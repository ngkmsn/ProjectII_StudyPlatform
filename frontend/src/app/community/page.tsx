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
              <Card className="h-full flex flex-col hover:shadow-lg transition-all group border-gray-100">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="bg-purple-50 w-10 h-10 rounded-lg flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                      <FileText className="text-purple-600 group-hover:text-white transition-colors" size={20} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 px-2 py-1 rounded">
                      Public
                    </span>
                  </div>
                  <CardTitle className="text-base line-clamp-2 leading-tight group-hover:text-purple-700 transition-colors">
                    {doc.fileName}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="flex-grow space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                      <User size={16} />
                    </div>
                    <div className="text-sm">
                      <p className="font-semibold text-gray-700 leading-none">{doc.user.name}</p>
                      <p className="text-xs text-gray-400 mt-1">{doc.user.email}</p>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-4 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    {new Date(doc.createdAt).toLocaleDateString('vi-VN')}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-black"
                    onClick={() => window.open(doc.fileUrl, '_blank')}
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
