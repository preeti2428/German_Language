"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Map, GraduationCap, Layers, MessageCircle,
  Home, Video, User as UserIcon, LogOut, Settings,
  Star, CalendarDays, Globe2, Shield, Megaphone, FlaskConical,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { calculateLevelInfo } from "@/lib/level";

/**
 * Sidebar — Exactly matches "German with Jai" reference design:
 * - White background, mascot logo
 * - Section labels: LEARN, SPEAK, DISCOVER, ME
 * - Red pill for active item
 * - User card at bottom with XP bar
 */
export default function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  const isAdmin = user?.role === 'admin';

  const sections = [
    {
      label: "LEARN",
      links: [
        { name: "Home",     href: "/dashboard",  icon: Home },
        { name: "Levels",  href: "/learn",       icon: Map },
        { name: "Practice", href: "/practice",    icon: FlaskConical },
        { name: "Flashcards", href: "/flashcards", icon: Layers },
        { name: "Batches",  href: "/courses",     icon: GraduationCap },
      ],
    },
    {
      label: "SPEAK",
      links: [
        { name: "Talk to Jai",    href: "/tutor",    icon: MessageCircle },
        { name: "Book a Session", href: "/calendar", icon: CalendarDays },
        { name: "Live Sessions",  href: "/classes",  icon: Video },
      ],
    },
    {
      label: "DISCOVER",
      links: [
        { name: "Reels",         href: "/reels",          icon: Home },
        { name: "Germany Guide", href: "/germany-guide",  icon: Globe2 },
      ],
    },
    {
      label: "ME",
      links: [
        { name: "Profile",  href: "/profile",  icon: UserIcon },
        { name: "Settings", href: "/settings", icon: Settings },
        ...(isAdmin ? [
          { name: "Admin Profile", href: "/admin/profile", icon: Shield },
        ] : []),
      ],
    },
  ];

  const xp = user?.xp ?? 0;
  const levelInfo = calculateLevelInfo(xp, user?.level);

  return (
    <aside className="w-[230px] bg-white hidden md:flex flex-col h-screen border-r border-[#F0F0F0] z-50 flex-shrink-0">

      {/* ── Logo + Mascot ── */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#F5F5F5]">
        {/* Mascot avatar */}
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#E53935] to-[#FF7043] flex items-center justify-center text-xl shadow-[0_3px_0_#C62828] flex-shrink-0">
          🇩🇪
        </div>
        <div>
          <p className="text-[13px] font-black text-[#1A1A2E] leading-tight">German</p>
          <p className="text-[13px] font-black text-[#E53935] leading-tight">with Jai</p>
        </div>
      </div>

      {/* ── Nav Sections ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-3 hide-scrollbar">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="text-[9px] font-black text-[#BDBDBD] tracking-[0.2em] uppercase px-2 mb-1">
              {section.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {section.links.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/dashboard" && link.href !== "/" && pathname.startsWith(link.href));
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href + link.name}
                    href={link.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-[13px] font-bold transition-all duration-150 ${
                      isActive
                        ? "bg-[#E53935] text-white shadow-[0_3px_0_#C62828]"
                        : "text-[#757575] hover:bg-[#FFF5F5] hover:text-[#E53935]"
                    }`}
                  >
                    <Icon
                      size={17}
                      className={isActive ? "text-white" : "text-[#BDBDBD]"}
                    />
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── User Card at Bottom ── */}
      <div className="border-t border-[#F5F5F5] p-4 space-y-3">
        {user && (
          <>
            {/* Avatar + Info */}
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-[#FFC107] flex items-center justify-center font-black text-[#1A1A2E] text-[15px] shadow-[0_3px_0_rgba(0,0,0,0.12)] flex-shrink-0">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-[13px] font-black text-[#1A1A2E] truncate">{user.name}</p>
                <p className="text-[10px] font-bold text-[#BDBDBD]">
                  Level {levelInfo.level} · {levelInfo.tierLabel}
                </p>
              </div>
            </div>

            {/* XP bar */}
            <div>
              <div className="h-2 rounded-full bg-[#F0F0F0] overflow-hidden mb-1">
                <div
                  className="h-full rounded-full bg-[#E53935] transition-[width] duration-700"
                  style={{ width: `${levelInfo.progressPercent}%` }}
                />
              </div>
              <p className="text-[9px] font-bold text-[#BDBDBD] text-center">
                {levelInfo.toNext} XP to Level {levelInfo.level + 1}
              </p>
            </div>
          </>
        )}

        {/* Sign out */}
        <button
          onClick={logout}
          className="group flex w-full items-center gap-2.5 px-2 py-2 rounded-xl text-[12px] font-bold text-[#BDBDBD] hover:bg-[#FFF5F5] hover:text-[#E53935] transition-all"
        >
          <LogOut size={15} className="text-[#D8D8D8] group-hover:text-[#E53935] transition-colors" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
