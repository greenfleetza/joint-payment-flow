// SplitMethodTile — the S01 choice cards.
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { cn } from "@/lib/utils";
import { spring, tapScale } from "@/lib/motion";

interface SplitMethodTileProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  badge?: string;
  selected?: boolean;
  onSelect?: () => void;
}

export function SplitMethodTile({ icon: Icon, title, description, badge, selected, onSelect }: SplitMethodTileProps) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileTap={tapScale}
      whileHover={{ y: -2 }}
      transition={spring}
      aria-pressed={selected}
      className={cn(
        "group relative flex flex-col gap-4 rounded-3xl border p-6 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        selected
          ? "border-[color:var(--primary)] bg-white shadow-[0_20px_50px_-20px_color-mix(in_oklab,var(--primary)_45%,transparent)]"
          : "border-border bg-white/70 backdrop-blur-xl hover:border-foreground/20",
      )}
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-2xl",
            selected ? "bg-[color:var(--primary)] text-primary-foreground" : "bg-secondary text-foreground",
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        {badge && (
          <span className="rounded-full bg-[color:var(--primary)]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--primary)]">
            {badge}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {selected && (
        <span className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--primary)] text-primary-foreground">
          <Check className="h-3.5 w-3.5" aria-hidden />
        </span>
      )}
    </motion.button>
  );
}
