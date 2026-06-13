"use client";

import { useEffect, useState } from "react";
import { Pause, Play } from "lucide-react";

export interface InfoBarItem {
  id: string;
  text: string;
  href?: string | null;
}

function ItemText({ item }: { item: InfoBarItem }) {
  if (item.href) {
    return (
      <a href={item.href} className="text-accent underline-offset-2 hover:underline">
        {item.text}
      </a>
    );
  }
  return <span>{item.text}</span>;
}

/**
 * Rotating portal announcements (PRD 7.8): one message at a time on an 8s
 * interval with a quiet pause control. Visitors who prefer reduced motion get
 * the full list, static. Swaps are instant — no animation.
 */
export default function InfoBar({ messages }: { messages: InfoBarItem[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion || messages.length < 2) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [paused, reducedMotion, messages.length]);

  if (messages.length === 0) return null;

  if (reducedMotion) {
    return (
      <ul className="space-y-1 rounded-s bg-inset px-4 py-2.5 text-sm text-secondary">
        {messages.map((item) => (
          <li key={item.id}>
            <ItemText item={item} />
          </li>
        ))}
      </ul>
    );
  }

  const current = messages[index % messages.length];

  return (
    <div className="flex items-center justify-between gap-4 rounded-s bg-inset px-4 py-2.5 text-sm text-secondary">
      <ItemText item={current} />
      <button
        type="button"
        onClick={() => setPaused((value) => !value)}
        aria-label={paused ? "Resume announcements" : "Pause announcements"}
        className="shrink-0 text-muted hover:text-primary"
      >
        {paused ? (
          <Play size={16} strokeWidth={1.5} aria-hidden />
        ) : (
          <Pause size={16} strokeWidth={1.5} aria-hidden />
        )}
      </button>
    </div>
  );
}
