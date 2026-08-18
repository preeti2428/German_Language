"use client";

import dynamic from "next/dynamic";

// We must dynamically import the 3D Scene so it doesn't cause SSR issues
const Scene = dynamic(() => import("@/components/3d/Scene"), { ssr: false });

export default function DashboardPage() {
  return (
    <div className="w-full h-full relative overflow-hidden">
      <Scene />
    </div>
  );
}
