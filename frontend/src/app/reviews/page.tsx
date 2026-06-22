"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/lib/api";
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
  BookOpen,
  FileText,
  ChevronRight
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

interface Document {
  id: number;
  fileName: string;
  fileUrl: string;
  createdAt: string;
}

export default function DailyReviewsPage() {
  const router = useRouter();
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [selectedDocName, setSelectedDocName] = useState<string>("");
  
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoadingDocs(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/auth/login");
        return;
      }
      const response = await axios.get(`${API_BASE_URL}/api/files`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoadingDocs(false);
    }
  };

  const fetchReviewsForDoc = async (docId: number) => {
    setLoadingReviews(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/api/reviews/today?documentId=${docId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReviews(Array.isArray(response.data) ? response.data : []);
      setCurrentIdx(0);
      setCompletedCount(0);
      setIsFlipped(false);
    } catch (error) {
      console.error("Error fetching reviews for document:", error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleSelectDoc = (doc: Document) => {
    setSelectedDocId(doc.id);
    setSelectedDocName(doc.fileName);
    fetchReviewsForDoc(doc.id);
  };

  const handleGenerateFlashcards = async () => {
    if (!selectedDocId) return;
    setGeneratingFlashcards(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_BASE_URL}/api/ai/generate-flashcards/${selectedDocId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Reload reviews after generation
      await fetchReviewsForDoc(selectedDocId);
    } catch (error) {
      console.error("Error generating flashcards:", error);
      alert("Không thể sinh flashcard bằng AI. Vui lòng thử lại.");
    } finally {
      setGeneratingFlashcards(false);
    }
  };

  const handleScoreSubmit = async (score: number) => {
    if (submitting || reviews.length === 0) return;
    setSubmitting(true);
    const item = reviews[currentIdx];

    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_BASE_URL}/api/reviews/submit`, {
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

  if (loadingDocs) {
    return (
      <div className="flex h-screen items-center justify-center bg-transparent">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <span className="text-sm text-slate-500 font-bold">Đang tải danh sách tài liệu...</span>
        </div>
      </div>
    );
  }

  const currentItem = reviews[currentIdx];
  const totalReviews = reviews.length;
  const isFinished = currentIdx >= totalReviews;

  const scoreOptions = [
    { value: 0, label: "Quên hoàn toàn", desc: "Không có ấn tượng gì", color: "bg-rose-50/50 text-rose-600 border-rose-100 hover:bg-rose-500 hover:text-white hover:border-rose-500" },
    { value: 1, label: "Nhớ mang máng", desc: "Nhầm lẫn khi trả lời", color: "bg-orange-50/50 text-orange-600 border-orange-100 hover:bg-orange-500 hover:text-white hover:border-orange-500" },
    { value: 2, label: "Cần xem đáp án", desc: "Nhớ ra sau khi lật thẻ", color: "bg-amber-50/50 text-amber-600 border-amber-100 hover:bg-amber-500 hover:text-white hover:border-amber-500" },
    { value: 3, label: "Nhớ khó khăn", desc: "Mất nhiều thời gian nghĩ", color: "bg-yellow-50/50 text-yellow-600 border-yellow-100 hover:bg-yellow-500 hover:text-white hover:border-yellow-500" },
    { value: 4, label: "Nhớ tốt", desc: "Trả lời đúng sau đắn đo", color: "bg-indigo-50/50 text-indigo-600 border-indigo-100 hover:bg-indigo-500 hover:text-white hover:border-indigo-500" },
    { value: 5, label: "Nhớ hoàn hảo", desc: "Phản xạ trả lời ngay", color: "bg-emerald-50/50 text-emerald-600 border-emerald-100 hover:bg-emerald-500 hover:text-white hover:border-emerald-500" },
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
            <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Học ôn tập Flashcard</h1>
            <p className="text-xs font-semibold text-slate-400 mt-1.5">Ôn tập chọn lọc dựa trên tài liệu đã tải lên</p>
          </div>
        </div>
        {selectedDocId !== null && !loadingReviews && totalReviews > 0 && !isFinished && (
          <span className="px-3 py-1.5 rounded-full bg-slate-100 text-xs font-black text-slate-500">
            Còn lại {totalReviews - currentIdx} thẻ
          </span>
        )}
      </div>

      <AnimatePresence mode="wait">
        {selectedDocId === null ? (
          /* Màn hình lựa chọn tài liệu ôn tập */
          <motion.div
            key="document-selection"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            <div className="text-left space-y-1">
              <h2 className="text-lg font-bold text-slate-800">Hôm nay bạn muốn ôn tập nội dung gì?</h2>
              <p className="text-xs text-slate-400 font-semibold">Chọn một tài liệu dưới đây để bắt đầu ôn tập flashcard tương ứng:</p>
            </div>

            {documents.length === 0 ? (
              <Card className="p-12 text-center border-dashed border-2 rounded-3xl">
                <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <FileText className="text-gray-400" size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Chưa có tài liệu nào</h3>
                <p className="text-slate-400 text-xs mt-1">Hãy quay lại trang chủ và tải lên tài liệu học tập của bạn.</p>
                <Button 
                  className="mt-6 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-100" 
                  onClick={() => router.push("/")}
                >
                  Tải lên tài liệu
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4">
                {documents.map((doc) => (
                  <Card
                    key={doc.id}
                    className="glass-card glass-card-hover glow-blue relative overflow-hidden rounded-2xl border border-slate-100/80 cursor-pointer group"
                    onClick={() => handleSelectDoc(doc)}
                  >
                    <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-500" />
                    <CardContent className="p-5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100 shrink-0 group-hover:scale-110 transition-transform duration-300">
                          <FileText size={20} />
                        </div>
                        <div className="text-left min-w-0">
                          <h4 className="font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors leading-snug">
                            {doc.fileName}
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-1">
                            Tải lên ngày: {new Date(doc.createdAt).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all shrink-0" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        ) : loadingReviews ? (
          /* Màn hình loading khi tải thẻ */
          <motion.div
            key="reviews-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4"
          >
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <p className="text-xs text-slate-400 font-bold">Đang chuẩn bị bộ thẻ học...</p>
          </motion.div>
        ) : generatingFlashcards ? (
          /* Màn hình sinh AI Flashcards */
          <motion.div
            key="flashcard-generation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4"
          >
            <div className="relative">
              <div className="h-16 w-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-blue-600">
                <Sparkles size={24} className="animate-pulse" />
              </div>
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-800">AI đang phân tích kiến thức...</h3>
              <p className="text-xs text-slate-400 font-medium">Đang tự động thiết kế bộ câu hỏi Flashcard học tập</p>
            </div>
          </motion.div>
        ) : totalReviews === 0 ? (
          /* Màn hình tài liệu trống chưa có flashcard */
          <motion.div
            key="empty-flashcards"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="text-center py-16 px-6 bg-white border border-slate-100 rounded-3xl shadow-xl shadow-slate-100/40 flex flex-col items-center justify-center space-y-6"
          >
            <button 
              onClick={() => setSelectedDocId(null)}
              className="absolute top-4 left-6 flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              <ArrowLeft size={14} /> Chọn tài liệu khác
            </button>
            <div className="h-20 w-20 bg-blue-50 border border-blue-100 text-blue-500 rounded-full flex items-center justify-center">
              <Sparkles size={44} className="animate-pulse" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black text-slate-800">Tài liệu chưa có Flashcard!</h2>
              <p className="text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">
                Tài liệu <strong>{selectedDocName}</strong> chưa được tạo thẻ Flashcard. Hãy để AI giúp bạn trích xuất kiến thức cốt lõi ngay bây giờ.
              </p>
            </div>
            <div className="pt-4 flex gap-3 w-full max-w-xs justify-center mx-auto">
              <Button onClick={handleGenerateFlashcards} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl h-11 font-bold px-8 w-full border-none">
                Tạo Flashcard bằng AI
              </Button>
            </div>
          </motion.div>
        ) : isFinished ? (
          /* Màn hình hoàn thành buổi học */
          <motion.div
            key="finish"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="text-center py-16 px-6 bg-white border border-slate-100 rounded-3xl shadow-xl shadow-slate-100/40 flex flex-col items-center justify-center space-y-6 relative"
          >
            <div className="h-20 w-20 bg-emerald-50 border border-emerald-100 text-emerald-500 rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle2 size={44} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-800">Hoàn thành buổi học!</h2>
              <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
                Tuyệt vời! Bạn đã hoàn thành việc ôn tập {completedCount} thẻ ôn tập của tài liệu <strong>{selectedDocName}</strong>.
              </p>
            </div>
            <div className="pt-4 flex gap-4 w-full max-w-sm">
              <Button onClick={() => setSelectedDocId(null)} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 font-bold border-none">
                Ôn tập tài liệu khác
              </Button>
              <Button onClick={() => fetchReviewsForDoc(selectedDocId)} variant="outline" className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl h-11 font-bold">
                Học lại từ đầu
              </Button>
            </div>
          </motion.div>
        ) : (
          /* Màn hình lật thẻ Flashcard */
          <motion.div
            key={currentItem.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <button 
              onClick={() => setSelectedDocId(null)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 mb-2 transition-colors"
            >
              <ArrowLeft size={14} /> Quay về chọn tài liệu
            </button>

            {/* Progress Bar */}
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
                  {/* Front Side */}
                  <div className="absolute inset-0 w-full h-full backface-hidden">
                    <Card className="w-full h-full border border-slate-100 shadow-lg flex flex-col items-center justify-center p-8 text-center bg-white rounded-3xl hover:border-blue-200 transition-colors relative">
                      <span className="absolute top-4 left-4 text-xs font-black text-slate-300 uppercase tracking-widest">
                        Khái niệm / Câu hỏi ({currentItem.flashcard.cardType})
                      </span>
                      <h3 className="text-lg font-bold text-slate-800 leading-relaxed max-w-md">
                        {currentItem.flashcard.frontText}
                      </h3>
                      <p className="absolute bottom-4 text-slate-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                        Nhấp chuột để xem đáp án <RotateCw size={12} />
                      </p>
                    </Card>
                  </div>

                  {/* Back Side */}
                  <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
                    <Card className="w-full h-full border border-indigo-100 shadow-lg flex flex-col items-center justify-center p-8 text-center bg-gradient-to-tr from-indigo-50/50 to-purple-50/50 rounded-3xl relative">
                      <span className="absolute top-4 left-4 text-xs font-black text-indigo-400 uppercase tracking-widest">
                        Đáp án / Định nghĩa
                      </span>
                      <p className="text-md font-bold text-indigo-950 leading-relaxed max-w-md">
                        {currentItem.flashcard.backText}
                      </p>
                      <p className="absolute bottom-4 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                        Đánh giá mức độ nhớ của bạn ở dưới
                      </p>
                    </Card>
                  </div>
                </motion.div>
              </div>
            ) : (
              <Card className="p-8 text-center border-dashed border-2 border-slate-200 rounded-3xl">
                <AlertCircle className="mx-auto text-slate-400 mb-2" size={32} />
                <p className="text-sm font-semibold text-slate-500">Thẻ flashcard này không hợp lệ hoặc đã bị xóa.</p>
                <Button size="sm" onClick={() => setCurrentIdx(prev => prev + 1)} className="mt-3">Bỏ qua</Button>
              </Card>
            )}

            {/* SM-2 Scoring Options */}
            {isFlipped && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 pt-2"
              >
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider text-center">
                  Bạn nhớ nội dung này ở mức nào?
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
