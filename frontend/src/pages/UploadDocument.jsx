import { useState } from "react";

export default function UploadDocument() {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [type, setType] = useState("");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title || !subject || !type || !file) {
      alert("Vui lòng nhập đầy đủ thông tin bắt buộc!");
      return;
    }

    console.log({
      title,
      subject,
      type,
      tags,
      description,
      file,
    });

    alert("Đăng tải tài liệu thành công!");

    // Reset form
    setTitle("");
    setSubject("");
    setType("");
    setTags("");
    setDescription("");
    setFile(null);

    // Reset input file
    document.getElementById("document-file").value = "";
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium uppercase tracking-wider text-teal-600">
            Tài liệu
          </p>

          <h1 className="text-3xl font-bold text-gray-900">
            Đăng tải tài liệu
          </h1>

          <p className="mt-2 text-gray-600">
            Chia sẻ tài liệu học tập với mọi người.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white p-6 shadow-sm"
        >

          {/* Tên tài liệu */}
          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Tên tài liệu
              <span className="text-red-500"> *</span>
            </label>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tên tài liệu"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          {/* Học phần */}
          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Học phần
              <span className="text-red-500"> *</span>
            </label>

            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-teal-500"
            >
              <option value="">
                Chọn học phần
              </option>

              <option value="Công nghệ phần mềm">
                Công nghệ phần mềm
              </option>

              <option value="Cơ sở dữ liệu">
                Cơ sở dữ liệu
              </option>

              <option value="Lập trình Web">
                Lập trình Web
              </option>

              <option value="An toàn thông tin">
                An toàn thông tin
              </option>

              <option value="Mạng máy tính">
                Mạng máy tính
              </option>
            </select>
          </div>

          {/* Loại tài liệu */}
          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Loại tài liệu
              <span className="text-red-500"> *</span>
            </label>

            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-teal-500"
            >
              <option value="">
                Chọn loại tài liệu
              </option>

              <option value="PDF">
                PDF
              </option>

              <option value="DOCX">
                DOCX
              </option>

              <option value="PPTX">
                PPTX
              </option>
            </select>
          </div>

          {/* Tags */}
          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Tags
            </label>

            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Ví dụ: database, sql, cntt"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />

            <p className="mt-2 text-xs text-gray-500">
              Nhập các tag cách nhau bằng dấu phẩy.
            </p>
          </div>

          {/* Mô tả */}
          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Mô tả
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập mô tả tài liệu..."
              rows={5}
              className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          {/* Upload file */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              File tài liệu
              <span className="text-red-500"> *</span>
            </label>

            <div className="rounded-xl border-2 border-dashed border-gray-300 p-6 text-center transition hover:border-teal-500">

              <input
                id="document-file"
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx"
                onChange={(e) => {
                  setFile(e.target.files[0]);
                }}
                className="mx-auto block w-full max-w-md text-sm text-gray-600"
              />

              <p className="mt-3 text-xs text-gray-500">
                Hỗ trợ PDF, DOC, DOCX, PPT, PPTX
              </p>

              {file && (
                <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                  File đã chọn:
                  <span className="ml-1 font-medium">
                    {file.name}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3">

            <button
              type="button"
              onClick={() => {
                setTitle("");
                setSubject("");
                setType("");
                setTags("");
                setDescription("");
                setFile(null);

                document.getElementById(
                  "document-file"
                ).value = "";
              }}
              className="rounded-xl border border-gray-300 px-5 py-3 font-medium text-gray-700 transition hover:bg-gray-100"
            >
              Hủy
            </button>

            <button
              type="submit"
              className="rounded-xl bg-teal-600 px-6 py-3 font-medium text-white transition hover:bg-teal-700"
            >
              Đăng tải tài liệu
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}