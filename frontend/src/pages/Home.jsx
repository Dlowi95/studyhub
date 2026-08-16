import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Download, Star } from "lucide-react";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Mock documents representing Studocu/CourseHero style
  const mockDocuments = [
    {
      id: "doc-1",
      title: "Đề cương ôn tập Triết học Mác-Lênin (Full 12 Chương)",
      subject: "Triết học Mác-Lênin",
      downloads: 1420,
      rating: 4.8,
      type: "PDF",
      uploader: "Huy Thịnh",
    },
    {
      id: "doc-2",
      title: "Giáo trình Cấu trúc dữ liệu và Giải thuật - ĐH Bách Khoa",
      subject: "Cấu trúc dữ liệu & Giải thuật",
      downloads: 850,
      rating: 5.0,
      type: "PDF",
      uploader: "Lâm Nguyễn",
    },
    {
      id: "doc-3",
      title: "Đề thi cuối kỳ Giải tích 1 có đáp án chi tiết (2025)",
      subject: "Giải tích 1",
      downloads: 2100,
      rating: 4.6,
      type: "DOCX",
      uploader: "Admin",
    },
    {
      id: "doc-4",
      title: "Tóm tắt công thức Vật lý đại cương 1",
      subject: "Vật lý đại cương 1",
      downloads: 620,
      rating: 4.7,
      type: "PDF",
      uploader: "Thành Đạt",
    },
  ];

  const filteredDocs = mockDocuments.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-12">
      {/* Hero Search Section */}
      <section className="text-center py-12 px-4 rounded-3xl bg-gradient-to-r from-primary/10 via-sky-500/5 to-primary/5 border border-muted/30 max-w-5xl mx-auto space-y-6">
        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-3 py-1 text-xs">
          Nền tảng chia sẻ tài liệu học tập
        </Badge>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight max-w-3xl mx-auto leading-tight">
          Tìm kiếm tài liệu học tập, học phần & đề thi mẫu
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Tài liệu được chia sẻ và kiểm duyệt bởi cộng đồng sinh viên các trường đại học.
        </p>
        
        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto flex items-center gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder="Nhập tên tài liệu, môn học hoặc từ khoá ôn tập..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-md shadow-sm border-muted-foreground/20 rounded-xl"
            />
          </div>
          <Button className="h-12 px-6 rounded-xl font-medium">Tìm kiếm</Button>
        </div>
      </section>

      {/* Popular Subjects */}
      <section className="max-w-5xl mx-auto space-y-4">
        <h2 className="text-2xl font-bold text-left">Học phần phổ biến</h2>
        <div className="flex flex-wrap gap-2">
          {["Giải tích", "Đại số tuyến tính", "Triết học", "Lập trình C++", "Cấu trúc dữ liệu", "Vật lý đại cương", "Kinh tế vĩ mô"].map((sub, idx) => (
            <Badge key={idx} onClick={() => setSearchQuery(sub)} variant="secondary" className="cursor-pointer hover:bg-muted/80 px-3 py-1.5 text-sm rounded-lg font-medium">
              {sub}
            </Badge>
          ))}
        </div>
      </section>

      {/* Documents Grid */}
      <section className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Tài liệu nổi bật</h2>
          <span className="text-sm text-muted-foreground font-medium">Hiển thị {filteredDocs.length} tài liệu</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredDocs.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow border-muted/60 text-left">
              <CardHeader className="pb-3 flex flex-row items-start justify-between gap-4">
                <div className="space-y-1">
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] uppercase font-bold">
                    {doc.subject}
                  </Badge>
                  <CardTitle className="text-lg font-semibold line-clamp-2 hover:text-primary transition-colors cursor-pointer pt-1">
                    {doc.title}
                  </CardTitle>
                </div>
                <div className="p-2 bg-primary/5 text-primary rounded-lg shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-3">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-foreground">{doc.rating}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="w-4 h-4" />
                      <span>{doc.downloads}</span>
                    </span>
                  </div>
                  <div>
                    Người tải: <span className="font-medium text-foreground">{doc.uploader}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
