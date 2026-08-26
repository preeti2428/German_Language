"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search, Users, BookOpen, Lock, Play, Star,
  ChevronRight, GraduationCap, Zap, Trophy, Plus,
  Flame, Filter,
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface Batch {
  _id: string;
  title: string;
  description: string;
  level: string;
  price: number;
  thumbnail?: string;
  isPublished: boolean;
  teacher: { name: string; avatar?: string };
  enrolledStudents: string[];
  modules: { title: string }[];
  startDate?: string;
  tags: string[];
}

const LEVELS = ["All", "A1", "A2", "B1", "B2", "C1", "C2"];

const LEVEL_META: Record<string, { color: string; bg: string; border: string; darkBg: string; emoji: string; label: string }> = {
  A1: { color: "#43A047", bg: "#E8F5E9", border: "#A5D6A7", darkBg: "#43A047", emoji: "🌱", label: "Absolute Beginner" },
  A2: { color: "#00897B", bg: "#E0F2F1", border: "#80CBC4", darkBg: "#00897B", emoji: "🌿", label: "Elementary" },
  B1: { color: "#1565C0", bg: "#E3F2FD", border: "#90CAF9", darkBg: "#1565C0", emoji: "📘", label: "Intermediate" },
  B2: { color: "#6A1B9A", bg: "#F3E5F5", border: "#CE93D8", darkBg: "#6A1B9A", emoji: "🔮", label: "Upper Intermediate" },
  C1: { color: "#E53935", bg: "#FFEBEE", border: "#EF9A9A", darkBg: "#E53935", emoji: "🏆", label: "Advanced" },
  C2: { color: "#E65100", bg: "#FFF3E0", border: "#FFCC80", darkBg: "#E65100", emoji: "💎", label: "Mastery" },
};

export default function CoursesPage() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("All");
  const [filterPrice, setFilterPrice] = useState("all");

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    fetchBatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterLevel]);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterLevel !== "All") params.level = filterLevel;
      const res = await api.get("/batches", { params });
      setBatches(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = batches
    .filter((b) => {
      if (filterPrice === "trial") return b.level === "A1" || b.tags?.some((t) => t.includes("trial"));
      if (filterPrice === "paid") return true;
      return true;
    })
    .filter((b) =>
      search === "" ||
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.description?.toLowerCase().includes(search.toLowerCase()) ||
      b.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()))
    );

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div className="min-h-screen bg-[#F5F6FA]">

      {/* ══ HERO HEADER ════════════════════════════════════════════════ */}
      <div className="bg-white border-b border-[#F0F0F0] px-6 py-5">
        <div className="max-w-[1300px] mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] font-black text-[#E53935] uppercase tracking-[0.2em] mb-1">🎓 Learn German</p>
              <h1 className="text-[28px] font-black text-[#1A1A2E] leading-tight">
                Explore Our <span className="text-[#E53935]">Batches</span>
              </h1>
              <p className="text-[#9E9E9E] text-sm font-medium mt-1">
                {batches.length} batches · Expert teachers · A1 Starting 2 Weeks Free Trial
              </p>
            </div>
            {isAdmin && (
              <Link href="/admin/batches" className="duo-btn duo-btn-red px-5 py-2.5 text-xs flex items-center gap-2">
                <Plus size={14} /> Manage Batches
              </Link>
            )}
          </div>

          {/* Search */}
          <div className="relative max-w-lg">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#BDBDBD]" />
            <input
              type="text"
              placeholder="Search batches, topics, levels..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-[#EAEAEA] bg-[#FAFAFA] text-sm font-semibold text-[#1A1A2E] placeholder:text-[#BDBDBD] focus:outline-none focus:border-[#E53935] focus:bg-white transition-all"
            />
          </div>
        </div>
      </div>

      <div className="max-w-[1300px] mx-auto px-6 py-6">

        {/* ══ LEVEL FILTER GRID ═══════════════════════════════════════ */}
        <div className="grid grid-cols-7 gap-2 mb-6">
          {LEVELS.map((level) => {
            const isActive = filterLevel === level;
            const meta = LEVEL_META[level];
            return (
              <button
                key={level}
                onClick={() => setFilterLevel(level)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 border-b-[4px] font-black text-xs transition-all ${
                  isActive
                    ? "bg-[#E53935] border-[#E53935] border-b-[#C62828] text-white shadow-[0_4px_12px_rgba(229,57,53,0.25)]"
                    : "bg-white border-[#EAEAEA] border-b-[#D8D8D8] text-[#9E9E9E] hover:border-[#E53935] hover:text-[#E53935] hover:bg-[#FFF5F5]"
                }`}
              >
                <span className="text-lg">{meta?.emoji ?? "📚"}</span>
                <span>{level}</span>
                {meta && <span className={`text-[8px] font-bold ${isActive ? "text-white/70" : "text-[#BDBDBD]"} hidden lg:block`}>{meta.label.split(" ")[0]}</span>}
              </button>
            );
          })}
        </div>

        {/* Price & Trial filter chips */}
        <div className="flex items-center gap-2 mb-6">
          <Filter size={14} className="text-[#BDBDBD]" />
          <span className="text-xs font-bold text-[#BDBDBD]">Filter:</span>
          {[
            { key: "all", label: "All Batches" },
            { key: "trial", label: "🎁 2-Week Free Trial (A1)" },
            { key: "paid", label: "💎 Premium Batches" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterPrice(f.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black border-2 transition-all ${
                filterPrice === f.key
                  ? "bg-[#1A1A2E] text-white border-[#1A1A2E]"
                  : "bg-white text-[#9E9E9E] border-[#EAEAEA] hover:border-[#1A1A2E] hover:text-[#1A1A2E]"
              }`}
            >
              {f.label}
            </button>
          ))}
          <span className="ml-auto text-xs font-bold text-[#BDBDBD]">{filtered.length} results</span>
        </div>

        {/* ══ LOADING SKELETON ════════════════════════════════════════ */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-[1.5rem] border border-[#EAEAEA] border-b-4 border-b-[#D8D8D8] overflow-hidden animate-pulse">
                <div className="h-36 bg-[#F5F5F5]" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-[#F0F0F0] rounded-xl w-3/4" />
                  <div className="h-3 bg-[#F0F0F0] rounded-xl w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══ FEATURED BATCH (first result) ════════════════════════════ */}
        {!loading && featured && (
          <Link href={`/courses/${featured._id}`} className="block mb-6 group">
            <div className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-r from-[#1A1A2E] via-[#2D1B4E] to-[#E53935] p-6 md:p-8 border-2 border-[#333] border-b-[6px] border-b-[#E53935] shadow-[0_8px_32px_rgba(229,57,53,0.2)] hover:shadow-[0_12px_40px_rgba(229,57,53,0.3)] transition-all hover:-translate-y-1">
              {/* Background glow */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(229,57,53,0.25),transparent_60%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,193,7,0.1),transparent_50%)]" />

              <div className="relative flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-1">
                  {/* Badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="inline-flex items-center gap-1.5 bg-[#FFC107] text-[#1A1A2E] text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-[0_2px_0_rgba(0,0,0,0.2)]">
                      <Star size={10} className="fill-[#1A1A2E]" /> FEATURED BATCH
                    </div>
                    {featured.level === "A1" && (
                      <span className="inline-flex items-center gap-1 bg-[#E8F5E9] text-[#2E7D32] text-[10px] font-black px-2.5 py-1 rounded-full border border-[#A5D6A7]">
                        🎁 2-Week Free Trial
                      </span>
                    )}
                  </div>

                  <h2 className="text-[22px] md:text-[28px] font-black text-white leading-tight mb-2">
                    {featured.title}
                  </h2>
                  <p className="text-white/60 text-sm font-medium mb-4 max-w-lg line-clamp-2">
                    {featured.description}
                  </p>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-3 mb-5">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-white/70 bg-white/10 px-3 py-1.5 rounded-xl">
                      <Users size={12} /> {featured.enrolledStudents?.length ?? 0} students
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-bold text-white/70 bg-white/10 px-3 py-1.5 rounded-xl">
                      <BookOpen size={12} /> {featured.modules?.length ?? 0} modules
                    </span>
                    <span className="text-xs font-black px-3 py-1.5 rounded-xl bg-[#FFC107] text-[#1A1A2E]">
                      💎 ₹{featured.price}
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-2 bg-[#E53935] text-white text-sm font-black px-6 py-3 rounded-2xl shadow-[0_4px_0_#C62828] group-hover:shadow-[0_2px_0_#C62828] group-hover:translate-y-[2px] transition-all">
                    {featured.level === "A1" ? "Try Free Preview & Enroll" : "Enroll Now"} <ChevronRight size={16} />
                  </div>
                </div>

                {/* Right decoration */}
                <div className="hidden md:flex flex-col items-center gap-3">
                  <div className="w-28 h-28 rounded-3xl bg-white/10 backdrop-blur-sm flex flex-col items-center justify-center border border-white/20">
                    <span className="text-5xl">{LEVEL_META[featured.level]?.emoji ?? "📚"}</span>
                    <span className="text-white font-black text-sm mt-1">{featured.level}</span>
                  </div>
                  <p className="text-white/50 text-xs font-bold">{LEVEL_META[featured.level]?.label}</p>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* ══ BATCH GRID ══════════════════════════════════════════════ */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 text-[#BDBDBD]">
            <GraduationCap size={56} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-black">No batches found</p>
            <p className="text-sm font-medium mt-1">Try a different level or search term</p>
          </div>
        )}

        {!loading && rest.length > 0 && (
          <>
            <h2 className="text-[15px] font-black text-[#1A1A2E] mb-4 flex items-center gap-2">
              <Trophy size={16} className="text-[#E53935]" />
              {filterLevel === "All" ? "All Batches" : `${filterLevel} Batches`}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rest.map((batch) => {
                const meta = LEVEL_META[batch.level];
                const isA1 = batch.level === "A1";
                return (
                  <Link key={batch._id} href={`/courses/${batch._id}`}
                    className="group bg-white rounded-[1.5rem] border border-[#EAEAEA] border-b-[4px] border-b-[#D8D8D8] overflow-hidden hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-200">

                    {/* Colorful top banner */}
                    <div className="h-3" style={{ background: meta?.darkBg ?? "#E53935" }} />

                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
                            style={{ background: meta?.bg ?? "#FFF5F5" }}>
                            {meta?.emoji ?? "📚"}
                          </div>
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wide" style={{ color: meta?.color ?? "#E53935" }}>
                              {batch.level} · {meta?.label ?? "Learner"}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[11px] font-black px-2.5 py-1 rounded-xl bg-[#FFF3E0] text-[#E65100]">
                            ₹{batch.price}
                          </span>
                          {isA1 && (
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-[#E8F5E9] text-[#2E7D32]">
                              🎁 2-Wk Free Trial
                            </span>
                          )}
                        </div>
                      </div>

                      <h3 className="font-black text-[#1A1A2E] text-[15px] leading-tight mb-2 group-hover:text-[#E53935] transition-colors line-clamp-2">
                        {batch.title}
                      </h3>
                      <p className="text-[#9E9E9E] text-xs font-medium mb-4 line-clamp-2">
                        {batch.description || "A structured German language learning batch."}
                      </p>

                      {/* Stats row */}
                      <div className="flex items-center gap-3 text-[11px] text-[#BDBDBD] font-bold mb-4">
                        <span className="flex items-center gap-1"><Users size={11} /> {batch.enrolledStudents?.length ?? 0}</span>
                        <span className="flex items-center gap-1"><BookOpen size={11} /> {batch.modules?.length ?? 0} modules</span>
                        <span className="flex items-center gap-1 text-[#9E9E9E]">by {batch.teacher?.name}</span>
                      </div>

                      {/* Tags */}
                      {batch.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {batch.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-[10px] font-bold bg-[#F5F5F5] text-[#9E9E9E] px-2 py-0.5 rounded-lg">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* CTA */}
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#BDBDBD]">
                          {batch.startDate ? `Starts ${new Date(batch.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : "Self-paced"}
                        </span>
                        <span className="flex items-center gap-1 text-xs font-black text-[#E53935] group-hover:gap-2 transition-all">
                          {isA1 ? "Free Trial & Enroll" : "View Batch"} <ChevronRight size={13} />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {/* ══ WHY LEARN GERMAN section ════════════════════════════════ */}
        {!loading && (
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { emoji: "🇩🇪", title: "Native-style Teaching", desc: "Taught like it's spoken in Germany" },
              { emoji: "🤖", title: "AI Tutor — Jai", desc: "Practice conversations 24/7 with AI" },
              { emoji: "🏆", title: "Goethe Prep", desc: "A1 to C2 exam ready curriculum" },
              { emoji: "📱", title: "Learn Anywhere", desc: "Web + mobile friendly platform" },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-[1.25rem] border border-[#EAEAEA] border-b-[3px] border-b-[#E53935] p-4 text-center">
                <div className="text-3xl mb-2">{f.emoji}</div>
                <p className="font-black text-[#1A1A2E] text-sm">{f.title}</p>
                <p className="text-[#BDBDBD] text-[11px] font-medium mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
