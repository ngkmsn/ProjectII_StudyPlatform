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
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Send,
  BookOpen,
  HelpCircle,
  X
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
  type?: string;
  difficulty?: string;
}

interface Flashcard {
  id: number;
  frontText: string;
  backText: string;
}

interface Topic {
  id: number;
  title: string;
  description: string;
  masteryLevel: number;
  parent: Topic | null;
}

interface ChatMessage {
  id?: number;
  sender: "USER" | "AI";
  message: string;
  citations?: string; // JSON string
  createdAt?: string;
}

interface Citation {
  chunkId: number;
  chunkIndex: number;
  snippet: string;
  pageNumber: number;
}

export default function StudySetPage() {
  const { id } = useParams();
  const router = useRouter();
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Topic tree states
  const [topics, setTopics] = useState<Topic[]>([]);
  const [fetchingTopics, setFetchingTopics] = useState(false);
  const [expandedTopics, setExpandedTopics] = useState<Record<number, boolean>>({});

  // AI Quiz states
  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [hasExistingQuiz, setHasExistingQuiz] = useState(false);
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");
  const [isAdaptive, setIsAdaptive] = useState(false);
  const [selectedTopicForQuiz, setSelectedTopicForQuiz] = useState<string | null>(null);
  
  // Flashcard states
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentFlashcardIdx, setCurrentFlashcardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Chat/RAG drawer states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const [activeCitation, setActiveCitation] = useState<any | null>(null);

  const [activeMode, setActiveMode] = useState<"options" | "quiz" | "flashcards">("options");

  useEffect(() => {
    if (id) {
      fetchDocDetail();
      checkExistingQuizAndMode();
      fetchTopics();
      fetchChatHistory();
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

  const fetchTopics = async () => {
    setFetchingTopics(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`http://localhost:8080/api/topics/document/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTopics(response.data);
      // Auto expand first parent topic
      const parents = response.data.filter((t: Topic) => !t.parent);
      if (parents.length > 0) {
        setExpandedTopics(prev => ({ ...prev, [parents[0].id]: true }));
      }
    } catch (error) {
      console.error("Error fetching topics:", error);
    } finally {
      setFetchingTopics(false);
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
        
        const mode = new URLSearchParams(window.location.search).get("mode");
        if (mode === "quiz") {
          setActiveMode("quiz");
        }
      }
    } catch (error) {
      console.error("Error checking existing quiz:", error);
    }
  };

  const fetchChatHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`http://localhost:8080/api/chat/document/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChatMessages(response.data);
    } catch (error) {
      console.error("Error fetching chat history:", error);
    }
  };

  const handleStartQuiz = () => {
    setSelectedTopicForQuiz(null);
    if (hasExistingQuiz && !isAdaptive) {
      setActiveMode("quiz");
    } else {
      handleGenerateQuiz();
    }
  };

  const handleGenerateQuiz = async () => {
    setGenerating(true);
    setActiveMode("quiz");
    setShowResults(false);
    setSelectedAnswers({});
    try {
      const token = localStorage.getItem("token");
      let response;
      if (isAdaptive || selectedTopicForQuiz) {
        response = await axios.post(`http://localhost:8080/api/quiz/adaptive`, {
          documentId: id,
          difficulty: difficulty,
          topic: selectedTopicForQuiz || undefined
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        response = await axios.post(`http://localhost:8080/api/ai/generate/${id}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
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

  const handleSubmitQuiz = async () => {
    const correctCount = questions.filter(q => q.answers.find(a => a.id === selectedAnswers[q.id])?.correct).length;
    const finalScore = Math.round((correctCount / questions.length) * 100);
    
    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:8080/api/quiz/submit", {
        documentId: id,
        score: finalScore,
        answers: selectedAnswers
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refresh topic mastery tree
      fetchTopics();
    } catch (err) {
      console.error("Error submitting quiz results:", err);
    }
    
    setShowResults(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || sendingChat) return;

    const userMsg = chatInput;
    setChatInput("");
    setSendingChat(true);

    // Optimistic update
    setChatMessages(prev => [...prev, { sender: "USER", message: userMsg }]);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post("http://localhost:8080/api/chat/document", {
        documentId: id,
        message: userMsg
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setChatMessages(prev => [...prev, { 
        sender: "AI", 
        message: res.data.answer,
        citations: JSON.stringify(res.data.citations)
      }]);
    } catch (err) {
      console.error("Chat error:", err);
      setChatMessages(prev => [...prev, { sender: "AI", message: "Có lỗi xảy ra khi kết nối trợ lý AI." }]);
    } finally {
      setSendingChat(false);
    }
  };

  const score = questions.filter(q => q.answers.find(a => a.id === selectedAnswers[q.id])?.correct).length;

  const parentTopics = topics.filter(t => !t.parent);
  const getSubtopics = (parentId: number) => topics.filter(t => t.parent && t.parent.id === parentId);

  const toggleExpandTopic = (topicId: number) => {
    setExpandedTopics(prev => ({ ...prev, [topicId]: !prev[topicId] }));
  };

  const handlePracticeTopic = (topicTitle: string) => {
    setSelectedTopicForQuiz(topicTitle);
    setIsAdaptive(true);
    handleGenerateQuiz();
  };

  // Safe formatting for chat answers
  const formatChatMessage = (text: string) => {
    if (!text) return "";
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\n/g, '<br />');
    return <div dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl space-y-6 animate-in fade-in duration-500 relative">
      {/* Breadcrumb */}
      <button 
        onClick={() => router.push("/")} 
        className="flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-2 font-bold transition-all hover:-translate-x-1 group"
      >
        <ChevronLeft size={16} className="transition-transform group-hover:scale-110" /> Quay lại Bảng điều khiển
      </button>

      {/* Header Info */}
      <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
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
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left column: Expandable Topic Tree (Curriculum breakdown) */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="border-none shadow-md bg-white rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-4">
              <CardTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
                <BookOpen className="text-blue-600" size={20} />
                Cây chủ đề giáo trình
              </CardTitle>
              <CardDescription className="text-xs">
                AI phân tích và đánh giá mức độ thông thạo của bạn theo từng chương.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {fetchingTopics ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-2">
                  <Loader2 className="animate-spin text-blue-500" size={24} />
                  <span className="text-xs text-slate-400 font-medium">Đang tạo cây chủ đề...</span>
                </div>
              ) : parentTopics.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-slate-400 font-semibold">Tài liệu chưa được phân tích chủ đề.</p>
                  <Button size="sm" onClick={fetchTopics} className="mt-3 bg-blue-600 hover:bg-blue-700">
                    Phân tích ngay
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {parentTopics.map(parent => {
                    const isExpanded = expandedTopics[parent.id];
                    const subtopics = getSubtopics(parent.id);
                    // Calculate overall parent mastery level
                    const avgMastery = subtopics.length > 0
                      ? subtopics.reduce((acc, sub) => acc + sub.masteryLevel, 0) / subtopics.length
                      : parent.masteryLevel;

                    return (
                      <div key={parent.id} className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50/30">
                        {/* Parent Row */}
                        <div 
                          className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50 transition-colors"
                          onClick={() => toggleExpandTopic(parent.id)}
                        >
                          <div className="flex items-center gap-2 max-w-[80%]">
                            {isExpanded ? <ChevronDown size={16} className="text-slate-500" /> : <ChevronRight size={16} className="text-slate-500" />}
                            <div className="space-y-0.5">
                              <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{parent.title}</h4>
                              <p className="text-[10px] text-slate-400 line-clamp-1">{parent.description}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-xs font-black text-blue-600">{Math.round(avgMastery * 100)}%</span>
                            <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${avgMastery * 100}%` }} />
                            </div>
                          </div>
                        </div>

                        {/* Subtopics Area */}
                        {isExpanded && subtopics.length > 0 && (
                          <div className="border-t border-slate-100 bg-white p-3 space-y-3 animate-in slide-in-from-top-1 duration-200">
                            {subtopics.map(sub => (
                              <div key={sub.id} className="flex flex-col gap-2 p-2 rounded-lg bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                <div className="flex justify-between items-start">
                                  <div className="space-y-0.5 max-w-[70%]">
                                    <span className="text-xs font-bold text-slate-700 line-clamp-1">{sub.title}</span>
                                    <p className="text-[10px] text-slate-400 line-clamp-1">{sub.description}</p>
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    <span className="text-[10px] font-bold text-indigo-600">{Math.round(sub.masteryLevel * 100)}% thông thạo</span>
                                    <div className="w-12 bg-slate-200 h-1 rounded-full overflow-hidden">
                                      <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${sub.masteryLevel * 100}%` }} />
                                    </div>
                                  </div>
                                </div>
                                <div className="flex justify-end">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => handlePracticeTopic(sub.title)}
                                    className="h-6 text-[10px] border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                                  >
                                    Luyện tập (Adaptive)
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: Interactive Study Zone (Modes) */}
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="wait">
            {activeMode === "options" && (
              <motion.div 
                key="options"
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                {/* Advanced Mode Selectors */}
                <div className="grid md:grid-cols-2 gap-6">
                  
                  {/* Mode: AI Quiz */}
                  <Card className="group border-slate-100 hover:border-purple-200 shadow-sm transition-all duration-300">
                    <CardContent className="p-6 space-y-6">
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className="h-16 w-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center border border-purple-100 group-hover:scale-110 transition-transform duration-300">
                          <BrainCircuit size={32} />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-xl font-black text-slate-800">AI Quiz</h3>
                          <p className="text-slate-400 text-xs leading-relaxed max-w-[280px]">
                            Tạo bộ câu hỏi trắc nghiệm thông minh để kiểm tra kiến thức của bạn.
                          </p>
                        </div>

                        {/* Difficulty and Adaptive Config */}
                        <div className="w-full border-t border-slate-100 pt-4 space-y-3 text-left">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500">Mức độ khó:</span>
                            <div className="flex gap-1.5">
                              {(["EASY", "MEDIUM", "HARD"] as const).map(d => (
                                <button
                                  key={d}
                                  onClick={() => setDifficulty(d)}
                                  className={cn(
                                    "px-2 py-1 rounded text-[10px] font-black border transition-colors",
                                    difficulty === d 
                                      ? "bg-purple-600 border-purple-600 text-white" 
                                      : "border-slate-200 text-slate-500 hover:bg-slate-50"
                                  )}
                                >
                                  {d === "EASY" ? "Dễ" : d === "MEDIUM" ? "Trung bình" : "Khó"}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div 
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={() => setIsAdaptive(!isAdaptive)}
                          >
                            <input 
                              type="checkbox" 
                              checked={isAdaptive} 
                              onChange={() => {}} // Controlled by label div click
                              className="accent-purple-600 rounded"
                            />
                            <div className="space-y-0.5">
                              <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                Chế độ Thích ứng (Adaptive) <Sparkles size={12} className="text-amber-500 animate-pulse" />
                              </span>
                              <p className="text-[10px] text-slate-400">Tự động tập trung vào các câu hỏi và chủ đề bạn còn yếu.</p>
                            </div>
                          </div>
                        </div>

                        <Button 
                          variant="secondary" 
                          onClick={handleStartQuiz}
                          className="w-full h-11 rounded-xl font-bold mt-2 shadow-sm bg-purple-600 text-white hover:bg-purple-700 border-none"
                        >
                          {hasExistingQuiz && !isAdaptive ? "Làm lại bài kiểm tra cũ" : "Bắt đầu bài trắc nghiệm"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Mode: Flashcards */}
                  <Card className="group border-slate-100 hover:border-blue-200 shadow-sm transition-all duration-300">
                    <CardContent className="p-6 space-y-6">
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100 group-hover:scale-110 transition-transform duration-300">
                          <Layers size={32} />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-xl font-black text-slate-800">Flashcards</h3>
                          <p className="text-slate-400 text-xs leading-relaxed max-w-[280px]">
                            Ghi nhớ các khái niệm cốt lõi, từ vựng bằng bộ thẻ flashcard lật.
                          </p>
                        </div>
                        <div className="w-full border-t border-slate-100 pt-4 text-center">
                          <span className="text-[10px] text-slate-400 font-semibold block leading-tight">
                            Phục vụ ôn tập lặp lại khoảng cách Spaced Repetition.
                          </span>
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={handleGenerateFlashcards}
                          className="w-full h-11 rounded-xl font-bold mt-2 border-blue-200 text-blue-600 hover:bg-blue-50/50"
                        >
                          Tạo & Học Flashcards
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {activeMode === "quiz" && (
              <motion.div 
                key="quiz"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {generating ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4">
                    <div className="relative">
                      <div className="h-16 w-16 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center text-purple-600">
                        <Sparkles size={24} className="animate-pulse" />
                      </div>
                    </div>
                    <div className="text-center space-y-1">
                      <h3 className="text-lg font-bold text-slate-800">AI đang thiết kế đề thi cá nhân hóa...</h3>
                      <p className="text-xs text-slate-400 font-medium">Lựa chọn câu hỏi theo chủ đề yếu và độ khó: {difficulty}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 pb-20">
                    <div className="flex items-center justify-between sticky top-0 z-30 bg-slate-50/90 backdrop-blur-md py-3 border-b border-slate-200">
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Trophy className="text-amber-500" size={20} /> 
                        {selectedTopicForQuiz ? `Trắc nghiệm: ${selectedTopicForQuiz}` : `Quiz AI (${difficulty})`}
                      </h3>
                      {showResults ? (
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2 rounded-xl font-black text-md shadow-md">
                          ĐIỂM SỐ: {score} / {questions.length} ({Math.round((score / questions.length) * 100)}%)
                        </div>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setActiveMode("options")}
                          className="rounded-xl border-slate-200 text-slate-500 hover:bg-slate-100"
                        >
                          Thoát
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-6">
                      {questions.map((q, idx) => (
                        <Card key={q.id} className="border-none shadow-sm bg-white ring-1 ring-slate-100 overflow-hidden rounded-2xl">
                          <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-4">
                            <div className="flex gap-3 items-start">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white text-xs font-bold shadow-sm">
                                {idx + 1}
                              </span>
                              <CardTitle className="text-sm font-semibold leading-snug text-slate-800 pt-0.5">{q.questionText}</CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4">
                            <div className="grid md:grid-cols-2 gap-3">
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
                                      "group flex items-center justify-between p-3.5 rounded-xl border-2 text-left transition-all duration-200 text-xs font-semibold",
                                      stateStyles
                                    )}
                                  >
                                    <span>{a.answerText}</span>
                                  </button>
                                );
                              })}
                            </div>

                            {showResults && q.explanation && (
                              <div className="mt-4 pt-4 border-t border-slate-100">
                                <div className="flex gap-2.5 bg-blue-50/40 p-3.5 rounded-xl border border-blue-100/50">
                                  <Lightbulb className="text-blue-600 shrink-0 mt-0.5" size={16} />
                                  <div className="space-y-0.5">
                                    <p className="text-xs font-bold text-blue-900">Giải thích chi tiết</p>
                                    <p className="text-xs text-blue-800/80 leading-relaxed italic">{q.explanation}</p>
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
                        onClick={handleSubmitQuiz}
                        disabled={Object.keys(selectedAnswers).length < questions.length}
                        className="w-full h-12 rounded-xl text-md font-black shadow-md bg-gradient-to-r from-blue-600 to-indigo-600 text-white uppercase tracking-wider"
                      >
                        Nộp bài và lưu kết quả
                      </Button>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-4">
                        <Button 
                          onClick={() => { setQuestions([]); setSelectedAnswers({}); setShowResults(false); handleGenerateQuiz(); }} 
                          variant="secondary" 
                          className="h-12 rounded-xl font-bold bg-purple-600 text-white hover:bg-purple-700"
                        >
                          Làm bài thích ứng mới
                        </Button>
                        <Button 
                          onClick={() => { setSelectedAnswers({}); setShowResults(false); setActiveMode("options"); }} 
                          variant="outline" 
                          className="h-12 rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50"
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
                className="flex flex-col items-center py-4 space-y-6"
              >
                {generating ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-3xl w-full max-w-xl shadow-sm space-y-4">
                    <div className="relative">
                      <div className="h-16 w-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center text-blue-600">
                        <Sparkles size={24} className="animate-pulse" />
                      </div>
                    </div>
                    <div className="text-center space-y-1">
                      <h3 className="text-lg font-bold text-slate-800">AI đang chiết xuất Flashcards...</h3>
                      <p className="text-xs text-slate-400 font-medium">Nhận diện định nghĩa và Q&A chính</p>
                    </div>
                  </div>
                ) : flashcards.length > 0 ? (
                  <>
                    <div className="w-full max-w-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
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
                        className="relative h-[280px] w-full cursor-pointer perspective-1000"
                        onClick={() => setIsFlipped(!isFlipped)}
                      >
                        <motion.div
                          className="w-full h-full relative transform-style-preserve-3d"
                          initial={false}
                          animate={{ rotateY: isFlipped ? 180 : 0 }}
                          transition={{ duration: 0.5, type: "spring", stiffness: 200, damping: 20 }}
                        >
                          {/* Front Side */}
                          <div className="absolute inset-0 w-full h-full backface-hidden">
                            <Card className="w-full h-full border border-blue-100 shadow-md flex flex-col items-center justify-center p-6 text-center bg-white rounded-2xl relative overflow-hidden group hover:border-blue-300 transition-colors">
                              <span className="absolute top-4 left-4 text-blue-100"><RotateCw size={28} /></span>
                              <h3 className="text-lg font-bold text-slate-800 leading-relaxed px-2">
                                {flashcards[currentFlashcardIdx].frontText}
                              </h3>
                              <p className="absolute bottom-4 text-slate-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
                                Nhấp để lật thẻ <RotateCw size={10} />
                              </p>
                            </Card>
                          </div>

                          {/* Back Side */}
                          <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
                            <Card className="w-full h-full border border-purple-100 shadow-md flex flex-col items-center justify-center p-6 text-center bg-gradient-to-tr from-purple-50 to-indigo-50/50 rounded-2xl relative overflow-hidden">
                              <span className="absolute top-4 right-4 text-purple-200/50"><Sparkles size={28} /></span>
                              <p className="text-md font-bold text-purple-900 leading-relaxed px-2">
                                {flashcards[currentFlashcardIdx].backText}
                              </p>
                              <p className="absolute bottom-4 text-purple-400 font-bold text-[10px] uppercase tracking-wider">
                                Đáp án / Định nghĩa
                              </p>
                            </Card>
                          </div>
                        </motion.div>
                      </div>

                      <div className="flex items-center justify-center gap-4 mt-4">
                        <Button 
                          variant="outline" 
                          onClick={(e) => { e.stopPropagation(); prevFlashcard(); }}
                          disabled={currentFlashcardIdx === 0}
                          className="h-10 w-10 rounded-full border-slate-200 p-0 hover:bg-slate-100"
                        >
                          <ArrowLeft size={16} />
                        </Button>
                        
                        <Button 
                          variant="secondary"
                          onClick={(e) => { e.stopPropagation(); setIsFlipped(!isFlipped); }}
                          className="h-10 px-5 rounded-lg font-bold bg-blue-600 hover:bg-blue-700 text-white border-none shadow-sm"
                        >
                          Lật thẻ
                        </Button>

                        <Button 
                          variant="outline" 
                          onClick={(e) => { e.stopPropagation(); nextFlashcard(); }}
                          disabled={currentFlashcardIdx === flashcards.length - 1}
                          className="h-10 w-10 rounded-full border-slate-200 p-0 hover:bg-slate-100"
                        >
                          <ArrowRight size={16} />
                        </Button>
                      </div>
                    </div>

                    <div className="w-full max-w-xl pt-4 border-t border-slate-100">
                      <p className="text-[10px] text-slate-400 text-center mb-3 font-semibold leading-relaxed">
                        Mẹo: Bạn có thể luyện tập các flashcards này theo chu kỳ lặp lại hàng ngày tại trang <strong className="text-blue-500 cursor-pointer" onClick={() => router.push("/reviews")}>Ôn tập Spaced Repetition</strong>.
                      </p>
                      <Button 
                        variant="outline" 
                        className="w-full h-10 rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50"
                        onClick={() => { setFlashcards([]); handleGenerateFlashcards(); }}
                      >
                        <RefreshCcw size={14} className="mr-2" /> Tạo bộ thẻ Flashcards mới
                      </Button>
                    </div>
                  </>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Floating AI Chat Trigger */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-all duration-300 z-40 group"
      >
        <MessageSquare size={24} className="group-hover:rotate-12 transition-transform" />
      </button>

      {/* RAG Chat drawer sidebar panel */}
      <AnimatePresence>
        {isChatOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChatOpen(false)}
              className="fixed inset-0 bg-black z-40"
            />
            {/* Drawer Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-[400px] max-w-full bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800">Trợ lý Hỏi đáp RAG</h3>
                    <p className="text-[10px] text-slate-400 font-semibold">Trả lời bám sát nội dung tài liệu</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsChatOpen(false)} 
                  className="h-8 w-8 text-slate-400 hover:text-slate-600 flex items-center justify-center rounded-lg hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Chat Message list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-3 px-6">
                    <HelpCircle className="text-slate-300" size={36} />
                    <div>
                      <p className="text-xs font-bold text-slate-500">Hãy đặt câu hỏi đầu tiên!</p>
                      <p className="text-[10px] text-slate-400 max-w-[200px] mx-auto mt-1">
                        AI sẽ tìm kiếm nội dung tương đồng trong văn bản và trả lời kèm dẫn chứng trang tài liệu.
                      </p>
                    </div>
                  </div>
                ) : (
                  chatMessages.map((msg, index) => {
                    const isAI = msg.sender === "AI";
                    let citations: Citation[] = [];
                    if (isAI && msg.citations) {
                      try {
                        citations = JSON.parse(msg.citations);
                      } catch(e) {}
                    }

                    return (
                      <div key={index} className={cn("flex flex-col space-y-1.5", isAI ? "items-start" : "items-end")}>
                        <div className={cn(
                          "p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed shadow-sm",
                          isAI 
                            ? "bg-slate-100 text-slate-800" 
                            : "bg-blue-600 text-white rounded-br-none"
                        )}>
                          {formatChatMessage(msg.message)}
                        </div>

                        {/* Citations Pill indicators */}
                        {isAI && citations.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1 pl-1">
                            <span className="text-[9px] font-bold text-slate-400 mt-1">Nguồn:</span>
                            {citations.map((cit, ci) => (
                              <button
                                key={ci}
                                onClick={() => setActiveCitation(cit)}
                                className="px-1.5 py-0.5 rounded-full bg-blue-50 hover:bg-blue-100 border border-blue-100 text-[9px] font-black text-blue-600 transition-colors"
                              >
                                [Trang {cit.pageNumber || 1}]
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                
                {sendingChat && (
                  <div className="flex items-start">
                    <div className="bg-slate-100 text-slate-800 p-3 rounded-2xl text-xs flex items-center gap-1.5 shadow-sm">
                      <Loader2 className="animate-spin text-blue-600" size={14} />
                      <span>AI đang đọc tài liệu & trả lời...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Popover Citation Detail */}
              {activeCitation && (
                <div className="p-3 bg-blue-50 border-t border-b border-blue-100 animate-in slide-in-from-bottom duration-200 relative">
                  <button 
                    onClick={() => setActiveCitation(null)}
                    className="absolute top-2 right-2 text-blue-400 hover:text-blue-600"
                  >
                    <X size={14} />
                  </button>
                  <span className="text-[9px] font-black uppercase text-blue-700 block mb-1">
                    Chi tiết Trích dẫn (Trang {activeCitation.pageNumber || 1}, Đoạn {activeCitation.chunkIndex + 1}):
                  </span>
                  <p className="text-[10px] text-blue-900 italic leading-relaxed line-clamp-3">
                    "{activeCitation.snippet}"
                  </p>
                </div>
              )}

              {/* Chat Input form */}
              <form onSubmit={handleSendChatMessage} className="p-3 border-t border-slate-100 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Hỏi AI về tài liệu này..."
                  className="flex-1 text-xs border border-slate-200 rounded-xl px-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <Button 
                  type="submit" 
                  disabled={!chatInput.trim() || sendingChat}
                  className="h-9 w-9 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center p-0"
                >
                  <Send size={16} />
                </Button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}