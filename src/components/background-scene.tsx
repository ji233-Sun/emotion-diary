"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";

function SkyScene() {
  const ref = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
    if (ref.current) {
      // Slowly rotate the stars for a dynamic, peaceful feeling
      ref.current.rotation.x -= delta / 50;
      ref.current.rotation.y -= delta / 60;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <group ref={ref}>
        <Stars 
          radius={50} 
          depth={50} 
          count={7000} 
          factor={4} 
          saturation={0} 
          fade 
          speed={1.5} 
        />
      </group>
    </group>
  );
}

export function BackgroundScene() {
  return (
    <div className="bg-canvas-container" style={{ background: 'linear-gradient(to bottom, #050505 0%, #0a0a1a 100%)' }}>
      <Canvas camera={{ position: [0, 0, 1] }}>
        <SkyScene />
      </Canvas>
    </div>
  );
}
