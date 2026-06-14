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
  LayoutGrid,
  Trophy
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";

export default function Home() {
  const [recentDocs, setRecentDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [attemptsCount, setAttemptsCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }
    fetchRecentDocs();
    fetchAttempts();
  }, []);

  const fetchAttempts = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:8080/api/quiz/attempts", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttemptsCount(response.data.length);
    } catch (error) {
      console.error("Error fetching attempts:", error);
    }
  };

  const fetchRecentDocs = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:8080/api/files", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecentDocs(response.data.slice(0, 3));
    } catch (error: any) {
      console.error("Error fetching docs:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/auth/login");
        return;
      }
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
      router.push(`/studyset/${response.data.id}`);
    } catch (error: any) {
      // Token hết hạn → xóa và chuyển về trang login
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/auth/login");
        return;
      }
      alert("Tải lên thất bại. Vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-8 py-12 max-w-6xl space-y-10 animate-in fade-in duration-500">
      {/* Header Greeting Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-8 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-100 glow-blue overflow-hidden relative">
        <div className="relative z-10 space-y-2">
          <span className="px-3 py-1 text-xs font-bold bg-white/20 rounded-full tracking-wider uppercase">Nền tảng học tập AI</span>
          <h1 className="text-3xl font-black tracking-tight">Chào mừng quay lại! 👋</h1>
          <p className="text-blue-100 font-medium">Học tập hiệu quả hơn gấp 3 lần với sơ đồ tư duy và bài kiểm tra tự động tạo bởi AI.</p>
        </div>
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-radial-gradient from-white/10 to-transparent pointer-events-none" />
      </div>

      {/* Quick Actions Grid */}
      <section className="grid md:grid-cols-2 gap-8">
        {/* Action: Upload File */}
        <Card className="relative overflow-hidden group border-none bg-white shadow-lg shadow-slate-100/40 hover:shadow-2xl hover:shadow-blue-100/50 hover:-translate-y-1 transition-all duration-300 ring-1 ring-slate-100">
          <CardContent className="p-8">
            <div className="relative z-10 space-y-6">
              <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100 group-hover:scale-110 transition-transform duration-300">
                <Upload size={22} className="animate-float" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-800">Tải lên tài liệu</h3>
                <p className="text-slate-400 text-sm">Phân tích tài liệu học tập của bạn bằng AI để tạo sơ đồ chủ đề, bộ câu hỏi trắc nghiệm và flashcards.</p>
              </div>
              <div className="relative border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-6 bg-slate-50/50 hover:bg-blue-50/10 transition-colors text-center cursor-pointer">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  accept=".pdf,.docx"
                  disabled={uploading}
                />
                <span className="text-sm font-bold text-blue-600">
                  {uploading ? "Đang xử lý..." : "Chọn file PDF hoặc DOCX"}
                </span>
                <p className="text-xs text-slate-400 mt-1">Dung lượng tối đa 10MB</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action: Daily Practice */}
        <Card 
          className="relative overflow-hidden group border-none bg-white shadow-lg shadow-slate-100/40 hover:shadow-2xl hover:shadow-purple-100/50 hover:-translate-y-1 transition-all duration-300 ring-1 ring-slate-100 cursor-pointer"
          onClick={() => router.push("/quiz")}
        >
          <CardContent className="p-8 flex flex-col justify-between h-full">
            <div className="relative z-10 space-y-6">
              <div className="h-12 w-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center border border-purple-100 group-hover:scale-110 transition-transform duration-300">
                <Trophy size={22} className="animate-float" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-800">Xem lại Quiz đã làm</h3>
                <p className="text-slate-400 text-sm">Luyện tập lại các bộ câu hỏi đã tạo từ tài liệu cũ của bạn để củng cố kiến thức và nâng cao độ ghi nhớ.</p>
              </div>
            </div>
            <div className="mt-8 relative z-10">
              <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 border-none font-bold w-full h-11 rounded-xl shadow-lg shadow-purple-200">
                Vào trang Quiz của tôi
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Bottom Layout Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Materials */}
        <section className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Clock size={20} className="text-blue-600" />
              Tài liệu gần đây
            </h2>
            <Button variant="ghost" size="sm" className="text-blue-600 font-bold hover:bg-blue-50/50" onClick={() => router.push("/materials")}>
              Xem tất cả
            </Button>
          </div>

          <div className="grid gap-4">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-100/60 animate-pulse rounded-2xl" />)
            ) : recentDocs.length === 0 ? (
              <div className="text-center py-16 bg-white/60 border border-slate-100 rounded-3xl backdrop-blur-sm shadow-sm">
                <FileText size={44} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-400 font-medium text-sm">Bạn chưa tải lên tài liệu nào</p>
              </div>
            ) : (
              recentDocs.map((doc) => (
                <Card 
                  key={doc.id} 
                  className="hover:shadow-lg hover:shadow-slate-100/80 hover:scale-[1.01] transition-all duration-300 cursor-pointer group border-slate-100" 
                  onClick={() => router.push(`/studyset/${doc.id}`)}
                >
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                      <FileText size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">{doc.fileName}</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Ngày tải lên: {new Date(doc.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <div className="h-8 w-8 rounded-full flex items-center justify-center border border-slate-100 group-hover:border-blue-200 group-hover:bg-blue-50/30 transition-all">
                      <ArrowRight size={16} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>

        {/* Statistics & Streaks */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <LayoutGrid size={20} className="text-purple-600" />
            Thống kê học tập
          </h2>
          <Card className="border-none shadow-lg shadow-slate-100/40 bg-white/80 backdrop-blur-md ring-1 ring-slate-100">
            <CardContent className="p-6 space-y-6">
              <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50/50 border border-slate-100">
                <span className="text-sm text-slate-500 font-bold">Tổng tài liệu</span>
                <span className="text-2xl font-black text-blue-600">{recentDocs.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50/50 border border-slate-100">
                <span className="text-sm text-slate-500 font-bold">Quiz hoàn thành</span>
                <span className="text-2xl font-black text-purple-600">{attemptsCount}</span>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs text-center text-slate-400 font-medium leading-relaxed">
                  Hãy tiếp tục học tập và tải lên tài liệu mới để AI vẽ sơ đồ kiến thức của bạn nhé!
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
