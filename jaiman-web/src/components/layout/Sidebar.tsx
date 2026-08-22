"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User as UserIcon, LogOut, BookOpen, LayoutDashboard, Layers, Video, Map, MessageCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

/**
 * Sidebar, restyled to the "Gamified App" design canvas: floating navy panel,
 * a rail indicator on the active item, and a real level bar computed from the
 * user's XP (100 XP per level) instead of the old hardcoded 65%.
 */
export default function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  const navLinks = [
    { name: "Learn", href: "/learn", icon: Map },
    { name: "AI Tutor", href: "/tutor", icon: MessageCircle },
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Reels Feed", href: "/reels", icon: Home },
    { name: "Classes", href: "/classes", icon: Video },
    { name: "Flashcards", href: "/flashcards", icon: Layers },
    { name: "Profile", href: "/profile", icon: UserIcon },
  ];

  const xp = user?.xp ?? 0;
  const level = Math.floor(xp / 100) + 1;
  const intoLevel = xp % 100;
  const toNext = 100 - intoLevel;

  return (
    <aside className="w-[270px] bg-[#1B2A4A] hidden md:flex flex-col justify-between h-[calc(100vh-2rem)] my-4 ml-4 rounded-[2rem] p-4 z-50 relative shadow-[0_24px_48px_rgba(27,42,74,0.28)] border border-[#2A3F6C]">
      <div className="relative z-10 flex min-h-0 flex-col gap-6 overflow-y-auto hide-scrollbar">
        <Link href="/dashboard" className="flex items-center gap-3 px-4 pt-4 group flex-none">
          <div className="w-10 h-10 rounded-xl bg-[#4361EE] flex items-center justify-center text-white group-hover:scale-105 transition-transform shadow-[0_4px_0_#3046B2]">
            <BookOpen size={20} />
          </div>
          <span className="text-xl font-black text-white tracking-tight flex items-center">
            German<span className="text-[#4361EE]">Jai</span>
          </span>
        </Link>

        <nav className="flex flex-col gap-1.5">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`group relative flex items-center gap-3.5 rounded-[14px] px-4 py-3 text-[15px] transition-all duration-200 ${
                  isActive
                    ? "bg-[#2A3F6C] font-black text-white"
                    : "font-bold text-[#8E9FBE] hover:bg-[#2A3F6C]/50 hover:text-white"
                }`}
              >
                {/* Rail indicator, per the design canvas */}
                <span
                  className={`absolute left-0 top-2 bottom-2 w-[5px] rounded-r-[6px] transition-colors ${
                    isActive ? "bg-[#4361EE]" : "bg-transparent"
                  }`}
                />
                <Icon
                  size={21}
                  className={`transition-colors duration-200 ${isActive ? "text-[#4361EE]" : "group-hover:text-[#4361EE]"}`}
                />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="relative z-10 flex-none space-y-3 border-t border-[#2A3F6C] px-2 pt-5">
        {user && (
          <>
            <div className="flex items-center gap-3">
              <div className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[#F7B731] text-lg font-black text-[#1B2A4A] shadow-[0_3px_0_#D99C2A]">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-black text-white">{user.name}</p>
                <p className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-[0.09em] text-[#8E9FBE]">
                  Level {level} · {user.level ?? "A1"}
                </p>
              </div>
            </div>

            <div className="relative h-2.5 overflow-hidden rounded-full bg-[#131F3A] shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]">
              <div
                className="relative h-full rounded-full bg-[#20BF6B] transition-[width] duration-700"
                style={{ width: `${intoLevel}%` }}
              >
                <div className="absolute left-1 right-1 top-[2px] h-[2px] rounded-full bg-white/35" />
              </div>
            </div>
            <p className="text-center text-[10px] font-extrabold text-[#8E9FBE]">
              {toNext} XP to Level {level + 1}
            </p>
          </>
        )}

        <button
          onClick={logout}
          className="group mt-1 flex w-full items-center gap-3.5 rounded-[14px] px-4 py-2.5 text-sm font-extrabold text-[#8E9FBE] transition-all duration-200 hover:bg-[#FF4757]/10 hover:text-[#FF4757]"
        >
          <LogOut size={19} className="transition-transform group-hover:scale-110" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
