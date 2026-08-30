import { PlusCircle } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

export default function NewTransactionPage() {
  return (
    <div className="flex flex-col gap-4 px-4 pt-6">
      <h1 className="text-xl font-semibold">Add transaction</h1>
      <EmptyState
        icon={PlusCircle}
        title="Coming soon"
        description="The quick-add flow lands in the next build phase, once accounts exist to log against."
      />
    </div>
  );
}
