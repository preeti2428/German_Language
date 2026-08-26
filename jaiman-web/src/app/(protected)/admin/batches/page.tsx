"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap, Plus, Edit, Trash2, Eye, EyeOff,
  Users, BookOpen, ChevronRight, AlertCircle, CheckCircle, ArrowLeft
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface Batch {
  _id: string; title: string; level: string; price: number;
  isPublished: boolean; enrolledStudents: string[];
  modules: { title: string }[];
  teacher: { name: string };
  createdAt: string;
}

export default function AdminBatchesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isStaff = user?.role === "admin" || user?.role === "teacher";

  useEffect(() => {
    if (!isStaff) { router.replace("/dashboard"); return; }
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      // Admin sees all; teacher sees own — backend handles this via auth
      const res = await api.get("/batches", { params: {} });
      // Show all including unpublished for staff — fetch without filter
      setBatches(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  const togglePublish = async (batch: Batch) => {
    try {
      await api.patch(`/batches/${batch._id}`, { isPublished: !batch.isPublished });
      setBatches((prev) => prev.map((b) => b._id === batch._id ? { ...b, isPublished: !b.isPublished } : b));
      showToast("success", `Batch ${!batch.isPublished ? "published" : "unpublished"}!`);
    } catch (err: any) {
      showToast("error", err.response?.data?.message ?? "Failed to update");
    }
  };

  const deleteBatch = async (id: string) => {
    if (!confirm("Delete this batch and all its modules?")) return;
    try {
      await api.delete(`/batches/${id}`);
      setBatches((prev) => prev.filter((b) => b._id !== id));
      showToast("success", "Batch deleted.");
    } catch (err: any) {
      showToast("error", err.response?.data?.message ?? "Failed to delete");
    }
  };

  const LEVEL_COLORS: Record<string, string> = {
    A1: "text-emerald-700 bg-emerald-100 border-emerald-200",
    A2: "text-teal-700 bg-teal-100 border-teal-200",
    B1: "text-blue-700 bg-blue-100 border-blue-200",
    B2: "text-indigo-700 bg-indigo-100 border-indigo-200",
    C1: "text-purple-700 bg-purple-100 border-purple-200",
    C2: "text-rose-700 bg-rose-100 border-rose-200",
  };

  return (
    <div className="min-h-screen p-6 md:p-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-lg text-sm font-black border-2 transition-all ${
          toast.type === "success" ? "bg-[#D1FAE5] text-[#059669] border-[#6EE7B7]" : "bg-[#FFE4E6] text-[#FF4757] border-[#FCA5A5]"
        }`}>
          {toast.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.text}
        </div>
      )}

      {/* Navigation & Back Bar */}
      <div className="mb-4 flex items-center gap-2">
        <Link
          href="/courses"
          className="inline-flex items-center gap-1.5 text-xs font-black text-[#E53935] bg-[#FFF5F5] border-2 border-[#FFCDD2] px-3.5 py-2 rounded-xl hover:bg-[#FFEAEA] transition-all"
        >
          <ArrowLeft size={14} /> Back to Courses
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-black text-[#555] bg-white border-2 border-[#EAEAEA] px-3.5 py-2 rounded-xl hover:bg-[#FAFAFA] transition-all"
        >
          Dashboard
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="dj-crumb">Admin Panel</p>
          <h1 className="dj-title flex items-center gap-2 mt-1">
            <GraduationCap className="text-[#4361EE]" size={28} />
            Manage Batches
          </h1>
        </div>
        <Link
          href="/admin/batches/new"
          className="duo-btn duo-btn-red px-5 py-2.5 text-sm flex items-center gap-2"
        >
          <Plus size={16} /> Create Batch
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="duo-card h-20 animate-pulse bg-gray-100" />)}
        </div>
      ) : batches.length === 0 ? (
        <div className="text-center py-20 text-[#9AA6B4]">
          <GraduationCap size={56} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-bold">No batches yet</p>
          <Link href="/admin/batches/new" className="duo-btn duo-btn-blue mt-4 px-6 py-2.5 text-sm inline-flex items-center gap-2">
            <Plus size={16} /> Create your first batch
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {batches.map((batch) => (
            <div key={batch._id} className="duo-card p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
              {/* Level badge */}
              <span className={`text-xs font-black px-3 py-1.5 rounded-xl border-2 flex-shrink-0 ${LEVEL_COLORS[batch.level] ?? "text-gray-600 bg-gray-100 border-gray-200"}`}>
                {batch.level}
              </span>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-black text-[#1F2328] text-sm">{batch.title}</p>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${batch.isPublished ? "bg-[#D1FAE5] text-[#059669]" : "bg-[#FEF3C7] text-[#D97706]"}`}>
                    {batch.isPublished ? "Published" : "Draft"}
                  </span>
                  {batch.price === 0 ? (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-[#D1FAE5] text-[#059669]">FREE</span>
                  ) : (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-[#FEF3C7] text-[#D97706]">₹{batch.price}</span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-[#9AA6B4] font-bold">
                  <span className="flex items-center gap-1"><Users size={11} /> {batch.enrolledStudents?.length ?? 0} students</span>
                  <span className="flex items-center gap-1"><BookOpen size={11} /> {batch.modules?.length ?? 0} modules</span>
                  <span>by {batch.teacher?.name}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href={`/courses/${batch._id}`}
                  className="w-8 h-8 rounded-xl bg-[#EEF1FF] flex items-center justify-center text-[#4361EE] hover:bg-[#4361EE] hover:text-white transition-colors"
                  title="Preview"
                >
                  <Eye size={14} />
                </Link>
                <button
                  onClick={() => togglePublish(batch)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${batch.isPublished ? "bg-[#FEF3C7] text-[#D97706] hover:bg-[#D97706] hover:text-white" : "bg-[#D1FAE5] text-[#059669] hover:bg-[#059669] hover:text-white"}`}
                  title={batch.isPublished ? "Unpublish" : "Publish"}
                >
                  {batch.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <Link
                  href={`/admin/batches/${batch._id}/edit`}
                  className="w-8 h-8 rounded-xl bg-[#EEF1FF] flex items-center justify-center text-[#4361EE] hover:bg-[#4361EE] hover:text-white transition-colors"
                  title="Edit"
                >
                  <Edit size={14} />
                </Link>
                <button
                  onClick={() => deleteBatch(batch._id)}
                  className="w-8 h-8 rounded-xl bg-[#FFE4E6] flex items-center justify-center text-[#FF4757] hover:bg-[#FF4757] hover:text-white transition-colors"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
                <Link
                  href={`/admin/batches/${batch._id}/edit`}
                  className="duo-btn duo-btn-blue text-xs px-3 py-2 flex items-center gap-1"
                >
                  Manage <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
