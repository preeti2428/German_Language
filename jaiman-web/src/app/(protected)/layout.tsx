import AuthGuard from "@/components/auth/AuthGuard";
import Sidebar from "@/components/layout/Sidebar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex h-screen bg-[#FAF9F6] text-[#1F2328] overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto relative">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
