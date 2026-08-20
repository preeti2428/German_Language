import Link from "next/link";
import { BookOpen, Play, TrendingUp, Users } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1F2328]">
      
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-[#26408B] text-white p-2 rounded-xl shadow-md">
            <BookOpen size={24} />
          </div>
          <span className="text-2xl font-extrabold text-[#26408B]">
            German with Jai
          </span>
        </div>
        <div className="hidden md:flex space-x-8 text-sm font-semibold">
          <a href="#features" className="hover:text-[#D9A441] transition-colors">Features</a>
          <a href="#method" className="hover:text-[#D9A441] transition-colors">Methodology</a>
          <a href="#classes" className="hover:text-[#D9A441] transition-colors">Live Classes</a>
        </div>
        <div className="flex gap-4">
          <Link 
            href="/auth/login" 
            className="px-5 py-2.5 font-bold text-[#26408B] hover:bg-[#26408B]/10 rounded-xl transition-colors"
          >
            Log In
          </Link>
          <Link 
            href="/onboarding" 
            className="px-5 py-2.5 font-bold bg-[#D9A441] hover:bg-[#c49033] text-white rounded-xl shadow-lg shadow-[#D9A441]/20 transition-all"
          >
            Start Learning
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-20 md:py-32 flex flex-col md:flex-row items-center gap-12">
        <div className="md:w-1/2 space-y-8 relative z-10">
          <div className="inline-block px-4 py-2 bg-[#26408B]/10 rounded-full text-[#26408B] font-bold text-sm tracking-wide">
            🏆 The #1 Way to Master German
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight text-[#1F2328]">
            Fluency through <span className="text-[#26408B]">Immersion</span>, <br/> not textbooks.
          </h1>
          <p className="text-lg text-gray-500 max-w-lg leading-relaxed">
            Master German organically with bite-sized video reels, gamified progress tracking, and interactive live classes led by Jai.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link 
              href="/onboarding" 
              className="px-8 py-4 text-lg font-bold bg-[#26408B] hover:bg-[#2C3E7A] text-white rounded-2xl shadow-xl shadow-[#26408B]/20 transition-all text-center flex justify-center items-center gap-2"
            >
              Start for free <TrendingUp size={20} />
            </Link>
            <Link 
              href="#features" 
              className="px-8 py-4 text-lg font-bold bg-white text-[#1F2328] border border-gray-200 hover:border-gray-300 rounded-2xl shadow-sm transition-all text-center"
            >
              How it works
            </Link>
          </div>
        </div>

        <div className="md:w-1/2 relative flex justify-center">
          {/* Decorative shapes */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-[#26408B]/20 to-[#D9A441]/20 rounded-full blur-3xl -z-10 animate-pulse"></div>
          
          {/* Mock Phone UI */}
          <div className="w-[300px] h-[600px] bg-white/80 backdrop-blur-xl rounded-[3rem] border-[8px] border-[#1F2328] shadow-[0_20px_50px_rgba(38,64,139,0.2)] overflow-hidden relative flex flex-col justify-center items-center animate-float">
            {/* Reel Mock inside Phone */}
            <div className="w-full h-[90%] bg-[#FAF9F6]/50 backdrop-blur-md border-y border-gray-100/50 flex flex-col justify-center items-center p-6 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#26408B]/10 rounded-full blur-[40px]"></div>
              <span className="px-3 py-1 bg-[#D9A441]/20 text-[#D9A441] rounded-full text-[10px] font-bold uppercase tracking-wider self-start mb-6 z-10 shadow-sm">
                A1 Beginner
              </span>
              <p className="text-2xl font-extrabold text-[#1F2328] text-center z-10 mb-2">Ich hätte gerne einen Kaffee.</p>
              <p className="text-sm text-[#26408B] font-semibold text-center z-10">I would like a coffee.</p>
              
              <div className="absolute right-4 bottom-10 flex flex-col gap-4">
                <div className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">❤️</div>
                <div className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">💬</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="bg-white py-24 border-y border-gray-100">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl font-extrabold text-[#1F2328] mb-4">Why German with Jai?</h2>
            <p className="text-gray-500 text-lg">We've combined the addictive nature of short-form video with proven language learning science.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="bg-[#FAF9F6]/50 backdrop-blur-sm p-8 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(38,64,139,0.08)] hover:-translate-y-2 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-[#26408B]/20 to-[#26408B]/5 rounded-2xl flex items-center justify-center mb-6 text-[#26408B] shadow-inner">
                <Play size={28} />
              </div>
              <h3 className="text-xl font-bold text-[#1F2328] mb-3">Immersive Reels Feed</h3>
              <p className="text-gray-500 leading-relaxed">Scroll through a feed of bite-sized, native-speaker videos. Learn real pronunciation and cultural context effortlessly.</p>
            </div>
            
            <div className="bg-[#FAF9F6]/50 backdrop-blur-sm p-8 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(217,164,65,0.08)] hover:-translate-y-2 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-[#D9A441]/20 to-[#D9A441]/5 rounded-2xl flex items-center justify-center mb-6 text-[#D9A441] shadow-inner">
                <TrendingUp size={28} />
              </div>
              <h3 className="text-xl font-bold text-[#1F2328] mb-3">Gamified Progress</h3>
              <p className="text-gray-500 leading-relaxed">Earn XP by interacting with reels and completing quizzes. Maintain your streak and climb the weekly leaderboard.</p>
            </div>

            <div className="bg-[#FAF9F6]/50 backdrop-blur-sm p-8 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(38,64,139,0.08)] hover:-translate-y-2 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-[#26408B]/20 to-[#26408B]/5 rounded-2xl flex items-center justify-center mb-6 text-[#26408B] shadow-inner">
                <Users size={28} />
              </div>
              <h3 className="text-xl font-bold text-[#1F2328] mb-3">Live Classes & VOD</h3>
              <p className="text-gray-500 leading-relaxed">Take your learning to the next level by enrolling in live interactive classes with Jai, or watch recordings on-demand.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1F2328] text-white py-12">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <BookOpen size={24} className="text-[#D9A441]" />
            <span className="text-2xl font-extrabold">German with Jai</span>
          </div>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">Mastering the German language has never been this engaging, effective, and fun.</p>
          <div className="text-gray-500 text-sm">
            © {new Date().getFullYear()} German with Jai. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
