"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FileText, Calendar, ExternalLink, User, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/Input";

interface Document {
  id: number;
  fileName: string;
  fileUrl: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
}

export default function CommunityPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchSearchTerm] = useState("");

  useEffect(() => {
    fetchCommunityDocuments();
  }, []);

  const fetchCommunityDocuments = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get("http://localhost:8080/api/files/community", {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setDocuments(response.data);
    } catch (error) {
      console.error("Error fetching community documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocs = documents.filter(doc => 
    doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cộng đồng học tập</h1>
          <p className="text-gray-500 mt-2">Khám phá các tài liệu được chia sẻ từ những người học khác</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="Tìm kiếm tài liệu hoặc người đăng..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredDocs.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2">
          <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <Search className="text-gray-400" size={32} />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Không tìm thấy tài liệu nào</h3>
          <p className="text-gray-500 mt-1">Thử tìm kiếm với từ khóa khác xem sao.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map((doc, idx) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card 
                className="h-full flex flex-col glass-card glass-card-hover glow-amber relative overflow-hidden rounded-3xl border border-slate-100/80 cursor-pointer group"
                onClick={() => window.open(doc.fileUrl, '_blank')}
              >
                {/* Top decorative gradient bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 via-emerald-400 to-green-500" />

                <CardHeader className="pb-3 pt-6">
                  <div className="flex justify-between items-start mb-3">
                    <div className="h-10 w-10 bg-gradient-to-tr from-teal-500 to-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-teal-100 group-hover:scale-110 transition-transform duration-300">
                      <FileText size={20} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-2.5 py-0.5 rounded-full shadow-sm shadow-teal-100">
                      Cộng đồng
                    </span>
                  </div>
                  <CardTitle className="text-base font-bold line-clamp-2 leading-tight text-slate-800 group-hover:text-teal-600 transition-colors min-h-[2.5rem]">
                    {doc.fileName}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="flex-grow space-y-4 pb-4">
                  <div className="flex items-center gap-3 bg-slate-50/50 p-2.5 rounded-2xl border border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-orange-400 flex items-center justify-center text-white font-black text-xs shadow-sm">
                      {doc.user.name ? doc.user.name.charAt(0).toUpperCase() : <User size={14} />}
                    </div>
                    <div className="text-left min-w-0">
                      <p className="font-bold text-xs text-slate-700 leading-none truncate">{doc.user.name}</p>
                      <p className="text-[10px] text-slate-400 mt-1 truncate">{doc.user.email}</p>
                    </div>
                  </div>
                  
                  {/* Decorative background blur glow */}
                  <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-teal-500/10 transition-colors" />
                </CardContent>

                <CardFooter className="pt-3 pb-5 px-6 border-t border-slate-50/50 flex items-center justify-between z-10">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                    <Calendar size={13} className="text-slate-400" />
                    {new Date(doc.createdAt).toLocaleDateString('vi-VN')}
                  </div>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="font-bold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white border-none shadow-md shadow-teal-100/50 hover:shadow-lg hover:shadow-teal-200/50 transition-all rounded-xl h-10 px-4 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(doc.fileUrl, '_blank');
                    }}
                  >
                    Mở tài liệu
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
