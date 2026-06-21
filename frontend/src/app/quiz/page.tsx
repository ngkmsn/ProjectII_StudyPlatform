"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FileText, Calendar, Loader2, Trophy, ArrowRight, BrainCircuit, Search } from "lucide-react";
import { Input } from "@/components/ui/Input";

interface Document {
  id: number;
  fileName: string;
  fileUrl: string;
  createdAt: string;
}

export default function QuizPage() {
  const [quizzes, setQuizzes] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("newest");
  const router = useRouter();

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    try {
      const response = await axios.get("http://localhost:8080/api/ai/quizzes", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuizzes(response.data);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedQuizzes = quizzes
    .filter(quiz => quiz.fileName.toLowerCase().includes(searchTerm.toLowerCase()))
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
    <div className="container mx-auto px-8 py-12 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Trophy className="text-purple-600" size={32} />
            Quiz của tôi
          </h1>
          <p className="text-slate-400 text-xs font-semibold mt-1">Xem lại các bài trắc nghiệm thông minh bạn đã làm</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input 
              placeholder="Tìm tên tài liệu..." 
              className="pl-9 h-10 text-xs rounded-xl border-slate-200 focus:ring-1 focus:ring-purple-500/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Sort dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-10 text-xs rounded-xl border border-slate-200 bg-white px-3 font-semibold text-slate-600 focus:outline-none focus:ring-1 focus:ring-purple-500/20 cursor-pointer"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="name">Tên A-Z</option>
          </select>
        </div>
      </div>

      {filteredAndSortedQuizzes.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 border-gray-200 bg-white rounded-3xl">
          <div className="mx-auto w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4 text-purple-600">
            <Trophy size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-800">Không tìm thấy bài quiz nào</h3>
          <p className="text-slate-400 text-xs mt-1 max-w-md mx-auto">
            Hãy tải lên một tài liệu học tập mới tại trang chủ và bắt đầu tạo thử thách AI Quiz để kiểm tra kiến thức của mình!
          </p>
          <Button 
            className="mt-6 font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg shadow-purple-100/50" 
            onClick={() => router.push("/")}
          >
            Tạo Quiz ngay
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedQuizzes.map((quiz, idx) => (
            <motion.div
              key={quiz.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card 
                className="h-full flex flex-col glass-card glass-card-hover glow-purple relative overflow-hidden rounded-3xl border border-slate-100/80 cursor-pointer group"
                onClick={() => router.push(`/studyset/${quiz.id}?mode=quiz`)}
              >
                {/* Top decorative gradient bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500" />

                <CardHeader className="pb-3 pt-6">
                  <div className="flex justify-between items-start mb-2">
                    <div className="h-10 w-10 bg-gradient-to-tr from-purple-500 to-pink-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-purple-100 group-hover:scale-110 transition-transform duration-300">
                      <BrainCircuit size={20} />
                    </div>
                    <span className="text-[10px] font-bold text-purple-600 bg-purple-50/50 px-2 py-1 rounded-md">
                      ID: #{quiz.id}
                    </span>
                  </div>
                  <CardTitle className="text-base font-bold line-clamp-2 leading-tight text-slate-800 min-h-[2.5rem] group-hover:text-purple-600 transition-colors">
                    {quiz.fileName}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1.5 mt-2 font-medium text-slate-400 text-xs">
                    <Calendar size={13} className="text-slate-400" />
                    {new Date(quiz.createdAt).toLocaleDateString('vi-VN')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow pb-4">
                  {/* Decorative background blur glow */}
                  <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-500/10 transition-colors" />
                </CardContent>
                <CardFooter className="pt-0 pb-5 px-6">
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="w-full font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-none shadow-md shadow-purple-100/50 hover:shadow-lg hover:shadow-purple-200/50 transition-all h-10 rounded-xl flex items-center justify-center gap-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/studyset/${quiz.id}?mode=quiz`);
                    }}
                  >
                    Xem lại / Làm lại Quiz
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
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
