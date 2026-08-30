"use client";

import { getIcon, COLOR_PALETTE } from "@/lib/icon-map";
import { cn } from "@/lib/utils";

export function IconPicker({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (icon: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((key) => {
        const Icon = getIcon(key);
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={cn(
              "flex size-10 items-center justify-center rounded-lg border transition-colors",
              value === key ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
            )}
          >
            <Icon className="size-4" />
          </button>
        );
      })}
    </div>
  );
}

export function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLOR_PALETTE.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={cn(
            "size-8 rounded-full border-2 transition-transform",
            value === color ? "scale-110 border-foreground" : "border-transparent"
          )}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}
