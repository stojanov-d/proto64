import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/ui/button";

export function ThemeToggle({ showLabel = false }: { showLabel?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
  const label = `Switch to ${nextTheme} theme`;

  return (
    <Button
      variant="outline"
      className={`h-11 rounded-xl border-border bg-card text-foreground shadow-xs hover:border-primary/30 hover:bg-accent hover:text-accent-foreground motion-reduce:transition-none ${showLabel ? "gap-2.5 px-3.5 text-xs" : "w-11"}`}
      onClick={() => setTheme(nextTheme)}
      aria-label={label}
      title={label}
    >
      {nextTheme === "light" ? (
        <Sun className="size-[18px]" aria-hidden="true" />
      ) : (
        <Moon className="size-[18px]" aria-hidden="true" />
      )}
      {showLabel && `Use ${nextTheme} theme`}
    </Button>
  );
}
