"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Delete, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_LENGTH = 8;
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"] as const;

export default function LoginPage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();
  const reduceMotion = useReducedMotion();

  function press(key: string) {
    if (error) setError(false);
    if (key === "back") {
      setPasscode((p) => p.slice(0, -1));
      return;
    }
    if (passcode.length >= MAX_LENGTH) return;
    const next = passcode + key;
    setPasscode(next);
    if (next.length >= 4) {
      submit(next);
    }
  }

  function submit(code: string) {
    startTransition(async () => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: code }),
      });
      if (res.ok) {
        router.replace("/");
        router.refresh();
      } else {
        setError(true);
        setPasscode("");
      }
    });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 bg-background px-6">
      <div className="flex flex-col items-center gap-3">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/15">
          <Lock className="size-6 text-primary" />
        </div>
        <h1 className="text-lg font-semibold">Enter passcode</h1>
      </div>

      <div
        className={cn(
          "flex gap-3 transition-transform",
          error && "animate-[shake_0.3s_ease-in-out]"
        )}
      >
        {Array.from({ length: Math.max(4, passcode.length) }).map((_, i) => {
          const filled = i < passcode.length;
          return (
            <motion.div
              key={`${i}-${filled}`}
              initial={reduceMotion ? false : { scale: filled ? 0.4 : 1 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
              className={cn(
                "size-3.5 rounded-full border border-border",
                filled && (error ? "bg-destructive border-destructive" : "bg-primary border-primary")
              )}
            />
          );
        })}
      </div>

      {error && <p className="text-sm text-destructive">Incorrect passcode</p>}

      <div className="grid grid-cols-3 gap-4">
        {KEYS.map((key, i) =>
          key === "" ? (
            <div key={i} />
          ) : key === "back" ? (
            <button
              key={i}
              onClick={() => press(key)}
              disabled={pending}
              aria-label="Delete"
              className="flex size-16 items-center justify-center rounded-full text-muted-foreground transition-all active:scale-90 active:bg-secondary"
            >
              <Delete className="size-5" />
            </button>
          ) : (
            <button
              key={i}
              onClick={() => press(key)}
              disabled={pending}
              className="flex size-16 items-center justify-center rounded-full text-xl font-medium transition-all active:scale-90 active:bg-secondary"
            >
              {key}
            </button>
          )
        )}
      </div>
    </div>
  );
}
