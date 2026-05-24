import { cn } from "@/lib/cn";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "green" | "yellow" | "red" | "orange";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants = {
    default: "bg-background text-ink",
    green: "bg-primary-light text-primary",
    yellow: "bg-yellow-100 text-yellow-700",
    red: "bg-red-100 text-red-700",
    orange: "bg-primary-light text-primary",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
