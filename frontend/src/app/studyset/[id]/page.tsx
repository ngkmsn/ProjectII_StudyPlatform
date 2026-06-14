"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BrainCircuit, 
  Layers, 
  FileText, 
  ChevronLeft,
  Sparkles,
  Trophy,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCcw,
  RotateCw,
  ArrowRight,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface Answer {
  id: number;
  answerText: string;
  correct: boolean;
}

interface Question {
  id: number;
  questionText: string;
  explanation: string;
  answers: Answer[];
}

interface Flashcard {
  id: number;
  frontText: string;
  backText: string;
}

export default function StudySetPage() {
  const { id } = useParams();
  const router = useRouter();
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // AI Quiz states
  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [hasExistingQuiz, setHasExistingQuiz] = useState(false);
  
  // Flashcard states
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentFlashcardIdx, setCurrentFlashcardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const [activeMode, setActiveMode] = useState<"options" | "quiz" | "flashcards">("options");

  useEffect(() => {
    if (id) {
      fetchDocDetail();
      checkExistingQuizAndMode();
    }
  }, [id]);

  const fetchDocDetail = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:8080/api/files", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const currentDoc = response.data.find((d: any) => d.id.toString() === id);
      if (currentDoc) setDoc(currentDoc);
      else router.push("/");
    } catch (error) {
      console.error("Error fetching doc:", error);
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const checkExistingQuizAndMode = async () => {
    try {
      const token = localStorage.getItem("token");
      const quizRes = await axios.get(`http://localhost:8080/api/ai/quiz/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (quizRes.data && quizRes.data.length > 0) {
        setQuestions(quizRes.data);
        setHasExistingQuiz(true);
        
        // If mode query param is "quiz", enter quiz mode directly
        const mode = new URLSearchParams(window.location.search).get("mode");
        if (mode === "quiz") {
          setActiveMode("quiz");
        }
      }
    } catch (error) {
      console.error("Error checking existing quiz:", error);
    }
  };

  const handleStartQuiz = () => {
    if (hasExistingQuiz) {
      setActiveMode("quiz");
    } else {
      handleGenerateQuiz();
    }
  };

  const handleGenerateQuiz = async () => {
    setGenerating(true);
    setActiveMode("quiz");
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(`http://localhost:8080/api/ai/generate/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuestions(response.data);
      setHasExistingQuiz(true);
    } catch (error) {
      alert("Không thể tạo câu hỏi. Vui lòng thử lại.");
      setActiveMode("options");
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    setGenerating(true);
    setActiveMode("flashcards");
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(`http://localhost:8080/api/ai/generate-flashcards/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFlashcards(response.data);
      setCurrentFlashcardIdx(0);
      setIsFlipped(false);
    } catch (error) {
      alert("Không thể tạo flashcards. Vui lòng thử lại.");
      setActiveMode("options");
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectAnswer = (questionId: number, answerId: number) => {
    if (showResults) return;
    setSelectedAnswers(prev => ({ ...prev, [questionId]: answerId }));
  };

  const nextFlashcard = () => {
    if (currentFlashcardIdx < flashcards.length - 1) {
      setCurrentFlashcardIdx(prev => prev + 1);
      setIsFlipped(false);
    }
  };

  const prevFlashcard = () => {
    if (currentFlashcardIdx > 0) {
      setCurrentFlashcardIdx(prev => prev - 1);
      setIsFlipped(false);
    }
  };

  const score = questions.filter(q => q.answers.find(a => a.id === selectedAnswers[q.id])?.correct).length;

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;


  return (
    <div className="container mx-auto px-8 py-12 max-w-5xl space-y-8 animate-in fade-in duration-500">
      {/* Breadcrumb & Title */}
      <button 
        onClick={() => router.push("/")} 
        className="flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-2 font-bold transition-all hover:-translate-x-1 group"
      >
        <ChevronLeft size={16} className="transition-transform group-hover:scale-110" /> Quay lại Bảng điều khiển
      </button>

      <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-lg shadow-slate-100/40 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <div className="h-14 w-14 bg-gradient-to-tr from-blue-500 to-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
            <FileText size={26} />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">{doc?.fileName}</h1>
            <p className="text-xs font-semibold text-slate-400">
              Tải lên ngày: {doc?.createdAt ? new Date(doc.createdAt).toLocaleDateString('vi-VN') : 'Đang tải...'}
            </p>
          </div>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-blue-50/20 to-transparent pointer-events-none" />
      </div>

      <AnimatePresence mode="wait">
        {activeMode === "options" && (
          <motion.div 
            key="options"
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
            className="grid md:grid-cols-2 gap-8"
          >
            {/* Mode: AI Quiz */}
            <Card 
              className="group glass-card glass-card-hover border-slate-150 overflow-hidden cursor-pointer" 
              onClick={handleStartQuiz}
            >
              <CardContent className="p-8 space-y-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="h-20 w-20 bg-purple-50 text-purple-600 rounded-3xl flex items-center justify-center border border-purple-100 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                    <BrainCircuit size={38} className="animate-float" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-800">AI Quiz</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Tạo bộ câu hỏi trắc nghiệm thông minh để kiểm tra và củng cố kiến thức của bạn ngay lập tức.
                    </p>
                  </div>
                  <Button variant="secondary" className="w-full h-12 rounded-xl font-bold mt-4 shadow-lg shadow-purple-100 bg-purple-600 text-white hover:bg-purple-700 border-none">
                    {hasExistingQuiz ? "Làm lại bài kiểm tra" : "Bắt đầu ôn tập"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Mode: Flashcards */}
            <Card 
              className="group glass-card glass-card-hover border-slate-150 overflow-hidden cursor-pointer" 
              onClick={handleGenerateFlashcards}
            >
              <CardContent className="p-8 space-y-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="h-20 w-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center border border-blue-100 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                    <Layers size={38} className="animate-float" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-800">Flashcards</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Ghi nhớ từ vựng, định lý và các khái niệm quan trọng thông qua bộ thẻ học thông minh tự động.
                    </p>
                  </div>
                  <Button variant="outline" className="w-full h-12 rounded-xl font-bold mt-4 border-blue-200 text-blue-600 hover:bg-blue-50/50">
                    Học bằng Flashcards
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeMode === "quiz" && (
          <motion.div 
            key="quiz"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {generating ? (
              <div className="flex flex-col items-center justify-center py-24 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-6">
                <div className="relative">
                  <div className="h-20 w-20 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-purple-600">
                    <Sparkles size={28} className="animate-pulse" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-slate-800">AI đang phân tích & soạn câu hỏi...</h3>
                  <p className="text-slate-400 text-sm font-medium">Quá trình này mất khoảng vài giây</p>
                </div>
              </div>
            ) : (
              <div className="space-y-8 pb-20">
                <div className="flex items-center justify-between sticky top-16 z-30 bg-slate-50/90 backdrop-blur-md py-4 border-b border-slate-200">
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Trophy className="text-amber-500" /> Thử thách Quiz AI
                  </h3>
                  {showResults ? (
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-2.5 rounded-2xl font-black text-lg shadow-lg shadow-emerald-100">
                      KẾT QUẢ: {score} / {questions.length}
                    </div>
                  ) : (
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveMode("options")}
                      className="rounded-xl border-slate-200 text-slate-500 hover:bg-slate-100"
                    >
                      Thoát
                    </Button>
                  )}
                </div>

                <div className="grid gap-8">
                  {questions.map((q, idx) => (
                    <Card key={q.id} className="border-none shadow-lg shadow-slate-100/40 bg-white ring-1 ring-slate-100 overflow-hidden rounded-2xl">
                      <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                        <div className="flex gap-4 items-start">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white text-sm font-bold shadow-md shadow-blue-200">
                            {idx + 1}
                          </span>
                          <CardTitle className="text-lg leading-snug text-slate-800 pt-0.5">{q.questionText}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="grid md:grid-cols-2 gap-4">
                          {q.answers.map((a) => {
                            const isSelected = selectedAnswers[q.id] === a.id;
                            let stateStyles = "border-slate-100 hover:border-blue-200 hover:bg-blue-50/30";
                            
                            if (showResults) {
                              if (a.correct) stateStyles = "border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500";
                              else if (isSelected && !a.correct) stateStyles = "border-red-500 bg-red-50 text-red-800 ring-1 ring-red-500";
                              else stateStyles = "border-slate-100 opacity-50 grayscale-[0.4]";
                            } else if (isSelected) {
                              stateStyles = "border-blue-600 bg-blue-50/40 text-blue-700 ring-2 ring-blue-100 font-bold";
                            }

                            return (
                              <button
                                key={a.id}
                                onClick={() => handleSelectAnswer(q.id, a.id)}
                                disabled={showResults}
                                className={cn(
                                  "group flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all duration-200 text-sm font-semibold",
                                  stateStyles
                                )}
                              >
                                <span>{a.answerText}</span>
                              </button>
                            );
                          })}
                        </div>

                        {showResults && (
                          <div className="mt-6 pt-6 border-t border-slate-100">
                            <div className="flex gap-3 bg-blue-50/40 p-4 rounded-2xl border border-blue-100/50 glow-blue">
                              <Lightbulb className="text-blue-600 shrink-0 mt-0.5" size={20} />
                              <div className="space-y-1">
                                <p className="text-sm font-bold text-blue-900">Giải thích từ AI</p>
                                <p className="text-sm text-blue-800/80 leading-relaxed italic">{q.explanation}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {!showResults ? (
                  <Button
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      setShowResults(true);
                    }}
                    disabled={Object.keys(selectedAnswers).length < questions.length}
                    className="w-full h-15 rounded-2xl text-lg font-black shadow-xl shadow-blue-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white uppercase tracking-wider"
                  >
                    Nộp bài và xem kết quả
                  </Button>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    <Button 
                      onClick={() => { setQuestions([]); setSelectedAnswers({}); setShowResults(false); handleGenerateQuiz(); }} 
                      variant="secondary" 
                      className="h-14 rounded-2xl font-bold shadow-lg shadow-purple-100 bg-purple-600 text-white hover:bg-purple-700"
                    >
                      Làm bài kiểm tra mới
                    </Button>
                    <Button 
                      onClick={() => { setSelectedAnswers({}); setShowResults(false); setActiveMode("options"); }} 
                      variant="outline" 
                      className="h-14 rounded-2xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                      Thoát chế độ Quiz
                    </Button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {activeMode === "flashcards" && (
          <motion.div 
            key="flashcards"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center py-6 space-y-8"
          >
            {generating ? (
              <div className="flex flex-col items-center justify-center py-24 bg-white border border-slate-100 rounded-3xl w-full max-w-xl shadow-sm space-y-6">
                <div className="relative">
                  <div className="h-20 w-20 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-blue-600">
                    <Sparkles size={28} className="animate-pulse" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-slate-800">AI đang tóm tắt Flashcards...</h3>
                  <p className="text-slate-400 text-sm font-medium">Trích xuất kiến thức trọng tâm</p>
                </div>
              </div>
            ) : flashcards.length > 0 ? (
              <>
                <div className="w-full max-w-xl space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Thẻ {currentFlashcardIdx + 1} / {flashcards.length}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setActiveMode("options")}
                      className="rounded-xl border-slate-200 text-slate-500 hover:bg-slate-100"
                    >
                      Thoát
                    </Button>
                  </div>

                  <div 
                    className="relative h-[340px] w-full cursor-pointer perspective-1000"
                    onClick={() => setIsFlipped(!isFlipped)}
                  >
                    <motion.div
                      className="w-full h-full relative transform-style-preserve-3d"
                      initial={false}
                      animate={{ rotateY: isFlipped ? 180 : 0 }}
                      transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 20 }}
                    >
                      {/* Front Side */}
                      <div 
                        className="absolute inset-0 w-full h-full backface-hidden"
                      >
                        <Card className="w-full h-full border border-blue-100 shadow-xl shadow-blue-50/40 flex flex-col items-center justify-center p-8 text-center bg-white rounded-3xl relative overflow-hidden group hover:border-blue-300 transition-colors">
                          <span className="absolute top-6 left-6 text-blue-100"><RotateCw size={36} /></span>
                          <h3 className="text-xl font-bold text-slate-800 leading-relaxed px-4">
                            {flashcards[currentFlashcardIdx].frontText}
                          </h3>
                          <p className="absolute bottom-6 text-slate-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                            Nhấp để lật thẻ <RotateCw size={12} />
                          </p>
                        </Card>
                      </div>

                      {/* Back Side */}
                      <div 
                        className="absolute inset-0 w-full h-full backface-hidden rotate-y-180"
                      >
                        <Card className="w-full h-full border border-purple-100 shadow-xl shadow-purple-50/40 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-tr from-purple-50 to-indigo-50/50 rounded-3xl relative overflow-hidden">
                          <span className="absolute top-6 right-6 text-purple-200/50"><Sparkles size={36} /></span>
                          <p className="text-lg font-bold text-purple-900 leading-relaxed px-4">
                            {flashcards[currentFlashcardIdx].backText}
                          </p>
                          <p className="absolute bottom-6 text-purple-400 font-bold text-xs uppercase tracking-wider">
                            Định nghĩa / Đáp án
                          </p>
                        </Card>
                      </div>
                    </motion.div>
                  </div>

                  <div className="flex items-center justify-center gap-4 mt-6">
                    <Button 
                      variant="outline" 
                      onClick={(e) => { e.stopPropagation(); prevFlashcard(); }}
                      disabled={currentFlashcardIdx === 0}
                      className="h-12 w-12 rounded-full border-slate-200 p-0 hover:bg-slate-100"
                    >
                      <ArrowLeft size={18} />
                    </Button>
                    
                    <Button 
                      variant="secondary"
                      onClick={(e) => { e.stopPropagation(); setIsFlipped(!isFlipped); }}
                      className="h-12 px-6 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white border-none shadow-md shadow-blue-200"
                    >
                      Lật thẻ
                    </Button>

                    <Button 
                      variant="outline" 
                      onClick={(e) => { e.stopPropagation(); nextFlashcard(); }}
                      disabled={currentFlashcardIdx === flashcards.length - 1}
                      className="h-12 w-12 rounded-full border-slate-200 p-0 hover:bg-slate-100"
                    >
                      <ArrowRight size={18} />
                    </Button>
                  </div>
                </div>

                <div className="w-full max-w-xl pt-6 border-t border-slate-150">
                  <Button 
                    variant="outline" 
                    className="w-full h-11 rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50"
                    onClick={() => { setFlashcards([]); handleGenerateFlashcards(); }}
                  >
                    <RefreshCcw size={16} className="mr-2" /> Tạo bộ thẻ Flashcards mới
                  </Button>
                </div>
              </>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}