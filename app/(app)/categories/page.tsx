import { Tags } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

export default function CategoriesPage() {
  return (
    <div className="flex flex-col gap-4 px-4 pt-6">
      <h1 className="text-xl font-semibold">Categories</h1>
      <EmptyState
        icon={Tags}
        title="Default categories coming soon"
        description="Categories will be seeded automatically once you add your first transaction."
      />
    </div>
  );
}
