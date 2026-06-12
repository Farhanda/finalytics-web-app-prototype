// Server-only Claude integration for Tahap 2: turn an uploaded project brief
// into a structured list of draft tasks.
//
// Uses the Anthropic SDK with structured outputs (output_config.format) so the
// model is constrained to a JSON schema — no fragile text parsing. Requires
// ANTHROPIC_API_KEY; `aiReady` is false until it's set, and callers surface a
// friendly "add your key" message rather than crashing.

import Anthropic from "@anthropic-ai/sdk";

import type { GeneratedTaskDraft, TaskCategory } from "./data";

export const aiReady = Boolean(process.env.ANTHROPIC_API_KEY);

const MODEL = "claude-opus-4-8";

const CATEGORIES: TaskCategory[] = [
  "Frontend",
  "Backend",
  "Design",
  "QA",
  "DevOps",
  "Research",
  "Other",
];

// Structured-outputs JSON schema. Note the constraints structured outputs allow:
// enums are fine; every object needs additionalProperties:false; no min/max.
const TASK_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    tasks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          category: { type: "string", enum: CATEGORIES },
          priority: { type: "string", enum: ["High", "Medium", "Low"] },
          description: { type: "string" },
        },
        required: ["name", "category", "priority", "description"],
      },
    },
  },
  required: ["tasks"],
} as const;

const SYSTEM_PROMPT = `You are a delivery lead at a software studio. Given a project brief, break it into concrete, actionable engineering tasks the team can pick up and assign.

Rules:
- Produce 5–20 tasks. Each is one shippable unit of work, not an epic.
- Set "category" to the discipline that owns it: Frontend, Backend, Design, QA, DevOps, Research, or Other.
- Set "priority" (High/Medium/Low) from what the brief implies is critical-path vs. nice-to-have.
- "name" is a short imperative title (e.g. "Build the login form"). "description" is 1–2 sentences of scope.
- Only include work the brief actually implies. Do not invent features, integrations, or scope that isn't supported by the document.`;

// Generate draft tasks from a document's extracted text. Throws when the API key
// is missing or the model declines/returns nothing usable.
export async function generateTasksFromDocument(opts: {
  projectName: string;
  text: string;
}): Promise<GeneratedTaskDraft[]> {
  if (!aiReady) throw new Error("ANTHROPIC_API_KEY is not set.");

  const client = new Anthropic();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "medium",
      format: { type: "json_schema", schema: TASK_SCHEMA },
    },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Project: ${opts.projectName}\n\nProject brief:\n${opts.text}`,
      },
    ],
  });

  if (response.stop_reason === "refusal")
    throw new Error("The model declined to process this document.");

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text")
    throw new Error("The model returned no structured output.");

  // Structured outputs guarantee the text is valid JSON matching TASK_SCHEMA.
  const parsed = JSON.parse(textBlock.text) as { tasks?: GeneratedTaskDraft[] };
  return parsed.tasks ?? [];
}
