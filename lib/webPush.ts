import "server-only";
import webPush from "web-push";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) {
    throw new Error("VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT env vars are not set");
  }
  webPush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/** Sends a push notification to every saved subscription; prunes subscriptions the browser has revoked. */
export async function sendPushToAll(payload: PushPayload) {
  ensureConfigured();
  const { listSubscriptions, deleteSubscription } = await import("@/lib/services/pushService");

  const allSubscriptions = await listSubscriptions();
  const subscriptions = allSubscriptions.filter((sub) => !!sub.keys?.p256dh && !!sub.keys?.auth);

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.keys!.p256dh, auth: sub.keys!.auth },
        },
        JSON.stringify(payload)
      )
    )
  );

  await Promise.all(
    results.map((result, i) => {
      if (result.status === "rejected") {
        const statusCode = (result.reason as { statusCode?: number })?.statusCode;
        // Gone / Not Found: the browser revoked or expired this subscription.
        if (statusCode === 404 || statusCode === 410) {
          return deleteSubscription(subscriptions[i].endpoint);
        }
      }
      return Promise.resolve();
    })
  );

  return {
    sent: results.filter((r) => r.status === "fulfilled").length,
    total: subscriptions.length,
  };
}
