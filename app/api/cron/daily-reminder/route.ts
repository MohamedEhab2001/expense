import { NextRequest, NextResponse } from "next/server";
import { hasTransactionOnDate } from "@/lib/services/transactionService";
import { sendPushToAll } from "@/lib/webPush";
import { CRON_SECRET } from "@/lib/pushConfig";

export async function GET(req: NextRequest) {
  const authorized =
    req.headers.get("authorization") === `Bearer ${CRON_SECRET}` ||
    req.nextUrl.searchParams.get("secret") === CRON_SECRET;
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loggedToday = await hasTransactionOnDate(new Date());
  if (loggedToday) {
    return NextResponse.json({ skipped: true, reason: "already logged today" });
  }

  try {
    const result = await sendPushToAll({
      title: "Don't forget to log today 📒",
      body: "You haven't logged any income or expenses today — add them now while they're fresh.",
      url: "/transactions/new",
    });
    return NextResponse.json({ skipped: false, ...result });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
