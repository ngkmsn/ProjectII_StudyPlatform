"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  BarChart2, 
  Loader2, 
  TrendingUp, 
  AlertTriangle, 
  Trophy, 
  Calendar, 
  Clock, 
  ArrowRight,
  Target,
  Flame,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface WeakTopic {
  topicId: number;
  title: string;
  description: string;
  accuracy: number;
  totalAttempts: number;
  documentId: number;
  documentName: string;
}

interface Attempt {
  id: number;
  score: number;
  createdAt: string;
  document: {
    id: number;
    fileName: string;
  } | null;
}

export default function SmartAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/auth/login");
        return;
      }

      // Fetch weak topics and attempts in parallel
      const [weakTopicsRes, attemptsRes] = await Promise.all([
        axios.get("http://localhost:8080/api/quiz/weak-topics", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get("http://localhost:8080/api/quiz/attempts", {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setWeakTopics(weakTopicsRes.data);
      setAttempts(attemptsRes.data);

      // Calculate streak based on attempts
      calculateStreak(attemptsRes.data);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = (attemptsList: Attempt[]) => {
    if (attemptsList.length === 0) {
      setStreak(0);
      return;
    }

    // Extract unique dates of attempts
    const dates = attemptsList.map(a => new Date(a.createdAt).toDateString());
    const uniqueDates = Array.from(new Set(dates)).map(d => new Date(d));

    // Sort descending
    uniqueDates.sort((a, b) => b.getTime() - a.getTime());

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const latestAttemptDate = uniqueDates[0];
    latestAttemptDate.setHours(0, 0, 0, 0);

    // If the latest attempt is not today or yesterday, streak is broken
    if (latestAttemptDate.getTime() !== today.getTime() && latestAttemptDate.getTime() !== yesterday.getTime()) {
      setStreak(0);
      return;
    }

    let currentStreak = 1;
    for (let i = 0; i < uniqueDates.length - 1; i++) {
      const current = new Date(uniqueDates[i]);
      current.setHours(0, 0, 0, 0);
      
      const next = new Date(uniqueDates[i + 1]);
      next.setHours(0, 0, 0, 0);

      const diffTime = Math.abs(current.getTime() - next.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak++;
      } else if (diffDays > 1) {
        break; // Streak broken
      }
    }
    setStreak(currentStreak);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <span className="text-sm text-slate-500 font-bold">Đang tổng hợp dữ liệu học tập...</span>
        </div>
      </div>
    );
  }

  // Summary Metrics
  const totalAttempts = attempts.length;
  const averageScore = totalAttempts > 0 
    ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts) 
    : 0;

  return (
    <div className="container mx-auto px-6 py-10 max-w-6xl space-y-8 animate-in fade-in duration-500">
      
      {/* Header title */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-6">
        <div className="h-12 w-12 bg-gradient-to-tr from-blue-500 to-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
          <BarChart2 size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Thống kê học tập thông minh</h1>
          <p className="text-xs font-semibold text-slate-400 mt-1.5">Theo dõi điểm yếu, tiến độ ôn tập và lịch sử làm bài</p>
        </div>
      </div>

      {/* Grid Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Streak */}
        <Card className="border-none shadow-sm bg-white overflow-hidden rounded-2xl relative">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center border border-amber-100">
              <Flame size={24} className="animate-pulse" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-black uppercase text-slate-400">Chuỗi ngày học</span>
              <p className="text-2xl font-black text-slate-800">{streak} ngày</p>
            </div>
          </CardContent>
        </Card>

        {/* Avg Score */}
        <Card className="border-none shadow-sm bg-white overflow-hidden rounded-2xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center border border-blue-100">
              <Target size={24} />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-black uppercase text-slate-400">Độ chính xác trung bình</span>
              <p className="text-2xl font-black text-slate-800">{averageScore}%</p>
            </div>
          </CardContent>
        </Card>

        {/* Total Quizzes */}
        <Card className="border-none shadow-sm bg-white overflow-hidden rounded-2xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center border border-purple-100">
              <Trophy size={24} />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-black uppercase text-slate-400">Số Quiz đã làm</span>
              <p className="text-2xl font-black text-slate-800">{totalAttempts} bài</p>
            </div>
          </CardContent>
        </Card>

        {/* Alert weak topics */}
        <Card className="border-none shadow-sm bg-white overflow-hidden rounded-2xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center border border-rose-100">
              <AlertTriangle size={24} />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-black uppercase text-slate-400">Khái niệm còn yếu</span>
              <p className="text-2xl font-black text-slate-800">{weakTopics.length} chủ đề</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main grids: Weak topics left, History right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left column: Weak Topics (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-4">
              <CardTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
                <AlertTriangle className="text-rose-500 animate-pulse" size={20} />
                Các chủ đề và khái niệm còn yếu (Dưới 70%)
              </CardTitle>
              <CardDescription className="text-xs">
                Hệ thống đề xuất bạn tập trung làm Quiz Adaptive cho các phần này.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              {weakTopics.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <div className="h-12 w-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                    <Trophy size={20} />
                  </div>
                  <p className="text-xs font-bold text-slate-500">Tuyệt vời! Bạn không có chủ đề yếu nào.</p>
                  <p className="text-[10px] text-slate-400">Hãy tiếp tục duy trì kết quả trên 70% nhé.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {weakTopics.map((topic) => (
                    <div 
                      key={topic.topicId} 
                      className="flex flex-col md:flex-row md:items-center justify-between p-3.5 border border-slate-100 rounded-xl hover:border-slate-200 transition-colors gap-3"
                    >
                      <div className="space-y-1 max-w-[70%]">
                        <span className="text-xs font-black text-slate-800">{topic.title}</span>
                        <p className="text-[10px] text-slate-400 leading-tight">
                          Thuộc: <strong className="text-slate-500">{topic.documentName || "Tài liệu học tập"}</strong>
                        </p>
                      </div>
                      <div className="flex items-center gap-4 justify-between md:justify-end">
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-black text-rose-500">{Math.round(topic.accuracy * 100)}% chính xác</span>
                          <span className="text-[9px] text-slate-400 font-semibold">{topic.totalAttempts} lần làm bài</span>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => router.push(`/studyset/${topic.documentId}?mode=quiz`)}
                          className="bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[10px] font-bold h-7 flex items-center gap-1"
                        >
                          Luyện tập <ArrowRight size={10} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: Recent Quiz Attempts (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-4">
              <CardTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Clock className="text-blue-500" size={20} />
                Lịch sử làm bài gần đây
              </CardTitle>
              <CardDescription className="text-xs">
                Xem lại danh sách điểm số và thời gian ôn tập của các bài trước.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              {attempts.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-xs text-slate-400 font-semibold">Chưa có lịch sử làm bài kiểm tra nào.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {attempts.map((att) => {
                    const isExcellent = att.score >= 80;
                    const isGood = att.score >= 50 && att.score < 80;
                    
                    return (
                      <div key={att.id} className="flex items-center justify-between p-3 border border-slate-50 rounded-xl bg-slate-50/40">
                        <div className="flex items-center gap-3 max-w-[75%]">
                          <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                            <FileText size={16} />
                          </div>
                          <div className="space-y-0.5 overflow-hidden">
                            <h4 className="text-xs font-bold text-slate-800 truncate">
                              {att.document?.fileName || "Tài liệu học"}
                            </h4>
                            <p className="text-[9px] text-slate-400 font-semibold">
                              {new Date(att.createdAt).toLocaleDateString("vi-VN")} {new Date(att.createdAt).toLocaleTimeString("vi-VN", {hour: '2-digit', minute:'2-digit'})}
                            </p>
                          </div>
                        </div>
                        <span className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-black shadow-sm",
                          isExcellent ? "bg-emerald-500 text-white" : isGood ? "bg-amber-500 text-white" : "bg-rose-500 text-white"
                        )}>
                          {att.score}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
