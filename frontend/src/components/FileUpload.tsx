"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { 
  Upload as UploadIcon, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  BrainCircuit,
  ArrowRight,
  Trophy,
  Lightbulb
} from "lucide-react";

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

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [documentId, setDocumentId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (!token || !storedUser) {
      router.push("/auth/login");
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [router]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setDocumentId(null);
      setQuestions([]);
      setSelectedAnswers({});
      setShowResults(false);
      setMessage("");
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        "http://localhost:8080/api/files/upload", 
        formData,
        getAuthHeaders()
      );
      setDocumentId(response.data.id);
    } catch (error: any) {
      console.error("Upload error:", error);
      // Token hết hạn → xóa và chuyển về trang login
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/auth/login");
        return;
      }
      setMessage("Tải lên thất bại. Vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!documentId) return;

    setGenerating(true);
    try {
      const response = await axios.post(
        `http://localhost:8080/api/ai/generate/${documentId}`,
        {},
        getAuthHeaders()
      );
      setQuestions(response.data);
    } catch (error: any) {
      console.error("AI Generation error:", error);
      setMessage("Không thể tạo câu hỏi. Vui lòng kiểm tra lại nội dung tài liệu.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectAnswer = (questionId: number, answerId: number) => {
    if (showResults) return;
    setSelectedAnswers(prev => ({ ...prev, [questionId]: answerId }));
  };

  const score = questions.filter(q => q.answers.find(a => a.id === selectedAnswers[q.id])?.correct).length;

  if (!user) return null;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 pb-20">
      {/* Welcome Section */}
      <section className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Chào {user.name.split(' ').pop()}! 👋
          </h1>
          <p className="text-gray-500 text-sm">Hôm nay bạn muốn học thêm điều gì mới?</p>
        </div>
      </section>

      {/* Main Action Area */}
      <Card className="overflow-hidden border-none shadow-xl shadow-blue-100/50 ring-1 ring-gray-100">
        <CardContent className="p-0">
          <div className="grid md:grid-cols-5 h-full">
            {/* Left: Upload Side */}
            <div className="md:col-span-2 bg-slate-50/50 p-8 border-r border-gray-100">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <UploadIcon size={20} className="text-blue-600" />
                Tải lên tài liệu
              </h2>
              
              <div className="space-y-6">
                <div 
                  className={cn(
                    "relative group cursor-pointer border-2 border-dashed rounded-2xl p-8 transition-all duration-200 text-center",
                    file ? "bg-white border-blue-200 shadow-sm" : "hover:border-blue-400 border-gray-200"
                  )}
                >
                  <input
                    type="file"
                    id="file-upload"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    accept=".pdf,.docx"
                  />
                  <div className="flex flex-col items-center gap-3">
                    <div className={cn(
                      "p-4 rounded-2xl transition-colors",
                      file ? "bg-blue-50 text-blue-600" : "bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500"
                    )}>
                      {file ? <FileText size={32} /> : <UploadIcon size={32} />}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-gray-700 break-all px-2">
                        {file ? file.name : "Kéo thả hoặc nhấp để chọn file"}
                      </p>
                      {!file && <p className="text-xs text-gray-400">PDF hoặc DOCX lên đến 10MB</p>}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleUpload}
                  disabled={uploading || !file || !!documentId}
                  className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-blue-200"
                  isLoading={uploading}
                >
                  {documentId ? "Tải lên thành công" : "Phân tích tài liệu"}
                </Button>

                {message && !documentId && (
                  <p className="text-xs text-center font-medium text-red-500 bg-red-50 p-2 rounded-lg border border-red-100">
                    {message}
                  </p>
                )}
              </div>
            </div>

            {/* Right: AI Flow */}
            <div className="md:col-span-3 p-8 flex flex-col justify-center items-center text-center">
              <AnimatePresence mode="wait">
                {!documentId ? (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="space-y-4 max-w-[280px]"
                  >
                    <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                      <Sparkles size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Sẵn sàng trải nghiệm AI?</h3>
                    <p className="text-sm text-gray-500">Tải tài liệu lên để AI giúp bạn tạo bộ câu hỏi ôn tập thông minh trong vài giây.</p>
                  </motion.div>
                ) : questions.length === 0 ? (
                  <motion.div 
                    key="ready"
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="space-y-6 w-full"
                  >
                    <div className="mx-auto w-20 h-20 bg-purple-50 text-purple-600 rounded-3xl flex items-center justify-center shadow-inner">
                      <BrainCircuit size={40} className={generating ? "animate-pulse" : ""} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-gray-900">Tài liệu đã sẵn sàng!</h3>
                      <p className="text-sm text-gray-500">AI đã sẵn sàng phân tích "{file?.name}"</p>
                    </div>
                    <Button
                      onClick={handleGenerateQuiz}
                      disabled={generating}
                      variant="secondary"
                      className="w-full max-w-sm h-14 rounded-2xl text-lg font-bold shadow-xl shadow-purple-200"
                      isLoading={generating}
                    >
                      {generating ? "Đang xử lý..." : "Tạo câu hỏi trắc nghiệm"}
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="finished"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="mx-auto w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                      <CheckCircle2 size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Đã tạo xong Quiz!</h3>
                    <p className="text-sm text-gray-500">Cuộn xuống để bắt đầu thử thách kiến thức của bạn.</p>
                    <Button variant="outline" onClick={() => {
                      const el = document.getElementById('quiz-section');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }} className="rounded-xl border-gray-200 font-bold">
                      Bắt đầu làm bài
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quiz Section */}
      {questions.length > 0 && (
        <div id="quiz-section" className="space-y-8 animate-in slide-in-from-bottom-10 duration-700">
          <div className="flex items-center justify-between sticky top-20 z-40 bg-gray-50/95 backdrop-blur-sm py-4 border-b border-gray-200">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Trophy className="text-yellow-500" />
              Thử thách Quiz AI
            </h3>
            {showResults && (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="bg-white border-2 border-purple-500 text-purple-700 px-6 py-2 rounded-2xl font-black text-lg shadow-lg"
              >
                KẾT QUẢ: {score} / {questions.length}
              </motion.div>
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

                  <AnimatePresence>
                    {showResults && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                        className="mt-6 pt-6 border-t border-gray-100"
                      >
                        <div className="flex gap-3 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                          <Lightbulb className="text-blue-600 shrink-0 mt-0.5" size={20} />
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-blue-900">Giải thích chi tiết</p>
                            <p className="text-sm text-blue-800/80 leading-relaxed italic">{q.explanation}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-col gap-4 pb-10">
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
                <Button
                  onClick={handleGenerateQuiz}
                  variant="secondary"
                  className="h-14 rounded-2xl font-bold shadow-xl shadow-purple-100"
                >
                  Thử lại với câu hỏi mới
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="h-14 rounded-2xl font-bold border-gray-200"
                >
                  Học tài liệu khác
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
