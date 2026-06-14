"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FileText, Calendar, Loader2, Trophy, ArrowRight, BrainCircuit } from "lucide-react";

interface Document {
  id: number;
  fileName: string;
  fileUrl: string;
  createdAt: string;
}

export default function QuizPage() {
  const [quizzes, setQuizzes] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
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

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-8 py-12 max-w-6xl">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          <Trophy className="text-purple-600" size={32} />
          Quiz của tôi
        </h1>
        <p className="text-gray-500 font-medium mt-2">Xem lại các bài trắc nghiệm thông minh bạn đã làm</p>
      </div>

      {quizzes.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 border-gray-200 bg-white rounded-2xl">
          <div className="mx-auto w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4 text-purple-600">
            <Trophy size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Chưa có bài quiz nào được tạo</h3>
          <p className="text-gray-500 mt-1 max-w-md mx-auto">
            Hãy tải lên một tài liệu học tập mới tại trang chủ và bắt đầu tạo thử thách AI Quiz để kiểm tra kiến thức của mình!
          </p>
          <Button 
            className="mt-6 font-bold shadow-lg shadow-blue-100" 
            onClick={() => router.push("/")}
          >
            Tạo Quiz ngay
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz, idx) => (
            <motion.div
              key={quiz.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="h-full flex flex-col hover:shadow-xl hover:shadow-purple-50/50 hover:border-purple-200 transition-all duration-300 border border-gray-100 rounded-2xl group overflow-hidden bg-white">
                <CardHeader className="pb-4">
                  <div className="bg-purple-50 w-10 h-10 rounded-xl flex items-center justify-center mb-3 text-purple-600 group-hover:scale-110 transition-transform duration-300">
                    <BrainCircuit size={20} />
                  </div>
                  <CardTitle className="text-base font-bold line-clamp-2 leading-tight text-gray-900 min-h-[2.5rem]">
                    {quiz.fileName}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1.5 mt-2 font-medium text-gray-500">
                    <Calendar size={14} />
                    {new Date(quiz.createdAt).toLocaleDateString('vi-VN')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                    ID Tài liệu: #{quiz.id}
                  </p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full font-bold border-purple-200 text-purple-600 hover:bg-purple-50 hover:text-purple-700 flex items-center justify-center gap-2 group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600 transition-all duration-300 h-11 rounded-xl"
                    onClick={() => router.push(`/studyset/${quiz.id}?mode=quiz`)}
                  >
                    Xem lại / Làm lại Quiz
                    <ArrowRight size={16} />
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
