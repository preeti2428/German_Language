"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, Stars } from "@react-three/drei";
import { useRef, useState, useEffect, Suspense } from "react";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Shield, ChevronRight } from "lucide-react";

export interface Exercise {
  _id?: string;
  id?: string;
  type: string;
  prompt?: string;
  questionText?: string;
  options?: any;
  correctAnswer?: any;
  audioUrl?: string;
  points?: number;
  xpValue?: number;
}

// ─── 3D Castle Parts ─────────────────────────────────────
function CastlePart({ position, size, color, visible, delay = 0 }: any) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [scale, setScale] = useState(0);
  const [glowing, setGlowing] = useState(false);
  const targetScale = useRef(0);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        targetScale.current = 1;
        setGlowing(true);
        setTimeout(() => setGlowing(false), 1500);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      targetScale.current = 0;
      setScale(0);
    }
  }, [visible, delay]);

  useFrame((_, delta) => {
    if (meshRef.current) {
      const current = meshRef.current.scale.x;
      const target = targetScale.current;
      const newScale = THREE.MathUtils.lerp(current, target, delta * 5);
      meshRef.current.scale.set(newScale, newScale, newScale);
      setScale(newScale);
      meshRef.current.rotation.y += delta * 0.1;
    }
  });

  const emissiveColor = glowing ? color : "#000000";
  const emissiveIntensity = glowing ? 1.5 : 0.1;

  return (
    <mesh ref={meshRef} position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} emissive={emissiveColor} emissiveIntensity={emissiveIntensity} metalness={0.3} roughness={0.4} />
    </mesh>
  );
}

function Battlements({ y, visible }: { y: number; visible: boolean }) {
  const positions: [number, number, number][] = [
    [-2.5, y, 1.5], [-1.5, y, 1.5], [-0.5, y, 1.5], [0.5, y, 1.5], [1.5, y, 1.5], [2.5, y, 1.5],
    [-2.5, y, -1.5], [-1.5, y, -1.5], [-0.5, y, -1.5], [0.5, y, -1.5], [1.5, y, -1.5], [2.5, y, -1.5],
    [-2.5, y, 0.5], [-2.5, y, -0.5], [2.5, y, 0.5], [2.5, y, -0.5],
  ];
  return (
    <>
      {positions.map((p, i) => (
        <CastlePart key={i} position={p} size={[0.4, 0.4, 0.4]} color="#8B7355" visible={visible} delay={i * 50} />
      ))}
    </>
  );
}

function Tower({ position, visible, color }: any) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const coneRef = useRef<THREE.Mesh>(null!);
  const targetScale = useRef(visible ? 1 : 0);

  useEffect(() => {
    targetScale.current = visible ? 1 : 0;
    if (!visible && meshRef.current) {
      meshRef.current.scale.set(0, 0, 0);
    }
  }, [visible]);

  useFrame((_, delta) => {
    [meshRef, coneRef].forEach((r) => {
      if (r.current) {
        const cur = r.current.scale.x;
        const next = THREE.MathUtils.lerp(cur, targetScale.current, delta * 5);
        r.current.scale.set(next, next, next);
      }
    });
  });

  return (
    <group position={position}>
      <mesh ref={meshRef} castShadow>
        <cylinderGeometry args={[0.6, 0.7, 2.5, 8]} />
        <meshStandardMaterial color="#9B8970" metalness={0.2} roughness={0.6} />
      </mesh>
      <mesh ref={coneRef} position={[0, 1.8, 0]} castShadow>
        <coneGeometry args={[0.7, 1.2, 8]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.3} emissive={color} emissiveIntensity={visible ? 0.3 : 0} />
      </mesh>
    </group>
  );
}

function Flag({ position, visible }: any) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const targetScale = useRef(0);

  useEffect(() => {
    targetScale.current = visible ? 1 : 0;
  }, [visible]);

  useFrame((state, delta) => {
    if (meshRef.current) {
      const cur = meshRef.current.scale.x;
      const next = THREE.MathUtils.lerp(cur, targetScale.current, delta * 5);
      meshRef.current.scale.set(next, next, next);
      if (visible) {
        meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 3) * 0.3;
      }
    }
  });

  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.04, 0.04, 2, 6]} />
        <meshStandardMaterial color="#C0A060" metalness={0.8} />
      </mesh>
      <mesh ref={meshRef} position={[0.3, 0.7, 0]}>
        <planeGeometry args={[0.7, 0.45]} />
        <meshStandardMaterial color="#FF4757" side={THREE.DoubleSide} emissive="#FF4757" emissiveIntensity={visible ? 0.5 : 0} />
      </mesh>
    </group>
  );
}

function CastleScene({ completedParts }: { completedParts: string[] }) {
  const hasFoundation = completedParts.includes("foundation");
  const hasLeftTower = completedParts.includes("left_tower");
  const hasRightTower = completedParts.includes("right_tower");
  const hasWalls = completedParts.includes("walls");
  const hasGate = completedParts.includes("gate");
  const hasFlags = completedParts.includes("flags");

  const groupRef = useRef<THREE.Group>(null!);
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, -1.5, 0]} receiveShadow>
        <cylinderGeometry args={[4, 4, 0.3, 32]} />
        <meshStandardMaterial color="#4a7c59" roughness={0.9} />
      </mesh>
      <CastlePart position={[0, -0.7, 0]} size={[3.5, 1.5, 3]} color="#8B7355" visible={hasFoundation} />
      <CastlePart position={[0, 0.4, 0]} size={[3, 1, 2.6]} color="#9B8970" visible={hasFoundation} delay={200} />
      <Tower position={[-2.2, 0.2, 0]} color="#4361EE" visible={hasLeftTower} />
      <Tower position={[2.2, 0.2, 0]} color="#CE82FF" visible={hasRightTower} />
      <CastlePart position={[-2.2, -0.8, -1.6]} size={[0.5, 1.2, 2]} color="#7A6B55" visible={hasWalls} />
      <CastlePart position={[2.2, -0.8, -1.6]} size={[0.5, 1.2, 2]} color="#7A6B55" visible={hasWalls} delay={150} />
      <CastlePart position={[0, -0.8, -2.5]} size={[4, 1.2, 0.5]} color="#7A6B55" visible={hasWalls} delay={300} />
      <Battlements y={0.1} visible={hasWalls} />
      <CastlePart position={[0, -1, -2.6]} size={[1.2, 0.8, 0.6]} color="#5A4A3A" visible={hasGate} />
      {hasGate && [-0.3, 0, 0.3].map((x, i) => (
        <CastlePart key={i} position={[x, -0.95, -2.65]} size={[0.08, 0.7, 0.05]} color="#3A3A3A" visible={hasGate} delay={i * 100} />
      ))}
      <Flag position={[-2.2, 1.6, 0]} visible={hasFlags} />
      <Flag position={[2.2, 1.6, 0]} visible={hasFlags} />
      <Flag position={[0, 1.2, 0]} visible={hasFlags} />
    </group>
  );
}

function Confetti({ show }: { show: boolean }) {
  const [particles, setParticles] = useState<{ id: number; x: number; color: string }[]>([]);

  useEffect(() => {
    if (show) {
      const colors = ["#FF4757", "#4361EE", "#20BF6B", "#FF9F43", "#CE82FF", "#F7B731"];
      setParticles(Array.from({ length: 20 }, (_, i) => ({ id: i, x: Math.random() * 100, color: colors[Math.floor(Math.random() * colors.length)] })));
      const timer = setTimeout(() => setParticles([]), 2500);
      return () => clearTimeout(timer);
    }
  }, [show]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute w-3 h-3 rounded-sm top-0"
            style={{ left: `${p.x}%`, backgroundColor: p.color }}
            initial={{ y: -20, opacity: 1, rotate: 0 }}
            animate={{ y: "110vh", opacity: 0.6, rotate: 720 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 + Math.random(), ease: "easeIn" }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ProgressRing({ progress }: { progress: number }) {
  const radius = 36;
  const stroke = 7;
  const normalizedRadius = radius - stroke;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg height={radius * 2} width={radius * 2}>
        <circle stroke="#E2E8F0" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} />
        <circle
          stroke="#FF9F43"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + " " + circumference}
          style={{ strokeDashoffset, transition: "stroke-dashoffset 0.8s ease", transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="text-[13px] font-black" fill="#1A202C">
          {progress}%
        </text>
      </svg>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Castle Built</p>
    </div>
  );
}

const ALL_PARTS = ["foundation", "left_tower", "right_tower", "walls", "gate", "flags"];

export default function CastleBuilder({ exercises = [], onComplete }: { exercises?: Exercise[], onComplete: (xpEarned: number) => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedParts, setCompletedParts] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [xp, setXp] = useState(0);
  const [finished, setFinished] = useState(false);

  const hasExercises = exercises && exercises.length > 0;
  const currentLevel = hasExercises ? exercises[currentIndex] : null;
  const progress = hasExercises ? Math.round((currentIndex / exercises.length) * 100) : 0;

  function checkAnswer(answerToCheck: string) {
    if (selected || !currentLevel) return;
    
    setSelected(answerToCheck);
    
    const actualCorrect = (currentLevel.correctAnswer || "").toString().trim().toLowerCase();
    const provided = answerToCheck.toString().trim().toLowerCase();
    const correct = provided === actualCorrect;
    
    setIsCorrect(correct);
    if (correct) {
      setShowConfetti(true);
      const points = currentLevel.points || currentLevel.xpValue || 10;
      setXp((prev) => prev + points);
      
      const partToUnlock = ALL_PARTS[Math.floor((currentIndex / exercises.length) * 6)] || "flags";
      setCompletedParts((prev) => Array.from(new Set([...prev, partToUnlock])));
      
      setTimeout(() => setShowConfetti(false), 2600);
    }
  }

  function handleNext() {
    if (currentIndex + 1 >= (exercises?.length || 0)) {
      setFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
      setInputValue("");
      setIsCorrect(null);
    }
  }

  if (!hasExercises) {
    return <div className="text-white">No exercises found for this session!</div>;
  }

  const promptText = currentLevel?.prompt || currentLevel?.questionText || "Answer the question";
  const options = currentLevel?.options || [];
  const isMcq = Array.isArray(options) && options.length > 0 && typeof options[0] === 'string';

  return (
    <div className="w-full h-full min-h-[80vh] flex flex-col bg-gradient-to-br from-[#F8F9FF] to-[#EEF2FF] rounded-3xl overflow-hidden shadow-2xl relative">
      <Confetti show={showConfetti} />

      {/* Header */}
      <div className="px-6 md:px-10 pt-6 pb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-[#4361EE] uppercase tracking-widest mb-1">🏰 Castle Builder</p>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">Build Your Kingdom</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 duo-card px-4 py-2 border-b-[3px] border-[#d4aa70]">
            <Zap size={16} className="text-[#FF9F43] fill-[#FF9F43]" />
            <span className="font-black text-gray-800 text-sm">{xp} XP</span>
          </div>
          <ProgressRing progress={progress} />
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row flex-1 gap-4 px-4 md:px-8 pb-4 h-full">
        
        {/* 3D Castle Viewer */}
        <div className="w-full lg:w-1/2 h-[320px] lg:h-full rounded-3xl overflow-hidden border-2 border-white shadow-xl bg-gradient-to-b from-[#87CEEB] to-[#E0F4FF] relative min-h-[300px]">
          <Canvas shadows camera={{ position: [0, 3, 10], fov: 45 }}>
            <Suspense fallback={<Html center><div className="text-gray-600 font-black text-sm animate-pulse">Loading Castle...</div></Html>}>
              <Stars radius={60} depth={20} count={800} factor={2} saturation={0} fade />
              <ambientLight intensity={0.8} />
              <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
              <pointLight position={[-5, 5, -5]} intensity={0.5} color="#4361EE" />
              <CastleScene completedParts={completedParts} />
              <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 2} autoRotate={false} />
            </Suspense>
          </Canvas>
          
          <div className="absolute bottom-4 left-4 right-4 flex gap-2 flex-wrap justify-center">
            {ALL_PARTS.map((part) => (
              <div
                key={part}
                className={`w-3 h-3 rounded-full transition-all ${
                  completedParts.includes(part)
                    ? "bg-[#20BF6B] shadow-[0_0_8px_#20BF6B]"
                    : "bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Quiz Panel */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center py-4">
          <AnimatePresence mode="wait">
            {finished ? (
              <motion.div
                key="finished"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="duo-card p-8 text-center border-t-[6px] border-t-[#FF9F43]"
              >
                <div className="text-5xl mb-4">🏰👑</div>
                <h2 className="text-3xl font-black text-gray-900 mb-2">Castle Complete!</h2>
                <p className="text-gray-500 font-bold mb-6">Your German Kingdom is built. You earned <span className="text-[#FF9F43] font-black">{xp} XP</span>!</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => onComplete(xp)}
                    className="duo-btn duo-btn-green px-6 py-3 text-sm"
                  >
                    Continue to Map ✨
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="duo-card p-4 flex items-center gap-4 border-t-[4px] border-t-[#4361EE]">
                  <div className="w-10 h-10 rounded-xl bg-[#4361EE] flex items-center justify-center text-white shadow-[0_3px_0_#3046B2]">
                    <Shield size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-[#4361EE] uppercase tracking-widest">{currentLevel?.type}</p>
                    <p className="font-black text-gray-900">Question {currentIndex + 1}</p>
                  </div>
                  <div className="ml-auto text-xs font-black text-gray-400">{currentIndex + 1}/{exercises.length}</div>
                </div>

                <div className="duo-card p-6 text-center bg-white text-gray-800">
                  <p className="text-2xl font-black">{promptText}</p>
                  {currentLevel?.audioUrl && (
                    <audio src={currentLevel.audioUrl} controls className="mx-auto mt-4" />
                  )}
                </div>

                {isMcq ? (
                  <div className="grid grid-cols-2 gap-3">
                    {options.map((option: string) => {
                      const actualCorrect = (currentLevel.correctAnswer || "").toString().trim().toLowerCase();
                      const isThisCorrect = option.toLowerCase() === actualCorrect;
                      
                      let style = "duo-card p-4 text-center font-black text-sm border-2 border-gray-200 shadow-[0_3px_0_#CBD5E0] hover:border-[#4361EE] hover:bg-[#F0F3FF] cursor-pointer transition-all active:shadow-none active:translate-y-[3px]";
                      
                      if (selected) {
                        if (isThisCorrect) {
                          style = "duo-card p-4 text-center font-black text-sm border-2 border-[#20BF6B] bg-[#E8FBF0] shadow-[0_3px_0_#179854] text-[#20BF6B]";
                        } else if (option === selected && !isCorrect) {
                          style = "duo-card p-4 text-center font-black text-sm border-2 border-[#FF4757] bg-[#FFF0F0] shadow-none text-[#FF4757]";
                        } else {
                          style = "duo-card p-4 text-center font-black text-sm border-2 border-gray-200 opacity-50 cursor-not-allowed";
                        }
                      }
                      return (
                        <motion.button
                          key={option}
                          onClick={() => checkAnswer(option)}
                          className={style}
                          whileTap={!selected ? { scale: 0.96, y: 3 } : {}}
                          disabled={!!selected}
                        >
                          {option}
                        </motion.button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <input 
                      type="text" 
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      disabled={!!selected}
                      placeholder="Type your answer here..."
                      className="duo-card w-full p-4 font-black text-gray-800 text-lg border-2 border-gray-200 focus:border-[#4361EE] outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !selected) checkAnswer(inputValue);
                      }}
                    />
                    {!selected && (
                      <button 
                        onClick={() => checkAnswer(inputValue)}
                        className="duo-btn duo-btn-blue p-4 w-full"
                      >
                        Check Answer
                      </button>
                    )}
                  </div>
                )}

                <AnimatePresence>
                  {selected && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`rounded-2xl p-4 flex items-center justify-between ${
                        isCorrect ? "bg-[#E8FBF0] border-2 border-[#20BF6B]" : "bg-[#FFF0F0] border-2 border-[#FF4757]"
                      }`}
                    >
                      <div>
                        <p className={`font-black text-sm ${isCorrect ? "text-[#20BF6B]" : "text-[#FF4757]"}`}>
                          {isCorrect ? "🎉 Ausgezeichnet! (Excellent!)" : `❌ Correct: ${currentLevel?.correctAnswer}`}
                        </p>
                      </div>
                      <button
                        onClick={handleNext}
                        className={`duo-btn px-4 py-2 text-sm flex items-center gap-1 ${isCorrect ? "duo-btn-green" : "duo-btn-blue"}`}
                      >
                        Next <ChevronRight size={14} />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
