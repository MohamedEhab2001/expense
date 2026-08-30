"use client";

import { motion, useReducedMotion } from "framer-motion";

export function StaggerItem({
  index,
  children,
  className,
}: {
  index: number;
  children: React.ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: reduceMotion ? 0 : Math.min(index, 8) * 0.035, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
