"use client";
import { ReactNode, useEffect, useRef } from "react";

/** Progressive enhancement: content is always readable, even without an observer. */
export default function MotionSurface({ children, revision, busy }: { children: ReactNode; revision: string; busy: boolean }) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (preference.matches || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const element = entry.target as HTMLElement;
        element.dataset.revealed = "true";
        element.classList.add("reveal-enter");
        observer.unobserve(element);
      }
    }, { threshold: 0.06 });
    root.current?.querySelectorAll<HTMLElement>(".panel, .integrity-banner").forEach(element => {
      if (!element.dataset.revealed) observer.observe(element);
    });
    const stop = () => { if (preference.matches) observer.disconnect(); };
    preference.addEventListener("change", stop);
    return () => { observer.disconnect(); preference.removeEventListener("change", stop); };
  }, [revision, busy]);
  return <main ref={root} id="main" className="content" aria-busy={busy}>{children}</main>;
}
