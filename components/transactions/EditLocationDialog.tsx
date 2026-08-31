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
import { postJSON } from "@/lib/fetcher";
import type { TransactionDTO } from "@/lib/types";
import { toast } from "sonner";

export function EditLocationDialog({
  transaction,
  open,
  onOpenChange,
  onSaved,
}: {
  transaction: TransactionDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [city, setCity] = useState(transaction.location?.city ?? "");
  const [governorate, setGovernorate] = useState(transaction.location?.governorate ?? "");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      await postJSON(
        `/api/transactions/${transaction._id}/location`,
        { city: city.trim() || undefined, governorate: governorate.trim() || undefined },
        "PATCH"
      );
      toast.success("Location updated");
      onSaved();
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
          <DialogTitle>Set location</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="loc-city">City</Label>
            <Input id="loc-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cairo" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="loc-governorate">Governorate</Label>
            <Input
              id="loc-governorate"
              value={governorate}
              onChange={(e) => setGovernorate(e.target.value)}
              placeholder="Cairo Governorate"
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={submit} disabled={saving} className="w-full">
            {saving ? "Saving..." : "Save location"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
