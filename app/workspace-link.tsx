"use client";

import { type ComponentPropsWithoutRef, type MouseEvent, useEffect, useState } from "react";

type WorkspaceLinkProps = Omit<ComponentPropsWithoutRef<"a">, "href"> & {
  href: string;
};

const transitionDuration = 140;
const transitionStorageKey = "current-workspace-transition";

export function WorkspaceLink({ href, onClick, children, ...props }: WorkspaceLinkProps) {
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (window.sessionStorage.getItem(transitionStorageKey) !== "pending") return;

    window.sessionStorage.removeItem(transitionStorageKey);
    root.dataset.workspaceTransition = "entering";
    const timer = window.setTimeout(() => {
      delete root.dataset.workspaceTransition;
    }, 320);

    return () => window.clearTimeout(timer);
  }, []);

  const navigate = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    event.preventDefault();
    if (isNavigating) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.location.assign(href);
      return;
    }

    setIsNavigating(true);
    window.sessionStorage.setItem(transitionStorageKey, "pending");
    document.documentElement.dataset.workspaceTransition = "leaving";
    window.setTimeout(() => window.location.assign(href), transitionDuration);
  };

  return <a {...props} href={href} aria-busy={isNavigating || undefined} onClick={navigate}>{children}</a>;
}
