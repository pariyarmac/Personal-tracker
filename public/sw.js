// ── SERVICE WORKER — Daily Tracker Reminders ──────────────────────────────

let bgIntervalId = null;
let pendingItems  = [];
let reminderIdx   = 0;

// ── Message from the app tab ───────────────────────────────────────────────
self.addEventListener("message", (e) => {
  if (e.data?.type === "START_REMINDERS") {
    pendingItems = e.data.pending || [];
    reminderIdx  = 0;
    // Clear any existing BG loop
    if (bgIntervalId) clearInterval(bgIntervalId);

    if (pendingItems.length === 0) return;

    // Fire every 10 s from the service worker — works in the background
    bgIntervalId = setInterval(() => {
      if (pendingItems.length === 0) { clearInterval(bgIntervalId); return; }
      const item = pendingItems[reminderIdx % pendingItems.length];
      reminderIdx++;
      self.registration.showNotification("Satyam · Daily Tracker 🗒", {
        body:     item.title + "\n" + item.body,
        icon:     "/vite.svg",
        badge:    "/vite.svg",
        tag:      "pending-reminder",
        renotify: true,
        silent:   false,
        data:     { url: self.location.origin },
      });
    }, 10000);
  }

  if (e.data?.type === "STOP_REMINDERS") {
    clearInterval(bgIntervalId);
    bgIntervalId = null;
  }

  if (e.data?.type === "UPDATE_PENDING") {
    pendingItems = e.data.pending || [];
    reminderIdx  = 0;
    if (pendingItems.length === 0) {
      clearInterval(bgIntervalId);
      bgIntervalId = null;
    }
  }
});

// ── Notification click → open / focus the app ─────────────────────────────
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const targetUrl = e.notification.data?.url || "/";
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      // Focus existing tab if open
      for (const client of list) {
        if (client.url.startsWith(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise open a new tab
      return clients.openWindow(targetUrl);
    })
  );
});
