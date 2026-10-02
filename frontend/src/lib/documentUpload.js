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
