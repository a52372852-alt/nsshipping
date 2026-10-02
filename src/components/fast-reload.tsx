"use client";

import { useEffect, useState } from "react";

export function FastReload() {
  const [updated, setUpdated] = useState(false);
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator)
    )
      return;
    const alreadyControlled = !!navigator.serviceWorker.controller;
    const onControllerChange = () => {
      // Never reload automatically: unsaved order edits must remain in memory.
      if (alreadyControlled) setUpdated(true);
    };
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );
    const register = () => {
      void navigator.serviceWorker
        .register("/shipping-cache-worker.js", {
          scope: "/",
          updateViaCache: "none",
        })
        .catch(() => {
          /* Browsers without storage continue using the normal network path. */
        });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
    return () => {
      window.removeEventListener("load", register);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
    };
  }, []);
  return updated ? (
    <aside
      role="status"
      className="notice"
      style={{
        position: "fixed",
        bottom: 16,
        left: 16,
        right: 16,
        zIndex: 100,
        margin: 0,
      }}
    >
      <span>
        새 버전이 준비되었습니다. 진행 중인 주문을 다운로드한 뒤
        새로고침해주세요.
      </span>
    </aside>
  ) : null;
}
