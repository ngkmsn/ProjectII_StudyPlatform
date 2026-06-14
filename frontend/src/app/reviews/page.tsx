"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Loader2, 
  RotateCw, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  Calendar,
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface ReviewItem {
  id: number;
  boxLevel: number;
  easeFactor: number;
  repetitions: number;
  intervalDays: number;
  dueDate: string;
  flashcard: {
    id: number;
    frontText: string;
    backText: string;
    cardType: string;
    documentId: number;
  } | null;
}

export default function DailyReviewsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [initialDueCount, setInitialDueCount] = useState<number | null>(null);

  useEffect(() => {
    fetchDueReviews();
  }, []);

  const fetchDueReviews = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/auth/login");
        return;
      }
      const response = await axios.get("http://localhost:8080/api/reviews/today", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReviews(response.data);
      setInitialDueCount(response.data.length);
      setCurrentIdx(0);
    } catch (error) {
      console.error("Error fetching due reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreSubmit = async (score: number) => {
    if (submitting || reviews.length === 0) return;
    setSubmitting(true);
    const item = reviews[currentIdx];

    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:8080/api/reviews/submit", {
        reviewItemId: item.id,
        qualityScore: score
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCompletedCount(prev => prev + 1);
      setIsFlipped(false);
      
      // Delay briefly to allow flip animation to reset before moving to next card
      setTimeout(() => {
        setCurrentIdx(prev => prev + 1);
        setSubmitting(false);
      }, 200);

    } catch (error) {
      console.error("Error submitting review score:", error);
      alert("Có lỗi xảy ra khi gửi kết quả ôn tập. Vui lòng thử lại.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <span className="text-sm text-slate-500 font-bold">Đang tải lịch ôn tập hôm nay...</span>
        </div>
      </div>
    );
  }

  const currentItem = reviews[currentIdx];
  const totalReviews = reviews.length;
  const isFinished = currentIdx >= totalReviews;

  const scoreOptions = [
    { value: 0, label: "Quên hoàn toàn", desc: "Không có ấn tượng gì", color: "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-500 hover:text-white hover:border-rose-500" },
    { value: 1, label: "Nhớ mang máng", desc: "Nhầm lẫn khi trả lời", color: "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-500 hover:text-white hover:border-orange-500" },
    { value: 2, label: "Cần xem đáp án", desc: "Nhớ ra sau khi lật thẻ", color: "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-500 hover:text-white hover:border-amber-500" },
    { value: 3, label: "Nhớ khó khăn", desc: "Mất nhiều thời gian nghĩ", color: "bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-500 hover:text-white hover:border-yellow-500" },
    { value: 4, label: "Nhớ tốt", desc: "Trả lời đúng sau đắn đo", color: "bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-500 hover:text-white hover:border-indigo-500" },
    { value: 5, label: "Nhớ hoàn hảo", desc: "Phản xạ trả lời ngay", color: "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-500 hover:text-white hover:border-emerald-500" },
  ];

  return (
    <div className="container mx-auto px-6 py-12 max-w-2xl space-y-8 animate-in fade-in duration-500">
      
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-gradient-to-tr from-blue-500 to-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
            <Calendar size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Học lặp lại ngắt quãng</h1>
            <p className="text-xs font-semibold text-slate-400 mt-1.5">Thuật toán SuperMemo-2 tối ưu hóa trí nhớ dài hạn</p>
          </div>
        </div>
        {!isFinished && (
          <span className="px-3 py-1.5 rounded-full bg-slate-100 text-xs font-black text-slate-500">
            Còn lại {totalReviews - currentIdx} thẻ
          </span>
        )}
      </div>

      <AnimatePresence mode="wait">
        {initialDueCount === 0 ? (
          <motion.div
            key="all-caught-up"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 px-6 bg-white border border-slate-100 rounded-3xl shadow-xl shadow-slate-100/40 flex flex-col items-center justify-center space-y-6"
          >
            <div className="h-20 w-20 bg-blue-50 border border-blue-100 text-blue-500 rounded-full flex items-center justify-center">
              <Sparkles size={44} className="animate-pulse" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-800">Không có thẻ đến hạn ôn!</h2>
              <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
                Tuyệt vời! Bạn đã hoàn thành toàn bộ lịch ôn tập hôm nay. Hãy tiếp tục tải lên tài liệu mới để củng cố kiến thức.
              </p>
            </div>
            <div className="pt-4 flex gap-4 w-full max-w-xs justify-center mx-auto">
              <Button onClick={() => router.push("/")} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 font-bold px-8">
                Về trang chủ
              </Button>
            </div>
          </motion.div>
        ) : isFinished ? (
          <motion.div
            key="finish"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 px-6 bg-white border border-slate-100 rounded-3xl shadow-xl shadow-slate-100/40 flex flex-col items-center justify-center space-y-6"
          >
            <div className="h-20 w-20 bg-emerald-50 border border-emerald-100 text-emerald-500 rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle2 size={44} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-800">Hoàn thành buổi học hôm nay!</h2>
              <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
                Tuyệt vời! Bạn đã hoàn thành {completedCount} thẻ ôn tập. Hệ thống sẽ tính toán lại khoảng cách và nhắc nhở bạn khi thẻ đến hạn.
              </p>
            </div>
            <div className="pt-4 flex gap-4 w-full max-w-xs">
              <Button onClick={() => router.push("/")} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 font-bold">
                Về trang chủ
              </Button>
              <Button onClick={fetchDueReviews} variant="outline" className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl h-11 font-bold">
                Tải lại trang
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={currentItem.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            {/* ProgressBar */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-blue-600 h-full transition-all duration-300"
                style={{ width: `${(currentIdx / totalReviews) * 100}%` }}
              />
            </div>

            {/* Flashcard Component */}
            {currentItem.flashcard ? (
              <div 
                className="relative h-[300px] w-full cursor-pointer perspective-1000"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <motion.div
                  className="w-full h-full relative transform-style-preserve-3d"
                  initial={false}
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Front */}
                  <div className="absolute inset-0 w-full h-full backface-hidden">
                    <Card className="w-full h-full border border-slate-100 shadow-lg flex flex-col items-center justify-center p-8 text-center bg-white rounded-3xl hover:border-blue-200 transition-colors relative">
                      <span className="absolute top-4 left-4 text-xs font-black text-slate-300 uppercase tracking-widest">
                        Câu hỏi / Khái niệm ({currentItem.flashcard.cardType})
                      </span>
                      <h3 className="text-xl font-bold text-slate-800 leading-relaxed max-w-md">
                        {currentItem.flashcard.frontText}
                      </h3>
                      <p className="absolute bottom-4 text-slate-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                        Nhấp để xem đáp án <RotateCw size={12} />
                      </p>
                    </Card>
                  </div>

                  {/* Back */}
                  <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
                    <Card className="w-full h-full border border-indigo-100 shadow-lg flex flex-col items-center justify-center p-8 text-center bg-gradient-to-tr from-indigo-50/50 to-purple-50/50 rounded-3xl relative">
                      <span className="absolute top-4 left-4 text-xs font-black text-indigo-400 uppercase tracking-widest">
                        Đáp án / Định nghĩa
                      </span>
                      <p className="text-lg font-bold text-indigo-950 leading-relaxed max-w-md">
                        {currentItem.flashcard.backText}
                      </p>
                      <p className="absolute bottom-4 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                        Bấm nút bên dưới để chấm điểm nhớ thẻ
                      </p>
                    </Card>
                  </div>
                </motion.div>
              </div>
            ) : (
              <Card className="p-8 text-center border-dashed border-2 border-slate-200 rounded-3xl">
                <AlertCircle className="mx-auto text-slate-400 mb-2" size={32} />
                <p className="text-sm font-semibold text-slate-500">Thẻ flashcard này đã bị xóa hoặc không hợp lệ.</p>
                <Button size="sm" onClick={() => setCurrentIdx(prev => prev + 1)} className="mt-3">Bỏ qua</Button>
              </Card>
            )}

            {/* SM-2 scoring panel: Show only when card is flipped */}
            {isFlipped && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 pt-2"
              >
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider text-center">
                  Mức độ nhớ của bạn thế nào?
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {scoreOptions.map((opt) => (
                    <button
                      key={opt.value}
                      disabled={submitting}
                      onClick={(e) => { e.stopPropagation(); handleScoreSubmit(opt.value); }}
                      className={cn(
                        "flex flex-col items-center text-center p-3 rounded-2xl border-2 transition-all duration-200 group active:scale-95 disabled:opacity-50",
                        opt.color
                      )}
                    >
                      <span className="text-sm font-black tracking-tight">{opt.value} - {opt.label}</span>
                      <span className="text-[10px] text-slate-400 font-medium mt-1 leading-tight group-hover:text-white/80">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
