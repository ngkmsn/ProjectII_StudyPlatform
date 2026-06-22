"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/lib/api";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Settings, User, KeyRound, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Profile fields
  const [name, setName] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  // Password fields
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (!token || !storedUser) {
      router.push("/auth/login");
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    setName(parsedUser.name || "");
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess("");
    setProfileError("");
    
    if (!name.trim()) {
      setProfileError("Họ tên không được để trống!");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(`${API_BASE_URL}/api/auth/profile`, {
        name: name
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update localStorage
      const updatedUser = { ...user, name: response.data.name };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setProfileSuccess("Cập nhật thông tin tài khoản thành công!");
      
      // Refresh page or trigger context update if needed
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setProfileError(err.response?.data || "Có lỗi xảy ra khi cập nhật hồ sơ!");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess("");
    setPasswordError("");

    if (!oldPassword) {
      setPasswordError("Vui lòng nhập mật khẩu cũ!");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Mật khẩu mới phải tối thiểu 6 ký tự!");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Xác nhận mật khẩu mới không khớp!");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_BASE_URL}/api/auth/change-password`, {
        oldPassword,
        newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPasswordSuccess("Đổi mật khẩu thành công!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordError(err.response?.data || "Có lỗi xảy ra khi đổi mật khẩu!");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-10 max-w-4xl space-y-8 animate-in fade-in duration-500">
      
      {/* Header Title */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-6">
        <div className="h-12 w-12 bg-gradient-to-tr from-blue-500 to-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
          <Settings size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Hồ sơ cá nhân</h1>
          <p className="text-xs font-semibold text-slate-400 mt-1.5">Quản lý thông tin tài khoản và mật khẩu của bạn</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Card: Profile Info */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-none shadow-lg shadow-slate-100/40 bg-white/80 backdrop-blur-md rounded-3xl relative overflow-hidden ring-1 ring-slate-100 h-full">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
            <CardHeader className="pb-4 pt-6">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <User className="text-blue-500" size={18} />
                Thông tin cá nhân
              </CardTitle>
              <CardDescription className="text-xs font-medium text-slate-400">Xem và sửa đổi tên hiển thị của tài khoản</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                
                {/* Email (Readonly) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Email đăng nhập</label>
                  <Input 
                    type="email" 
                    value={user.email} 
                    disabled 
                    className="bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed font-medium"
                  />
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Họ và tên</label>
                  <Input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Nhập họ và tên..."
                    className="border-slate-200 focus:ring-1 focus:ring-blue-500/20 text-slate-700 font-semibold"
                  />
                </div>

                {/* Notifications */}
                {profileSuccess && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 text-xs font-bold">
                    <CheckCircle size={16} />
                    <span>{profileSuccess}</span>
                  </div>
                )}
                {profileError && (
                  <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 text-xs font-bold">
                    <AlertCircle size={16} />
                    <span>{profileError}</span>
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold h-11 rounded-xl shadow-lg shadow-blue-100"
                >
                  {loading ? (
                    <span className="flex items-center gap-2 justify-center">
                      <Loader2 className="animate-spin" size={16} /> Đang lưu...
                    </span>
                  ) : "Lưu thay đổi"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Card: Change Password */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-none shadow-lg shadow-slate-100/40 bg-white/80 backdrop-blur-md rounded-3xl relative overflow-hidden ring-1 ring-slate-100 h-full">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500" />
            <CardHeader className="pb-4 pt-6">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <KeyRound className="text-purple-500" size={18} />
                Đổi mật khẩu
              </CardTitle>
              <CardDescription className="text-xs font-medium text-slate-400">Thay đổi mật khẩu đăng nhập của bạn</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleChangePassword} className="space-y-4">
                
                {/* Old Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Mật khẩu hiện tại</label>
                  <Input 
                    type="password" 
                    value={oldPassword} 
                    onChange={(e) => setOldPassword(e.target.value)} 
                    placeholder="Nhập mật khẩu hiện tại..."
                    className="border-slate-200 focus:ring-1 focus:ring-purple-500/20 text-slate-700"
                  />
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Mật khẩu mới</label>
                  <Input 
                    type="password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    placeholder="Tối thiểu 6 ký tự..."
                    className="border-slate-200 focus:ring-1 focus:ring-purple-500/20 text-slate-700"
                  />
                </div>

                {/* Confirm New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Xác nhận mật khẩu mới</label>
                  <Input 
                    type="password" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    placeholder="Nhập lại mật khẩu mới..."
                    className="border-slate-200 focus:ring-1 focus:ring-purple-500/20 text-slate-700"
                  />
                </div>

                {/* Notifications */}
                {passwordSuccess && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 text-xs font-bold">
                    <CheckCircle size={16} />
                    <span>{passwordSuccess}</span>
                  </div>
                )}
                {passwordError && (
                  <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 text-xs font-bold">
                    <AlertCircle size={16} />
                    <span>{passwordError}</span>
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold h-11 rounded-xl shadow-lg shadow-purple-100"
                >
                  {loading ? (
                    <span className="flex items-center gap-2 justify-center">
                      <Loader2 className="animate-spin" size={16} /> Đang lưu...
                    </span>
                  ) : "Cập nhật mật khẩu"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </div>
  );
}
