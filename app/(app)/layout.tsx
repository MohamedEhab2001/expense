import { BottomNav } from "@/components/nav/BottomNav";
import { PageTransition } from "@/components/nav/PageTransition";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <main className="flex-1 pb-24">
        <PageTransition>{children}</PageTransition>
      </main>
      <BottomNav />
    </div>
  );
}
