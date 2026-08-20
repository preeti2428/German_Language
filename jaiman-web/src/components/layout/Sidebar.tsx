"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User as UserIcon, LogOut, BookOpen, LayoutDashboard, Layers, Video, Map } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  const navLinks = [
    { name: "Learn", href: "/learn", icon: Map },
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Reels Feed", href: "/reels", icon: Home },
    { name: "Classes", href: "/classes", icon: Video },
    { name: "Flashcards", href: "/flashcards", icon: Layers },
    { name: "Profile", href: "/profile", icon: UserIcon },
  ];

  return (
    <aside className="w-64 bg-[#1B2A4A] hidden md:flex flex-col justify-between h-[calc(100vh-2rem)] my-4 ml-4 rounded-[2rem] p-4 z-50 relative shadow-2xl border border-[#2A3F6C]">
      <div className="relative z-10 flex flex-col gap-8">
        <Link href="/dashboard" className="flex items-center gap-3 px-4 pt-4 group">
          <div className="w-10 h-10 rounded-xl bg-[#4361EE] flex items-center justify-center text-white group-hover:scale-105 transition-transform shadow-[0_4px_0_#3046B2]">
            <BookOpen size={20} />
          </div>
          <span className="text-xl font-black text-white tracking-tight flex items-center">
            German<span className="text-[#4361EE]">Jai</span>
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
                className={`group flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden ${
                  isActive
                    ? "bg-[#2A3F6C] text-white font-bold"
                    : "text-[#8E9FBE] hover:text-white hover:bg-[#2A3F6C]/50 font-semibold"
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#4361EE] rounded-r-full" />
                )}
                <Icon 
                  size={22} 
                  className={`transition-colors duration-300 ${isActive ? "text-[#4361EE]" : "group-hover:text-[#4361EE]"}`} 
                />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="space-y-4 relative z-10 border-t border-[#2A3F6C] pt-6 px-2">
        {user && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#F7B731] flex items-center justify-center text-[#1B2A4A] text-lg font-black shadow-[0_3px_0_#D99C2A]">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-sm font-black text-white truncate">{user.name}</p>
                <p className="text-[10px] text-[#8E9FBE] truncate font-bold uppercase tracking-wider">{user.email}</p>
              </div>
            </div>
            
            {/* XP Mini Bar */}
            <div className="w-full bg-[#131F3A] rounded-full h-2.5 overflow-hidden shadow-inner">
              <div className="bg-[#20BF6B] h-full rounded-full w-[65%] relative">
                <div className="absolute top-[2px] left-1 right-1 h-[2px] bg-white/30 rounded-full" />
              </div>
            </div>
            <p className="text-[10px] font-bold text-[#8E9FBE] text-center">35 XP to next level</p>
          </div>
        )}

        <button
          onClick={logout}
          className="flex items-center gap-4 px-4 py-3 w-full text-[#8E9FBE] hover:text-[#FF4757] hover:bg-[#FF4757]/10 rounded-xl transition-all duration-300 font-bold group mt-2"
        >
          <LogOut size={20} className="group-hover:scale-110 transition-transform group-hover:text-[#FF4757]" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
