"use client";

import { useEffect, useRef } from "react";
import { markWelcomeSeen } from "@/app/actions/onboarding";

/** Records the first-visit landing once per session (PRD 7.13), so the
 *  Today view stops redirecting here after the new hire has seen it. Renders
 *  nothing. */
export default function WelcomeSeenMarker() {
  const marked = useRef(false);
  useEffect(() => {
    if (marked.current) return;
    marked.current = true;
    void markWelcomeSeen();
  }, []);
  return null;
}
