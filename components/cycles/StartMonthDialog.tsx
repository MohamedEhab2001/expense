"use client";

import { useState } from "react";
import { format, parse } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { postJSON } from "@/lib/fetcher";
import { toast } from "sonner";

export function StartMonthDialog({
  open,
  onOpenChange,
  currentStart,
  onChanged,
  onUndo,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStart: Date | null;
  onChanged: () => void;
  onUndo: () => Promise<void>;
}) {
  const today = format(new Date(), "yyyy-MM-dd");
  const [date, setDate] = useState(today);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      // Sent as a plain day, like transaction dates, so both line up on the same day boundary.
      await postJSON("/api/cycles", { startDate: date });
      toast.success(`New month started on ${format(parse(date, "yyyy-MM-dd", new Date()), "MMM d")}`);
      onChanged();
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start new month</DialogTitle>
          <DialogDescription>
            Pick the day your salary came in. Budgets, &quot;spent this month&quot; and spending pace count from that
            day. Balances and past transactions stay as they are.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5 px-4">
          <Label htmlFor="cycle-start">Starts on</Label>
          <Input id="cycle-start" type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} />
          <p className="text-xs text-muted-foreground">
            {currentStart
              ? `Current month started ${format(currentStart, "MMM d")}.`
              : "You're on calendar months until you start one."}
          </p>
        </div>

        <DialogFooter>
          {currentStart && (
            <Button
              variant="ghost"
              disabled={saving}
              className="w-full text-muted-foreground"
              onClick={async () => {
                setSaving(true);
                await onUndo();
                setSaving(false);
                onOpenChange(false);
              }}
            >
              Undo month started {format(currentStart, "MMM d")}
            </Button>
          )}
          <Button onClick={submit} disabled={saving || !date} className="w-full">
            {saving ? "Starting..." : "Start new month"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
