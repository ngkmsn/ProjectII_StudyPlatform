"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { LogIn, ArrowRight } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post("http://localhost:8080/api/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify({ name: response.data.name, email: response.data.email }));
      
      router.push("/dashboard");
    } catch (err: any) {
      const errorData = err.response?.data;
      const errorMessage = typeof errorData === 'object' 
        ? (errorData.message || "Đăng nhập thất bại. Kiểm tra lại email/mật khẩu.")
        : (errorData || "Đăng nhập thất bại. Kiểm tra lại email/mật khẩu.");
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[440px]"
      >
        <Card className="border-none shadow-2xl shadow-blue-100/50">
          <CardHeader className="space-y-2 pb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
              <LogIn size={24} />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Chào mừng quay lại</CardTitle>
            <CardDescription className="text-gray-500">
              Nhập thông tin để truy cập vào tài liệu học tập của bạn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600 border border-red-100">
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <Input
                  label="Địa chỉ Email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-50/50"
                />
                <Input
                  label="Mật khẩu"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-gray-50/50"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 text-base font-bold uppercase tracking-wide"
                isLoading={loading}
              >
                Đăng nhập
              </Button>
            </form>
            
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                Chưa có tài khoản?{" "}
                <Link 
                  href="/auth/register" 
                  className="font-semibold text-blue-600 hover:text-blue-700 underline-offset-4 hover:underline"
                >
                  Đăng ký ngay
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
