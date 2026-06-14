"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  Sparkles,
  FolderOpen,
  Trophy,
  Calendar,
  BarChart2
} from "lucide-react";
import { Button } from "./ui/Button";

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  if (pathname.startsWith("/auth")) return null;

  const navItems = [
    { label: "Trang chủ", href: "/", icon: LayoutDashboard },
    { label: "Tài liệu của tôi", href: "/materials", icon: FolderOpen },
    { label: "Quiz của tôi", href: "/quiz", icon: Trophy },
    { label: "Ôn tập hàng ngày", href: "/reviews", icon: Calendar },
    { label: "Thống kê học tập", href: "/analytics", icon: BarChart2 },
    { label: "Cộng đồng", href: "/community", icon: Users },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/auth/login");
  };

  return (
    <aside 
      className={cn(
        "relative flex flex-col border-r border-slate-100 bg-white/75 backdrop-blur-lg transition-all duration-300 ease-in-out z-40 shadow-xl shadow-slate-100/40",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-10 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white shadow-md hover:bg-slate-50 hover:scale-115 active:scale-95 transition-all z-50"
      >
        {isCollapsed ? <ChevronRight size={12} className="text-slate-600" /> : <ChevronLeft size={12} className="text-slate-600" />}
      </button>

      {/* Logo */}
      <div className="flex h-20 items-center px-6 mb-4">
        <Link href="/" className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm shadow-lg shadow-blue-200 animate-float">
            LH
          </div>
          {!isCollapsed && (
            <span className="text-xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent whitespace-nowrap">
              LearnHub
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 group border-l-4",
                isActive 
                  ? "bg-gradient-to-r from-blue-500/8 to-indigo-500/2 text-blue-600 border-blue-600 font-bold" 
                  : "text-slate-500 hover:bg-slate-50/70 hover:text-slate-900 border-transparent hover:translate-x-1"
              )}
            >
              <Icon size={19} className={cn("shrink-0 transition-colors duration-300", isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-700")} />
              {!isCollapsed && (
                <span className="text-sm tracking-wide">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User & Settings */}
      <div className="border-t border-slate-100 p-4 space-y-4 bg-slate-50/40">
        {!isCollapsed && user && (
          <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl bg-white/60 shadow-sm border border-slate-100">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-50 to-indigo-50 flex items-center justify-center text-blue-600 font-black text-sm border border-blue-100">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <Button 
          variant="ghost" 
          onClick={handleLogout}
          className={cn(
            "w-full justify-start rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50/60 font-bold transition-all",
            isCollapsed ? "px-2" : "px-3"
          )}
        >
          <LogOut size={19} className={cn("shrink-0 text-slate-400 group-hover:text-red-600", !isCollapsed && "mr-3")} />
          {!isCollapsed && "Đăng xuất"}
        </Button>
      </div>
    </aside>
  );
}
