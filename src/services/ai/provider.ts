import { AISettings } from "../../types";

async function callOpenAI(settings: AISettings, system: string, prompt: string, signal: AbortSignal): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: settings.model || "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      temperature: 0.9,
      response_format: { type: "json_object" },
    }),
    signal,
  });
  if (!res.ok) throw new Error(`OpenAI request failed: ${res.status}`);
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? "";
}

async function callAnthropic(settings: AISettings, system: string, prompt: string, signal: AbortSignal): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": settings.apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: settings.model || "claude-sonnet-5",
      max_tokens: 4096,
      system,
      messages: [{ role: "user", content: prompt }],
    }),
    signal,
  });
  if (!res.ok) throw new Error(`Anthropic request failed: ${res.status}`);
  const json = await res.json();
  return json.content?.[0]?.text ?? "";
}

export async function complete(settings: AISettings, system: string, prompt: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    if (settings.provider === "openai") return await callOpenAI(settings, system, prompt, controller.signal);
    if (settings.provider === "anthropic") return await callAnthropic(settings, system, prompt, controller.signal);
    throw new Error("No live provider configured");
  } finally {
    clearTimeout(timeout);
  }
}

export function parseJsonLoose<T>(text: string): T | null {
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function withAI<T>(settings: AISettings, system: string, prompt: string, mock: () => T): Promise<T> {
  if (settings.provider === "mock" || !settings.apiKey) return mock();
  try {
    const text = await complete(settings, system, prompt);
    const parsed = parseJsonLoose<T>(text);
    return parsed ?? mock();
  } catch {
    return mock();
  }
}
