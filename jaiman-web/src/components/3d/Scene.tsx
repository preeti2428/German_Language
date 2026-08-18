"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, ScrollControls, useScroll, Sky, Cloud, useGLTF } from "@react-three/drei";
import { useState, useMemo, useRef, Suspense } from "react";
import * as THREE from "three";

// --------------------------------------------------------
// Configuration
// --------------------------------------------------------
const STATIONS = [
  { id: "flashcards", label: "Flashcards", title: "Practice Vocab", color: "#FF9600", offset: 0.20, icon: "box", path: "/flashcards" },
  { id: "classes", label: "Classes", title: "Video Lessons", color: "#FF4B4B", offset: 0.45, icon: "torus", path: "/classes" },
  { id: "reels", label: "Reels", title: "Shorts Feed", color: "#00CD9C", offset: 0.70, icon: "cone", path: "/reels" },
  { id: "profile", label: "Profile", title: "Your Stats", color: "#CE82FF", offset: 0.95, icon: "sphere", path: "/profile" },
];

// Preload the model to prevent flickering
useGLTF.preload("/models/village.glb");

// --------------------------------------------------------
// The 3D Village Model
// --------------------------------------------------------
function VillageModel() {
  // Load the downloaded GLB file
  const { scene } = useGLTF("/models/village.glb");

  // Traverse and enable shadows for all meshes
  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  return (
    // Adjust scale and position based on the specific BabylonJS village model dimensions
    <primitive object={scene} scale={0.8} position={[0, -2, 0]} />
  );
}

// --------------------------------------------------------
// Camera Rig (Driven by Scroll & Spline)
// --------------------------------------------------------
function CameraRig({ curve }: { curve: THREE.CatmullRomCurve3 }) {
  const { camera } = useThree();
  const scroll = useScroll();

  useFrame((state, delta) => {
    // Current scroll progress (0 to 1)
    const offset = scroll.offset;
    
    // Get exact point on the curve for current scroll
    const targetPosition = curve.getPoint(offset);
    
    // Smoothly interpolate camera position
    camera.position.lerp(targetPosition, 4 * delta);

    // Look slightly ahead on the curve
    const lookAheadOffset = Math.min(offset + 0.05, 1);
    const lookAheadTarget = curve.getPoint(lookAheadOffset);
    
    // Smoothly interpolate looking direction
    const currentLookAt = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).add(camera.position);
    currentLookAt.lerp(lookAheadTarget, 4 * delta);
    camera.lookAt(currentLookAt);
  });

  return null;
}

// --------------------------------------------------------
// HTML Overlays (Level Gates)
// --------------------------------------------------------
function LevelGate({ data, curve }: { data: typeof STATIONS[0], curve: THREE.CatmullRomCurve3 }) {
  const scroll = useScroll();
  const htmlRef = useRef<HTMLDivElement>(null);

  // Place the gate slightly further away so the camera can see the whole thing
  const positionOffset = Math.min(data.offset + 0.05, 1);
  const position = useMemo(() => curve.getPoint(positionOffset), [curve, positionOffset]);

  useFrame(() => {
    if (htmlRef.current) {
      const distance = data.offset - scroll.offset;
      // Visible when camera is approaching
      const isVisible = distance > -0.05 && distance < 0.15;
      
      htmlRef.current.style.opacity = isVisible ? '1' : '0';
      htmlRef.current.style.transform = `scale(${isVisible ? 1 : 0.8}) translateY(${isVisible ? '0px' : '40px'})`;
      htmlRef.current.style.pointerEvents = isVisible ? 'auto' : 'none';
    }
  });

  return (
    <group position={[position.x, position.y + 0.5, position.z]}>
      {/* Visual Marker directly underneath */}
      <mesh position={[0, -0.5, 0]} castShadow>
        <cylinderGeometry args={[1.5, 1.5, 0.2, 32]} />
        <meshStandardMaterial color={data.color} emissive={data.color} emissiveIntensity={0.6} />
      </mesh>

      {/* Wrapping the HTML in a group to control its true 3D scale safely */}
      <group position={[0, 1.5, 0]} scale={0.03}>
        <Html transform center zIndexRange={[100, 0]}>
          <div 
            ref={htmlRef}
            className="transition-all duration-300 flex flex-col items-center w-80"
            style={{ opacity: 0 }}
          >
            <div className="bg-white/95 backdrop-blur-xl border-[4px] border-white rounded-[2rem] p-6 text-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] w-full">
              <div 
                className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-inner"
                style={{ backgroundColor: data.color }}
              >
                <span className="text-white font-black text-3xl">{data.label.charAt(0)}</span>
              </div>
              
              <h2 className="text-3xl font-black text-gray-800 mb-2 leading-tight uppercase tracking-wide">{data.label}</h2>
              <p className="text-gray-500 font-bold text-sm mb-6">{data.title}</p>
              
              <a 
                href={data.path}
                className="block w-full py-4 text-white font-black text-lg uppercase tracking-widest rounded-2xl transition-all hover:scale-105 active:scale-95"
                style={{ backgroundColor: data.color, borderBottom: `6px solid ${data.color}80` }}
              >
                Enter {data.label}
              </a>
            </div>
          </div>
        </Html>
      </group>
    </group>
  );
}

// --------------------------------------------------------
// Main Scene Component
// --------------------------------------------------------
export default function Scene() {
  // Define the master cinematic camera path winding through the 3D space
  const curve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 6, 40),      // Start (High up, far back)
    new THREE.Vector3(15, 4, 20),     // Swoop right
    new THREE.Vector3(5, 3, 0),       // Dive into the center
    new THREE.Vector3(-15, 3, -15),   // Swoop left
    new THREE.Vector3(-5, 4, -30),    // Coming back center
    new THREE.Vector3(10, 5, -45),    // Final rise right
    new THREE.Vector3(0, 6, -60),     // End
  ]), []);

  return (
    <div className="w-full h-full relative bg-[#87CEEB]">
      {/* Native Scroll Overlay hint */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10 pointer-events-none flex flex-col items-center animate-bounce">
        <span className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-full text-[#1CB0F6] font-black uppercase tracking-widest shadow-lg border-2 border-white">
          Scroll Down to Journey ↓
        </span>
      </div>

      <Canvas shadows camera={{ position: [0, 6, 40], fov: 50 }}>
        <Suspense fallback={
          <Html center>
            <div className="text-white font-black text-xl uppercase tracking-widest animate-pulse">
              Loading 3D World...
            </div>
          </Html>
        }>
          <Sky sunPosition={[100, 20, 100]} turbidity={0.1} rayleigh={0.2} mieCoefficient={0.005} mieDirectionalG={0.8} />
          
          <ambientLight intensity={1.5} color="#ffffff" />
          <directionalLight 
            position={[50, 50, 20]} 
            intensity={2} 
            castShadow 
            shadow-mapSize={[2048, 2048]}
            shadow-camera-far={200}
            shadow-camera-left={-50}
            shadow-camera-right={50}
            shadow-camera-top={50}
            shadow-camera-bottom={-50}
          />
          <directionalLight position={[-10, 10, -10]} intensity={0.5} color="#A0D8EF" />

          <ScrollControls pages={6} damping={0.25} maxSpeed={0.5}>
            <CameraRig curve={curve} />

            {/* The Real Village Model */}
            <VillageModel />

            {/* Level UI Popups positioned along the curve */}
            {STATIONS.map(level => (
              <LevelGate key={level.id} data={level} curve={curve} />
            ))}
            
            {/* Clouds for atmosphere */}
            <Cloud position={[-20, 20, -10]} speed={0.2} opacity={0.5} />
            <Cloud position={[30, 25, -30]} speed={0.2} opacity={0.5} />
            <Cloud position={[-10, 15, -50]} speed={0.2} opacity={0.5} />
            
          </ScrollControls>
        </Suspense>
      </Canvas>
    </div>
  );
}
