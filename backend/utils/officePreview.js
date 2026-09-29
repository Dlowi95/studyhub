const zlib = require("zlib");

const MAX_ENTRY_COUNT = 5000;
const MAX_XML_SIZE = 8 * 1024 * 1024;
const MAX_PREVIEW_CHARACTERS = 600000;
const MAX_PREVIEW_IMAGES = 30;
const MAX_IMAGE_SIZE = 3 * 1024 * 1024;
const MAX_TOTAL_IMAGE_SIZE = 6 * 1024 * 1024;

const startsWithBytes = (buffer, bytes) =>
  bytes.every((byte, index) => buffer[index] === byte);

const findEndOfCentralDirectory = (buffer) => {
  const minimumOffset = Math.max(0, buffer.length - 65557);
  for (let offset = buffer.length - 22; offset >= minimumOffset; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) return offset;
  }
  return -1;
};

const readZipEntries = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 22) {
    throw new Error("Gói tài liệu Office không hợp lệ");
  }

  const endOffset = findEndOfCentralDirectory(buffer);
  if (endOffset < 0) throw new Error("Không tìm thấy cấu trúc gói Office");

  const entryCount = buffer.readUInt16LE(endOffset + 10);
  const centralDirectoryOffset = buffer.readUInt32LE(endOffset + 16);
  if (entryCount > MAX_ENTRY_COUNT || centralDirectoryOffset >= buffer.length) {
    throw new Error("Gói Office có cấu trúc bất thường");
  }

  const entries = new Map();
  let offset = centralDirectoryOffset;

  for (let index = 0; index < entryCount; index += 1) {
    if (offset + 46 > buffer.length || buffer.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error("Danh mục tệp Office bị hỏng");
    }

    const flags = buffer.readUInt16LE(offset + 8);
    const compression = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const uncompressedSize = buffer.readUInt32LE(offset + 24);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const nextOffset = offset + 46 + fileNameLength + extraLength + commentLength;

    if (nextOffset > buffer.length) throw new Error("Tên mục trong gói Office không hợp lệ");

    const name = buffer
      .subarray(offset + 46, offset + 46 + fileNameLength)
      .toString("utf8")
      .replace(/\\/g, "/")
      .replace(/^\/+/, "");

    entries.set(name, {
      name,
      flags,
      compression,
      compressedSize,
      uncompressedSize,
      localHeaderOffset,
    });
    offset = nextOffset;
  }

  return entries;
};

const extractZipEntry = (archive, entries, name) => {
  const entry = entries.get(name);
  if (!entry) return null;
  if (entry.flags & 0x1) throw new Error("Không thể xem trước tệp Office được mã hóa");
  if (entry.uncompressedSize > MAX_XML_SIZE) throw new Error("Nội dung Office quá lớn để xem trước");

  const offset = entry.localHeaderOffset;
  if (offset + 30 > archive.length || archive.readUInt32LE(offset) !== 0x04034b50) {
    throw new Error("Mục trong gói Office bị hỏng");
  }

  const fileNameLength = archive.readUInt16LE(offset + 26);
  const extraLength = archive.readUInt16LE(offset + 28);
  const dataStart = offset + 30 + fileNameLength + extraLength;
  const dataEnd = dataStart + entry.compressedSize;
  if (dataStart < 0 || dataEnd > archive.length) throw new Error("Dữ liệu Office vượt ngoài giới hạn gói");

  const compressed = archive.subarray(dataStart, dataEnd);
  let output;
  if (entry.compression === 0) {
    output = Buffer.from(compressed);
  } else if (entry.compression === 8) {
    output = zlib.inflateRawSync(compressed, { maxOutputLength: MAX_XML_SIZE });
  } else {
    throw new Error("Phương thức nén Office chưa được hỗ trợ");
  }

  if (output.length > MAX_XML_SIZE) throw new Error("Nội dung Office quá lớn để xem trước");
  return output;
};

const decodeXmlEntities = (value = "") =>
  value
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&#([0-9]+);/g, (_, code) => String.fromCodePoint(parseInt(code, 10)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");

const getTextNodes = (xml, tagName) => {
  const expression = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "gi");
  return [...xml.matchAll(expression)].map((match) =>
    decodeXmlEntities(match[1].replace(/<[^>]*>/g, ""))
  );
};

const truncatePreview = (value) => {
  if (value.length <= MAX_PREVIEW_CHARACTERS) return { content: value, truncated: false };
  return {
    content: `${value.slice(0, MAX_PREVIEW_CHARACTERS)}\n\n[Đã rút gọn phần còn lại vì tài liệu quá dài]`,
    truncated: true,
  };
};

const getSafeImageMimeType = (buffer) => {
  if (buffer.length >= 8 && startsWithBytes(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return "image/png";
  }
  if (buffer.length >= 3 && startsWithBytes(buffer, [0xff, 0xd8, 0xff])) {
    return "image/jpeg";
  }
  const header = buffer.subarray(0, 12).toString("ascii");
  if (header.startsWith("GIF87a") || header.startsWith("GIF89a")) return "image/gif";
  if (header.startsWith("RIFF") && header.slice(8, 12) === "WEBP") return "image/webp";
  return "";
};

const extractSafeImages = (archive, entries, mediaPrefix) => {
  const mediaNames = [...entries.keys()].filter((name) => name.startsWith(mediaPrefix));
  const images = [];
  let totalImageSize = 0;

  for (const name of mediaNames) {
    if (images.length >= MAX_PREVIEW_IMAGES) break;
    const entry = entries.get(name);
    if (!entry || entry.uncompressedSize > MAX_IMAGE_SIZE) continue;

    const image = extractZipEntry(archive, entries, name);
    const mimeType = image ? getSafeImageMimeType(image) : "";
    if (!mimeType || totalImageSize + image.length > MAX_TOTAL_IMAGE_SIZE) continue;

    totalImageSize += image.length;
    images.push({
      name: name.split("/").pop() || `image-${images.length + 1}`,
      mimeType,
      dataUrl: `data:${mimeType};base64,${image.toString("base64")}`,
    });
  }

  return { imageCount: mediaNames.length, images };
};

const extractDocxPreview = (archive, entries) => {
  const documentXml = extractZipEntry(archive, entries, "word/document.xml");
  if (!documentXml) throw new Error("Không tìm thấy nội dung Word trong tệp");

  const xml = documentXml.toString("utf8");
  const paragraphs = [...xml.matchAll(/<w:p\b[\s\S]*?<\/w:p>/gi)]
    .map((match) => {
      const fragment = match[0]
        .replace(/<w:tab\b[^>]*\/>/gi, "\t")
        .replace(/<w:(?:br|cr)\b[^>]*\/>/gi, "\n");
      return getTextNodes(fragment, "w:t").join("").trimEnd();
    })
    .filter((paragraph) => paragraph.trim().length > 0);

  const { imageCount, images } = extractSafeImages(archive, entries, "word/media/");
  const preview = truncatePreview(paragraphs.join("\n\n"));
  return {
    mode: "extracted",
    kind: "docx",
    sections: [{ title: "Nội dung tài liệu", content: preview.content || "[Không có nội dung văn bản]" }],
    imageCount,
    images,
    truncated: preview.truncated,
    notice: "Bản xem an toàn hiển thị phần chữ và ảnh raster; bố cục phức tạp được lược bỏ.",
  };
};

const extractPptxPreview = (archive, entries) => {
  const slideNames = [...entries.keys()]
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort((first, second) => {
      const firstNumber = Number(first.match(/slide(\d+)\.xml$/i)?.[1] || 0);
      const secondNumber = Number(second.match(/slide(\d+)\.xml$/i)?.[1] || 0);
      return firstNumber - secondNumber;
    });

  if (slideNames.length === 0) throw new Error("Không tìm thấy trang trình chiếu trong tệp");

  let totalCharacters = 0;
  let truncated = false;
  const sections = [];

  for (const [index, slideName] of slideNames.entries()) {
    if (totalCharacters >= MAX_PREVIEW_CHARACTERS) {
      truncated = true;
      break;
    }
    const slideXml = extractZipEntry(archive, entries, slideName)?.toString("utf8") || "";
    const paragraphs = [...slideXml.matchAll(/<a:p\b[\s\S]*?<\/a:p>/gi)]
      .map((match) => getTextNodes(match[0], "a:t").join("").trim())
      .filter(Boolean);
    const content = paragraphs.join("\n") || "[Trang chiếu không có nội dung chữ]";
    const remainingCharacters = MAX_PREVIEW_CHARACTERS - totalCharacters;
    sections.push({ title: `Trang ${index + 1}`, content: content.slice(0, remainingCharacters) });
    totalCharacters += content.length;
    if (content.length > remainingCharacters) truncated = true;
  }

  const { imageCount, images } = extractSafeImages(archive, entries, "ppt/media/");
  return {
    mode: "extracted",
    kind: "pptx",
    sections,
    imageCount,
    images,
    truncated,
    notice: "Bản xem an toàn hiển thị chữ theo từng trang và ảnh raster; hiệu ứng và bố cục được lược bỏ.",
  };
};

const extractXlsxPreview = (archive, entries) => {
  const sharedStringsXml = extractZipEntry(archive, entries, "xl/sharedStrings.xml")?.toString("utf8") || "";
  const sharedStrings = [...sharedStringsXml.matchAll(/<si\b[\s\S]*?<\/si>/gi)].map((match) =>
    getTextNodes(match[0], "t").join("")
  );
  const sheetNames = [...entries.keys()]
    .filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(name))
    .sort((first, second) => first.localeCompare(second, undefined, { numeric: true }));

  if (sheetNames.length === 0) throw new Error("Không tìm thấy bảng tính trong tệp");

  let totalCharacters = 0;
  let truncated = false;
  const sections = [];

  for (const [sheetIndex, sheetName] of sheetNames.entries()) {
    if (totalCharacters >= MAX_PREVIEW_CHARACTERS) {
      truncated = true;
      break;
    }
    const sheetXml = extractZipEntry(archive, entries, sheetName)?.toString("utf8") || "";
    const rows = [];

    for (const rowMatch of sheetXml.matchAll(/<row\b[\s\S]*?<\/row>/gi)) {
      if (rows.length >= 500) {
        truncated = true;
        break;
      }
      const cells = [];
      for (const cellMatch of rowMatch[0].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/gi)) {
        const attributes = cellMatch[1];
        const body = cellMatch[2];
        const reference = attributes.match(/\br="([^"]+)"/i)?.[1] || "";
        const type = attributes.match(/\bt="([^"]+)"/i)?.[1] || "";
        const rawValue = body.match(/<v\b[^>]*>([\s\S]*?)<\/v>/i)?.[1];
        const inlineValue = getTextNodes(body, "t").join("");
        let value = inlineValue || decodeXmlEntities(rawValue || "");
        if (type === "s" && rawValue !== undefined) value = sharedStrings[Number(rawValue)] || "";
        if (value) cells.push(`${reference}: ${value}`);
      }
      if (cells.length) rows.push(cells.join("  |  "));
    }

    const content = rows.join("\n") || "[Bảng tính không có dữ liệu hiển thị]";
    const remainingCharacters = MAX_PREVIEW_CHARACTERS - totalCharacters;
    sections.push({ title: `Trang tính ${sheetIndex + 1}`, content: content.slice(0, remainingCharacters) });
    totalCharacters += content.length;
    if (content.length > remainingCharacters) truncated = true;
  }

  return {
    mode: "extracted",
    kind: "xlsx",
    sections,
    imageCount: 0,
    images: [],
    truncated,
    notice: "Bản xem an toàn hiển thị tối đa 500 dòng mỗi trang tính; định dạng và biểu đồ được lược bỏ.",
  };
};

const extractOfficePreview = (buffer, format) => {
  const entries = readZipEntries(buffer);
  if (format === "docx") return extractDocxPreview(buffer, entries);
  if (format === "pptx") return extractPptxPreview(buffer, entries);
  if (format === "xlsx") return extractXlsxPreview(buffer, entries);
  throw new Error("Định dạng Office này chưa hỗ trợ xem trước nội bộ");
};

module.exports = { extractOfficePreview };
