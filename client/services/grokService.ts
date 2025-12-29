import { Flashcard, MindMapNode, QuizQuestion, StudyMaterial } from "../types";

// Use full backend URL for Static Site deployment (relative paths don't work)
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const GROQ_PROXY_URL = `${API_BASE_URL.replace(/\/api$/, "")}/api/openrouter`;

console.log("🔧 Groq Service configured:", {
  apiBaseUrl: API_BASE_URL,
  groqProxyUrl: GROQ_PROXY_URL,
});

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Token limits for Groq API (qwen model has ~6000 TPM limit on free tier)
// Actual token ratio is closer to 3-3.5 chars per token for Ukrainian text
const MAX_INPUT_CHARS = 12000;
const MAX_CONTENT_CHARS = 8000; // For processContent - more conservative
const MAX_QUIZ_CONTENT_CHARS = 3000; // For quiz generation - very conservative to avoid rate limit

if (!GROQ_PROXY_URL) {
  console.error("❌ Groq proxy URL not configured");
}

// Note: The actual model is configured on the server via GROQ_MODEL env var
const MODEL_NAME = "qwen/qwen3-32b (or configured server model)";

// Sanitize mind map node recursively to ensure valid structure
function sanitizeMindMapNode(node?: MindMapNode | null): MindMapNode {
  if (!node || typeof node !== "object") {
    return {
      id: `n-${Math.random().toString(36).slice(2, 9)}`,
      label: "(без назви)",
      children: [],
    };
  }
  const sanitized: MindMapNode = {
    id: node.id || `n-${Math.random().toString(36).slice(2, 9)}`,
    label: node.label || "(без назви)",
    children: [],
  };
  if (Array.isArray(node.children) && node.children.length > 0) {
    sanitized.children = node.children
      .filter(Boolean)
      .map((c) => sanitizeMindMapNode(c));
  }
  return sanitized;
}

// Function to truncate text smartly (at sentence boundaries)
function truncateText(text: string | undefined, maxChars: number): string {
  if (!text) return "";
  if (text.length <= maxChars) return text;

  // Try to cut at sentence boundary
  const truncated = text.substring(0, maxChars);
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf("."),
    truncated.lastIndexOf("!"),
    truncated.lastIndexOf("?"),
    truncated.lastIndexOf("\n")
  );

  if (lastSentenceEnd > maxChars * 0.7) {
    return (
      truncated.substring(0, lastSentenceEnd + 1) +
      "\n\n[Текст скорочено через обмеження API]"
    );
  }

  return truncated + "...\n\n[Текст скорочено через обмеження API]";
}

// Helper function for retry logic with exponential backoff and rate limit handling
async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error as Error;

      // Handle rate limit (429) with exponential backoff
      if (error?.status === 429 || error?.message?.includes("rate_limit")) {
        const retryAfter = error?.retryAfter || (delay * Math.pow(2, i)) / 1000;
        const waitTime = Math.max(retryAfter * 1000, delay * Math.pow(2, i));
        console.warn(
          `⏳ Rate limit 429! Waiting ${(waitTime / 1000).toFixed(
            1
          )}s before retry ${i + 1}/${retries}...`
        );

        if (i < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      } else {
        // For other errors, normal backoff
        console.warn(
          `⚠️ Attempt ${i + 1}/${retries} failed:`,
          error?.message || error
        );

        if (i < retries - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, delay * Math.pow(2, i))
          );
        }
      }
    }
  }

  throw lastError;
}

// Parse JSON safely from AI response (handles markdown code blocks and XML thinking tags)
export function parseJsonSafely<T>(text: string): T {
  let cleaned = (text || "").trim();

  // Remove <think>...</think> tags (Groq's reasoning output)
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/g, "");

  // Remove leading BOM if present
  cleaned = cleaned.replace(/^\uFEFF/, "");

  // Trim again
  cleaned = cleaned.trim();

  // Remove markdown code blocks if present (```json...``` or ```...```)
  const codeBlockRegex = /```(?:json)?\s*\n([\s\S]*?)\n```/gi;
  const cbMatch = codeBlockRegex.exec(cleaned);

  if (cbMatch && cbMatch[1]) {
    cleaned = cbMatch[1].trim();
  } else if (cleaned.startsWith("```")) {
    // Fallback for non-standard formatting
    const lines = cleaned.split("\n");
    lines.shift(); // Remove first ```json or ``` line
    while (lines.length > 0 && lines[lines.length - 1].trim() === "```") {
      lines.pop();
    }
    cleaned = lines.join("\n").trim();
  }

  if (!cleaned) {
    throw new Error("Empty content after removing markdown blocks");
  }

  // Replace smart quotes converted by the model to regular quotes to help JSON parsing
  cleaned = cleaned.replace(/[“”«»]/g, '"').replace(/[‘’]/g, "'");

  // Helper: attempt to locate first JSON object/array in the text by scanning for braces and counting
  function findJsonSubstring(s: string): string | null {
    for (let i = 0; i < s.length; i++) {
      if (s[i] === "{" || s[i] === "[") {
        const openChar = s[i];
        const closeChar = openChar === "{" ? "}" : "]";
        let depth = 0;
        let inString = false;
        let escape = false;

        for (let j = i; j < s.length; j++) {
          const ch = s[j];
          if (escape) {
            escape = false;
            continue;
          }
          if (ch === "\\") {
            escape = true;
            continue;
          }
          if (ch === '"') {
            inString = !inString;
            continue;
          }
          if (inString) continue;
          if (ch === openChar) depth++;
          else if (ch === closeChar) depth--;
          if (depth === 0) {
            return s.substring(i, j + 1).trim();
          }
        }
      }
    }
    return null;
  }

  // Escape unescaped quotes inside JSON string values
  function escapeUnescapedQuotes(s: string): string {
    let result = "";
    let inString = false;
    let escape = false;

    for (let i = 0; i < s.length; i++) {
      const ch = s[i];

      if (escape) {
        result += ch;
        escape = false;
        continue;
      }

      if (ch === "\\") {
        result += ch;
        escape = true;
        continue;
      }

      if (ch === '"') {
        inString = !inString;
        result += ch;
        continue;
      }

      // If we're in a string and encounter a quote-like character, escape it
      if (inString && (ch === '"' || ch === '"' || ch === '"' || ch === '"')) {
        result += '\\"';
        continue;
      }

      result += ch;
    }

    return result;
  }

  // If the entire cleaned string is a JSON candidate, try it first, then attempt substring extraction
  try {
    return JSON.parse(cleaned);
  } catch (outerError) {
    // Not valid as a whole - look for a JSON substring
  }

  const jsonCandidate = findJsonSubstring(cleaned);
  if (jsonCandidate) {
    // Escape unescaped quotes first
    let tidy = escapeUnescapedQuotes(jsonCandidate);

    // clean trailing commas inside objects/arrays
    tidy = tidy.replace(/,\s*([}\]])/g, "$1");

    // Sanitize string contents: only convert raw newlines/tabs/backslashes inside JSON strings
    function sanitizeStringLiterals(s: string): string {
      let out = "";
      let inString = false;
      let quoteChar = "";
      let escape = false;

      for (let i = 0; i < s.length; i++) {
        const ch = s[i];

        if (escape) {
          out += ch;
          escape = false;
          continue;
        }

        if (ch === "\\") {
          // Keep backslashes as-is but set escape so next char is preserved
          out += "\\";
          escape = true;
          continue;
        }

        if (inString) {
          if (ch === quoteChar) {
            inString = false;
            out += ch;
            continue;
          }

          if (ch === "\n") {
            out += "\\n";
            continue;
          }
          if (ch === "\r") {
            out += "\\r";
            continue;
          }
          if (ch === "\t") {
            out += "\\t";
            continue;
          }

          // Otherwise append char as-is
          out += ch;
          continue;
        }

        // Not in string
        if (ch === '"' || ch === "'") {
          inString = true;
          quoteChar = ch;
          out += ch;
          continue;
        }

        out += ch;
      }

      return out;
    }

    tidy = sanitizeStringLiterals(tidy);

    // Escape unescaped quotes within string literals when they are not actual closers
    function escapeUnescapedQuotesInStrings(str: string): string {
      const arr = Array.from(str);
      let inString = false;
      let quoteChar = "";
      let escape = false;

      for (let i = 0; i < arr.length; i++) {
        const ch = arr[i];
        if (escape) {
          escape = false;
          continue;
        }
        if (ch === "\\") {
          escape = true;
          continue;
        }
        if (!inString) {
          if (ch === '"' || ch === "'") {
            inString = true;
            quoteChar = ch;
          }
          continue;
        }

        // inString
        if (ch === quoteChar) {
          // Look ahead to determine if this is an actual closing quote
          let k = i + 1;
          while (k < arr.length && /\s/.test(arr[k])) k++;
          const nextChar = k < arr.length ? arr[k] : "";
          if (
            nextChar === ":" ||
            nextChar === "," ||
            nextChar === "}" ||
            nextChar === "]" ||
            nextChar === ""
          ) {
            // Closing quote found
            inString = false;
            quoteChar = "";
            continue;
          }

          // Not a closing quote -> escape it
          arr.splice(i, 0, "\\");
          i++; // skip inserted backslash
        }
      }

      return arr.join("");
    }

    tidy = escapeUnescapedQuotesInStrings(tidy);

    // Replace unescaped backslashes inside strings with escaped backslashes where possible
    tidy = tidy.replace(/\\(?!["\\\/bfnrtu])/g, "\\\\");

    // Escape control characters outside strings conservatively (we already handled inside strings)
    tidy = tidy.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, (ch) => {
      const code = ch.charCodeAt(0);
      return `\\u${code.toString(16).padStart(4, "0")}`;
    });

    // Add quotes to unquoted object keys (simple heuristic for common key names)
    // Matches sequences of word chars and Cyrillic letters: letters / digits / underscore / hyphen
    tidy = tidy.replace(
      /([\{,]\s*)([A-Za-z0-9_\-\u0400-\u04FF\u00C0-\u024F]+)\s*:/gu,
      '$1"$2":'
    );

    try {
      return JSON.parse(tidy);
    } catch (innerError) {
      // Fallback: try to minimally sanitize common problems (e.g., single quotes)
      const replaceSingles = tidy.replace(/\'([\s\S]*?)\'/g, '"$1"');
      try {
        return JSON.parse(replaceSingles);
      } catch (finalError) {
        // Provide more helpful message including a preview of the candidate
        const preview = jsonCandidate.substring(0, 250);
        throw new Error(
          `Unable to parse JSON substring: ${
            finalError instanceof Error
              ? finalError.message
              : String(finalError)
          }; preview: ${preview}`
        );
      }
    }
  }

  // No JSON inside text; include preview in error for easier debugging
  const preview = cleaned.substring(0, 150);
  throw new Error(`No JSON found in output. Raw preview: ${preview}`);
}

// Rough language detection helper
function isLikelyUkrainian(text?: string): boolean {
  if (!text) return false;
  // Heuristic: presence of unique Ukrainian letters (ґ,є,і,ї) OR majority of Cyrillic characters
  const ukrUnique = /[ґҐєЄіІїЇ]/;
  if (ukrUnique.test(text)) return true;
  const letters = text.replace(/[^A-Za-zА-Яа-яЁёҐґЄєІіЇї]/g, "");
  if (!letters) return false;
  const cyrillicCount = letters.replace(/[^А-Яа-яЁёҐґЄєІіЇї]/g, "").length;
  return cyrillicCount / letters.length > 0.4;
}

// Calls Groq API and ensures the reply is Ukrainian; retries once with a stronger language-only prompt.
async function callGroqAPIEnsureUkrainian(
  messages: { role: string; content: string }[],
  temperature: number = 0.6,
  responseFormat?: { type: string }
) {
  const response = await callGroqAPI(messages, temperature, responseFormat);
  const responseObj: any =
    typeof response === "string" ? { content: response } : response;
  const text = responseObj.content;
  if (isLikelyUkrainian(text)) {
    responseObj.__enforcedLanguage = false;
    return responseObj;
  }

  // Re-prompt once to enforce Ukrainian language
  const retryMessages = [
    ...messages,
    {
      role: "user",
      content:
        "Відповідай ТІЛЬКИ українською мовою (українська), без англійських фраз. Якщо відповідаєш в JSON — також українською.",
    },
  ];

  const retryResp = await callGroqAPI(
    retryMessages,
    temperature,
    responseFormat
  );
  const retryObj: any =
    typeof retryResp === "string" ? { content: retryResp } : retryResp;
  const retryText = retryObj.content;
  if (isLikelyUkrainian(retryText)) {
    retryObj.__enforcedLanguage = true;
    return retryObj;
  }

  // As a final fallback, return the original response (avoid infinite re-prompt)
  return responseObj;
}

async function callGroqAPI(
  messages: { role: string; content: string }[],
  temperature: number = 0.6,
  responseFormat?: { type: string }
) {
  const requestBody: any = {
    messages,
    temperature,
  };

  if (responseFormat) {
    requestBody.response_format = responseFormat;
  }

  console.log("🤖 Calling Groq via proxy...", {
    messageCount: messages.length,
    totalChars: messages.reduce((sum, m) => sum + m.content.length, 0),
  });

  // Wrap in withRetry to handle rate limits automatically
  return withRetry(async () => {
    console.log("📡 Fetching from:", GROQ_PROXY_URL);

    const response = await fetch(GROQ_PROXY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log("📥 Response received:", {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get("content-type"),
    });

    if (!response.ok) {
      let errorText = "";
      try {
        errorText = await response.text();
        console.error("❌ Error response body:", errorText);
      } catch (readError) {
        console.error("❌ Failed to read error response:", readError);
      }

      const error: any = new Error(
        `Groq API error (${response.status}): ${errorText.substring(0, 200)}`
      );
      error.status = response.status;

      // Parse retry-after header for rate limits
      const retryAfter = response.headers.get("retry-after");
      if (retryAfter) {
        error.retryAfter = parseInt(retryAfter, 10);
      }

      if (response.status === 401 || response.status === 403) {
        throw new Error(`Invalid/Unauthorized API key for Groq`);
      }

      throw error;
    }

    let data;
    try {
      const responseText = await response.text();
      console.log("📄 Response text length:", responseText.length);

      if (!responseText || responseText.trim().length === 0) {
        throw new Error("Empty response body from server");
      }

      data = JSON.parse(responseText);
      console.log("✅ JSON parsed successfully:", {
        hasChoices: !!data.choices,
        choicesLength: data.choices?.length,
      });
    } catch (jsonError) {
      console.error("❌ Failed to parse JSON:", jsonError);
      throw new Error(
        `Invalid JSON response: ${
          jsonError instanceof Error ? jsonError.message : String(jsonError)
        }`
      );
    }

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("❌ Invalid response structure:", data);
      throw new Error("Invalid response structure from Groq API");
    }

    console.log(
      "✅ Groq API response successful, content length:",
      data.choices[0].message.content.length
    );

    return {
      content: data.choices[0].message.content,
    };
  });
}

export const processContent = async (
  text: string,
  title: string
): Promise<Omit<StudyMaterial, "id" | "createdAt">> => {
  // Validate input
  if (!text || text.trim().length === 0) {
    throw new Error("Вміст не може бути порожнім");
  }

  // Truncate text to stay within token limits
  const truncatedText = truncateText(text, MAX_CONTENT_CHARS);

  console.log("📝 Processing content...", {
    originalLength: text.length,
    truncatedLength: truncatedText.length,
    title,
  });

  const systemPrompt = `Ти — експертний освітній AI. Проаналізуй текст конспекту українською мовою.
Твої завдання:
1) Зроби стислий конспект (summary) до 300 слів;
2) Виділи 5-8 ключових термінів та їх визначення для глосарію;
3) Виділи список із 5 ключових фактів;
4) Створи ієрархічну структуру для ментальної карти (2-3 рівні);
5) Створи 8 флеш-карток (питання-відповідь).

ВАЖЛИВО: Поверни ВИКЛЮЧНО у форматі JSON у вигляді:
{
  "summary": "текст",
  "glossary": [{"term":"","definition":""}],
  "keyFacts": ["..."],
  "mindMap": {"id":"root","label":"...","children":[]},
  "flashcards": [{"question":"","answer":""}]
}`;

  const userPrompt = `Текст конспекту:\n\n${truncatedText}`;

  try {
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    // Use retry logic for reliability
    const responseObj = await withRetry(() =>
      callGroqAPIEnsureUkrainian(messages, 0.7)
    );
    console.log("📦 Parsing Groq response...");

    const responseText =
      typeof responseObj === "string" ? responseObj : responseObj.content;
    let data: {
      summary: string;
      glossary: { term: string; definition: string }[];
      keyFacts: string[];
      mindMap: MindMapNode;
      flashcards: { question: string; answer: string }[];
    };
    try {
      data = parseJsonSafely<{
        summary: string;
        glossary: { term: string; definition: string }[];
        keyFacts: string[];
        mindMap: MindMapNode;
        flashcards: { question: string; answer: string }[];
      }>(responseText);
    } catch (parseError) {
      console.warn(
        "⚠️ Initial JSON parse failed, attempting to re-prompt model for JSON-only output",
        parseError instanceof Error ? parseError.message : parseError
      );
      // Try to re-request strict JSON output once
      const rePromptMessages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content:
            userPrompt +
            "\n\nВАЖЛИВО: Поверни ВИКЛЮЧНО JSON, без жодних пояснень.",
        },
      ];

      try {
        const retryResponse = await callGroqAPIEnsureUkrainian(
          rePromptMessages,
          0.7
        );
        const retryText =
          typeof retryResponse === "string"
            ? retryResponse
            : retryResponse.content;
        try {
          data = parseJsonSafely<{
            summary: string;
            glossary: { term: string; definition: string }[];
            keyFacts: string[];
            mindMap: MindMapNode;
            flashcards: { question: string; answer: string }[];
          }>(retryText);
        } catch (secondError) {
          console.error(
            "❌ Failed to parse JSON after re-prompt:",
            secondError instanceof Error ? secondError.message : secondError
          );
          // Provide clearer error message
          const errorMsg =
            secondError instanceof Error
              ? secondError.message
              : "Invalid format";
          const fullMsg =
            "JSON parsing failed: " +
            errorMsg +
            ". Try again with shorter text.";
          throw new Error(fullMsg);
        }
      } catch (retryError) {
        console.error("❌ Re-prompt API call failed:", retryError);
        throw retryError;
      }
    }

    if (
      !data.summary ||
      !data.glossary ||
      !data.keyFacts ||
      !data.mindMap ||
      !data.flashcards
    ) {
      console.error(
        "❌ Missing required fields in response:",
        Object.keys(data)
      );
      throw new Error("Incomplete data from AI");
    }

    const processedFlashcards: Flashcard[] = data.flashcards.map(
      (fc, index: number) => ({
        id: "fc-" + Date.now() + "-" + index,
        question: fc.question,
        answer: fc.answer,
        status: "new" as const,
      })
    );

    // Sanitize mindMap to ensure valid structure
    const sanitizedMindMap = sanitizeMindMapNode(data.mindMap);

    console.log("✅ Content processed successfully");

    return {
      title: title || "Новий матеріал",
      originalContent: text,
      summary: data.summary,
      glossary: data.glossary,
      keyFacts: data.keyFacts,
      mindMap: sanitizedMindMap,
      flashcards: processedFlashcards,
    };
  } catch (error: unknown) {
    console.error("❌❌❌ Error processing content:", {
      errorType: error?.constructor?.name,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error("Failed to process material: " + errorMessage);
  }
};

export const generateQuiz = async (
  content: string,
  difficulty: string = "medium"
): Promise<QuizQuestion[]> => {
  // Validate input
  if (!content || content.trim().length === 0) {
    throw new Error("Вміст для генерації тесту не може бути порожнім");
  }

  // Use MUCH smaller truncation for quiz to avoid rate limiting
  // Quiz generation happens right after content processing, so we're already using tokens
  const truncatedContent = truncateText(content, MAX_QUIZ_CONTENT_CHARS);

  // Determine question count based on difficulty
  const questionCount =
    difficulty === "easy" ? 10 : difficulty === "hard" ? 15 : 12;

  const difficultyText =
    difficulty === "easy"
      ? "easy (basic concepts)"
      : difficulty === "hard"
      ? "hard (deep knowledge)"
      : "medium";

  const systemPrompt = `Ти — експерт з тестування. Створи ${questionCount} питань на основі ключових пунктів.
Рівень: ${
    difficulty === "easy"
      ? "легкий"
      : difficulty === "hard"
      ? "важкий"
      : "середній"
  }.
Мова: Українська.
Поверни ВИКЛЮЧНО JSON масив у форматі: [{"id":"q1","type":"multiple_choice","question":"?","options":["A","B","C","D"],"correctAnswer":"A","explanation":"..."}]`;

  const userPrompt = `КЛЮЧОВІ ПУНКТИ:\n${truncatedContent}`;

  try {
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    let responseObj = await callGroqAPIEnsureUkrainian(messages, 0.7);
    let questions: QuizQuestion[] = [];
    try {
      const raw =
        typeof responseObj === "string" ? responseObj : responseObj.content;
      const parsed = parseJsonSafely<any>(raw);
      questions = Array.isArray(parsed)
        ? parsed
        : parsed.questions || parsed.quiz || [];
    } catch (parseError) {
      console.warn(
        "⚠️ Quiz JSON parse failed, attempting to re-prompt model to return strict JSON format",
        parseError instanceof Error ? parseError.message : parseError
      );
      // Re-prompt for strict JSON
      const rePromptMessages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: userPrompt + "\n\nПоверни ВИКЛЮЧНО JSON масив без пояснень.",
        },
      ];
      try {
        responseObj = await callGroqAPIEnsureUkrainian(rePromptMessages, 0.7);
        try {
          const raw =
            typeof responseObj === "string" ? responseObj : responseObj.content;
          const parsed = parseJsonSafely<any>(raw);
          questions = Array.isArray(parsed)
            ? parsed
            : parsed.questions || parsed.quiz || [];
        } catch (parseError2) {
          console.error(
            "❌ JSON parse error in quiz generation (after retry):",
            (parseError2 as Error).message
          );
          const response = responseObj as any;
          const preview =
            typeof response === "string"
              ? response.substring(0, 200)
              : response.content?.substring?.(0, 200) || "";
          console.warn("Raw response preview:", preview);
          questions = [];
        }
      } catch (retryError) {
        console.error("❌ Quiz generation retry failed:", retryError);
        questions = [];
      }
    }

    return questions;
  } catch (error) {
    console.error("❌ Quiz generation error:", error);
    return [];
  }
};

// Grok chat implementation
class GrokChat {
  private context: string;
  private conversationHistory: Array<{ role: string; content: string }> = [];
  private systemPrompt: string;

  constructor(context?: string) {
    this.context = context || "";
    const contextPreview = this.context.substring(0, 30000);
    this.systemPrompt = `Ти — доброзичливий репетитор ExamNinja. Твоя мета — допомогти користувачеві зрозуміти матеріал.
Пояснюй просто, наводь аналогії з реального життя.
Якщо питання не стосується контексту, ввічливо спробуй повернути розмову до теми, але відповідай.
Мова: Українська.

КОНТЕКСТ МАТЕРІАЛУ:\n${contextPreview}`;

    this.conversationHistory.push({
      role: "system",
      content: this.systemPrompt,
    });
  }

  // Restore conversation from persisted UI messages (ChatMessage[] format)
  restoreConversation(
    externalMessages: {
      id: string;
      role: "user" | "model";
      text: string;
      timestamp: number;
    }[]
  ) {
    const mapped = externalMessages.map((m) => ({
      role: m.role === "model" ? ("assistant" as const) : ("user" as const),
      content: m.text,
    }));
    this.conversationHistory = [
      { role: "system", content: this.systemPrompt },
      ...mapped,
    ];
  }

  // Expose a way to get internal messages for debugging (not required for production)
  getConversationHistory() {
    return this.conversationHistory;
  }

  async sendMessage(params: {
    message: string;
  }): Promise<{ text: string; enforcedLanguage?: boolean }> {
    this.conversationHistory.push({
      role: "user",
      content: params.message,
    });

    try {
      const responseObj: any = await callGroqAPIEnsureUkrainian(
        this.conversationHistory,
        0.7
      );
      const responseText = responseObj.content;
      const enforcedLanguage = !!responseObj.__enforcedLanguage;

      this.conversationHistory.push({
        role: "assistant",
        content: responseText,
      });

      // Keep conversation history manageable (last 10 messages)
      if (this.conversationHistory.length > 11) {
        this.conversationHistory = [
          this.conversationHistory[0], // Keep system message
          ...this.conversationHistory.slice(-10),
        ];
      }

      return { text: responseText, enforcedLanguage };
    } catch (error) {
      console.error("Grok chat error:", error);
      return {
        text: "Вибачте, виникла помилка при обробці вашого повідомлення.",
      };
    }
  }
}

export const createStudyChat = (context?: string): GrokChat => {
  return new GrokChat(context);
};

export const explainConcept = async (
  concept: string,
  context?: string
): Promise<string> => {
  const contextSnippet = (context || "").substring(0, 5000);
  const messages = [
    {
      role: "system",
      content:
        "Ти — доброзичливий вчитель. Пояснюй терміни просто та зрозуміло. Мова: Українська.",
    },
    {
      role: "user",
      content: `Поясни термін або фразу "${concept}" максимально просто, "як для друга".\nКонтекст: ${contextSnippet}`,
    },
  ];

  try {
    const responseObj = await callGroqAPIEnsureUkrainian(messages, 0.7);
    const responseText =
      typeof responseObj === "string" ? responseObj : responseObj.content;
    return responseText || "Failed to explain.";
  } catch (error) {
    console.error("Explain concept error:", error);
    return "Error generating explanation.";
  }
};
