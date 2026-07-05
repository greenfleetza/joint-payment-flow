// StepHeader — the "where am I, what should I do" primitive.
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StepHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
}

export function StepHeader({ eyebrow, title, description, align = "left", className }: StepHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-3", align === "center" && "items-center text-center", className)}>
      {eyebrow && (
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--primary)]">
          {eyebrow}
        </span>
      )}
      <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
        {title}
      </h1>
      {description && (
        <p className="max-w-xl text-pretty text-base text-muted-foreground md:text-lg">{description}</p>
      )}
    </header>
  );
}
