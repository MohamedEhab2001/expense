export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 px-4 pt-6">
      <header>
        <p className="text-sm text-muted-foreground">Total balance</p>
        <p className="text-3xl font-semibold tabular-nums">$0.00</p>
      </header>

      <section className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        No accounts yet. Add one from the Accounts screen to get started.
      </section>
    </div>
  );
}
