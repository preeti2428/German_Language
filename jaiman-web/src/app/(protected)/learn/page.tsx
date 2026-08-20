'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { X, Lock, ChevronRight, Train, Cloud } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

type NodeStatus = 'completed' | 'active' | 'locked' | 'boss';

interface City {
  id: string;
  stageNumber: number;
  tier: string;
  name: string;
  nameDe: string;
  status: NodeStatus;
  emoji: string;
  color: string;
  bgColor: string;
  description: string;
  xp: number;
  x: number;
  y: number;
  completedSessions: number;
  totalSessions: number;
  nextSession: number | 'boss';
}

// SVG path between cities simulating tracks
function RailPath({ from: f, to: t, isUnlocked }: { from: City; to: City; isUnlocked: boolean }) {
  const midX = (f.x + t.x) / 2 + (Math.random() * 10 - 5);
  const midY = (f.y + t.y) / 2 + (Math.random() * 10 - 5);
  const pathData = `M ${f.x} ${f.y} Q ${midX} ${midY} ${t.x} ${t.y}`;

  return (
    <g>
      <path d={pathData} fill="none" stroke={isUnlocked ? '#CBD5E0' : '#E2E8F0'} strokeWidth="6" strokeLinecap="round" />
      <path d={pathData} fill="none" stroke={isUnlocked ? '#A0AEC0' : '#CBD5E0'} strokeWidth="12" strokeDasharray="2, 10" strokeLinecap="butt" />
      <path d={pathData} fill="none" stroke={isUnlocked ? '#4A5568' : '#A0AEC0'} strokeWidth="2" strokeDasharray="20, 20" />
    </g>
  );
}

const DECORATIONS = [
  { type: 'tree', x: 20, y: 80, scale: 1.5 },
  { type: 'tree', x: 60, y: 60, scale: 1.2 },
  { type: 'mountain', x: 80, y: 65, scale: 2 },
  { type: 'tree', x: 15, y: 30, scale: 1 },
  { type: 'castle', x: 45, y: 40, scale: 1.5 },
  { type: 'mountain', x: 75, y: 45, scale: 1.8 },
  { type: 'tree', x: 90, y: 15, scale: 1.3 },
];

function EnvProp({ prop }: { prop: any }) {
  const emoji = prop.type === 'tree' ? '🌲' : prop.type === 'mountain' ? '🏔️' : '🏰';
  return (
    <div
      className="absolute pointer-events-none drop-shadow-md select-none"
      style={{ left: `${prop.x}%`, top: `${prop.y}%`, transform: `translate(-50%, -50%) scale(${prop.scale})` }}
    >
      {emoji}
    </div>
  );
}

function FloatingClouds() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
      {[1, 2, 3].map(i => (
        <motion.div
          key={i}
          className="absolute"
          initial={{ x: '-10%', y: `${20 * i}%` }}
          animate={{ x: '110%' }}
          transition={{ duration: 60 + i * 20, repeat: Infinity, ease: 'linear', delay: i * 5 }}
        >
          <Cloud size={64} className="text-white fill-white drop-shadow-xl" />
        </motion.div>
      ))}
    </div>
  );
}

function CityNode({ city, onClick }: { city: City; onClick: () => void }) {
  const isLocked = city.status === 'locked';
  const isActive = city.status === 'active';
  const isBoss = city.status === 'boss';

  return (
    <div className="absolute z-20" style={{ left: `${city.x}%`, top: `${city.y}%`, transform: 'translate(-50%, -50%)' }}>
      {isActive && <div className="absolute inset-[-12px] rounded-full border-[6px] animate-ping opacity-40" style={{ borderColor: city.color }} />}
      <div className="relative group">
        <div className={`absolute inset-0 rounded-full translate-y-2 transition-transform ${isLocked ? 'bg-gray-300' : ''}`} style={{ backgroundColor: !isLocked ? city.color : undefined, opacity: 0.8 }} />
        <motion.button
          whileHover={!isLocked ? { y: -2, scale: 1.05 } : {}}
          whileTap={!isLocked ? { y: 2, scale: 0.95 } : {}}
          onClick={isLocked ? undefined : onClick}
          className={`relative flex items-center justify-center rounded-full text-3xl transition-colors border-[3px] shadow-sm ${isLocked ? 'w-16 h-16 bg-gray-100 border-gray-300 cursor-not-allowed opacity-80' : isBoss || isActive ? 'w-20 h-20 border-white cursor-pointer bg-white' : 'w-16 h-16 border-white cursor-pointer bg-white'}`}
          style={!isLocked ? { borderColor: city.color } : {}}
        >
          <span className="drop-shadow-sm">{isLocked ? <Lock size={24} className="text-gray-400" /> : city.emoji}</span>
          {!isLocked && <div className="absolute -top-3 -right-3 text-white font-black text-xs px-2 py-1 rounded-full shadow-md" style={{ backgroundColor: city.color }}>{city.xp}XP</div>}
        </motion.button>
      </div>
      <div className="absolute top-full mt-4 left-1/2 -translate-x-1/2 text-center pointer-events-none whitespace-nowrap bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm border border-gray-100">
        <p className={`font-black text-sm ${isLocked ? 'text-gray-400' : 'text-gray-800'}`}>{city.nameDe}</p>
        {isActive && <p className="text-[10px] font-bold mt-0.5" style={{ color: city.color }}>▶ CURRENT STOP</p>}
      </div>
    </div>
  );
}

function CityPanel({ city, onStart, onClose }: { city: City; onStart: () => void; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 40, scale: 0.9 }}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden z-40 border-2 border-gray-100"
    >
      <div className="h-3 w-full" style={{ backgroundColor: city.color }} />
      <div className="p-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0 border-2 shadow-sm" style={{ backgroundColor: city.bgColor, borderColor: city.color }}>{city.emoji}</div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: city.color }}>{city.name}, Germany</p>
            <h3 className="text-2xl font-black text-gray-900 leading-tight">{city.nameDe}</h3>
            <p className="text-sm text-gray-500 font-bold mt-1">{city.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 mb-6 bg-gray-50 rounded-2xl p-4 border border-gray-100">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-sm border border-gray-200">🚀</div>
          <div className="flex flex-col w-full">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Progress</span>
            <div className="flex items-center justify-between w-full mt-1">
              <span className="font-black text-gray-800 text-sm">
                Session {city.status === 'completed' ? city.totalSessions : city.completedSessions} of {city.totalSessions}
              </span>
              <span className="font-black text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: city.bgColor, color: city.color }}>+{city.xp} XP total</span>
            </div>
            <div className="w-full h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
               <div className="h-full" style={{ width: `${(city.status === 'completed' ? 1 : city.completedSessions / city.totalSessions) * 100}%`, backgroundColor: city.color }} />
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onStart} className="flex-1 py-4 text-base font-black rounded-2xl text-white shadow-sm hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2" style={{ background: city.color, boxShadow: `0 4px 0 ${city.color}BB` }}>
            {city.status === 'completed' ? 'Review' : 'Resume Journey'} <ChevronRight size={20} />
          </button>
          <button onClick={onClose} className="w-14 h-14 bg-gray-100 hover:bg-gray-200 rounded-2xl text-gray-500 transition-colors flex items-center justify-center border-b-4 border-gray-200 active:border-b-0 active:translate-y-1">
            <X size={24} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function LearnPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [pendingCity, setPendingCity] = useState<City | null>(null);
  const [totalXp, setTotalXp] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stagesRes, progressRes] = await Promise.all([
          api.get('/stages/section/A1'),
          api.get('/progress')
        ]);
        
        const stages = stagesRes.data;
        const progress = progressRes.data;
        
        const MAP_COORDINATES = [
          { x: 25, y: 40, color: '#CE82FF', bgColor: '#F7EDFF' },
          { x: 35, y: 55, color: '#FF9F43', bgColor: '#FFF4E6' },
          { x: 45, y: 75, color: '#20BF6B', bgColor: '#E8FBF0' },
          { x: 75, y: 85, color: '#4361EE', bgColor: '#EEF2FF' },
          { x: 30, y: 25, color: '#FF6B6B', bgColor: '#FFF0F0' },
          { x: 50, y: 20, color: '#20BF6B', bgColor: '#E8FBF0' },
          { x: 65, y: 15, color: '#4CC9F0', bgColor: '#E8F8FE' },
          { x: 85, y: 25, color: '#FF4757', bgColor: '#FFF0F0' },
        ];

        let foundActive = false;
        const mappedCities: City[] = stages.map((stage: any, index: number) => {
          const isCompleted = progress.completedStages.some((c: any) => c._id === stage._id || c === stage._id);
          const stageProg = progress.stageProgress?.find((sp: any) => sp.stageId === stage._id);
          const completedSessionsCount = stageProg ? stageProg.completedSessions.length : 0;
          const totalSessions = (stage.sessions?.length || 0) + (stage.bossTest?.length > 0 ? 1 : 0);
          
          let nextSession: number | 'boss' = completedSessionsCount + 1;
          if (nextSession > (stage.sessions?.length || 0)) {
            nextSession = 'boss';
          }

          let status: NodeStatus = 'locked';
          if (isCompleted) {
            status = 'completed';
          } else if (!foundActive) {
            status = index === stages.length - 1 ? 'boss' : 'active';
            foundActive = true;
          }

          const coords = MAP_COORDINATES[index % MAP_COORDINATES.length];
          const calcXp = (stage.sessions?.reduce((a:any, s:any) => a + (s.exercises?.reduce((acc:any, ex:any)=>acc+ex.points,0)||0), 0) || 0) + (stage.bossTest?.reduce((a:any,c:any)=>a+c.points,0)||0);

          return {
            id: stage._id,
            stageNumber: stage.stageNumber,
            tier: stage.tier,
            name: stage.cityName,
            nameDe: stage.cityNameDe,
            status,
            emoji: stage.emoji,
            color: coords.color,
            bgColor: coords.bgColor,
            description: stage.theme,
            xp: calcXp,
            x: coords.x,
            y: coords.y,
            completedSessions: completedSessionsCount,
            totalSessions,
            nextSession
          };
        });

        setCities(mappedCities);
        setTotalXp(progress.totalXp);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-screen bg-[#F4F9F1]"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  const completedCount = cities.filter(c => c.status === 'completed').length;
  const activeCity = cities.find(c => c.status === 'active' || c.status === 'boss');

  return (
    <div className="w-full h-[calc(100vh-2rem)] flex flex-col bg-white rounded-[2.5rem] overflow-hidden border-2 border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative">
      <div className="flex-shrink-0 px-8 py-5 border-b-2 border-gray-100 flex items-center justify-between bg-white z-30">
        <div>
          <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-1">SECTION 1</p>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">Deutschland Reise 🗺️</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-[#FFF4E6] px-5 py-2.5 rounded-2xl border-b-4 border-[#FF9F43]/30 flex items-center gap-2">
            <span className="text-[#FF9F43] font-black text-base">⭐ {totalXp} XP</span>
          </div>
          <div className="bg-gray-50 px-5 py-2.5 rounded-2xl border-b-4 border-gray-200 text-sm font-black text-gray-600">{completedCount}/{cities.length} Stops</div>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden bg-gradient-to-br from-[#E2F0CB] via-[#F4F9F1] to-[#D4E8C1]">
        <FloatingClouds />
        {DECORATIONS.map((prop, i) => <EnvProp key={i} prop={prop} />)}
        
        <div className="absolute inset-0" style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            {cities.slice(0, -1).map((city, i) => (
              <RailPath key={city.id} from={city} to={cities[i + 1]} isUnlocked={city.status !== 'locked'} />
            ))}
          </svg>
          {cities.map(city => <CityNode key={city.id} city={city} onClick={() => setPendingCity(city)} />)}
        </div>

        {activeCity && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="absolute top-6 left-1/2 -translate-x-1/2 bg-white px-5 py-3 rounded-full shadow-lg border-2 border-gray-100 flex items-center gap-3 z-30">
            <div className="w-8 h-8 rounded-full bg-[#EEF2FF] flex items-center justify-center"><Train size={18} className="text-[#4361EE]" /></div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Next Destination</span>
              <span className="text-sm font-black text-gray-800">{activeCity.nameDe} {activeCity.emoji}</span>
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {pendingCity && (
            <CityPanel
              city={pendingCity}
              onStart={() => router.push(`/lesson/${pendingCity.tier}/${pendingCity.stageNumber}/${pendingCity.status === 'completed' ? 1 : pendingCity.nextSession}`)}
              onClose={() => setPendingCity(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
