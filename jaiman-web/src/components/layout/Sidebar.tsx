"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User as UserIcon, LogOut, BookOpen, LayoutDashboard, Layers, Video, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  const navLinks = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Reels Feed", href: "/reels", icon: Home },
    { name: "Classes", href: "/classes", icon: Video },
    { name: "Flashcards", href: "/flashcards", icon: Layers },
    { name: "Profile", href: "/profile", icon: UserIcon },
  ];

  return (
    <aside className="w-72 bg-white/90 backdrop-blur-3xl border-r border-gray-100 hidden md:flex flex-col justify-between h-screen p-6 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-50 relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-br from-[#26408B]/5 to-transparent blur-3xl rounded-full pointer-events-none -translate-y-1/2 -translate-x-1/4"></div>

      <div className="relative z-10">
        <Link href="/reels" className="flex items-center gap-3 mb-10 group px-2">
          <div className="bg-gradient-to-br from-[#26408B] to-[#4F75FF] text-white p-2.5 rounded-xl shadow-[0_8px_16px_rgba(38,64,139,0.25)] group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
            <BookOpen size={24} />
          </div>
          <span className="text-2xl font-black text-gray-900 tracking-tight">
            German<span className="text-[#26408B]">With</span>Jai
          </span>
        </Link>

        <nav className="space-y-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`group flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 relative ${
                  isActive
                    ? "bg-gradient-to-r from-[#26408B] to-[#3B5BCC] text-white shadow-[0_8px_20px_rgba(38,64,139,0.25)] scale-[1.02] font-semibold"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50/80 font-medium"
                }`}
              >
                <div className="flex items-center gap-3 relative z-10">
                  <Icon 
                    size={20} 
                    className={`transition-colors duration-300 ${isActive ? "text-white" : "text-gray-400 group-hover:text-[#26408B]"}`} 
                  />
                  <span>{link.name}</span>
                </div>
                {isActive && <ChevronRight size={18} className="text-white/70" />}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="space-y-4 relative z-10">
        {user && (
          <div className="p-3 bg-white rounded-2xl flex items-center gap-3 border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] group hover:border-[#26408B]/20 hover:shadow-[0_4px_20px_rgba(38,64,139,0.08)] transition-all duration-300 cursor-default">
            <div className="w-11 h-11 min-w-[2.75rem] rounded-xl bg-gradient-to-br from-[#D9A441] to-[#F1C40F] flex items-center justify-center text-white text-lg font-bold shadow-inner">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3.5 w-full text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all duration-300 font-semibold group"
        >
          <LogOut size={20} className="group-hover:scale-110 transition-transform" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
