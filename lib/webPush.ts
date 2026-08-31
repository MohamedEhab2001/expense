import "server-only";
import webPush from "web-push";
import { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } from "@/lib/pushConfig";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
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
