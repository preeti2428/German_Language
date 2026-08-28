"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap, Users, BookOpen, Clock, Lock, ChevronDown,
  ChevronRight, Play, FileText, Dumbbell, Check, ArrowLeft,
  Bell, Calendar, Star, Sparkles, AlertCircle
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface Lecture { title: string; videoUrl: string; duration?: number; isFree: boolean; order: number; }
interface Note { title: string; fileUrl?: string; content?: string; }
interface DPP { question: string; options: string[]; correctAnswer: string; explanation?: string; }
interface Module { _id: string; title: string; order: number; lectures: Lecture[]; notes: Note[]; dpp: DPP[]; }
interface Batch {
  _id: string; title: string; description: string; level: string; price: number;
  thumbnail?: string; isPublished: boolean;
  teacher: { _id: string; name: string; avatar?: string };
  enrolledStudents: string[]; modules: Module[];
  startDate?: string; endDate?: string; enrollmentDeadline?: string;
  maxStudents?: number; tags: string[]; announcements: { title: string; body: string; createdAt: string }[];
  isEnrolled?: boolean;
}

const LEVEL_BG: Record<string, string> = {
  A1: "from-emerald-500 to-teal-600", A2: "from-teal-500 to-cyan-600",
  B1: "from-blue-500 to-indigo-600",  B2: "from-indigo-500 to-purple-600",
  C1: "from-purple-500 to-pink-600",  C2: "from-rose-500 to-red-600",
};

export default function BatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"curriculum" | "announcements">("curriculum");
  const [enrollMsg, setEnrollMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/batches/${id}`);
        setBatch(res.data);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const toggleModule = (mid: string) => {
    setOpenModules((prev) => {
      const next = new Set(prev);
      next.has(mid) ? next.delete(mid) : next.add(mid);
      return next;
    });
  };

  const handleEnroll = async () => {
    if (!user) { router.push("/auth/login"); return; }
    setEnrolling(true);
    setEnrollMsg(null);
    try {
      const res = await api.post(`/batches/${id}/enroll`);
      if (res.data.enrolled) {
        setBatch((prev) => prev ? { ...prev, isEnrolled: true, enrolledStudents: [...prev.enrolledStudents, user.id] } : prev);
        setEnrollMsg({ type: "success", text: "🎉 Enrolled successfully! You can now access all content." });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message ?? "Enrollment failed.";
      if (err.response?.status === 402) {
        setEnrollMsg({ type: "info", text: "💎 This is a paid batch. Please contact the admin to get enrolled." });
      } else {
        setEnrollMsg({ type: "error", text: msg });
      }
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-4 border-[#4361EE] border-t-transparent animate-spin" />
    </div>
  );

  if (!batch) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-[#9AA6B4]">
      <GraduationCap size={56} className="opacity-30" />
      <p className="text-lg font-bold">Batch not found</p>
      <Link href="/courses" className="duo-btn duo-btn-blue px-6 py-2.5 text-sm">← Back to Courses</Link>
    </div>
  );

  const levelBg = LEVEL_BG[batch.level] ?? "from-gray-400 to-gray-600";
  const totalLectures = batch.modules.reduce((a, m) => a + m.lectures.length, 0);
  const totalNotes = batch.modules.reduce((a, m) => a + m.notes.length, 0);
  const totalDPP = batch.modules.reduce((a, m) => a + m.dpp.length, 0);
  const isOwner = user?.id === batch.teacher?._id || user?.role === "admin";
  const isPaid = batch.price > 0;

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <div className={`relative bg-gradient-to-br ${levelBg} px-6 md:px-10 pt-8 pb-10`}>
        <Link href="/courses" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm font-bold mb-5 transition-colors">
          <ArrowLeft size={16} /> Back to Batches
        </Link>

        <div className="max-w-4xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-white/20 text-white text-xs font-black px-3 py-1.5 rounded-xl backdrop-blur-sm">
              {batch.level}
            </span>
            <span className="bg-[#FFC107] text-[#1F2328] text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-[0_3px_0_#D99C2A]">
              <Lock size={10} /> ₹{batch.price}
            </span>
            {batch.level === 'A1' && (
              <span className="bg-[#20BF6B] text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-[0_3px_0_#178B4E] flex items-center gap-1">
                🎁 2-Week Free Trial
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-white leading-tight mb-3">
            {batch.title}
          </h1>
          <p className="text-white/80 text-base font-medium max-w-2xl mb-5">
            {batch.description || "A structured German language learning batch."}
          </p>

          <div className="flex flex-wrap gap-4 text-white/80 text-sm font-bold">
            <span className="flex items-center gap-1.5"><Users size={15} /> {batch.enrolledStudents.length} students enrolled</span>
            <span className="flex items-center gap-1.5"><BookOpen size={15} /> {batch.modules.length} modules</span>
            <span className="flex items-center gap-1.5"><Play size={15} /> {totalLectures} lectures</span>
            {batch.startDate && (
              <span className="flex items-center gap-1.5">
                <Calendar size={15} /> Starts {new Date(batch.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2.5 text-white/70 text-sm">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-black text-white">
              {batch.teacher?.name?.charAt(0)}
            </div>
            <span className="font-bold">by <span className="text-white font-black">{batch.teacher?.name}</span></span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 md:px-8 py-8 flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-7">
            {[
              { icon: Play, label: "Lectures", count: totalLectures, color: "dj-chip-xp" },
              { icon: FileText, label: "Notes", count: totalNotes, color: "dj-chip-gem" },
              { icon: Dumbbell, label: "DPP", count: totalDPP, color: "dj-chip-streak" },
            ].map(({ icon: Icon, label, count, color }) => (
              <div key={label} className={`dj-chip ${color} flex-col items-center justify-center gap-0.5 py-3 rounded-2xl text-center`}>
                <Icon size={18} />
                <span className="text-lg">{count}</span>
                <span className="text-[10px] font-bold opacity-70">{label}</span>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-5 border-b-2 border-[#e5e5e5]">
            {(["curriculum", "announcements"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-black capitalize transition-all border-b-2 -mb-[2px] ${
                  activeTab === tab
                    ? "border-[#4361EE] text-[#4361EE]"
                    : "border-transparent text-[#9AA6B4] hover:text-[#6b7280]"
                }`}
              >
                {tab}
                {tab === "announcements" && batch.announcements.length > 0 && (
                  <span className="ml-1.5 bg-[#FF4757] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                    {batch.announcements.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* A1 2-Week Free Trial Banner */}
          {batch.level === "A1" && !batch.isEnrolled && (
            <div className="mb-4 p-4 rounded-2xl bg-[#E8F5E9] border-2 border-b-[4px] border-[#A5D6A7] border-b-[#43A047] flex items-start gap-3">
              <span className="text-2xl">🎁</span>
              <div>
                <p className="font-black text-[#2E7D32] text-sm">2-Week Free Trial Active for A1!</p>
                <p className="text-[#388E3C] text-xs font-medium mt-0.5">
                  Week 1 and Week 2 lectures are 100% free to preview. Enroll for ₹{batch.price} to unlock full modules, notes, DPP tests, and certificates.
                </p>
              </div>
            </div>
          )}

          {/* Curriculum */}
          {activeTab === "curriculum" && (
            <div className="space-y-3">
              {batch.modules.length === 0 ? (
                <div className="text-center py-10 text-[#9AA6B4]">
                  <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="font-bold">No modules yet</p>
                </div>
              ) : (
                batch.modules.map((mod, idx) => {
                  const isOpen = openModules.has(mod._id);
                  const totalItems = mod.lectures.length + mod.notes.length + mod.dpp.length;
                  return (
                    <div key={mod._id} className="duo-card overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between p-4 hover:bg-[#f8f9fa] transition-colors text-left"
                        onClick={() => toggleModule(mod._id)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-xl bg-[#E8ECEF] text-[#4361EE] font-black text-sm flex items-center justify-center flex-shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-black text-[#1F2328] text-sm">{mod.title}</p>
                            <p className="text-[#9AA6B4] text-xs font-bold mt-0.5">
                              {mod.lectures.length} lectures · {mod.notes.length} notes · {mod.dpp.length} DPP
                            </p>
                          </div>
                        </div>
                        <ChevronDown size={18} className={`text-[#9AA6B4] transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      </button>

                      {isOpen && (
                        <div className="border-t-2 border-[#e5e5e5] divide-y-2 divide-[#f0f0f0]">
                          {/* Lectures */}
                          {mod.lectures.map((lec, li) => {
                            const canAccess = lec.isFree || batch.isEnrolled;
                            return (
                              <button 
                                key={li} 
                                onClick={() => { if (canAccess) router.push(`/learn/batch/${batch._id}`); }}
                                className={`w-full text-left flex items-center gap-3 px-4 py-3 transition-colors ${canAccess ? "hover:bg-gray-50 cursor-pointer" : "cursor-default"}`}
                              >
                                <div className="w-7 h-7 rounded-lg bg-[#EEF1FF] flex items-center justify-center flex-shrink-0">
                                  {canAccess ? (
                                    <Play size={13} className="text-[#4361EE]" />
                                  ) : (
                                    <Lock size={13} className="text-[#9AA6B4]" />
                                  )}
                                </div>
                                <span className={`text-sm font-semibold flex-1 ${!canAccess ? "text-[#9AA6B4]" : "text-[#1F2328]"}`}>
                                  {lec.title}
                                </span>
                                {lec.isFree && !batch.isEnrolled && (
                                  <span className="text-[10px] font-black text-[#20BF6B] bg-[#D1FAE5] px-2 py-0.5 rounded-lg">Preview</span>
                                )}
                                {lec.duration && <span className="text-[#9AA6B4] text-xs font-bold">{lec.duration}m</span>}
                              </button>
                            );
                          })}
                          {/* Notes */}
                          {mod.notes.map((note, ni) => (
                            <div key={ni} className="flex items-center gap-3 px-4 py-3">
                              <div className="w-7 h-7 rounded-lg bg-[#FEF3C7] flex items-center justify-center flex-shrink-0">
                                <FileText size={13} className="text-[#F7B731]" />
                              </div>
                              <span className={`text-sm font-semibold flex-1 ${!batch.isEnrolled ? "text-[#9AA6B4]" : "text-[#1F2328]"}`}>
                                {note.title}
                              </span>
                              {!batch.isEnrolled && <Lock size={12} className="text-[#9AA6B4]" />}
                            </div>
                          ))}
                          {/* DPP */}
                          {mod.dpp.length > 0 && (
                            <div className="flex items-center gap-3 px-4 py-3">
                              <div className="w-7 h-7 rounded-lg bg-[#FFE4E6] flex items-center justify-center flex-shrink-0">
                                <Dumbbell size={13} className="text-[#FF4757]" />
                              </div>
                              <span className={`text-sm font-semibold flex-1 ${!batch.isEnrolled ? "text-[#9AA6B4]" : "text-[#1F2328]"}`}>
                                DPP · {mod.dpp.length} questions
                              </span>
                              {!batch.isEnrolled && <Lock size={12} className="text-[#9AA6B4]" />}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Announcements */}
          {activeTab === "announcements" && (
            <div className="space-y-3">
              {batch.announcements.length === 0 ? (
                <div className="text-center py-10 text-[#9AA6B4]">
                  <Bell size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="font-bold">No announcements yet</p>
                </div>
              ) : (
                [...batch.announcements].reverse().map((ann, i) => (
                  <div key={i} className="duo-card p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#EEF1FF] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bell size={15} className="text-[#4361EE]" />
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-[#1F2328] text-sm">{ann.title}</p>
                        <p className="text-[#6b7280] text-sm mt-1 font-medium">{ann.body}</p>
                        <p className="text-[#9AA6B4] text-xs font-bold mt-2">
                          {new Date(ann.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Sticky Sidebar */}
        <div className="lg:w-72 flex-shrink-0">
          <div className="sticky top-6">
            <div className="duo-card overflow-hidden">
              <div className={`bg-gradient-to-br ${levelBg} p-5 text-white text-center`}>
                <p className="text-3xl font-black">
                  ₹{batch.price}
                </p>
                <p className="text-xs font-bold opacity-90 mt-1">
                  {batch.level === 'A1' ? '🎁 Includes 2-Week Free Trial' : 'One-time Full Enrollment'}
                </p>
              </div>
              <div className="p-5 space-y-4">
                {/* Enroll message */}
                {enrollMsg && (
                  <div className={`p-3 rounded-xl text-sm font-bold flex items-start gap-2 ${
                    enrollMsg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" :
                    enrollMsg.type === "info" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                    "bg-red-50 text-red-700 border border-red-200"
                  }`}>
                    <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                    {enrollMsg.text}
                  </div>
                )}

                {batch.isEnrolled ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2 py-2 text-[#20BF6B] font-black text-sm">
                      <Check size={18} /> Enrolled
                    </div>
                    <Link
                      href={`/learn/batch/${batch._id}`}
                      className="duo-btn duo-btn-green w-full py-3 text-sm flex items-center justify-center gap-2"
                    >
                      <Play size={16} /> Continue Learning
                    </Link>
                  </div>
                ) : (
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="duo-btn duo-btn-blue w-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {enrolling ? (
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    ) : (
                      <>
                        <GraduationCap size={16} />
                        {isPaid ? "Request Enrollment" : "Enroll for Free"}
                      </>
                    )}
                  </button>
                )}

                <div className="space-y-2 pt-2 border-t border-[#e5e5e5]">
                  {[
                    { icon: Play, label: `${totalLectures} video lectures` },
                    { icon: FileText, label: `${totalNotes} notes/PDFs` },
                    { icon: Dumbbell, label: `${totalDPP} DPP questions` },
                    { icon: BookOpen, label: `${batch.modules.length} modules` },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2.5 text-sm text-[#6b7280] font-semibold">
                      <Icon size={14} className="text-[#4361EE]" />
                      {label}
                    </div>
                  ))}
                  {batch.enrollmentDeadline && (
                    <div className="flex items-center gap-2.5 text-sm text-[#FF4757] font-bold">
                      <Calendar size={14} />
                      Deadline: {new Date(batch.enrollmentDeadline).toLocaleDateString("en-IN")}
                    </div>
                  )}
                </div>

                {isOwner && (
                  <Link
                    href={`/admin/batches/${batch._id}/edit`}
                    className="duo-btn duo-btn-outline w-full py-2.5 text-sm flex items-center justify-center gap-2 mt-2"
                  >
                    Manage Batch
                  </Link>
                )}
              </div>
            </div>

            {/* Tags */}
            {batch.tags.length > 0 && (
              <div className="duo-card p-4 mt-4">
                <p className="text-xs font-black text-[#9AA6B4] uppercase tracking-wider mb-2">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {batch.tags.map((tag) => (
                    <span key={tag} className="text-xs font-bold bg-[#E8ECEF] text-[#6b7280] px-2.5 py-1 rounded-xl">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
