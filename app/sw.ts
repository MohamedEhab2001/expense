/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import { Serwist } from "serwist";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher: ({ request }: { request: Request }) => request.destination === "document",
      },
    ],
  },
});

serwist.addEventListeners();

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

self.addEventListener("push", (event: PushEvent) => {
  let payload: PushPayload = { title: "Me Tracker", body: "You have a new notification." };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    // ignore malformed payloads, fall back to the default above
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: payload.url ?? "/" },
    })
  );
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const url = (event.notification.data as { url?: string })?.url ?? "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clientList) => {
      const client = clientList.find((c) => "focus" in c) as WindowClient | undefined;
      if (client) {
        await client.navigate(url);
        return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
