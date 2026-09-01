import AuthGuard from "@/components/auth/AuthGuard";
import Sidebar from "@/components/layout/Sidebar";
import MobileNavBar from "@/components/layout/MobileNavBar";
import LevelTestModal from "@/components/level/LevelTestModal";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex h-screen bg-[#F5F6FA] text-[#1A1A2E] overflow-hidden relative">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.03]">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="bg-pattern" x="0" y="0" width="160" height="160" patternUnits="userSpaceOnUse">
                <path d="M20,20 h20 v20 h-20 z M25,25 h10 M25,30 h10 M25,35 h10" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M100,20 L120,20 L120,30 C120,40 110,45 100,50 C90,45 80,40 80,30 L80,20 Z" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M40,100 h20 v30 h-20 z M60,110 h5 v10 h-5" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M120,100 l5,10 l10,0 l-8,7 l3,10 l-10,-6 l-10,6 l3,-10 l-8,-7 l10,0 z" fill="none" stroke="currentColor" strokeWidth="2" />
              </pattern>
            </defs>
            <rect x="0" y="0" width="100%" height="100%" fill="url(#bg-pattern)" />
          </svg>
        </div>

        <Sidebar />
        <main className="flex-1 overflow-y-auto relative z-10 pb-16 md:pb-0">
          {children}
        </main>
        <MobileNavBar />
        <LevelTestModal />
      </div>
    </AuthGuard>
  );
}
