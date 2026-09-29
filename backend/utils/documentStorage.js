const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { GridFSBucket, ObjectId } = require("mongodb");

const uploadDirectory = path.resolve(__dirname, "..", "uploads");
const bucketName = "documentFiles";
const defaultMaxSize = 25 * 1024 * 1024;

const createStorageError = (code, message, status = 500) =>
  Object.assign(new Error(message), { code, status });

const getBucket = () => {
  if (!mongoose.connection.db) {
    throw createStorageError(
      "STORAGE_UNAVAILABLE",
      "Kho lưu trữ tài liệu chưa sẵn sàng. Vui lòng thử lại sau.",
      503
    );
  }
  return new GridFSBucket(mongoose.connection.db, { bucketName });
};

const toObjectId = (value) => {
  if (!ObjectId.isValid(String(value || ""))) {
    throw createStorageError("INVALID_STORAGE_KEY", "Mã tệp lưu trữ không hợp lệ", 400);
  }
  return new ObjectId(String(value));
};

const parseDocumentSource = (fileUrl = "") => {
  let parsedUrl;
  try {
    parsedUrl = new URL(String(fileUrl), "http://studyhub.local");
  } catch {
    return { kind: "invalid" };
  }

  const gridFsMatch = parsedUrl.pathname.match(/^\/api\/files\/([a-f\d]{24})\/?$/i);
  if (gridFsMatch) {
    return { kind: "gridfs", storageKey: gridFsMatch[1] };
  }

  if (parsedUrl.pathname.startsWith("/uploads/")) {
    try {
      const localFileName = path.basename(decodeURIComponent(parsedUrl.pathname));
      const localPath = path.resolve(uploadDirectory, localFileName);
      const relativePath = path.relative(uploadDirectory, localPath);
      if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
        return { kind: "invalid" };
      }
      return { kind: "local", localPath, localFileName };
    } catch {
      return { kind: "invalid" };
    }
  }

  const isCloudinary =
    parsedUrl.protocol === "https:" &&
    (parsedUrl.hostname === "res.cloudinary.com" || parsedUrl.hostname.endsWith(".cloudinary.com"));
  if (isCloudinary) return { kind: "cloudinary", url: parsedUrl.href };

  return { kind: "unsupported" };
};

const saveBufferToGridFs = async (file) => {
  if (!Buffer.isBuffer(file?.buffer) || file.buffer.length === 0) {
    throw createStorageError("EMPTY_FILE", "Tệp rỗng hoặc không đọc được", 400);
  }

  const bucket = getBucket();
  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(file.originalname || "document", {
      metadata: {
        contentType: file.mimetype || "application/octet-stream",
        originalName: file.originalname || "document",
      },
    });

    uploadStream.once("error", reject);
    uploadStream.once("finish", () => {
      resolve({
        storageKey: String(uploadStream.id),
        size: file.buffer.length,
      });
    });
    uploadStream.end(file.buffer);
  });
};

const getGridFsFileInfo = async (storageKey) => {
  const bucket = getBucket();
  const file = await bucket.find({ _id: toObjectId(storageKey) }).next();
  if (!file) {
    throw createStorageError(
      "DOCUMENT_FILE_MISSING",
      "Tệp nguồn không còn trong kho lưu trữ.",
      410
    );
  }
  return file;
};

const readGridFsBuffer = async (storageKey, maxSize = defaultMaxSize) => {
  const bucket = getBucket();
  const file = await getGridFsFileInfo(storageKey);
  if (file.length > maxSize) {
    throw createStorageError(
      "DOCUMENT_FILE_TOO_LARGE",
      "Tệp vượt quá giới hạn xem trước 25MB",
      413
    );
  }

  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalSize = 0;
    let settled = false;
    const stream = bucket.openDownloadStream(toObjectId(storageKey));

    const fail = (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    stream.on("data", (chunk) => {
      totalSize += chunk.length;
      if (totalSize > maxSize) {
        stream.destroy();
        fail(
          createStorageError(
            "DOCUMENT_FILE_TOO_LARGE",
            "Tệp vượt quá giới hạn xem trước 25MB",
            413
          )
        );
        return;
      }
      chunks.push(chunk);
    });
    stream.once("error", (error) => {
      fail(
        error?.code === "ENOENT"
          ? createStorageError("DOCUMENT_FILE_MISSING", "Tệp nguồn không còn trong kho lưu trữ.", 410)
          : error
      );
    });
    stream.once("end", () => {
      if (settled) return;
      settled = true;
      resolve(Buffer.concat(chunks));
    });
  });
};

const readDocumentSource = async (fileUrl, maxSize = defaultMaxSize) => {
  const source = parseDocumentSource(fileUrl);

  if (source.kind === "local") {
    let stats;
    try {
      stats = await fs.promises.stat(source.localPath);
    } catch (error) {
      if (error?.code === "ENOENT") {
        throw createStorageError(
          "DOCUMENT_FILE_MISSING",
          "Tệp nguồn không còn trên máy chủ. Người đăng cần tải lại tài liệu.",
          410
        );
      }
      throw error;
    }
    if (!stats.isFile()) {
      throw createStorageError("DOCUMENT_FILE_MISSING", "Tệp nguồn không còn trên máy chủ.", 410);
    }
    if (stats.size > maxSize) {
      throw createStorageError("DOCUMENT_FILE_TOO_LARGE", "Tệp vượt quá giới hạn xem trước 25MB", 413);
    }
    return fs.promises.readFile(source.localPath);
  }

  if (source.kind === "gridfs") {
    return readGridFsBuffer(source.storageKey, maxSize);
  }

  if (source.kind === "cloudinary") {
    const response = await fetch(source.url, {
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });
    if (response.status === 404) {
      throw createStorageError("DOCUMENT_FILE_MISSING", "Tệp nguồn không còn trong kho lưu trữ.", 410);
    }
    if (!response.ok) {
      throw createStorageError("REMOTE_STORAGE_ERROR", "Không thể đọc tệp từ kho lưu trữ", 502);
    }

    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength > maxSize) {
      throw createStorageError("DOCUMENT_FILE_TOO_LARGE", "Tệp vượt quá giới hạn xem trước 25MB", 413);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > maxSize) {
      throw createStorageError("DOCUMENT_FILE_TOO_LARGE", "Tệp vượt quá giới hạn xem trước 25MB", 413);
    }
    return buffer;
  }

  throw createStorageError(
    "UNSUPPORTED_DOCUMENT_SOURCE",
    "Nguồn tệp này không được phép truy cập",
    415
  );
};

const checkDocumentSource = async (fileUrl) => {
  const source = parseDocumentSource(fileUrl);
  try {
    if (source.kind === "local") {
      const stats = await fs.promises.stat(source.localPath);
      return {
        available: stats.isFile(),
        storage: "local",
        issue: stats.isFile() ? "" : "Tệp nguồn không còn trên máy chủ.",
      };
    }
    if (source.kind === "gridfs") {
      await getGridFsFileInfo(source.storageKey);
      return { available: true, storage: "gridfs", issue: "" };
    }
    if (source.kind === "cloudinary") {
      return { available: true, storage: "cloudinary", issue: "" };
    }
  } catch (error) {
    if (error?.code === "ENOENT" || error?.code === "DOCUMENT_FILE_MISSING") {
      return {
        available: false,
        storage: source.kind,
        issue: "Tệp nguồn không còn trên máy chủ. Người đăng cần tải lại tài liệu.",
      };
    }
    return { available: null, storage: source.kind, issue: "Chưa thể kiểm tra tệp nguồn." };
  }

  return {
    available: false,
    storage: source.kind,
    issue: "Nguồn tệp không hợp lệ hoặc không còn được hỗ trợ.",
  };
};

const deleteGridFsFile = async (storageKey) => {
  const bucket = getBucket();
  try {
    await bucket.delete(toObjectId(storageKey));
  } catch (error) {
    if (error?.code !== "ENOENT" && !/FileNotFound/i.test(error?.message || "")) throw error;
  }
};

const openGridFsDownloadStream = (storageKey) =>
  getBucket().openDownloadStream(toObjectId(storageKey));

module.exports = {
  checkDocumentSource,
  createStorageError,
  defaultMaxSize,
  deleteGridFsFile,
  getGridFsFileInfo,
  openGridFsDownloadStream,
  parseDocumentSource,
  readDocumentSource,
  saveBufferToGridFs,
};
