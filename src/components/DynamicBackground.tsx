import { useEffect, useState, memo } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface DynamicBackgroundProps {
  color?: string; // Optional hex or hsl color to influence the gradient
  className?: string;
}

/**
 * Premium Dynamic Mesh Gradient background.
 * Creates a slow-moving, atmospheric set of color blobs that shift over time.
 */
function DynamicBackgroundInner({ color, className }: DynamicBackgroundProps) {
  return (
    <div className={cn("fixed inset-0 -z-10 overflow-hidden pointer-events-none", className)}>
      {/* Background base */}
      <div className="absolute inset-0 bg-background transition-colors duration-1000" />

      {/* Mesh Blobs */}
      <div className="absolute inset-0 opacity-20 dark:opacity-30 mix-blend-soft-light">
        <motion.div
          className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary blur-[120px] animate-mesh-1"
          style={{ backgroundColor: color }}
        />
        <div className="absolute top-[20%] right-[-5%] w-[50%] h-[50%] rounded-full bg-secondary blur-[100px] animate-mesh-2" />
        <div className="absolute bottom-[-10%] left-[20%] w-[55%] h-[55%] rounded-full bg-primary blur-[110px] animate-mesh-3" />
      </div>

      {/* Noise Texture Overlay for film grain look */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      <style>{`
        @keyframes mesh-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(10%, 15%) scale(1.1); }
          66% { transform: translate(-5%, 20%) scale(0.9); }
        }
        @keyframes mesh-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-15%, -10%) scale(0.95); }
          66% { transform: translate(5%, -15%) scale(1.05); }
        }
        @keyframes mesh-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(12%, -12%) scale(1.02); }
          66% { transform: translate(-10%, 5%) scale(0.98); }
        }
        .animate-mesh-1 { animation: mesh-1 25s ease-in-out infinite; }
        .animate-mesh-2 { animation: mesh-2 30s ease-in-out infinite; }
        .animate-mesh-3 { animation: mesh-3 28s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

export const DynamicBackground = memo(DynamicBackgroundInner);
