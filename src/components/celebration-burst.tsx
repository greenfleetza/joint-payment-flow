// CelebrationBurst — decorative animated confetti for completion screens.
import { motion } from "framer-motion";

const COLORS = ["#7c3aed", "#22c55e", "#f97316", "#ec4899", "#0ea5e9", "#eab308"];

export function CelebrationBurst() {
  const pieces = Array.from({ length: 24 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((_, i) => {
        const angle = (i / pieces.length) * Math.PI * 2;
        const dist = 140 + Math.random() * 80;
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist;
        const color = COLORS[i % COLORS.length];
        return (
          <motion.span
            key={i}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.6 }}
            animate={{ x: dx, y: dy, opacity: 0, scale: 1, rotate: 360 }}
            transition={{ duration: 1.6, ease: "easeOut", delay: (i % 6) * 0.02 }}
            style={{
              background: color,
              left: "50%",
              top: "40%",
              width: 8,
              height: 14,
              borderRadius: 2,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2"
          />
        );
      })}
    </div>
  );
}
