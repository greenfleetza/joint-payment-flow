// GlassCard — the primary surface for ZakaPay content.
import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "strong";
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingMap = {
  none: "",
  sm: "p-4",
  md: "p-6 md:p-7",
  lg: "p-8 md:p-10",
};

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ variant = "default", padding = "md", className, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          variant === "strong" ? "glass-strong" : "glass",
          "rounded-3xl",
          paddingMap[padding],
          className,
        )}
        {...rest}
      />
    );
  },
);
GlassCard.displayName = "GlassCard";
