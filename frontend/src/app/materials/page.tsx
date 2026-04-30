"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FileText, Calendar, ExternalLink, Trash2, Loader2 } from "lucide-react";

interface Document {
  id: number;
  fileName: string;
  fileUrl: string;
  createdAt: string;
}

export default function MaterialsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    try {
      const response = await axios.get("http://localhost:8080/api/files", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(response.data);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">Tài liệu của tôi</h1>
        <p className="text-gray-500 mt-2">Quản lý các tài liệu học tập bạn đã tải lên</p>
      </div>

      {documents.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2">
          <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <FileText className="text-gray-400" size={32} />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Chưa có tài liệu nào</h3>
          <p className="text-gray-500 mt-1">Hãy quay lại trang chủ để tải lên tài liệu đầu tiên của bạn.</p>
          <Button 
            className="mt-6" 
            onClick={() => router.push("/")}
          >
            Tải lên ngay
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc, idx) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="bg-blue-50 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
                    <FileText className="text-blue-600" size={20} />
                  </div>
                  <CardTitle className="text-base line-clamp-2 leading-tight">
                    {doc.fileName}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1.5 mt-2">
                    <Calendar size={14} />
                    {new Date(doc.createdAt).toLocaleDateString('vi-VN')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-xs text-gray-400 break-all">
                    ID: #{doc.id}
                  </p>
                </CardContent>
                <CardFooter className="pt-0 flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 font-bold"
                    onClick={() => window.open(doc.fileUrl, '_blank')}
                  >
                    Xem tài liệu
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 font-bold"
                  >
                    Xóa
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
