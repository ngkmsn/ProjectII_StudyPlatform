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
    <div className="container mx-auto px-8 py-10 max-w-5xl">
      {/* Breadcrumb & Title */}
      <button onClick={() => router.push("/")} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 font-semibold transition-colors">
        <ChevronLeft size={18} /> Quay lại Bảng điều khiển
      </button>

      <div className="flex items-start justify-between mb-10">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileText size={24} />
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">{doc?.fileName}</h1>
          </div>
          <p className="text-gray-500 font-medium ml-12">Tạo bởi bạn • {new Date(doc?.createdAt).toLocaleDateString('vi-VN')}</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeMode === "options" && (
          <motion.div 
            key="options"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="grid md:grid-cols-2 gap-6"
          >
            <Card className="group hover:border-purple-400 hover:shadow-xl hover:shadow-purple-100 transition-all cursor-pointer overflow-hidden border-2 border-transparent bg-white" onClick={handleStartQuiz}>
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="h-20 w-20 bg-purple-50 text-purple-600 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <BrainCircuit size={40} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-gray-900">AI Quiz</h3>
                    <p className="text-gray-500 font-medium">Tạo bộ câu hỏi trắc nghiệm thông minh để kiểm tra kiến thức của bạn ngay lập tức.</p>
                  </div>
                  <Button variant="secondary" className="w-full h-12 rounded-xl font-bold mt-4 shadow-lg shadow-purple-100">
                    {hasExistingQuiz ? "Xem lại / Làm lại Quiz" : "Bắt đầu ôn tập"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:border-blue-400 hover:shadow-xl hover:shadow-blue-100 transition-all cursor-pointer overflow-hidden border-2 border-transparent bg-white" onClick={handleGenerateFlashcards}>
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="h-20 w-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Layers size={40} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-gray-900">Flashcards</h3>
                    <p className="text-gray-500 font-medium">Ghi nhớ các khái niệm quan trọng thông qua bộ thẻ ghi nhớ tự động.</p>
                  </div>
                  <Button variant="outline" className="w-full h-12 rounded-xl font-bold mt-4 border-blue-200 text-blue-600 hover:bg-blue-50">
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
              <div className="flex flex-col items-center justify-center py-20 space-y-6">
                <div className="relative">
                  <div className="h-24 w-24 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-purple-600">
                    <Sparkles size={32} className="animate-pulse" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-gray-900">Gemini AI đang phân tích tài liệu...</h3>
                  <p className="text-gray-500">Việc này có thể mất vài giây</p>
                </div>
              </div>
            ) : (
              <div className="space-y-8 pb-20">
                <div className="flex items-center justify-between sticky top-0 z-40 bg-gray-50/95 backdrop-blur-sm py-4 border-b border-gray-200">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Trophy className="text-yellow-500" /> Thử thách Quiz AI
                  </h3>
                  {showResults && (
                    <div className="bg-white border-2 border-purple-500 text-purple-700 px-6 py-2 rounded-2xl font-black text-lg shadow-lg">
                      KẾT QUẢ: {score} / {questions.length}
                    </div>
                  )}
                </div>

                <div className="grid gap-8">
                  {questions.map((q, idx) => (
                    <Card key={q.id} className="border-none shadow-lg shadow-slate-200/50 ring-1 ring-gray-100 overflow-hidden">
                      <CardHeader className="bg-slate-50/50 border-b border-gray-100">
                        <div className="flex gap-4">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-bold">
                            {idx + 1}
                          </span>
                          <CardTitle className="text-lg leading-snug">{q.questionText}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="grid md:grid-cols-2 gap-4">
                          {q.answers.map((a) => {
                            const isSelected = selectedAnswers[q.id] === a.id;
                            let stateStyles = "border-gray-100 hover:border-blue-200 hover:bg-blue-50/30";
                            
                            if (showResults) {
                              if (a.correct) stateStyles = "border-green-500 bg-green-50 text-green-800 ring-1 ring-green-500";
                              else if (isSelected && !a.correct) stateStyles = "border-red-500 bg-red-50 text-red-800 ring-1 ring-red-500";
                              else stateStyles = "border-gray-100 opacity-50 grayscale-[0.5]";
                            } else if (isSelected) {
                              stateStyles = "border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-100";
                            }

                            return (
                              <button
                                key={a.id}
                                onClick={() => handleSelectAnswer(q.id, a.id)}
                                disabled={showResults}
                                className={cn(
                                  "group flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all duration-200 font-semibold",
                                  stateStyles
                                )}
                              >
                                <span>{a.answerText}</span>
                              </button>
                            );
                          })}
                        </div>

                        {showResults && (
                          <div className="mt-6 pt-6 border-t border-gray-100">
                            <div className="flex gap-3 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                              <Lightbulb className="text-blue-600 shrink-0 mt-0.5" size={20} />
                              <div className="space-y-1">
                                <p className="text-sm font-bold text-blue-900">Giải thích chi tiết</p>
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
                    className="w-full h-16 rounded-2xl text-xl font-black shadow-2xl shadow-blue-200 uppercase tracking-widest"
                  >
                    Nộp bài và xem điểm ngay
                  </Button>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    <Button onClick={() => { setQuestions([]); setSelectedAnswers({}); setShowResults(false); handleGenerateQuiz(); }} variant="secondary" className="h-14 rounded-2xl font-bold shadow-xl shadow-purple-100">Thử lại với câu hỏi mới</Button>
                    <Button onClick={() => setActiveMode("options")} variant="outline" className="h-14 rounded-2xl font-bold border-gray-200">Thoát chế độ Quiz</Button>
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
            className="flex flex-col items-center py-10 space-y-10"
          >
            {generating ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-6">
                <div className="relative">
                  <div className="h-24 w-24 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-blue-600">
                    <Sparkles size={32} className="animate-pulse" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-gray-900">Gemini AI đang soạn Flashcards...</h3>
                  <p className="text-gray-500">Tóm tắt các kiến thức quan trọng nhất</p>
                </div>
              </div>
            ) : flashcards.length > 0 ? (
              <>
                <div className="w-full max-w-xl">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                      Thẻ {currentFlashcardIdx + 1} / {flashcards.length}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setActiveMode("options")}
                      className="rounded-xl border-gray-200"
                    >
                      Thoát
                    </Button>
                  </div>

                  <div 
                    className="relative h-[400px] w-full cursor-pointer"
                    style={{ perspective: "1000px" }}
                    onClick={() => setIsFlipped(!isFlipped)}
                  >
                    <motion.div
                      className="w-full h-full relative"
                      initial={false}
                      animate={{ rotateY: isFlipped ? 180 : 0 }}
                      transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                      style={{ transformStyle: "preserve-3d" }}
                    >
                      {/* Front Side */}
                      <div 
                        className="absolute inset-0 w-full h-full"
                        style={{ backfaceVisibility: "hidden" }}
                      >
                        <Card className="w-full h-full border-2 border-blue-100 shadow-2xl shadow-blue-50 flex flex-col items-center justify-center p-10 text-center bg-white rounded-[2.5rem]">
                          <span className="absolute top-8 left-8 text-blue-600/20"><RotateCw size={40} /></span>
                          <h3 className="text-2xl font-bold text-gray-900 leading-relaxed">
                            {flashcards[currentFlashcardIdx].frontText}
                          </h3>
                          <p className="absolute bottom-8 text-gray-400 font-bold text-sm uppercase tracking-tighter flex items-center gap-2">
                            Nhấn để xem đáp án <RotateCw size={14} />
                          </p>
                        </Card>
                      </div>

                      {/* Back Side */}
                      <div 
                        className="absolute inset-0 w-full h-full"
                        style={{ 
                          backfaceVisibility: "hidden",
                          transform: "rotateY(180deg)"
                        }}
                      >
                        <Card className="w-full h-full border-2 border-purple-100 shadow-2xl shadow-purple-50 flex flex-col items-center justify-center p-10 text-center bg-purple-50 rounded-[2.5rem]">
                          <span className="absolute top-8 right-8 text-purple-600/20"><Sparkles size={40} /></span>
                          <p className="text-xl font-medium text-purple-900 leading-relaxed">
                            {flashcards[currentFlashcardIdx].backText}
                          </p>
                          <p className="absolute bottom-8 text-purple-400 font-bold text-sm uppercase tracking-tighter">
                            Đáp án
                          </p>
                        </Card>
                      </div>
                    </motion.div>
                  </div>

                  <div className="flex items-center justify-center gap-6 mt-10">
                    <Button 
                      variant="outline" 
                      onClick={(e) => { e.stopPropagation(); prevFlashcard(); }}
                      disabled={currentFlashcardIdx === 0}
                      className="h-14 w-14 rounded-full border-gray-200 p-0"
                    >
                      <ArrowLeft />
                    </Button>
                    
                    <Button 
                      variant="secondary"
                      onClick={(e) => { e.stopPropagation(); setIsFlipped(!isFlipped); }}
                      className="h-14 px-8 rounded-2xl font-black shadow-lg shadow-blue-100"
                    >
                      Lật thẻ
                    </Button>

                    <Button 
                      variant="outline" 
                      onClick={(e) => { e.stopPropagation(); nextFlashcard(); }}
                      disabled={currentFlashcardIdx === flashcards.length - 1}
                      className="h-14 w-14 rounded-full border-gray-200 p-0"
                    >
                      <ArrowRight />
                    </Button>
                  </div>
                </div>

                <div className="w-full max-w-xl pt-10 border-t border-gray-100">
                  <div className="flex items-center justify-between gap-4">
                    <Button 
                      variant="outline" 
                      className="flex-1 h-12 rounded-xl font-bold border-gray-200"
                      onClick={() => { setFlashcards([]); handleGenerateFlashcards(); }}
                    >
                      <RefreshCcw size={18} className="mr-2" /> Tạo bộ thẻ mới
                    </Button>
                  </div>
                </div>
              </>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}