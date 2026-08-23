"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await api.post("/auth/login", { email, password });
      
      const { token, ...userData } = response.data;
      login(userData, token);
      
      // Redirect to protected dashboard/reels
      router.push("/reels");
    } catch (err: any) {
      if (!err.response) {
        setError("Could not connect to the backend server. If using Render, it may be waking up (wait 30s) or check NEXT_PUBLIC_API_URL in Vercel.");
      } else {
        setError(err.response?.data?.message || "Invalid email or password.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] text-[#1F2328] p-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-8 w-full max-w-md relative overflow-hidden">
        
        {/* Decorative gradient blur */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#D9A441] rounded-full blur-[100px] opacity-20"></div>
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-[#26408B] rounded-full blur-[100px] opacity-15"></div>

        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold mb-2 text-center text-[#26408B]">
            Welcome Back
          </h1>
          <p className="text-gray-500 text-center mb-8">
            Sign in to continue to German with Jai
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-[#1F2328] mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#D9A441] focus:border-[#D9A441] transition-all text-[#1F2328] placeholder-gray-400"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1F2328] mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#D9A441] focus:border-[#D9A441] transition-all text-[#1F2328] placeholder-gray-400"
                placeholder="••••••••"
                required
              />
            </div>

            
            <div className="text-right -mt-2">
              <Link href="/auth/forgot" className="text-sm font-bold text-[#4361EE] hover:underline">
                Forgot password?
              </Link>
            </div>
<button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#26408B] hover:bg-[#2C3E7A] text-white font-semibold py-3 rounded-xl shadow-lg shadow-[#26408B]/20 hover:shadow-xl hover:shadow-[#26408B]/30 transition-all duration-300 mt-4 disabled:opacity-50"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-gray-500 mt-8 text-sm">
            Don't have an account?{" "}
            <Link href="/auth/signup" className="text-[#D9A441] hover:text-[#c49033] font-bold transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
