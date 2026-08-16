import { ENV } from "./env";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4" ;
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

const ensureArray = (
  value: MessageContent | MessageContent[]
): MessageContent[] => (Array.isArray(value) ? value : [value]);

const normalizeContentPart = (
  part: MessageContent
): TextContent | ImageContent | FileContent => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }

  if (part.type === "text") {
    return part;
  }

  if (part.type === "image_url") {
    return part;
  }

  if (part.type === "file_url") {
    return part;
  }

  throw new Error("Unsupported message content part");
};

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id } = message;

  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content)
      .map(part => (typeof part === "string" ? part : JSON.stringify(part)))
      .join("\n");

    return {
      role,
      name,
      tool_call_id,
      content,
    };
  }

  const contentParts = ensureArray(message.content).map(normalizeContentPart);

  // If there's only text content, collapse to a single string for compatibility
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text,
    };
  }

  return {
    role,
    name,
    content: contentParts,
  };
};

const normalizeToolChoice = (
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined
): "none" | "auto" | ToolChoiceExplicit | undefined => {
  if (!toolChoice) return undefined;

  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }

  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }

    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }

    return {
      type: "function",
      function: { name: tools[0].function.name },
    };
  }

  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name },
    };
  }

  return toolChoice;
};

const resolveApiUrl = () => {
  const url = ENV.forgeApiUrl?.trim();
  if (url && !url.includes("forge.manus.im")) {
    const cleanUrl = url.replace(/\/$/, "");
    return cleanUrl.endsWith("/v1/chat/completions")
      ? cleanUrl
      : `${cleanUrl}/v1/chat/completions`;
  }
  return "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
};

const assertApiKey = () => {
  if (!ENV.forgeApiKey) {
    throw new Error(
      "GEMINI_API_KEY (or BUILT_IN_FORGE_API_KEY / GOOGLE_API_KEY) is not configured"
    );
  }
};

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}):
  | { type: "json_schema"; json_schema: JsonSchema }
  | { type: "text" }
  | { type: "json_object" }
  | undefined => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (
      explicitFormat.type === "json_schema" &&
      !explicitFormat.json_schema?.schema
    ) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;

  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  assertApiKey();

  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
  } = params;

  const targetUrl = resolveApiUrl();
  const isDirectGemini = targetUrl.includes("generativelanguage.googleapis.com");

  const buildPayload = (modelName: string) => {
    const payload: Record<string, unknown> = {
      model: modelName,
      messages: messages.map(normalizeMessage),
    };

    if (tools && tools.length > 0) {
      payload.tools = tools;
    }

    const normalizedToolChoice = normalizeToolChoice(
      toolChoice || tool_choice,
      tools
    );
    if (normalizedToolChoice) {
      payload.tool_choice = normalizedToolChoice;
    }

    payload.max_tokens = 32768;

    if (!isDirectGemini) {
      payload.thinking = {
        budget_tokens: 128,
      };
    }

    const normalizedResponseFormat = normalizeResponseFormat({
      responseFormat,
      response_format,
      outputSchema,
      output_schema,
    });

    if (normalizedResponseFormat) {
      payload.response_format = normalizedResponseFormat;
    }

    return payload;
  };

  const executeRequest = async (modelName: string) => {
    const payload = buildPayload(modelName);
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
      },
      body: JSON.stringify(payload),
    });

    return response;
  };

  let modelToUse = "gemini-3.6-flash";
  let response = await executeRequest(modelToUse);

  // Fallback if gemini-3.6-flash is not available
  if (!response.ok && isDirectGemini && (response.status === 404 || response.status === 429)) {
    modelToUse = "gemini-flash-latest";
    response = await executeRequest(modelToUse);
  }

  if (!response.ok && isDirectGemini && (response.status === 404 || response.status === 429)) {
    modelToUse = "gemini-3.5-flash";
    response = await executeRequest(modelToUse);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`
    );
  }

  return (await response.json()) as InvokeResult;
}

/**
 * Robustly extract JSON from an LLM response string.
 * Handles markdown code blocks (```json...```) that Gemini often wraps responses in.
 */
export function extractJSON<T = unknown>(raw: string): T {
  if (!raw) throw new Error('Empty LLM response');

  // 1. Strip markdown code block: ```json ... ``` or ``` ... ``` (handles unclosed blocks too)
  const codeBlockMatch = raw.match(/```(?:json|JSON)?\s*([\s\S]*?)(?:```|$)/);
  if (codeBlockMatch) {
    try { return JSON.parse(codeBlockMatch[1].trim()) as T; } catch { /* fall through */ }
  }

  // 2. Try the whole string as JSON
  try { return JSON.parse(raw.trim()) as T; } catch { /* fall through */ }

  // 3. Find a JSON object {...}
  const objMatch = raw.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try { return JSON.parse(objMatch[0]) as T; } catch { /* fall through */ }
  }

  // 4. Find a JSON array [...]
  const arrMatch = raw.match(/\[[\s\S]*\]/);
  if (arrMatch) {
    try { return JSON.parse(arrMatch[0]) as T; } catch { /* fall through */ }
  }

  throw new Error(`No valid JSON found in LLM response: ${raw.substring(0, 200)}`);
}

/**
 * Extract the text content from an LLM InvokeResult.
 */
export function extractText(response: InvokeResult): string {
  const content = response?.choices?.[0]?.message?.content;
  return typeof content === 'string' ? content : JSON.stringify(content) || '';
}
