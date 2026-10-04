export const fallbackSubjects = [
  "Giải tích", "Đại số tuyến tính", "Triết học Mác-Lênin",
  "Cấu trúc dữ liệu & Giải thuật", "Lập trình C/C++", "Vật lý đại cương",
  "Kinh tế vĩ mô", "Mạng máy tính", "Công nghệ phần mềm", "Cơ sở dữ liệu",
  "Lập trình Web", "An toàn thông tin", "Khác",
];

export function validateUploadFile(file) {
  if (!file || !file.size) return "Vui lòng chọn tệp có nội dung.";
  if (file.size > 25 * 1024 * 1024) return "Dung lượng file tối đa là 25MB.";
  if (!["pdf", "docx", "pptx", "xlsx", "txt"].includes(file.name.split(".").pop().toLowerCase())) {
    return "Chỉ chấp nhận file PDF, DOCX, PPTX, XLSX hoặc TXT.";
  }
  return "";
}

export async function uploadDocumentsIndividually({ files, subjectName, docType, description, tags, apiUrl, token, onProgress }) {
  const uploaded = [];
  const failed = [];

  for (let index = 0; index < files.length; index += 1) {
    const item = files[index];
    const formData = new FormData();
    formData.append("title", item.title.trim());
    formData.append("description", description?.trim() || `${docType} - ${subjectName}`);
    formData.append("subjectName", subjectName);
    formData.append("tags", tags?.trim() || subjectName);
    formData.append("file", item.file);

    try {
      const response = await fetch(`${apiUrl}/documents/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Không thể gửi tệp này.");
      uploaded.push(data.document);
    } catch (error) {
      failed.push({ title: item.title, fileName: item.file.name, message: error.message || "Lỗi kết nối máy chủ." });
    } finally {
      onProgress?.(index + 1, files.length);
    }
  }

  return { uploaded, failed };
}
