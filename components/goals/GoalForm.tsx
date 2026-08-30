"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconPicker, ColorPicker } from "@/components/shared/IconColorPicker";
import { GOAL_ICON_OPTIONS } from "@/lib/icon-map";
import { postJSON } from "@/lib/fetcher";
import { useAccounts } from "@/lib/queries";
import { toCents } from "@/lib/utils/currency";
import { toast } from "sonner";

export function GoalForm({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const { data: accounts } = useAccounts();
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [linkedAccountId, setLinkedAccountId] = useState<string>("none");
  const [icon, setIcon] = useState("target");
  const [color, setColor] = useState("#34D399");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!name.trim()) return toast.error("Name is required");
    const cents = toCents(Number(targetAmount));
    if (!cents || cents <= 0) return toast.error("Enter a valid target amount");

    setSaving(true);
    try {
      await postJSON("/api/goals", {
        name: name.trim(),
        targetAmount: cents,
        targetDate: targetDate || undefined,
        linkedAccountId: linkedAccountId === "none" ? undefined : linkedAccountId,
        icon,
        color,
      });
      toast.success("Goal created");
      onSaved();
      onOpenChange(false);
      setName("");
      setTargetAmount("");
      setTargetDate("");
      setLinkedAccountId("none");
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
          <DialogTitle>New savings goal</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="goal-name">Name</Label>
            <Input id="goal-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Emergency Fund" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="goal-amount">Target amount</Label>
            <Input
              id="goal-amount"
              type="number"
              inputMode="decimal"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="goal-date">Target date (optional)</Label>
            <Input id="goal-date" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Link to account (optional)</Label>
            <Select value={linkedAccountId} onValueChange={(v) => setLinkedAccountId(v ?? "none")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None — track manually</SelectItem>
                {accounts?.map((a) => (
                  <SelectItem key={a._id} value={a._id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Icon</Label>
            <IconPicker options={GOAL_ICON_OPTIONS} value={icon} onChange={setIcon} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Color</Label>
            <ColorPicker value={color} onChange={setColor} />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={submit} disabled={saving} className="w-full">
            {saving ? "Saving..." : "Create goal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
