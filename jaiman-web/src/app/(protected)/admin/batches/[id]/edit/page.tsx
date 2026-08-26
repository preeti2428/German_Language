"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Save, Plus, Trash2, Play, FileText, Dumbbell,
  ChevronDown, Eye, AlertCircle, CheckCircle, GraduationCap, Bell,
  Users
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface Lecture { title: string; videoUrl: string; duration?: number; isFree: boolean; order: number; }
interface Note { title: string; fileUrl?: string; content?: string; }
interface DPP { question: string; options: string[]; correctAnswer: string; explanation?: string; }
interface Module { _id: string; title: string; order: number; lectures: Lecture[]; notes: Note[]; dpp: DPP[]; }
interface Batch {
  _id: string; title: string; description: string; level: string;
  price: number; thumbnail?: string; isPublished: boolean;
  startDate?: string; endDate?: string; enrollmentDeadline?: string;
  maxStudents?: number; tags: string[]; modules: Module[];
  enrolledStudents: string[];
}

type Tab = "settings" | "modules" | "students" | "announce";

export default function EditBatchPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("modules");
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [openMods, setOpenMods] = useState<Set<string>>(new Set());

  // Settings form
  const [form, setForm] = useState({ title: "", description: "", level: "A1", price: "0", thumbnail: "", startDate: "", endDate: "", enrollmentDeadline: "", maxStudents: "", tags: "", isPublished: false });

  // New module form
  const [newModTitle, setNewModTitle] = useState("");
  const [addingMod, setAddingMod] = useState(false);

  // New lecture/note/dpp forms per module
  const [newLec, setNewLec] = useState<Record<string, { title: string; videoUrl: string; duration: string; isFree: boolean }>>({});
  const [newNote, setNewNote] = useState<Record<string, { title: string; fileUrl: string; content: string }>>({});
  const [newDPP, setNewDPP] = useState<Record<string, { question: string; options: string; correctAnswer: string; explanation: string }>>({});

  // Announce form
  const [annForm, setAnnForm] = useState({ title: "", body: "" });

  // Admin enroll student
  const [studentId, setStudentId] = useState("");

  useEffect(() => {
    fetchBatch();
  }, [id]);

  const fetchBatch = async () => {
    try {
      const [bRes, mRes] = await Promise.all([
        api.get(`/batches/${id}`),
        api.get(`/batches/${id}/modules`),
      ]);
      const b = bRes.data;
      setBatch({ ...b, modules: mRes.data });
      setForm({
        title: b.title ?? "", description: b.description ?? "", level: b.level ?? "A1",
        price: String(b.price ?? 0), thumbnail: b.thumbnail ?? "",
        startDate: b.startDate ? b.startDate.slice(0, 10) : "",
        endDate: b.endDate ? b.endDate.slice(0, 10) : "",
        enrollmentDeadline: b.enrollmentDeadline ? b.enrollmentDeadline.slice(0, 10) : "",
        maxStudents: b.maxStudents ? String(b.maxStudents) : "", tags: (b.tags ?? []).join(", "),
        isPublished: b.isPublished,
      });
    } catch { router.replace("/admin/batches"); }
    finally { setLoading(false); }
  };

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await api.patch(`/batches/${id}`, {
        title: form.title, description: form.description, level: form.level,
        price: Number(form.price), thumbnail: form.thumbnail, isPublished: form.isPublished,
        startDate: form.startDate || undefined, endDate: form.endDate || undefined,
        enrollmentDeadline: form.enrollmentDeadline || undefined,
        maxStudents: form.maxStudents ? Number(form.maxStudents) : undefined,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      showToast("success", "Batch settings saved!");
    } catch (err: any) { showToast("error", err.response?.data?.message ?? "Save failed."); }
    finally { setSaving(false); }
  };

  const addModule = async () => {
    if (!newModTitle.trim()) return;
    setAddingMod(true);
    try {
      const res = await api.post(`/batches/${id}/modules`, { title: newModTitle.trim(), order: (batch?.modules.length ?? 0) });
      setBatch((prev) => prev ? { ...prev, modules: [...prev.modules, res.data] } : prev);
      setNewModTitle("");
      showToast("success", "Module added!");
    } catch (err: any) { showToast("error", err.response?.data?.message ?? "Failed."); }
    finally { setAddingMod(false); }
  };

  const deleteModule = async (mid: string) => {
    if (!confirm("Delete this module and all its content?")) return;
    try {
      await api.delete(`/modules/${mid}`);
      setBatch((prev) => prev ? { ...prev, modules: prev.modules.filter((m) => m._id !== mid) } : prev);
      showToast("success", "Module deleted.");
    } catch (err: any) { showToast("error", err.response?.data?.message ?? "Failed."); }
  };

  const addLecture = async (mid: string) => {
    const lec = newLec[mid];
    if (!lec?.title || !lec?.videoUrl) { showToast("error", "Title and video URL required."); return; }
    try {
      const res = await api.post(`/modules/${mid}/lectures`, { title: lec.title, videoUrl: lec.videoUrl, duration: lec.duration ? Number(lec.duration) : undefined, isFree: lec.isFree });
      setBatch((prev) => prev ? { ...prev, modules: prev.modules.map((m) => m._id === mid ? { ...m, lectures: [...m.lectures, res.data] } : m) } : prev);
      setNewLec((p) => ({ ...p, [mid]: { title: "", videoUrl: "", duration: "", isFree: false } }));
      showToast("success", "Lecture added!");
    } catch (err: any) { showToast("error", err.response?.data?.message ?? "Failed."); }
  };

  const addNote = async (mid: string) => {
    const note = newNote[mid];
    if (!note?.title) { showToast("error", "Title required."); return; }
    try {
      const res = await api.post(`/modules/${mid}/notes`, { title: note.title, fileUrl: note.fileUrl || undefined, content: note.content || undefined });
      setBatch((prev) => prev ? { ...prev, modules: prev.modules.map((m) => m._id === mid ? { ...m, notes: [...m.notes, res.data] } : m) } : prev);
      setNewNote((p) => ({ ...p, [mid]: { title: "", fileUrl: "", content: "" } }));
      showToast("success", "Note added!");
    } catch (err: any) { showToast("error", err.response?.data?.message ?? "Failed."); }
  };

  const addDPP = async (mid: string) => {
    const dpp = newDPP[mid];
    if (!dpp?.question || !dpp?.correctAnswer) { showToast("error", "Question and correct answer required."); return; }
    try {
      const options = dpp.options.split("\n").map((o) => o.trim()).filter(Boolean);
      const res = await api.post(`/modules/${mid}/dpp`, { question: dpp.question, options, correctAnswer: dpp.correctAnswer, explanation: dpp.explanation || undefined });
      setBatch((prev) => prev ? { ...prev, modules: prev.modules.map((m) => m._id === mid ? { ...m, dpp: [...m.dpp, res.data] } : m) } : prev);
      setNewDPP((p) => ({ ...p, [mid]: { question: "", options: "", correctAnswer: "", explanation: "" } }));
      showToast("success", "DPP question added!");
    } catch (err: any) { showToast("error", err.response?.data?.message ?? "Failed."); }
  };

  const postAnnouncement = async () => {
    if (!annForm.title || !annForm.body) { showToast("error", "Title and body required."); return; }
    try {
      await api.post(`/batches/${id}/announce`, annForm);
      setAnnForm({ title: "", body: "" });
      showToast("success", "Announcement posted!");
    } catch (err: any) { showToast("error", err.response?.data?.message ?? "Failed."); }
  };

  const enrollStudent = async () => {
    if (!studentId.trim()) return;
    try {
      await api.post(`/batches/${id}/enroll-student`, { studentId: studentId.trim() });
      setStudentId("");
      showToast("success", "Student enrolled!");
    } catch (err: any) { showToast("error", err.response?.data?.message ?? "Failed."); }
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: "modules", label: "📦 Modules" },
    { key: "settings", label: "⚙️ Settings" },
    { key: "students", label: "👥 Students" },
    { key: "announce", label: "📢 Announce" },
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-4 border-[#4361EE] border-t-transparent animate-spin" />
    </div>
  );

  if (!batch) return null;

  return (
    <div className="min-h-screen p-6 md:p-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-lg text-sm font-black border-2 ${
          toast.type === "success" ? "bg-[#D1FAE5] text-[#059669] border-[#6EE7B7]" : "bg-[#FFE4E6] text-[#FF4757] border-[#FCA5A5]"
        }`}>
          {toast.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.text}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <Link href="/admin/batches" className="inline-flex items-center gap-1.5 text-[#9AA6B4] hover:text-[#4361EE] text-sm font-bold mb-3 transition-colors">
            <ArrowLeft size={14} /> Back
          </Link>
          <h1 className="dj-title flex items-center gap-2">
            <GraduationCap className="text-[#4361EE]" size={24} /> {batch.title}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-black text-[#9AA6B4] uppercase">{batch.level}</span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${batch.isPublished ? "bg-[#D1FAE5] text-[#059669]" : "bg-[#FEF3C7] text-[#D97706]"}`}>
              {batch.isPublished ? "Published" : "Draft"}
            </span>
          </div>
        </div>
        <Link href={`/courses/${id}`} className="duo-btn duo-btn-outline text-xs px-4 py-2 flex items-center gap-1.5">
          <Eye size={13} /> Preview
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b-2 border-[#e5e5e5] flex-wrap">
        {TABS.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-black transition-all border-b-2 -mb-[2px] ${activeTab === tab.key ? "border-[#4361EE] text-[#4361EE]" : "border-transparent text-[#9AA6B4] hover:text-[#6b7280]"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── MODULES TAB ── */}
      {activeTab === "modules" && (
        <div className="max-w-3xl space-y-4">
          {/* Add module */}
          <div className="duo-card p-4 flex gap-3">
            <input
              type="text" value={newModTitle} onChange={(e) => setNewModTitle(e.target.value)}
              placeholder="New module title (e.g., Week 1: Greetings)"
              className="flex-1 px-4 py-2.5 rounded-2xl border-2 border-[#e5e5e5] text-sm font-semibold focus:outline-none focus:border-[#4361EE] transition-colors"
              onKeyDown={(e) => e.key === "Enter" && addModule()}
            />
            <button onClick={addModule} disabled={addingMod || !newModTitle.trim()}
              className="duo-btn duo-btn-blue text-sm px-4 py-2.5 flex items-center gap-1.5 disabled:opacity-50">
              <Plus size={15} /> Add Module
            </button>
          </div>

          {/* Modules list */}
          {batch.modules.length === 0 ? (
            <div className="text-center py-10 text-[#9AA6B4]">
              <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-bold">No modules yet — add one above</p>
            </div>
          ) : (
            batch.modules.map((mod, modIdx) => {
              const isOpen = openMods.has(mod._id);
              const lecForm = newLec[mod._id] ?? { title: "", videoUrl: "", duration: "", isFree: false };
              const noteForm = newNote[mod._id] ?? { title: "", fileUrl: "", content: "" };
              const dppForm = newDPP[mod._id] ?? { question: "", options: "", correctAnswer: "", explanation: "" };

              return (
                <div key={mod._id} className="duo-card overflow-hidden">
                  <div className="flex items-center gap-3 p-4">
                    <button onClick={() => setOpenMods((p) => { const n = new Set(p); n.has(mod._id) ? n.delete(mod._id) : n.add(mod._id); return n; })}
                      className="flex items-center gap-3 flex-1 text-left hover:opacity-80 transition-opacity">
                      <span className="w-7 h-7 rounded-xl bg-[#EEF1FF] text-[#4361EE] font-black text-sm flex items-center justify-center flex-shrink-0">{modIdx + 1}</span>
                      <div>
                        <p className="font-black text-[#1F2328] text-sm">{mod.title}</p>
                        <p className="text-[#9AA6B4] text-xs font-bold">{mod.lectures.length}L · {mod.notes.length}N · {mod.dpp.length}DPP</p>
                      </div>
                      <ChevronDown size={16} className={`text-[#9AA6B4] ml-auto transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    <button onClick={() => deleteModule(mod._id)} className="w-7 h-7 rounded-xl bg-[#FFE4E6] flex items-center justify-center text-[#FF4757] hover:bg-[#FF4757] hover:text-white transition-colors flex-shrink-0">
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {isOpen && (
                    <div className="border-t-2 border-[#e5e5e5] p-4 space-y-6">

                      {/* ─ Lectures ─ */}
                      <div>
                        <p className="text-xs font-black text-[#4361EE] uppercase tracking-wider mb-3 flex items-center gap-1.5"><Play size={12} /> Lectures</p>
                        {mod.lectures.map((lec, li) => (
                          <div key={li} className="flex items-center gap-2 py-2 border-b border-[#f0f0f0] last:border-0">
                            <Play size={12} className="text-[#9AA6B4] flex-shrink-0" />
                            <span className="text-sm font-semibold flex-1">{lec.title}</span>
                            {lec.isFree && <span className="text-[10px] font-black text-[#20BF6B] bg-[#D1FAE5] px-2 py-0.5 rounded-lg">Preview</span>}
                            {lec.duration && <span className="text-xs text-[#9AA6B4] font-bold">{lec.duration}m</span>}
                          </div>
                        ))}
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <input type="text" placeholder="Lecture title" value={lecForm.title}
                            onChange={(e) => setNewLec((p) => ({ ...p, [mod._id]: { ...lecForm, title: e.target.value } }))}
                            className="col-span-2 px-3 py-2 rounded-xl border-2 border-[#e5e5e5] text-xs font-semibold focus:outline-none focus:border-[#4361EE]" />
                          <input type="url" placeholder="Video URL (YouTube/direct)" value={lecForm.videoUrl}
                            onChange={(e) => setNewLec((p) => ({ ...p, [mod._id]: { ...lecForm, videoUrl: e.target.value } }))}
                            className="col-span-2 px-3 py-2 rounded-xl border-2 border-[#e5e5e5] text-xs font-semibold focus:outline-none focus:border-[#4361EE]" />
                          <input type="number" placeholder="Duration (min)" value={lecForm.duration}
                            onChange={(e) => setNewLec((p) => ({ ...p, [mod._id]: { ...lecForm, duration: e.target.value } }))}
                            className="px-3 py-2 rounded-xl border-2 border-[#e5e5e5] text-xs font-semibold focus:outline-none focus:border-[#4361EE]" />
                          <label className="flex items-center gap-2 text-xs font-bold text-[#6b7280] cursor-pointer">
                            <input type="checkbox" checked={lecForm.isFree} onChange={(e) => setNewLec((p) => ({ ...p, [mod._id]: { ...lecForm, isFree: e.target.checked } }))} className="rounded" />
                            Free preview
                          </label>
                        </div>
                        <button onClick={() => addLecture(mod._id)} className="mt-2 duo-btn duo-btn-blue text-xs px-3 py-2 flex items-center gap-1.5">
                          <Plus size={12} /> Add Lecture
                        </button>
                      </div>

                      {/* ─ Notes ─ */}
                      <div>
                        <p className="text-xs font-black text-[#F7B731] uppercase tracking-wider mb-3 flex items-center gap-1.5"><FileText size={12} /> Notes</p>
                        {mod.notes.map((note, ni) => (
                          <div key={ni} className="flex items-center gap-2 py-2 border-b border-[#f0f0f0] last:border-0">
                            <FileText size={12} className="text-[#9AA6B4] flex-shrink-0" />
                            <span className="text-sm font-semibold flex-1">{note.title}</span>
                            {note.fileUrl && <a href={note.fileUrl} target="_blank" className="text-[10px] text-[#4361EE] font-black">PDF</a>}
                          </div>
                        ))}
                        <div className="mt-3 space-y-2">
                          <input type="text" placeholder="Note title" value={noteForm.title}
                            onChange={(e) => setNewNote((p) => ({ ...p, [mod._id]: { ...noteForm, title: e.target.value } }))}
                            className="w-full px-3 py-2 rounded-xl border-2 border-[#e5e5e5] text-xs font-semibold focus:outline-none focus:border-[#4361EE]" />
                          <input type="url" placeholder="PDF URL (optional)" value={noteForm.fileUrl}
                            onChange={(e) => setNewNote((p) => ({ ...p, [mod._id]: { ...noteForm, fileUrl: e.target.value } }))}
                            className="w-full px-3 py-2 rounded-xl border-2 border-[#e5e5e5] text-xs font-semibold focus:outline-none focus:border-[#4361EE]" />
                          <textarea placeholder="Text content (optional)" value={noteForm.content} rows={3}
                            onChange={(e) => setNewNote((p) => ({ ...p, [mod._id]: { ...noteForm, content: e.target.value } }))}
                            className="w-full px-3 py-2 rounded-xl border-2 border-[#e5e5e5] text-xs font-semibold focus:outline-none focus:border-[#4361EE] resize-none" />
                        </div>
                        <button onClick={() => addNote(mod._id)} className="mt-2 duo-btn text-xs px-3 py-2 flex items-center gap-1.5 bg-[#FEF3C7] text-[#D97706] border-[#FDE68A] border-2 border-b-[4px] hover:brightness-95">
                          <Plus size={12} /> Add Note
                        </button>
                      </div>

                      {/* ─ DPP ─ */}
                      <div>
                        <p className="text-xs font-black text-[#FF4757] uppercase tracking-wider mb-3 flex items-center gap-1.5"><Dumbbell size={12} /> DPP Questions</p>
                        {mod.dpp.map((q, qi) => (
                          <div key={qi} className="py-2 border-b border-[#f0f0f0] last:border-0">
                            <p className="text-sm font-semibold text-[#1F2328]"><span className="text-[#FF4757] font-black">Q{qi + 1}.</span> {q.question}</p>
                            <p className="text-xs text-[#20BF6B] font-bold mt-0.5">✓ {q.correctAnswer}</p>
                          </div>
                        ))}
                        <div className="mt-3 space-y-2">
                          <textarea placeholder="Question" value={dppForm.question} rows={2}
                            onChange={(e) => setNewDPP((p) => ({ ...p, [mod._id]: { ...dppForm, question: e.target.value } }))}
                            className="w-full px-3 py-2 rounded-xl border-2 border-[#e5e5e5] text-xs font-semibold focus:outline-none focus:border-[#FF4757] resize-none" />
                          <textarea placeholder={"Options (one per line):\nOption A\nOption B\nOption C\nOption D"} value={dppForm.options} rows={4}
                            onChange={(e) => setNewDPP((p) => ({ ...p, [mod._id]: { ...dppForm, options: e.target.value } }))}
                            className="w-full px-3 py-2 rounded-xl border-2 border-[#e5e5e5] text-xs font-semibold focus:outline-none focus:border-[#FF4757] resize-none" />
                          <input type="text" placeholder="Correct answer (exact match)" value={dppForm.correctAnswer}
                            onChange={(e) => setNewDPP((p) => ({ ...p, [mod._id]: { ...dppForm, correctAnswer: e.target.value } }))}
                            className="w-full px-3 py-2 rounded-xl border-2 border-[#e5e5e5] text-xs font-semibold focus:outline-none focus:border-[#FF4757]" />
                          <input type="text" placeholder="Explanation (optional)" value={dppForm.explanation}
                            onChange={(e) => setNewDPP((p) => ({ ...p, [mod._id]: { ...dppForm, explanation: e.target.value } }))}
                            className="w-full px-3 py-2 rounded-xl border-2 border-[#e5e5e5] text-xs font-semibold focus:outline-none focus:border-[#FF4757]" />
                        </div>
                        <button onClick={() => addDPP(mod._id)} className="mt-2 duo-btn text-xs px-3 py-2 flex items-center gap-1.5 bg-[#FFE4E6] text-[#FF4757] border-[#FCA5A5] border-2 border-b-[4px] hover:brightness-95">
                          <Plus size={12} /> Add DPP Question
                        </button>
                      </div>

                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── SETTINGS TAB ── */}
      {activeTab === "settings" && (
        <div className="max-w-2xl space-y-5">
          <div className="duo-card p-5 space-y-4">
            <h2 className="font-black text-sm uppercase tracking-wider text-[#1F2328]">Basic Info</h2>
            {[
              { label: "Title", key: "title", type: "text", placeholder: "Batch title" },
              { label: "Thumbnail URL", key: "thumbnail", type: "url", placeholder: "https://..." },
              { label: "Tags (comma-separated)", key: "tags", type: "text", placeholder: "grammar, speaking" },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-black text-[#6b7280] uppercase tracking-wider mb-1.5">{label}</label>
                <input type={type} value={(form as any)[key]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-[#e5e5e5] text-sm font-semibold focus:outline-none focus:border-[#4361EE]" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-black text-[#6b7280] uppercase tracking-wider mb-1.5">Description</label>
              <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3}
                className="w-full px-4 py-3 rounded-2xl border-2 border-[#e5e5e5] text-sm font-semibold focus:outline-none focus:border-[#4361EE] resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-[#6b7280] uppercase tracking-wider mb-1.5">Level</label>
                <select value={form.level} onChange={(e) => setForm((p) => ({ ...p, level: e.target.value }))}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-[#e5e5e5] text-sm font-semibold focus:outline-none focus:border-[#4361EE]">
                  {["A1", "A2", "B1", "B2", "C1", "C2"].map((l) => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-[#6b7280] uppercase tracking-wider mb-1.5">Price (₹)</label>
                <input type="number" min="0" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-[#e5e5e5] text-sm font-semibold focus:outline-none focus:border-[#4361EE]" />
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <div className={`w-12 h-6 rounded-full transition-colors ${form.isPublished ? "bg-[#20BF6B]" : "bg-[#e5e5e5]"} relative`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form.isPublished ? "left-7" : "left-1"}`} />
              </div>
              <input type="checkbox" className="hidden" checked={form.isPublished} onChange={(e) => setForm((p) => ({ ...p, isPublished: e.target.checked }))} />
              <span className="text-sm font-black text-[#1F2328]">Published (visible to students)</span>
            </label>
          </div>

          <div className="duo-card p-5 space-y-4">
            <h2 className="font-black text-sm uppercase tracking-wider text-[#1F2328]">Schedule</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Start Date", key: "startDate" },
                { label: "End Date", key: "endDate" },
                { label: "Enrollment Deadline", key: "enrollmentDeadline" },
                { label: "Max Students", key: "maxStudents" },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-xs font-black text-[#6b7280] uppercase tracking-wider mb-1.5">{label}</label>
                  <input type={key === "maxStudents" ? "number" : "date"} value={(form as any)[key]}
                    onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-[#e5e5e5] text-sm font-semibold focus:outline-none focus:border-[#4361EE]" />
                </div>
              ))}
            </div>
          </div>

          <button onClick={saveSettings} disabled={saving}
            className="duo-btn duo-btn-blue w-full py-3.5 text-sm flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <><Save size={16} /> Save Settings</>}
          </button>
        </div>
      )}

      {/* ── STUDENTS TAB ── */}
      {activeTab === "students" && (
        <div className="max-w-2xl">
          <div className="duo-card p-5 mb-5">
            <p className="font-black text-[#1F2328] mb-3 flex items-center gap-2"><Users size={16} className="text-[#4361EE]" /> Manually Enroll a Student</p>
            <div className="flex gap-3">
              <input type="text" value={studentId} onChange={(e) => setStudentId(e.target.value)}
                placeholder="Student's MongoDB _id"
                className="flex-1 px-4 py-2.5 rounded-2xl border-2 border-[#e5e5e5] text-sm font-semibold focus:outline-none focus:border-[#4361EE]" />
              <button onClick={enrollStudent} className="duo-btn duo-btn-blue text-sm px-4 py-2.5">Enroll</button>
            </div>
          </div>
          <div className="duo-card p-5">
            <p className="font-black text-[#1F2328] mb-3">{batch.enrolledStudents?.length ?? 0} Enrolled Students</p>
            {batch.enrolledStudents?.length === 0 ? (
              <p className="text-[#9AA6B4] text-sm font-bold">No students enrolled yet.</p>
            ) : (
              <div className="space-y-2">
                {batch.enrolledStudents.map((sid, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-[#f0f0f0] last:border-0">
                    <div className="w-7 h-7 rounded-full bg-[#EEF1FF] flex items-center justify-center text-[#4361EE] font-black text-xs">{i + 1}</div>
                    <span className="text-sm font-mono text-[#6b7280] flex-1 truncate">{sid}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ANNOUNCE TAB ── */}
      {activeTab === "announce" && (
        <div className="max-w-2xl">
          <div className="duo-card p-5 space-y-3">
            <p className="font-black text-[#1F2328] flex items-center gap-2"><Bell size={16} className="text-[#4361EE]" /> Post Announcement</p>
            <input type="text" value={annForm.title} onChange={(e) => setAnnForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Announcement title"
              className="w-full px-4 py-3 rounded-2xl border-2 border-[#e5e5e5] text-sm font-semibold focus:outline-none focus:border-[#4361EE]" />
            <textarea value={annForm.body} onChange={(e) => setAnnForm((p) => ({ ...p, body: e.target.value }))}
              placeholder="Announcement message..." rows={4}
              className="w-full px-4 py-3 rounded-2xl border-2 border-[#e5e5e5] text-sm font-semibold focus:outline-none focus:border-[#4361EE] resize-none" />
            <button onClick={postAnnouncement} className="duo-btn duo-btn-blue text-sm px-5 py-2.5 flex items-center gap-2">
              <Bell size={14} /> Post Announcement
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const BookOpen = ({ size, className }: { size: number; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);
