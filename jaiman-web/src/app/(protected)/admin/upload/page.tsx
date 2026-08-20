"use client";

import { useState } from "react";
import { Upload, FileVideo, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function UploadReelPage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("German");
  const [level, setLevel] = useState("A1");
  const [tags, setTags] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus("idle");
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setStatus("error");
      setMessage("Please select a video file first.");
      return;
    }

    setIsUploading(true);
    setStatus("idle");
    
    // Using FormData to send multipart/form-data
    const formData = new FormData();
    formData.append("video", file);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("language", language);
    formData.append("level", level);
    formData.append("tags", tags);

    try {
      // Fetch user token from local storage (assuming AuthContext stores it here or cookie)
      const token = localStorage.getItem("token"); // Note: Update according to auth setup
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/reels/upload`, {
        method: "POST",
        headers: {
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
          // Note: Don't set Content-Type header manually when sending FormData, fetch does it automatically with correct boundaries
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage("Reel uploaded successfully to Cloudinary!");
        setFile(null);
        setTitle("");
        setDescription("");
        setTags("");
      } else {
        throw new Error(data.message || "Failed to upload reel");
      }
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setMessage(err.message || "An unexpected error occurred during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-2rem)] flex flex-col p-4 md:p-8 overflow-y-auto">
      <div className="max-w-3xl w-full mx-auto">
        
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black text-gray-900 mb-2">Upload Reel</h1>
          <p className="text-gray-500 font-bold">Add new video content to the platform</p>
        </div>

        {/* Upload Form */}
        <form onSubmit={handleUpload} className="duo-card p-6 md:p-8 bg-white border-2 border-gray-200">
          
          {/* File Drop Zone */}
          <div className="mb-8">
            <label className="block text-sm font-black text-gray-700 uppercase tracking-widest mb-2">Video File</label>
            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:bg-gray-50 transition-colors relative">
              <input 
                type="file" 
                accept="video/mp4,video/quicktime,video/x-msvideo" 
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isUploading}
              />
              {file ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-[#E8FBF0] text-[#20BF6B] rounded-full flex items-center justify-center">
                    <FileVideo size={32} />
                  </div>
                  <div>
                    <p className="font-black text-gray-800">{file.name}</p>
                    <p className="text-sm font-bold text-gray-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                  <p className="text-xs font-bold text-[#4361EE] mt-2">Click to change file</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center group-hover:bg-[#E8FBF0] group-hover:text-[#20BF6B] transition-colors">
                    <Upload size={32} />
                  </div>
                  <div>
                    <p className="font-black text-gray-800">Drag & drop or click to upload</p>
                    <p className="text-sm font-bold text-gray-400">MP4, MOV, AVI up to 50MB</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-black text-gray-700 uppercase tracking-widest mb-2">Title</label>
              <input 
                type="text" 
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isUploading}
                placeholder="e.g., How to order coffee in Berlin"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-800 focus:outline-none focus:border-[#4361EE] focus:ring-4 focus:ring-[#4361EE]/10 transition-all"
              />
            </div>
            
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-black text-gray-700 uppercase tracking-widest mb-2">Description</label>
              <textarea 
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isUploading}
                placeholder="Brief description of the lesson..."
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-800 focus:outline-none focus:border-[#4361EE] focus:ring-4 focus:ring-[#4361EE]/10 transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-gray-700 uppercase tracking-widest mb-2">Level</label>
              <select 
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                disabled={isUploading}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-800 focus:outline-none focus:border-[#4361EE] focus:ring-4 focus:ring-[#4361EE]/10 transition-all appearance-none bg-white"
              >
                <option value="A1">A1 (Beginner)</option>
                <option value="A2">A2 (Elementary)</option>
                <option value="B1">B1 (Intermediate)</option>
                <option value="B2">B2 (Upper Intermediate)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-black text-gray-700 uppercase tracking-widest mb-2">Tags (comma separated)</label>
              <input 
                type="text" 
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                disabled={isUploading}
                placeholder="e.g., greetings, cafe, daily"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-800 focus:outline-none focus:border-[#4361EE] focus:ring-4 focus:ring-[#4361EE]/10 transition-all"
              />
            </div>
          </div>

          {/* Status Feedback */}
          <AnimatePresence>
            {status !== "idle" && (
              <motion.div 
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className={`mb-6 p-4 rounded-xl flex items-start gap-3 border-2 ${
                  status === "success" ? "bg-[#E8FBF0] border-[#20BF6B] text-[#179854]" : "bg-[#FFF0F0] border-[#FF4757] text-[#D82A3A]"
                }`}
              >
                {status === "success" ? <CheckCircle2 size={20} className="mt-0.5" /> : <AlertCircle size={20} className="mt-0.5" />}
                <p className="font-bold text-sm leading-tight">{message}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={isUploading || !file}
            className={`w-full py-4 text-lg duo-btn ${
              isUploading ? "bg-gray-300 border-gray-400 text-gray-500 cursor-not-allowed shadow-none" : "duo-btn-green"
            } flex items-center justify-center gap-2`}
          >
            {isUploading ? (
              <>
                <Loader2 size={24} className="animate-spin" />
                Uploading to Cloudinary...
              </>
            ) : (
              <>
                <Upload size={24} />
                Upload Reel
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
