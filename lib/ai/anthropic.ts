import Anthropic from "@anthropic-ai/sdk";

export const DEFAULT_MODEL = "claude-opus-4-8";

let client: Anthropic | null = null;

// Lazy so builds/environments without ANTHROPIC_API_KEY don't crash at import time.
export function getAnthropic(): Anthropic {
  if (!client) {
    client = new Anthropic();
  }
  return client;
}
