"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  BrainCircuit, 
  Layers, 
  ArrowRight, 
  BookOpen, 
  CheckCircle,
  Trophy,
  GraduationCap,
  Users,
  MessageSquare,
  Upload,
  ArrowUpRight,
  Database,
  ShieldCheck,
  Zap,
  Send,
  X,
  Lightbulb,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface Document {
  id: number;
  fileName: string;
  fileUrl: string;
  createdAt: string;
}

export default function LandingPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");

  // Chat states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([
    {
      sender: "AI",
      message: "Xin chào! Tôi là Trợ lý Ảo hỗ trợ học tập của LearnHub. Bạn có thể đặt câu hỏi về các tính năng của nền tảng như cách hoạt động của RAG AI, Quiz cá nhân hóa, hoặc thuật toán lặp lại ngắt quãng..."
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const [activeCitation, setActiveCitation] = useState<any | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleCTA = () => {
    if (isLoggedIn) {
      router.push("/dashboard");
    } else {
      router.push("/auth/login");
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setActiveSection(id);
    }
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || sendingChat) return;

    const userMsg = chatInput;
    setChatInput("");
    setSendingChat(true);

    // Optimistic update
    setChatMessages(prev => [...prev, { sender: "USER", message: userMsg }]);

    setTimeout(() => {
      let answer = "";
      let citations = null;

      const lowerMsg = userMsg.toLowerCase();

      if (lowerMsg.includes("learnhub là gì") || lowerMsg.includes("learnhub là cái gì") || lowerMsg.includes("giới thiệu")) {
        answer = "LearnHub là nền tảng học tập thông minh giúp học viên tối ưu hóa việc tiếp thu kiến thức. Nền tảng cho phép tải lên tài liệu học tập, tự động trích xuất các chủ đề chính, giải đáp các câu hỏi dựa trên nội dung tài liệu bằng công nghệ AI tìm kiếm vector ngữ nghĩa, và thiết kế các bài thi thử trắc nghiệm hoặc flashcards ôn tập.";
        citations = [
          { pageNumber: 1, snippet: "LearnHub được thiết kế nhằm mục đích bứt phá hiệu quả học tập thông qua AI và Spaced Repetition." }
        ];
      } else if (lowerMsg.includes("rag") || lowerMsg.includes("hỏi đáp") || lowerMsg.includes("ai đọc tài liệu") || lowerMsg.includes("đọc hiểu")) {
        answer = "Cơ chế hỏi đáp AI RAG (Retrieval-Augmented Generation) trên LearnHub hoạt động bằng cách chuyển đổi tài liệu học tập của bạn thành các vector ngữ nghĩa (embeddings) và lưu vào database. Khi bạn đặt câu hỏi, AI sẽ tìm kiếm các đoạn văn bản có nghĩa gần nhất với câu hỏi để làm ngữ cảnh và sinh ra câu trả lời chính xác, tránh hiện tượng AI bịa đặt thông tin. Hệ thống cũng cung cấp trích dẫn số trang cụ thể từ tài liệu gốc.";
        citations = [
          { pageNumber: 2, snippet: "Tìm kiếm vector tương đồng sử dụng cosine similarity giúp trích xuất chính xác ngữ cảnh để sinh câu trả lời." }
        ];
      } else if (lowerMsg.includes("quiz") || lowerMsg.includes("trắc nghiệm") || lowerMsg.includes("thi thử")) {
        answer = "Tính năng AI Quiz cho phép bạn tự thiết kế các bài thi thử cá nhân hóa. Bạn có thể chọn mức độ khó (Dễ, Trung bình, Khó), số lượng câu hỏi (5 đến 20 câu) và các dạng câu hỏi khác nhau như: Trắc nghiệm 4 đáp án, câu hỏi Đúng/Sai, điền vào chỗ trống hoặc trả lời ngắn. Sau khi nộp bài, hệ thống sẽ chấm điểm và cung cấp giải thích chi tiết cho từng câu.";
        citations = [
          { pageNumber: 3, snippet: "Học viên tự kiểm tra kiến thức bằng các bộ đề thi trắc nghiệm được tạo tự động dựa trên tài liệu đã chọn." }
        ];
      } else if (lowerMsg.includes("flashcard") || lowerMsg.includes("lặp lại ngắt quãng") || lowerMsg.includes("spaced repetition") || lowerMsg.includes("sm-2") || lowerMsg.includes("ôn tập")) {
        answer = "Hệ thống ôn tập Flashcards của LearnHub áp dụng giải thuật lặp lại ngắt quãng SuperMemo-2 (SM-2). Dựa trên thang điểm tự đánh giá mức độ nhớ của bạn (từ 0 đến 5), thuật toán sẽ tự động tính toán E-Factor (độ dễ học) và lập lịch ôn tập tiếp theo (sau 1 ngày, 6 ngày, v.v.). Điều này giúp bạn ghi nhớ kiến thức dài hạn mà không cần phải ôn tập quá tải hàng ngày.";
        citations = [
          { pageNumber: 5, snippet: "Giải thuật SM-2 tối ưu hóa khoảng cách giữa các lần ôn tập để bảo đảm thông tin được chuyển vào vùng nhớ dài hạn." }
        ];
      } else {
        answer = "Câu hỏi của bạn nằm ngoài phạm vi tài liệu hướng dẫn nhanh của LearnHub. Hãy đăng nhập và tải lên tài liệu học tập của bạn để trải nghiệm tính năng RAG AI đầy đủ nhé!";
      }

      setChatMessages(prev => [...prev, { 
        sender: "AI", 
        message: answer,
        citations: citations ? JSON.stringify(citations) : undefined
      }]);
      setSendingChat(false);
    }, 800);
  };

  const formatChatMessage = (text: string) => {
    if (!text) return "";
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\n/g, '<br />');
    return <div dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 relative overflow-x-hidden flex flex-col">
      
      {/* Dynamic Background Blur Accents */}
      <div className="absolute top-[5%] left-[-15%] w-[45%] h-[45%] bg-blue-500/8 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute top-[40%] right-[-15%] w-[45%] h-[45%] bg-purple-500/8 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-[5%] left-[20%] w-[45%] h-[45%] bg-teal-500/8 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />

      {/* Sticky Header Navigation */}
      <header className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-md border-b border-slate-200/60 px-6 py-4 flex items-center justify-between">
        <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200">
              <GraduationCap size={20} />
            </div>
            <span className="text-xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              LearnHub
            </span>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-500">
            <button 
              onClick={() => scrollToSection("features")} 
              className={cn("hover:text-blue-600 transition-colors", activeSection === "features" && "text-blue-600")}
            >
              Tính năng
            </button>
            <button 
              onClick={() => scrollToSection("how-it-works")} 
              className={cn("hover:text-blue-600 transition-colors", activeSection === "how-it-works" && "text-blue-600")}
            >
              Cách hoạt động
            </button>
            <button 
              onClick={() => scrollToSection("testimonials")} 
              className={cn("hover:text-blue-600 transition-colors", activeSection === "testimonials" && "text-blue-600")}
            >
              Học viên nói gì
            </button>
          </nav>

          {/* Auth Action Buttons */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Button 
                onClick={() => router.push("/dashboard")}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold px-5 h-9 shadow-md shadow-blue-100 border-none"
              >
                Vào Bảng điều khiển
              </Button>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => router.push("/auth/login")}
                  className="text-slate-600 font-bold hover:bg-slate-100 rounded-xl text-xs px-4 h-9"
                >
                  Đăng nhập
                </Button>
                <Button 
                  onClick={() => router.push("/auth/register")}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold px-5 h-9 shadow-md shadow-blue-100 border-none"
                >
                  Bắt đầu học thử
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">

        {/* SECTION 1: HERO SECTION */}
        <section id="hero" className="max-w-6xl mx-auto px-6 pt-16 pb-20 grid md:grid-cols-12 gap-12 items-center min-h-[80vh]">
          <div className="md:col-span-7 space-y-8 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-sm">
              <Sparkles className="text-blue-600 animate-pulse" size={14} />
              <span className="text-[10px] font-black tracking-wider uppercase bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Nền tảng ôn thi tự động bằng trí tuệ nhân tạo
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-tight">
              Đọc tài liệu nhanh hơn, <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Ghi nhớ lâu gấp 3 lần
              </span>
            </h1>

            <p className="text-slate-500 text-sm sm:text-base leading-relaxed max-w-xl font-medium">
              Tải lên giáo trình, slide bài giảng hoặc tài liệu học tập của bạn. Trí tuệ nhân tạo sẽ tự động trích xuất chủ đề, giải đáp câu hỏi và sinh bài thi thử cá nhân hóa.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Button 
                onClick={handleCTA}
                className="h-12 px-8 text-xs font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl shadow-xl shadow-indigo-100/50 border-none flex items-center gap-2 group justify-center"
              >
                Bắt đầu học thử miễn phí
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline"
                onClick={() => scrollToSection("features")}
                className="h-12 px-6 text-xs font-bold border-slate-200 text-slate-600 hover:bg-slate-100 rounded-2xl justify-center"
              >
                Tìm hiểu thêm
              </Button>
            </div>
          </div>

          {/* Hero Visual Mockup */}
          <div className="md:col-span-5 relative flex justify-center items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8 }}
              className="w-full max-w-[400px] glass-card border border-slate-200/80 shadow-2xl rounded-3xl p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
              
              {/* Fake UI Header */}
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                <span className="text-[10px] font-bold text-slate-400 ml-2 truncate">Giao diện AI LearnHub</span>
              </div>

              {/* Fake UI Content */}
              <div className="space-y-4 pt-4">
                <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100/50 flex gap-3 items-start text-left">
                  <Sparkles size={16} className="text-blue-500 shrink-0 mt-0.5" />
                  <div className="space-y-1 min-w-0">
                    <p className="text-[10px] font-bold text-blue-900">AI Trích xuất tài liệu</p>
                    <p className="text-[9px] text-blue-800/80 leading-relaxed truncate">"Đã tạo sơ đồ cây 6 chủ đề chính của bài học..."</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[9px] text-left font-black text-slate-400 uppercase tracking-wider">Hệ thống gợi ý ôn thi</p>
                  
                  {/* Fake Quiz Box */}
                  <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm text-left relative group">
                    <span className="absolute top-2.5 right-3 text-[8px] font-black text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-md">Quiz AI</span>
                    <p className="text-[10px] font-bold text-slate-700 pr-10">Giải thuật ôn tập thông minh dựa trên chỉ số nào?</p>
                    <div className="grid grid-cols-2 gap-1.5 mt-2.5">
                      <div className="p-1.5 border border-purple-200 bg-purple-50/50 rounded-lg text-[8px] font-bold text-purple-700">A. Khoảng cách ôn tập</div>
                      <div className="p-1.5 border border-slate-100 rounded-lg text-[8px] font-semibold text-slate-400">B. Lượt xem tài liệu</div>
                    </div>
                  </div>
                </div>

                {/* Contribution block snippet */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-left space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] font-black text-slate-400 uppercase">Tần suất học tập</span>
                    <span className="text-[8px] font-bold text-emerald-600">Streak: 5 ngày</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 1, 4, 1, 3, 2, 3, 1].map((val, idx) => (
                      <div 
                        key={idx} 
                        className={cn(
                          "w-2.5 h-2.5 rounded-[1.5px]",
                          val === 1 && "bg-slate-200",
                          val === 2 && "bg-emerald-200",
                          val === 3 && "bg-emerald-400",
                          val === 4 && "bg-emerald-600"
                        )} 
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* SECTION 2: TRUST & METRICS BAR */}
        <section className="bg-white border-y border-slate-200/60 py-10 px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <p className="text-3xl font-black text-blue-600">10,000+</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Học sinh sử dụng</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-black text-indigo-600">50,000+</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tài liệu tải lên</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-black text-purple-600">98%</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bứt phá điểm thi</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-black text-emerald-600">9.5/10</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Độ hài lòng UX</p>
            </div>
          </div>
        </section>

        {/* SECTION 3: FEATURES SHOWCASE */}
        <section id="features" className="max-w-6xl mx-auto px-6 py-20 space-y-16">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Giải pháp học thi thông minh, toàn diện</h2>
            <p className="text-slate-400 text-xs font-semibold">Tích hợp các phương pháp học tập khoa học nhất hiện nay</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            
            {/* Feature 1: RAG AI */}
            <Card className="glass-card border border-slate-200/60 rounded-3xl p-8 space-y-6 text-left relative overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
              <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100 group-hover:scale-110 transition-transform duration-300">
                <Sparkles size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-800">Hỏi đáp AI chính xác</h3>
                <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                  Thay vì hỏi AI thông thường, LearnHub sử dụng tìm kiếm thông tin theo ngữ nghĩa tài liệu để đối chiếu và trả lời trực tiếp dựa trên nội dung tài liệu của bạn, đi kèm trích dẫn số trang chính xác.
                </p>
              </div>
              <ul className="text-[10px] text-slate-500 font-bold space-y-2 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-1.5 text-blue-600">
                  <CheckCircle size={12} /> Tải file PDF, DOCX tối đa 10MB
                </li>
                <li className="flex items-center gap-1.5 text-blue-600">
                  <CheckCircle size={12} /> Trích dẫn nguồn tài liệu tham khảo rõ ràng
                </li>
              </ul>
            </Card>

            {/* Feature 2: Quiz Generator */}
            <Card className="glass-card border border-slate-200/60 rounded-3xl p-8 space-y-6 text-left relative overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
              <div className="h-12 w-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center border border-purple-100 group-hover:scale-110 transition-transform duration-300">
                <BrainCircuit size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-800">Tự tạo đề Quiz cá nhân hóa</h3>
                <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                  Tự động thiết kế đề kiểm tra thử dựa trên các mức độ khó mong muốn (Dễ, Trung bình, Khó) và các dạng câu hỏi khác nhau (Trắc nghiệm 4 đáp án, câu hỏi Đúng/Sai, điền vào chỗ trống hoặc trả lời ngắn).
                </p>
              </div>
              <ul className="text-[10px] text-slate-500 font-bold space-y-2 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-1.5 text-purple-600">
                  <CheckCircle size={12} /> Chọn số lượng câu từ 5 đến 20 câu
                </li>
                <li className="flex items-center gap-1.5 text-purple-600">
                  <CheckCircle size={12} /> Giải thích chi tiết đáp án sau khi nộp
                </li>
              </ul>
            </Card>

            {/* Feature 3: Spaced Repetition */}
            <Card className="glass-card border border-slate-200/60 rounded-3xl p-8 space-y-6 text-left relative overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 to-emerald-500" />
              <div className="h-12 w-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center border border-teal-100 group-hover:scale-110 transition-transform duration-300">
                <Layers size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-800">Ôn tập Flashcard thông minh</h3>
                <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                  Hệ thống tự động lưu lịch sử và gợi ý khoảng cách ôn tập tiếp theo hợp lý dựa trên độ nhớ thẻ của bạn (Spaced Repetition). Giúp ghi nhớ khối lượng kiến thức khổng lồ mà không sợ mau quên.
                </p>
              </div>
              <ul className="text-[10px] text-slate-500 font-bold space-y-2 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-1.5 text-emerald-600">
                  <CheckCircle size={12} /> Biểu đồ nhiệt đóng ô kiểu GitHub
                </li>
                <li className="flex items-center gap-1.5 text-emerald-600">
                  <CheckCircle size={12} /> Tối ưu hóa thời gian và hiệu quả học tập
                </li>
              </ul>
            </Card>

          </div>
        </section>

        {/* SECTION 4: HOW IT WORKS */}
        <section id="how-it-works" className="bg-white border-y border-slate-200/60 py-20 px-6">
          <div className="max-w-6xl mx-auto space-y-16">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Quy trình học thi bứt phá trong 3 bước</h2>
              <p className="text-slate-400 text-xs font-semibold">Bắt đầu học tập thông minh chỉ với vài thao tác kéo thả</p>
            </div>

            <div className="grid md:grid-cols-3 gap-12 relative">
              {/* Step 1 */}
              <div className="text-center space-y-4 relative z-10 flex flex-col items-center">
                <div className="h-16 w-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-lg shadow-blue-200">
                  1
                </div>
                <h4 className="text-base font-bold text-slate-800">Tải lên tài liệu của bạn</h4>
                <p className="text-slate-400 text-xs leading-relaxed max-w-[240px] font-semibold">
                  Tải lên slide bài giảng, giáo trình PDF hay bài tập Word. Hệ thống sẽ xử lý trích xuất văn bản trong vài giây.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center space-y-4 relative z-10 flex flex-col items-center">
                <div className="h-16 w-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-lg shadow-indigo-200">
                  2
                </div>
                <h4 className="text-base font-bold text-slate-800">AI trích xuất cây chủ đề</h4>
                <p className="text-slate-400 text-xs leading-relaxed max-w-[240px] font-semibold">
                  Hệ thống tự động vẽ ra cây chủ đề giáo trình và phân tích mức độ thông thạo từng chương cho bạn.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center space-y-4 relative z-10 flex flex-col items-center">
                <div className="h-16 w-16 bg-purple-600 text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-lg shadow-purple-200">
                  3
                </div>
                <h4 className="text-base font-bold text-slate-800">Tạo Quiz & Ôn tập thẻ lật</h4>
                <p className="text-slate-400 text-xs leading-relaxed max-w-[240px] font-semibold">
                  Sinh đề trắc nghiệm kiểm tra kiến thức và ôn tập flashcard lặp lại để tự tin đi thi.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: TESTIMONIALS */}
        <section id="testimonials" className="max-w-6xl mx-auto px-6 py-20 space-y-16">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Học viên nói gì về LearnHub?</h2>
            <p className="text-slate-400 text-xs font-semibold">Cộng đồng sinh viên đến từ các trường Đại học hàng đầu tin dùng</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            
            {/* Student 1 */}
            <Card className="glass-card border border-slate-100 rounded-3xl p-6 text-left space-y-4 relative shadow-sm hover:shadow-md transition-shadow">
              <p className="text-slate-500 text-xs italic leading-relaxed font-semibold">
                "Nhờ tính năng hỏi đáp của LearnHub, mình học slide bài giảng nhanh hơn hẳn. Nó chỉ ra cụ thể nội dung nằm ở trang mấy để mình xem lại. Bài kiểm tra tự luyện cũng bám sát chương trình học!"
              </p>
              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <div className="h-9 w-9 bg-gradient-to-tr from-blue-400 to-indigo-400 rounded-full flex items-center justify-center text-white font-black text-xs">
                  MH
                </div>
                <div className="text-left">
                  <h5 className="text-xs font-bold text-slate-800">Minh Hoàng</h5>
                  <p className="text-[9px] text-slate-400 font-bold">Đại học Bách Khoa Hà Nội</p>
                </div>
              </div>
            </Card>

            {/* Student 2 */}
            <Card className="glass-card border border-slate-100 rounded-3xl p-6 text-left space-y-4 relative shadow-sm hover:shadow-md transition-shadow">
              <p className="text-slate-500 text-xs italic leading-relaxed font-semibold">
                "Học flashcard trên web giúp mình nhớ từ vựng Tiếng Anh cực lâu. Web tự động sắp xếp ngày ôn tập phù hợp nên mình không bị nản, điểm số cải thiện rõ rệt."
              </p>
              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <div className="h-9 w-9 bg-gradient-to-tr from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-black text-xs">
                  TL
                </div>
                <div className="text-left">
                  <h5 className="text-xs font-bold text-slate-800">Thùy Linh</h5>
                  <p className="text-[9px] text-slate-400 font-bold">Đại học Quốc gia TP.HCM</p>
                </div>
              </div>
            </Card>

            {/* Student 3 */}
            <Card className="glass-card border border-slate-100 rounded-3xl p-6 text-left space-y-4 relative shadow-sm hover:shadow-md transition-shadow">
              <p className="text-slate-500 text-xs italic leading-relaxed font-semibold">
                "Giao diện mờ kính của LearnHub thực sự rất đẹp, tạo cảm hứng học tập. Mình hay lên trang Cộng đồng để tham khảo tài liệu của các bạn khác chia sẻ. Rất đáng thử!"
              </p>
              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <div className="h-9 w-9 bg-gradient-to-tr from-teal-400 to-emerald-400 rounded-full flex items-center justify-center text-white font-black text-xs">
                  KH
                </div>
                <div className="text-left">
                  <h5 className="text-xs font-bold text-slate-800">Khánh Huy</h5>
                  <p className="text-[9px] text-slate-400 font-bold">Đại học Kinh tế Quốc dân</p>
                </div>
              </div>
            </Card>

          </div>
        </section>

        {/* SECTION 6: FINAL CALL TO ACTION */}
        <section className="max-w-5xl mx-auto px-6 pb-24">
          <div className="p-10 md:p-14 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-center space-y-6 shadow-2xl shadow-indigo-200/60 relative overflow-hidden">
            <div className="relative z-10 space-y-4">
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
                Sẵn sàng bứt phá điểm số học tập của bạn?
              </h2>
              <p className="text-blue-100 text-xs sm:text-sm max-w-lg mx-auto font-medium">
                Tải lên tài liệu đầu tiên ngay hôm nay và trải nghiệm giải pháp ôn thi thông minh hoàn toàn miễn phí.
              </p>
            </div>
            
            <div className="relative z-10 pt-4 flex justify-center">
              <Button 
                onClick={handleCTA}
                className="h-12 px-8 text-xs font-black bg-white text-blue-600 hover:bg-slate-50 rounded-2xl shadow-lg border-none flex items-center gap-2 group"
              >
                Bắt đầu học ngay
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
            <div className="absolute right-[-10%] bottom-[-10%] w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          </div>
        </section>

      </main>

      {/* FOOTER SECTION */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6 border-t border-slate-800">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-left">
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md">
                <GraduationCap size={16} />
              </div>
              <span className="text-lg font-black tracking-tight text-white">
                LearnHub
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
              Nền tảng ứng dụng trí tuệ nhân tạo hỗ trợ đọc hiểu tài liệu học tập, ôn tập chọn lọc nhằm bứt phá hiệu quả học tập cho học viên.
            </p>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs font-black text-white uppercase tracking-wider">Sản phẩm</h5>
            <ul className="space-y-2 text-[10px] font-bold">
              <li><button onClick={() => scrollToSection("features")} className="hover:text-white transition-colors">Tính năng chính</button></li>
              <li><button onClick={() => scrollToSection("how-it-works")} className="hover:text-white transition-colors">Cách hoạt động</button></li>
              <li><button onClick={handleCTA} className="hover:text-white transition-colors">Bắt đầu học thử</button></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs font-black text-white uppercase tracking-wider">Công nghệ</h5>
            <ul className="space-y-2 text-[10px] font-bold">
              <li className="flex items-center gap-1.5"><Sparkles size={10} /> Trợ lý trí tuệ ảo</li>
              <li className="flex items-center gap-1.5"><Database size={10} /> Cơ sở dữ liệu Vector</li>
              <li className="flex items-center gap-1.5"><Zap size={10} /> Lọc thẻ thông minh</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs font-black text-white uppercase tracking-wider">Dịch vụ & Hỗ trợ</h5>
            <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
              Giải pháp hỗ trợ ôn thi trực tuyến 24/7. Đồng hành cùng học viên vượt qua mọi kỳ thi căng thẳng.
            </p>
            <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold">
              <ShieldCheck size={12} />
              <span>Chứng nhận kết quả học tập vượt trội</span>
            </div>
          </div>

        </div>

        <div className="max-w-6xl mx-auto border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 font-bold gap-4">
          <p>LearnHub &copy; 2026. Bảo lưu mọi quyền.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-400">Điều khoản dịch vụ</a>
            <a href="#" className="hover:text-slate-400">Chính sách bảo mật</a>
          </div>
        </div>
      </footer>

      {/* Floating AI Chat Trigger */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-all duration-300 z-40 group border-none"
      >
        <MessageSquare size={24} className="group-hover:rotate-12 transition-transform" />
      </button>

      {/* RAG Chat drawer sidebar panel for Landing Page */}
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
                    <h3 className="text-sm font-black text-slate-800 text-left">Hỏi đáp AI LearnHub</h3>
                    <p className="text-[10px] text-slate-400 font-semibold text-left">Trợ lý ảo giới thiệu tính năng RAG</p>
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
                {chatMessages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={cn(
                      "flex flex-col space-y-1 max-w-[85%] text-left",
                      msg.sender === "USER" ? "ml-auto items-end" : "mr-auto items-start"
                    )}
                  >
                    <div 
                      className={cn(
                        "p-3 rounded-2xl text-xs leading-relaxed font-semibold shadow-sm",
                        msg.sender === "USER" 
                          ? "bg-blue-600 text-white rounded-br-none" 
                          : "bg-slate-100 text-slate-800 rounded-bl-none border border-slate-100"
                      )}
                    >
                      {formatChatMessage(msg.message)}
                    </div>
                    {msg.citations && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {JSON.parse(msg.citations).map((cit: any, cIdx: number) => (
                          <button
                            key={cIdx}
                            onClick={() => setActiveCitation(cit)}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100/50 text-[9px] font-black tracking-wide cursor-pointer transition-colors"
                          >
                            <BookOpen size={10} />
                            Trích dẫn [{cit.pageNumber}]
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                
                {sendingChat && (
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold pl-2">
                    <Loader2 size={14} className="animate-spin text-blue-600" />
                    <span>Trợ lý đang suy nghĩ...</span>
                  </div>
                )}
              </div>

              {/* Active Citation Panel */}
              {activeCitation && (
                <div className="p-3 border-t border-slate-100 bg-blue-50/70 relative">
                  <button 
                    onClick={() => setActiveCitation(null)}
                    className="absolute top-2 right-2 text-blue-400 hover:text-blue-600"
                  >
                    <X size={14} />
                  </button>
                  <div className="flex gap-2 items-start text-left pr-4">
                    <Lightbulb className="text-blue-600 shrink-0 mt-0.5" size={14} />
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-black text-blue-900">Chi tiết trích dẫn [Trang {activeCitation.pageNumber}]</p>
                      <p className="text-[9px] text-blue-800/80 leading-relaxed italic pr-2">"{activeCitation.snippet}"</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Chat Input Bar */}
              <form onSubmit={handleSendChatMessage} className="p-4 border-t border-slate-100 bg-white flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Hỏi về LearnHub, RAG AI, Quiz, Flashcard..."
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  disabled={sendingChat}
                />
                <Button 
                  type="submit" 
                  disabled={sendingChat || !chatInput.trim()} 
                  className="h-9 w-9 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center p-0 shrink-0 border-none"
                >
                  <Send size={14} />
                </Button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
