"use client";

import type { LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border p-8 text-center">
      <motion.div
        animate={reduceMotion ? undefined : { y: [0, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <Icon className="size-8 text-muted-foreground" />
      </motion.div>
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
