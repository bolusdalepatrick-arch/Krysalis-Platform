import type { ShadowFacts } from "./types";
import { composeProgressUpdate } from "./deterministic";

/** The request-time Shadow selector (PRD 7.3). The deterministic agent is
 *  the default and the test target; the model-backed adapter is selected
 *  only when ANTHROPIC_API_KEY is set, and any failure falls back to the
 *  deterministic draft — so the Shadow always produces something, offline or
 *  not, and the build never requires a key. The adapter is imported lazily so
 *  it is never pulled into the deterministic path. */
export async function draftBodyFromFacts(facts: ShadowFacts): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return composeProgressUpdate(facts);
  }
  try {
    const { anthropicProgressUpdate } = await import("./anthropic");
    return await anthropicProgressUpdate(facts);
  } catch (error) {
    console.error("Shadow adapter failed; falling back to the deterministic draft.", error);
    return composeProgressUpdate(facts);
  }
}
