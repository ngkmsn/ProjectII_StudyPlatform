"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Upload, 
  Plus, 
  Clock, 
  Sparkles, 
  ArrowRight,
  FileText,
  LayoutGrid
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";

export default function Home() {
  const [recentDocs, setRecentDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }
    fetchRecentDocs();
  }, []);

  const fetchRecentDocs = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:8080/api/files", {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Lấy 3 tài liệu gần nhất
      setRecentDocs(response.data.slice(0, 3));
    } catch (error) {
      console.error("Error fetching docs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append("file", e.target.files[0]);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post("http://localhost:8080/api/files/upload", formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Chuyển hướng sang trang Study Set của tài liệu vừa upload
      router.push(`/studyset/${response.data.id}`);
    } catch (error) {
      alert("Tải lên thất bại. Vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-8 py-10 max-w-6xl">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Chào mừng quay lại!</h1>
        <p className="text-gray-500 font-medium mt-1">Hôm nay bạn muốn bắt đầu học từ đâu?</p>
      </div>

      {/* Quick Actions */}
      <section className="grid md:grid-cols-3 gap-6 mb-12">
        <Card className="relative overflow-hidden group border-none bg-blue-600 text-white shadow-xl shadow-blue-100">
          <CardContent className="p-6">
            <div className="relative z-10 space-y-4">
              <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Upload size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold">Tải lên tài liệu</h3>
                <p className="text-blue-100 text-sm mt-1">Phân tích PDF/DOCX với AI</p>
              </div>
              <input
                type="file"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
                accept=".pdf,.docx"
                disabled={uploading}
              />
              <Button variant="outline" className="bg-white text-blue-600 border-none font-bold w-full hover:bg-blue-50">
                {uploading ? "Đang xử lý..." : "Chọn File"}
              </Button>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Upload size={120} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer group">
          <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center space-y-3">
            <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 group-hover:text-blue-500 transition-colors">
              <Plus size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Tạo Study Set mới</h3>
              <p className="text-sm text-gray-500">Bắt đầu ôn tập chủ đề mới</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-purple-50 text-purple-900">
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="space-y-2">
              <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                <Sparkles size={20} />
              </div>
              <h3 className="font-bold">Gợi ý từ AI</h3>
              <p className="text-sm text-purple-700/70">Dựa trên lịch sử học tập của bạn</p>
            </div>
            <Button variant="ghost" className="w-full mt-4 text-purple-600 font-bold hover:bg-purple-100">
              Khám phá ngay
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Recent Activity & My Materials */}
      <div className="grid lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Clock size={20} className="text-blue-600" />
              Tài liệu gần đây
            </h2>
            <Button variant="ghost" size="sm" className="text-blue-600 font-bold" onClick={() => router.push("/materials")}>
              Xem tất cả
            </Button>
          </div>

          <div className="grid gap-4">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-xl" />)
            ) : recentDocs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <FileText size={40} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">Bạn chưa tải lên tài liệu nào</p>
              </div>
            ) : (
              recentDocs.map((doc) => (
                <Card key={doc.id} className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => router.push(`/studyset/${doc.id}`)}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <FileText size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 truncate">{doc.fileName}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Đã tải lên: {new Date(doc.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <ArrowRight size={18} className="text-gray-300 group-hover:text-blue-600 transition-colors" />
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <LayoutGrid size={20} className="text-purple-600" />
            Thống kê
          </h2>
          <Card className="border-none shadow-sm">
            <CardContent className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 font-medium">Tổng tài liệu</span>
                <span className="text-2xl font-black text-blue-600">{recentDocs.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 font-medium">Quiz đã hoàn thành</span>
                <span className="text-2xl font-black text-purple-600">0</span>
              </div>
              <div className="pt-4 border-t border-gray-50">
                <p className="text-xs text-center text-gray-400">Tiếp tục học tập để thấy sự thay đổi!</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
