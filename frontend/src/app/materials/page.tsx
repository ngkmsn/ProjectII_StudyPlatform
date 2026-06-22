"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/lib/api";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FileText, Calendar, ExternalLink, Trash2, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/Input";

interface Document {
  id: number;
  fileName: string;
  fileUrl: string;
  createdAt: string;
}

export default function MaterialsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("newest");
  const router = useRouter();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/files`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(response.data);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedDocs = documents
    .filter(doc => doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === "name") {
        return a.fileName.localeCompare(b.fileName);
      }
      return 0;
    });

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Tài liệu của tôi</h1>
          <p className="text-slate-400 text-xs font-semibold mt-1">Quản lý các tài liệu học tập bạn đã tải lên</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input 
              placeholder="Tìm tên tài liệu..." 
              className="pl-9 h-10 text-xs rounded-xl border-slate-200 focus:ring-1 focus:ring-blue-500/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Sort dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-10 text-xs rounded-xl border border-slate-200 bg-white px-3 font-semibold text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/20 cursor-pointer"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="name">Tên A-Z</option>
          </select>
        </div>
      </div>

      {filteredAndSortedDocs.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 rounded-3xl">
          <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <FileText className="text-gray-400" size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-800">Không tìm thấy tài liệu nào</h3>
          <p className="text-slate-400 text-xs mt-1">Hãy thử tìm từ khóa khác hoặc tải lên tài liệu mới tại trang chủ.</p>
          <Button 
            className="mt-6 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-100" 
            onClick={() => router.push("/")}
          >
            Tải lên ngay
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedDocs.map((doc, idx) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card 
                className="h-full flex flex-col glass-card glass-card-hover glow-blue relative overflow-hidden rounded-3xl border border-slate-100/80 cursor-pointer group"
                onClick={() => router.push(`/studyset/${doc.id}`)}
              >
                {/* Top decorative gradient bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                
                <CardHeader className="pb-3 pt-6">
                  <div className="flex justify-between items-start mb-2">
                    <div className="h-10 w-10 bg-gradient-to-tr from-blue-500 to-indigo-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-100 group-hover:scale-110 transition-transform duration-300">
                      <FileText size={20} />
                    </div>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50/50 px-2 py-1 rounded-md">
                      ID: #{doc.id}
                    </span>
                  </div>
                  <CardTitle className="text-base font-bold line-clamp-2 leading-tight text-slate-800 group-hover:text-blue-600 transition-colors min-h-[2.5rem]">
                    {doc.fileName}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1.5 mt-2 font-medium text-slate-400 text-xs">
                    <Calendar size={13} className="text-slate-400" />
                    {new Date(doc.createdAt).toLocaleDateString('vi-VN')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow pb-4">
                  {/* Subtle decorative background glow in card content */}
                  <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-blue-500/10 transition-colors" />
                </CardContent>
                <CardFooter className="pt-0 flex gap-2 pb-5 px-6">
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="flex-grow-[2] flex-shrink-0 font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-none shadow-md shadow-blue-100/50 hover:shadow-lg hover:shadow-blue-200/50 transition-all rounded-xl h-10 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/studyset/${doc.id}`);
                    }}
                  >
                    Học & Tạo Quiz
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="font-bold border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors rounded-xl h-10 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(doc.fileUrl, '_blank');
                    }}
                  >
                    Tải file
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 font-bold rounded-xl h-10 text-xs transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Xử lý xóa nếu cần
                    }}
                  >
                    Xóa
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
