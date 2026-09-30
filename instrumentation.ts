export function register() {
  // Transaction dates are stored as UTC midnight of the user's day, so server-side date math
  // (startOfMonth, endOfDay, ...) must run in UTC too. Vercel already does; this makes local
  // dev match. The user's own timezone comes in through appNow() in lib/utils/dates.ts.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    process.env.TZ = "UTC";
  }
}
