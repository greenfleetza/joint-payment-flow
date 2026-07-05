// Ambient aurora canvas — placed at page root behind content.
// Purely decorative, pointer-events: none, respects reduced motion via CSS.
import { cn } from "@/lib/utils";

interface AmbientBackgroundProps {
  variant?: "aurora" | "quiet" | "warm";
  className?: string;
}

export function AmbientBackground({ variant = "aurora", className }: AmbientBackgroundProps) {
  const blobs =
    variant === "quiet"
      ? [
          { c: "var(--aurora-1)", top: "-10%", left: "-10%", size: 620 },
          { c: "var(--aurora-4)", top: "40%", right: "-8%", size: 520 },
        ]
      : variant === "warm"
      ? [
          { c: "var(--aurora-3)", top: "-15%", right: "-10%", size: 640 },
          { c: "var(--aurora-2)", bottom: "-20%", left: "-5%", size: 720 },
          { c: "var(--aurora-1)", top: "35%", left: "20%", size: 480 },
        ]
      : [
          { c: "var(--aurora-1)", top: "-12%", left: "-8%", size: 620 },
          { c: "var(--aurora-2)", top: "18%", right: "-12%", size: 700 },
          { c: "var(--aurora-3)", bottom: "-20%", left: "22%", size: 620 },
          { c: "var(--aurora-4)", bottom: "10%", right: "18%", size: 460 },
        ];

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden",
        className,
      )}
    >
      {blobs.map((b, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: b.size,
            height: b.size,
            top: (b as any).top,
            left: (b as any).left,
            right: (b as any).right,
            bottom: (b as any).bottom,
            background: `radial-gradient(closest-side, ${b.c}, transparent 70%)`,
            filter: "blur(60px)",
            animation: `aurora-drift ${18 + i * 4}s ease-in-out infinite`,
            animationDelay: `${i * -3}s`,
          }}
        />
      ))}
      {/* Subtle grain for depth */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.4), transparent 60%)",
          mixBlendMode: "overlay",
          opacity: 0.5,
        }}
      />
    </div>
  );
}
