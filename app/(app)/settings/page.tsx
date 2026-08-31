"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { LogOut, Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  isPushSupported,
  getExistingPushSubscription,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/utils/push";
import { toast } from "sonner";

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushSupported, setPushSupported] = useState(true);

  // Reflect the browser's actual subscription state on load (an external system).
  useEffect(() => {
    if (!isPushSupported()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from an external system (Push API) on mount
      setPushSupported(false);
      return;
    }
    getExistingPushSubscription().then((sub) => {
      setPushEnabled(!!sub);
    });
  }, []);

  async function togglePush(next: boolean) {
    setPushBusy(true);
    try {
      if (next) {
        await subscribeToPush();
        toast.success("Daily reminders enabled");
      } else {
        await unsubscribeFromPush();
        toast.success("Daily reminders disabled");
      }
      setPushEnabled(next);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPushBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6 px-4 pt-6">
      <h1 className="text-xl font-semibold">Settings</h1>

      <section className="flex flex-col gap-3">
        <p className="text-sm font-medium text-muted-foreground">Appearance</p>
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map((t) => (
            <button
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border border-border p-3 text-sm transition-colors",
                theme === t.value ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground"
              )}
            >
              <t.icon className="size-5" />
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {pushSupported && (
        <section className="flex flex-col gap-3">
          <p className="text-sm font-medium text-muted-foreground">Notifications</p>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">Daily reminders</p>
              <p className="text-xs text-muted-foreground">
                Get a nudge if you haven&apos;t logged anything by the evening
              </p>
            </div>
            <Switch checked={pushEnabled} disabled={pushBusy} onCheckedChange={togglePush} />
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <p className="text-sm font-medium text-muted-foreground">Account</p>
        <Button variant="outline" className="justify-start gap-2" onClick={logout}>
          <LogOut className="size-4" />
          Log out
        </Button>
      </section>
    </div>
  );
}
