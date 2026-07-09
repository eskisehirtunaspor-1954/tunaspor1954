"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function getSessionId(): string {
  const key = "tunaspor_session_id";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}

export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        session_id: getSessionId(),
        device_type: isMobile ? "mobile" : "desktop",
      }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
