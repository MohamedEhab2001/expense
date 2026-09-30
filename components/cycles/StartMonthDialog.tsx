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
  onStarted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStarted: () => void;
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
      onStarted();
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
            Budgets and spending pace reset from this day. Past transactions and balances stay as they are.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5 px-4">
          <Label htmlFor="cycle-start">Starts on</Label>
          <Input id="cycle-start" type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} />
        </div>

        <DialogFooter>
          <Button onClick={submit} disabled={saving || !date} className="w-full">
            {saving ? "Starting..." : "Start new month"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
