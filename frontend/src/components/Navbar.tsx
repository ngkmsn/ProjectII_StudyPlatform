"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "./ui/Button";
import { LayoutDashboard, Users, Upload, LogOut, BookOpen } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  
  // Don't show navbar on auth pages
  if (pathname.startsWith("/auth")) return null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/auth/login";
  };

  const navItems = [
    { label: "Bảng điều khiển", href: "/", icon: LayoutDashboard },
    { label: "Cộng đồng", href: "/community", icon: Users },
    { label: "Tài liệu", href: "/materials", icon: BookOpen },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-blue-600">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-black text-sm">
              AI
            </div>
            <span>LearnHub</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-4 py-2 text-sm font-semibold rounded-md transition-colors",
                    pathname === item.href
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-500 hover:text-red-600 font-semibold">
            Đăng xuất
          </Button>
        </div>
      </div>
    </nav>
  );
}
