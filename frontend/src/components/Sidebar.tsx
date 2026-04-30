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
  FolderOpen
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
        "relative flex flex-col border-r border-gray-100 bg-white transition-all duration-300 ease-in-out z-40",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-10 flex h-6 w-6 items-center justify-center rounded-full border border-gray-100 bg-white shadow-sm hover:bg-gray-50 transition-colors"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Logo */}
      <div className="flex h-16 items-center px-6 mb-6">
        <Link href="/" className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white font-black text-xs">
            AI
          </div>
          {!isCollapsed && (
            <span className="text-xl font-bold tracking-tight text-blue-600 whitespace-nowrap">
              LearnHub
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 group",
                isActive 
                  ? "bg-blue-50 text-blue-600" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon size={20} className={cn("shrink-0", isActive ? "text-blue-600" : "group-hover:text-gray-900")} />
              {!isCollapsed && (
                <span className="text-sm font-semibold whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User & Settings */}
      <div className="border-t border-gray-50 p-4 space-y-4">
        {!isCollapsed && user && (
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <Button 
          variant="ghost" 
          onClick={handleLogout}
          className={cn(
            "w-full justify-start text-gray-500 hover:text-red-600 hover:bg-red-50 font-semibold",
            isCollapsed ? "px-2" : "px-3"
          )}
        >
          <LogOut size={20} className={cn("shrink-0", !isCollapsed && "mr-3")} />
          {!isCollapsed && "Đăng xuất"}
        </Button>
      </div>
    </aside>
  );
}
