// Motion presets — Fluid Intelligence
// Physics-based springs, respects prefers-reduced-motion at CSS layer.
import type { Transition, Variants } from "framer-motion";

export const spring: Transition = { type: "spring", stiffness: 350, damping: 30, mass: 0.9 };
export const springSoft: Transition = { type: "spring", stiffness: 260, damping: 28 };
export const springSnap: Transition = { type: "spring", stiffness: 450, damping: 32 };

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: spring },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
};

export const stagger = (staggerChildren = 0.04): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren } },
});

export const tapScale = { scale: 0.97 };
export const hoverLift = { y: -2, transition: springSnap };

export const pageTransition: Transition = { type: "spring", stiffness: 350, damping: 32 };
