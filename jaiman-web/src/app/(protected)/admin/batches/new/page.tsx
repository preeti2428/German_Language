"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, GraduationCap, Save, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function NewBatchPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    level: "A1",
    price: "0",
    thumbnail: "",
    startDate: "",
    endDate: "",
    enrollmentDeadline: "",
    maxStudents: "",
    tags: "",
  });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Batch title is required."); return; }
    setSaving(true);
    setError("");
    try {
      const body: Record<string, any> = {
        title: form.title.trim(),
        description: form.description.trim(),
        level: form.level,
        price: Number(form.price) || 0,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      };
      if (form.thumbnail) body.thumbnail = form.thumbnail;
      if (form.startDate) body.startDate = form.startDate;
      if (form.endDate) body.endDate = form.endDate;
      if (form.enrollmentDeadline) body.enrollmentDeadline = form.enrollmentDeadline;
      if (form.maxStudents) body.maxStudents = Number(form.maxStudents);

      const res = await api.post("/batches", body);
      router.push(`/admin/batches/${res.data._id}/edit`);
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Failed to create batch.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-8 max-w-2xl">
      <Link href="/admin/batches" className="inline-flex items-center gap-1.5 text-[#9AA6B4] hover:text-[#4361EE] text-sm font-bold mb-6 transition-colors">
        <ArrowLeft size={15} /> Back to Batches
      </Link>

      <div className="mb-6">
        <p className="dj-crumb">Admin Panel</p>
        <h1 className="dj-title flex items-center gap-2 mt-1">
          <GraduationCap className="text-[#4361EE]" size={26} />
          Create New Batch
        </h1>
      </div>

      {error && (
        <div className="mb-5 p-3 rounded-2xl bg-[#FFE4E6] text-[#FF4757] border-2 border-[#FCA5A5] text-sm font-bold flex items-center gap-2">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="duo-card p-5 space-y-4">
          <h2 className="font-black text-[#1F2328] text-sm uppercase tracking-wider">Basic Info</h2>

          <div>
            <label className="block text-xs font-black text-[#6b7280] uppercase tracking-wider mb-1.5">Batch Title *</label>
            <input
              type="text" value={form.title} onChange={(e) => set("title", e.target.value)}
              placeholder="e.g., A1 German — August 2026 Batch"
              className="w-full px-4 py-3 rounded-2xl border-2 border-[#e5e5e5] bg-white text-sm font-semibold focus:outline-none focus:border-[#4361EE] transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-black text-[#6b7280] uppercase tracking-wider mb-1.5">Description</label>
            <textarea
              value={form.description} onChange={(e) => set("description", e.target.value)}
              placeholder="What will students learn in this batch?"
              rows={3}
              className="w-full px-4 py-3 rounded-2xl border-2 border-[#e5e5e5] bg-white text-sm font-semibold focus:outline-none focus:border-[#4361EE] transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-[#6b7280] uppercase tracking-wider mb-1.5">Level *</label>
              <select
                value={form.level} onChange={(e) => set("level", e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border-2 border-[#e5e5e5] bg-white text-sm font-semibold focus:outline-none focus:border-[#4361EE] transition-colors"
              >
                {["A1", "A2", "B1", "B2", "C1", "C2"].map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-[#6b7280] uppercase tracking-wider mb-1.5">Price (₹)</label>
              <input
                type="number" min="0" value={form.price} onChange={(e) => set("price", e.target.value)}
                placeholder="0 = Free"
                className="w-full px-4 py-3 rounded-2xl border-2 border-[#e5e5e5] bg-white text-sm font-semibold focus:outline-none focus:border-[#4361EE] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-[#6b7280] uppercase tracking-wider mb-1.5">Thumbnail URL</label>
            <input
              type="url" value={form.thumbnail} onChange={(e) => set("thumbnail", e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-3 rounded-2xl border-2 border-[#e5e5e5] bg-white text-sm font-semibold focus:outline-none focus:border-[#4361EE] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-[#6b7280] uppercase tracking-wider mb-1.5">Tags (comma-separated)</label>
            <input
              type="text" value={form.tags} onChange={(e) => set("tags", e.target.value)}
              placeholder="grammar, speaking, beginners"
              className="w-full px-4 py-3 rounded-2xl border-2 border-[#e5e5e5] bg-white text-sm font-semibold focus:outline-none focus:border-[#4361EE] transition-colors"
            />
          </div>
        </div>

        <div className="duo-card p-5 space-y-4">
          <h2 className="font-black text-[#1F2328] text-sm uppercase tracking-wider">Schedule</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-[#6b7280] uppercase tracking-wider mb-1.5">Start Date</label>
              <input
                type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border-2 border-[#e5e5e5] bg-white text-sm font-semibold focus:outline-none focus:border-[#4361EE] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-[#6b7280] uppercase tracking-wider mb-1.5">End Date</label>
              <input
                type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border-2 border-[#e5e5e5] bg-white text-sm font-semibold focus:outline-none focus:border-[#4361EE] transition-colors"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-[#6b7280] uppercase tracking-wider mb-1.5">Enrollment Deadline</label>
              <input
                type="date" value={form.enrollmentDeadline} onChange={(e) => set("enrollmentDeadline", e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border-2 border-[#e5e5e5] bg-white text-sm font-semibold focus:outline-none focus:border-[#4361EE] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-[#6b7280] uppercase tracking-wider mb-1.5">Max Students</label>
              <input
                type="number" min="1" value={form.maxStudents} onChange={(e) => set("maxStudents", e.target.value)}
                placeholder="Unlimited"
                className="w-full px-4 py-3 rounded-2xl border-2 border-[#e5e5e5] bg-white text-sm font-semibold focus:outline-none focus:border-[#4361EE] transition-colors"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="duo-btn duo-btn-blue w-full py-3.5 text-sm flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {saving ? (
            <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <><Save size={16} /> Create Batch & Add Modules</>
          )}
        </button>
      </form>
    </div>
  );
}
