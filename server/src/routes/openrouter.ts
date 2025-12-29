import express from "express";
import { Groq } from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
// Available models: llama-3.3-70b-versatile, llama-3.1-8b-instant, qwen/qwen3-32b
// Use llama-3.3-70b-versatile as fallback if model is not accessible
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { messages, temperature } = req.body;

    console.log("📨 Received request:", {
      messagesCount: messages?.length,
      temperature,
      hasApiKey: !!GROQ_API_KEY,
      model: GROQ_MODEL,
    });

    if (!GROQ_API_KEY) {
      console.error("❌ GROQ_API_KEY not configured");
      return res
        .status(500)
        .json({ error: "Groq API key not configured on server" });
    }

    if (!messages || !Array.isArray(messages)) {
      console.error("❌ Invalid messages format:", messages);
      return res.status(400).json({ error: "Messages must be an array" });
    }

    const client = new Groq({ apiKey: GROQ_API_KEY });

    console.log(
      `🤖 Calling Groq with model: ${GROQ_MODEL}, messages: ${messages.length}`
    );
    console.log(
      "📝 First message preview:",
      messages[0]?.content?.substring(0, 100)
    );

    const completion = await client.chat.completions.create({
      model: GROQ_MODEL,
      messages: messages,
      temperature: temperature || 0.6,
      max_tokens: 4096,
    });

    console.log("✅ Groq API response successful:", {
      choices: completion.choices?.length,
      contentLength: completion.choices?.[0]?.message?.content?.length,
      finishReason: completion.choices?.[0]?.finish_reason,
    });

    res.json(completion);
  } catch (error: any) {
    console.error("❌ Groq API error:", {
      status: error.status,
      message: error.message,
      code: error.code,
      model: GROQ_MODEL,
      fullError: error,
    });

    // Provide more helpful error messages
    if (error.status === 404) {
      console.error(
        `Model "${GROQ_MODEL}" returned 404 - may not be accessible`
      );
      return res.status(400).json({
        error: `Model "${GROQ_MODEL}" not found or not accessible with this API key.`,
        suggestion:
          "Try using llama-3.3-70b-versatile instead (production model)",
        availableModels: [
          "llama-3.3-70b-versatile",
          "llama-3.1-8b-instant",
          "qwen/qwen3-32b",
        ],
      });
    }
    if (error.status === 401 || error.message?.includes("401")) {
      console.error("Invalid API key or authentication failed");
      return res
        .status(401)
        .json({
          error:
            "Invalid Groq API key. Check GROQ_API_KEY environment variable.",
        });
    }
    if (error.status === 429 || error.message?.includes("429")) {
      console.error("Rate limited");
      return res
        .status(429)
        .json({ error: "Rate limited by Groq API. Please try again later." });
    }

    res.status(500).json({ error: error.message || "Groq API error" });
  }
});

export default router;
