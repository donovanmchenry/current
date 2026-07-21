"use client";

import { useRouter } from "next/navigation";
import { type ComponentPropsWithoutRef, type MouseEvent, useEffect, useState } from "react";

type WorkspaceLinkProps = Omit<ComponentPropsWithoutRef<"a">, "href"> & {
  href: string;
};

const transitionDuration = 140;

export function WorkspaceLink({ href, onClick, children, ...props }: WorkspaceLinkProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    router.prefetch(href);

    const root = document.documentElement;
    if (root.dataset.workspaceTransition !== "leaving") return;

    root.dataset.workspaceTransition = "entering";
    const timer = window.setTimeout(() => {
      delete root.dataset.workspaceTransition;
    }, 320);

    return () => window.clearTimeout(timer);
  }, [href, router]);

  const navigate = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    event.preventDefault();
    if (isNavigating) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      router.push(href);
      return;
    }

    setIsNavigating(true);
    document.documentElement.dataset.workspaceTransition = "leaving";
    window.setTimeout(() => router.push(href), transitionDuration);
  };

  return <a {...props} href={href} aria-busy={isNavigating || undefined} onClick={navigate}>{children}</a>;
}
