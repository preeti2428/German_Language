"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Play, FileText, Dumbbell, ChevronDown, ArrowLeft, Check,
  Lock, BookOpen, ChevronRight, X, AlertCircle
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface Lecture { title: string; videoUrl: string; duration?: number; isFree: boolean; order: number; }
interface Note { title: string; fileUrl?: string; content?: string; }
interface DPPQuestion { question: string; options: string[]; correctAnswer: string; explanation?: string; }
interface Module { _id: string; title: string; order: number; lectures: Lecture[]; notes: Note[]; dpp: DPPQuestion[]; }
interface Batch { _id: string; title: string; level: string; teacher: { name: string }; modules: Module[]; isEnrolled?: boolean; }

type ActiveContent =
  | { type: "lecture"; modIdx: number; lecIdx: number }
  | { type: "note"; modIdx: number; noteIdx: number }
  | { type: "dpp"; modIdx: number }
  | null;

export default function BatchLearnPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [openMods, setOpenMods] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<ActiveContent>(null);
  const [dppAnswers, setDppAnswers] = useState<Record<number, string>>({});
  const [dppSubmitted, setDppSubmitted] = useState(false);

  useEffect(() => {
    const fetchBatch = async () => {
      try {
        const res = await api.get(`/batches/${id}`);
        const data: Batch = res.data;
        // Let non-enrolled users view free preview content
        setBatch(data);
        
        // Find first accessible content
        if (data.modules.length > 0) {
          setOpenMods(new Set([data.modules[0]._id]));
          const firstFreeLec = data.modules[0].lectures.findIndex(l => data.isEnrolled || l.isFree);
          if (firstFreeLec !== -1) {
            setActive({ type: "lecture", modIdx: 0, lecIdx: firstFreeLec });
          }
        }
      } catch {
        router.replace("/courses");
      } finally {
        setLoading(false);
      }
    };
    fetchBatch();
  }, [id]);

  const toggleMod = (mid: string) =>
    setOpenMods((prev) => { const n = new Set(prev); n.has(mid) ? n.delete(mid) : n.add(mid); return n; });

  const getYouTubeEmbed = (url: string) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
    ];
    for (const p of patterns) {
      const m = url.match(p);
      if (m) return `https://www.youtube.com/embed/${m[1]}?rel=0&modestbranding=1`;
    }
    return url;
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-4 border-[#4361EE] border-t-transparent animate-spin" />
    </div>
  );

  if (!batch) return null;

  const activeModule = active ? batch.modules[active.modIdx] : null;

  // DPP score
  const dppQuestions = activeModule?.dpp ?? [];
  const dppScore = dppSubmitted
    ? dppQuestions.filter((q, i) => dppAnswers[i] === q.correctAnswer).length
    : 0;

  return (
    <div className="flex h-screen bg-[#E8ECEF] overflow-hidden">
      {/* ── LEFT SIDEBAR ── */}
      <aside className="w-[300px] flex-shrink-0 bg-[#1B2A4A] flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#2A3F6C]">
          <Link href={`/courses/${batch._id}`} className="flex items-center gap-1.5 text-[#8E9FBE] hover:text-white text-xs font-bold mb-3 transition-colors">
            <ArrowLeft size={13} /> Back to Batch
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#4361EE] flex items-center justify-center text-white flex-shrink-0">
              <BookOpen size={15} />
            </div>
            <div className="overflow-hidden">
              <p className="text-white font-black text-sm truncate">{batch.title}</p>
              <p className="text-[#8E9FBE] text-[10px] font-bold">by {batch.teacher?.name}</p>
            </div>
          </div>
        </div>

        {/* Module list */}
        <div className="flex-1 overflow-y-auto hide-scrollbar py-2">
          {batch.modules.map((mod, modIdx) => {
            const isOpen = openMods.has(mod._id);
            return (
              <div key={mod._id}>
                {/* Module header */}
                <button
                  onClick={() => toggleMod(mod._id)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#2A3F6C]/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-[#2A3F6C] text-[#4361EE] font-black text-[11px] flex items-center justify-center flex-shrink-0">
                      {modIdx + 1}
                    </span>
                    <span className="text-white/90 font-bold text-xs truncate">{mod.title}</span>
                  </div>
                  <ChevronDown size={13} className={`text-[#8E9FBE] flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {isOpen && (
                  <div className="pb-1">
                    {/* Lectures */}
                    {mod.lectures.map((lec, lecIdx) => {
                      const isActiveItem = active?.type === "lecture" && active.modIdx === modIdx && active.lecIdx === lecIdx;
                      const isLocked = !batch.isEnrolled && !lec.isFree;
                      return (
                        <button
                          key={lecIdx}
                          disabled={isLocked}
                          onClick={() => { setActive({ type: "lecture", modIdx, lecIdx }); setDppAnswers({}); setDppSubmitted(false); }}
                          className={`w-full flex items-center gap-2.5 pl-10 pr-4 py-2.5 text-left transition-colors ${isActiveItem ? "bg-[#4361EE]/20 border-l-2 border-[#4361EE]" : "border-l-2 border-transparent"} ${isLocked ? "opacity-50 cursor-not-allowed" : "hover:bg-[#2A3F6C]/40"}`}
                        >
                          {isLocked ? <Lock size={12} className="text-[#8E9FBE]" /> : <Play size={12} className={isActiveItem ? "text-[#4361EE]" : "text-[#8E9FBE]"} />}
                          <span className={`text-xs font-semibold truncate flex-1 ${isActiveItem ? "text-[#4361EE]" : "text-[#8E9FBE] hover:text-white"}`}>
                            {lec.title}
                          </span>
                          {!batch.isEnrolled && lec.isFree && <span className="text-[10px] font-black text-[#20BF6B] bg-[#20BF6B]/20 px-1.5 py-0.5 rounded">Preview</span>}
                          {lec.duration && <span className="text-[#8E9FBE] text-[10px] font-bold flex-shrink-0">{lec.duration}m</span>}
                        </button>
                      );
                    })}
                    {/* Notes */}
                    {mod.notes.map((note, noteIdx) => {
                      const isActiveItem = active?.type === "note" && active.modIdx === modIdx && active.noteIdx === noteIdx;
                      const isLocked = !batch.isEnrolled;
                      return (
                        <button
                          key={noteIdx}
                          disabled={isLocked}
                          onClick={() => { setActive({ type: "note", modIdx, noteIdx }); setDppAnswers({}); setDppSubmitted(false); }}
                          className={`w-full flex items-center gap-2.5 pl-10 pr-4 py-2.5 text-left transition-colors ${isActiveItem ? "bg-[#F7B731]/20 border-l-2 border-[#F7B731]" : "border-l-2 border-transparent"} ${isLocked ? "opacity-50 cursor-not-allowed" : "hover:bg-[#2A3F6C]/40"}`}
                        >
                          {isLocked ? <Lock size={12} className="text-[#8E9FBE]" /> : <FileText size={12} className={isActiveItem ? "text-[#F7B731]" : "text-[#8E9FBE]"} />}
                          <span className={`text-xs font-semibold truncate flex-1 ${isActiveItem ? "text-[#F7B731]" : "text-[#8E9FBE] hover:text-white"}`}>
                            📄 {note.title}
                          </span>
                        </button>
                      );
                    })}
                    {/* DPP */}
                    {mod.dpp.length > 0 && (() => {
                      const isLocked = !batch.isEnrolled;
                      return (
                        <button
                          disabled={isLocked}
                          onClick={() => { setActive({ type: "dpp", modIdx }); setDppAnswers({}); setDppSubmitted(false); }}
                          className={`w-full flex items-center gap-2.5 pl-10 pr-4 py-2.5 text-left transition-colors ${active?.type === "dpp" && active.modIdx === modIdx ? "bg-[#FF4757]/20 border-l-2 border-[#FF4757]" : "border-l-2 border-transparent"} ${isLocked ? "opacity-50 cursor-not-allowed" : "hover:bg-[#2A3F6C]/40"}`}
                        >
                          {isLocked ? <Lock size={12} className="text-[#8E9FBE]" /> : <Dumbbell size={12} className={active?.type === "dpp" && active.modIdx === modIdx ? "text-[#FF4757]" : "text-[#8E9FBE]"} />}
                          <span className={`text-xs font-semibold truncate flex-1 ${active?.type === "dpp" && active.modIdx === modIdx ? "text-[#FF4757]" : "text-[#8E9FBE] hover:text-white"}`}>
                            🏋️ DPP · {mod.dpp.length} Qs
                          </span>
                        </button>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 overflow-y-auto">
        {/* Lecture View */}
        {active?.type === "lecture" && (() => {
          const lec = batch.modules[active.modIdx]?.lectures[active.lecIdx];
          if (!lec) return null;
          const embedUrl = getYouTubeEmbed(lec.videoUrl);
          return (
            <div>
              {/* Video Player */}
              <div className="bg-black w-full aspect-video max-h-[60vh]">
                {lec.videoUrl.includes("youtube") || lec.videoUrl.includes("youtu.be") ? (
                  <iframe
                    src={embedUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video src={lec.videoUrl} controls className="w-full h-full" />
                )}
              </div>
              <div className="p-6 md:p-8 max-w-3xl">
                <p className="text-[#9AA6B4] text-xs font-bold uppercase tracking-wider mb-1">
                  Module {active.modIdx + 1} · Lecture {active.lecIdx + 1}
                </p>
                <h2 className="text-2xl font-black text-[#1F2328] mb-3">{lec.title}</h2>
                {lec.duration && (
                  <p className="text-[#6b7280] text-sm font-bold flex items-center gap-1.5">
                    <Play size={14} /> {lec.duration} minutes
                  </p>
                )}
                {/* Next lecture */}
                {(() => {
                  const mod = batch.modules[active.modIdx];
                  const nextLec = mod.lectures[active.lecIdx + 1];
                  const nextMod = batch.modules[active.modIdx + 1];
                  const target = nextLec
                    ? { label: nextLec.title, action: () => setActive({ type: "lecture", modIdx: active.modIdx, lecIdx: active.lecIdx + 1 }) }
                    : nextMod?.lectures[0]
                    ? { label: nextMod.lectures[0].title, action: () => setActive({ type: "lecture", modIdx: active.modIdx + 1, lecIdx: 0 }) }
                    : null;
                  return target ? (
                    <div className="mt-6 duo-card p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-[#9AA6B4] uppercase tracking-wider">Up Next</p>
                        <p className="font-black text-[#1F2328] text-sm mt-0.5">{target.label}</p>
                      </div>
                      <button onClick={target.action} className="duo-btn duo-btn-blue text-xs px-4 py-2 flex items-center gap-1.5">
                        Next <ChevronRight size={14} />
                      </button>
                    </div>
                  ) : null;
                })()}
              </div>
            </div>
          );
        })()}

        {/* Note View */}
        {active?.type === "note" && (() => {
          const note = batch.modules[active.modIdx]?.notes[active.noteIdx];
          if (!note) return null;
          return (
            <div className="p-6 md:p-8 max-w-3xl">
              <p className="text-[#9AA6B4] text-xs font-bold uppercase tracking-wider mb-2">Notes</p>
              <h2 className="text-2xl font-black text-[#1F2328] mb-5">{note.title}</h2>
              {note.fileUrl && (
                <a href={note.fileUrl} target="_blank" rel="noopener noreferrer"
                  className="duo-btn duo-btn-blue inline-flex items-center gap-2 px-5 py-2.5 text-sm mb-6">
                  <FileText size={15} /> Download PDF
                </a>
              )}
              {note.content ? (
                <div className="duo-card p-6 prose prose-sm max-w-none text-[#1F2328]">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{note.content}</pre>
                </div>
              ) : (
                <div className="duo-card p-6 text-center text-[#9AA6B4]">
                  <FileText size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="font-bold">Download the PDF above to view notes</p>
                </div>
              )}
            </div>
          );
        })()}

        {/* DPP View */}
        {active?.type === "dpp" && (() => {
          const mod = batch.modules[active.modIdx];
          const questions = mod?.dpp ?? [];
          if (questions.length === 0) return (
            <div className="p-8 text-center text-[#9AA6B4]">
              <Dumbbell size={48} className="mx-auto mb-3 opacity-30" />
              <p className="font-bold">No DPP questions in this module</p>
            </div>
          );

          return (
            <div className="p-6 md:p-8 max-w-3xl">
              <p className="text-[#9AA6B4] text-xs font-bold uppercase tracking-wider mb-1">Daily Practice Problems</p>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-[#1F2328]">
                  🏋️ {mod.title} — DPP
                </h2>
                {dppSubmitted && (
                  <div className="dj-chip" style={{ borderColor: "#D1FAE5", color: "#059669" }}>
                    <Check size={14} /> {dppScore}/{questions.length}
                  </div>
                )}
              </div>

              <div className="space-y-5">
                {questions.map((q, qi) => {
                  const answered = dppAnswers[qi];
                  const isCorrect = answered === q.correctAnswer;
                  return (
                    <div key={qi} className="duo-card p-5">
                      <p className="font-black text-[#1F2328] mb-4">
                        <span className="text-[#4361EE] mr-2">Q{qi + 1}.</span>{q.question}
                      </p>
                      <div className="space-y-2">
                        {q.options.map((opt, oi) => {
                          let optStyle = "border-2 border-[#e5e5e5] bg-white hover:border-[#4361EE] hover:bg-[#EEF1FF]";
                          if (dppSubmitted) {
                            if (opt === q.correctAnswer) optStyle = "border-2 border-[#20BF6B] bg-[#D1FAE5]";
                            else if (opt === answered) optStyle = "border-2 border-[#FF4757] bg-[#FFE4E6]";
                            else optStyle = "border-2 border-[#e5e5e5] bg-white opacity-50";
                          } else if (answered === opt) {
                            optStyle = "border-2 border-[#4361EE] bg-[#EEF1FF]";
                          }
                          return (
                            <button
                              key={oi}
                              disabled={dppSubmitted}
                              onClick={() => setDppAnswers((prev) => ({ ...prev, [qi]: opt }))}
                              className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${optStyle}`}
                            >
                              <span className="font-black text-[#9AA6B4] mr-2">{String.fromCharCode(65 + oi)}.</span>
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                      {dppSubmitted && q.explanation && (
                        <div className={`mt-3 p-3 rounded-xl text-xs font-semibold flex items-start gap-2 ${isCorrect ? "bg-[#D1FAE5] text-[#059669]" : "bg-[#FFE4E6] text-[#FF4757]"}`}>
                          <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                          <span><strong>Explanation:</strong> {q.explanation}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {!dppSubmitted ? (
                <button
                  onClick={() => setDppSubmitted(true)}
                  disabled={Object.keys(dppAnswers).length < questions.length}
                  className="duo-btn duo-btn-blue mt-6 w-full py-3 text-sm disabled:opacity-50"
                >
                  Submit DPP ({Object.keys(dppAnswers).length}/{questions.length} answered)
                </button>
              ) : (
                <div className="mt-6 duo-card p-5 text-center">
                  <p className="text-3xl font-black text-[#4361EE] mb-1">{dppScore}/{questions.length}</p>
                  <p className="text-[#6b7280] font-bold text-sm">
                    {dppScore === questions.length ? "🎉 Perfect score!" : dppScore >= questions.length / 2 ? "👍 Good effort!" : "💪 Keep practicing!"}
                  </p>
                  <button
                    onClick={() => { setDppAnswers({}); setDppSubmitted(false); }}
                    className="duo-btn duo-btn-outline mt-3 px-5 py-2 text-sm"
                  >
                    Retry DPP
                  </button>
                </div>
              )}
            </div>
          );
        })()}

        {/* Empty state */}
        {!active && (
          <div className="h-full flex flex-col items-center justify-center text-[#9AA6B4] p-8">
            <BookOpen size={56} className="mb-4 opacity-30" />
            <p className="text-lg font-black">Select a lecture to start learning</p>
            <p className="text-sm mt-1">Choose from the modules on the left</p>
          </div>
        )}
      </main>
    </div>
  );
}
