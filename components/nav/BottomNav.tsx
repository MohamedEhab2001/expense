"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Receipt, Wallet, Plus, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PiggyBank, Sparkles, Tags, Settings, CreditCard } from "lucide-react";

const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/transactions", label: "Activity", icon: Receipt },
] as const;

const MORE_LINKS = [
  { href: "/accounts", label: "Accounts", icon: Wallet },
  { href: "/goals", label: "Savings Goals", icon: PiggyBank },
  { href: "/debts", label: "Debts", icon: CreditCard },
  { href: "/insights", label: "AI Insights", icon: Sparkles },
  { href: "/categories", label: "Categories", icon: Tags },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const inMore = MORE_LINKS.some((l) => l.href === pathname);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {TABS.slice(0, 1).map((tab) => (
          <NavItem key={tab.href} tab={tab} active={pathname === tab.href} />
        ))}

        <Link
          href="/transactions/new"
          aria-label="Add transaction"
          className="-mt-6 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-90"
        >
          <Plus className="size-6" />
        </Link>

        {TABS.slice(1).map((tab) => (
          <NavItem key={tab.href} tab={tab} active={pathname === tab.href} />
        ))}

        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger
            aria-label="More"
            className={cn(
              "relative flex flex-1 flex-col items-center gap-1 py-2 transition-colors",
              inMore ? "text-primary" : "text-muted-foreground active:text-foreground"
            )}
          >
            {inMore && (
              <motion.div
                layoutId="nav-active-pill"
                className="absolute inset-x-2 inset-y-0.5 rounded-xl bg-primary/10"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <Menu className="relative size-5" />
            <span className="relative text-[11px] font-medium">More</span>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>More</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-3 gap-3 px-4 pb-8">
              {MORE_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex flex-col items-center gap-2 rounded-xl border border-border bg-secondary/50 p-4 text-center transition-transform active:scale-95 active:bg-secondary"
                >
                  <link.icon className="size-5 text-primary" />
                  <span className="text-xs font-medium">{link.label}</span>
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}

function NavItem({
  tab,
  active,
}: {
  tab: { href: string; label: string; icon: typeof Home };
  active: boolean;
}) {
  return (
    <Link
      href={tab.href}
      className={cn(
        "relative flex flex-1 flex-col items-center gap-1 py-2 transition-colors",
        active ? "text-primary" : "text-muted-foreground active:text-foreground"
      )}
    >
      {active && (
        <motion.div
          layoutId="nav-active-pill"
          className="absolute inset-x-2 inset-y-0.5 rounded-xl bg-primary/10"
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        />
      )}
      <tab.icon className="relative size-5" />
      <span className="relative text-[11px] font-medium">{tab.label}</span>
    </Link>
  );
}
