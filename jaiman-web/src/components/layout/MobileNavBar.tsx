"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, MessageCircle, User as UserIcon, FlaskConical } from "lucide-react";

export default function MobileNavBar() {
  const pathname = usePathname();

  const links = [
    { name: "Home", href: "/dashboard", icon: Home },
    { name: "Levels", href: "/learn", icon: Map },
    { name: "Practice", href: "/practice", icon: FlaskConical },
    { name: "Speak", href: "/tutor", icon: MessageCircle },
    { name: "Profile", href: "/profile", icon: UserIcon },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#F0F0F0] z-50 flex justify-around items-center px-2 py-2 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.04)] pb-[env(safe-area-inset-bottom)]">
      {links.map((link) => {
        const isActive =
          pathname === link.href ||
          (link.href !== "/dashboard" && link.href !== "/" && pathname.startsWith(link.href));
        const Icon = link.icon;
        
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-col items-center justify-center gap-1 w-16 h-12 rounded-xl transition-all ${
              isActive ? "text-[#E53935]" : "text-[#BDBDBD] hover:text-[#757575]"
            }`}
          >
            <Icon size={20} className={isActive ? "text-[#E53935]" : ""} strokeWidth={isActive ? 2.5 : 2} />
            <span className={`text-[9px] font-bold ${isActive ? "text-[#E53935]" : ""}`}>
              {link.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
