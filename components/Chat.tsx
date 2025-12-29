import React, { useState, useEffect, useRef } from "react";
import { ChatMessage } from "../types";
import { createStudyChat } from "../services/grokService";
import { Send, User, Bot, Loader2, Sparkles, AlertCircle } from "lucide-react";
import MessageContent from "./MessageContent";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/apiClient";

interface ChatProps {
  context?: string;
  chatId?: string;
}

export const Chat: React.FC<ChatProps> = ({ context, chatId }) => {
  const { isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [contextStatus, setContextStatus] = useState<
    "loading" | "loaded" | "error"
  >("loading");
  const [error, setError] = useState<string>("");
  const chatSessionRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const syncingRef = useRef(false);

  useEffect(() => {
    if (context && context.trim().length > 0) {
      try {
        chatSessionRef.current = createStudyChat(context);
        setContextStatus("loaded");
        setError("");
      } catch (err) {
        console.error("Failed to initialize chat with context:", err);
        setContextStatus("error");
        setError("Помилка при завантаженні контексту");
      }
    } else {
      chatSessionRef.current = createStudyChat("");
      setContextStatus("error");
      setError("Контекст не знайдено");
    }
  }, [context]);

  // Persisted chat key - prefer explicit chatId if provided, otherwise hash the context
  const computeKey = (id?: string, ctx?: string) => {
    if (id) return `examninja_chat:${id}`;
    if (!ctx) return `examninja_chat:global`;
    let hash = 0;
    for (let i = 0; i < ctx.length; i++) {
      // simple 32-bit hash
      // eslint-disable-next-line no-bitwise
      hash = (hash << 5) - hash + ctx.charCodeAt(i);
      // eslint-disable-next-line no-bitwise
      hash |= 0;
    }
    return `examninja_chat:${hash}`;
  };

  const storageKey = computeKey(chatId, context);

  // Load persisted chat messages for the given key
  useEffect(() => {
    (async () => {
      // If authenticated and chatId provided, prefer server-side messages
      if (isAuthenticated && chatId) {
        try {
          const history = await api.getChatHistory(chatId);
          if (history && history.messages) {
            const mapped = (history.messages as any[]).map(
              (m) =>
                ({
                  id: `${m.timestamp}-${m.role}-${Math.random()
                    .toString(36)
                    .slice(2, 9)}`,
                  role: m.role,
                  text: m.text,
                  timestamp: new Date(m.timestamp).getTime(),
                  synced: true,
                } as ChatMessage),
            );
            setMessages(mapped);
            return;
          }
        } catch (err) {
          console.error(
            "Failed to load chat from server, falling back to local storage",
            err,
          );
        }
      }

      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
            return;
          }
        }
      } catch (e) {
        console.error("Error loading chat from localStorage", e);
      }

      // Default welcome message if nothing stored
      setMessages([
        {
          id: "welcome",
          role: "model",
          text: "Привіт! Я твій AI-репетитор. Я прочитав твій конспект і готовий відповідати на питання.",
          timestamp: Date.now(),
          synced: !!(isAuthenticated && chatId),
        },
      ]);
    })();
  }, [storageKey, isAuthenticated, chatId]);

  // Save messages on change (localStorage + backend if authenticated)
  useEffect(() => {
    if (syncingRef.current) return;
    syncingRef.current = true;

    try {
      // Always save to localStorage
      localStorage.setItem(storageKey, JSON.stringify(messages));

      // For authenticated users, also save to backend
      if (isAuthenticated && chatId) {
        (async () => {
          const unsyncedMessages = messages.filter((m) => !m.synced);
          for (const msg of unsyncedMessages) {
            try {
              await api.addChatMessage(chatId, msg.role, msg.text);
              // Mark message as synced
              setMessages((prev) =>
                prev.map((p) => (p.id === msg.id ? { ...p, synced: true } : p)),
              );
            } catch (err) {
              console.warn("Failed to sync message to backend:", err);
            }
          }
        })();
      }
    } catch (e) {
      console.error("Error saving chat:", e);
    } finally {
      syncingRef.current = false;
    }
  }, [messages, storageKey, isAuthenticated, chatId]);

  // Ensure chatSessionRef has the session plus conversation history restored
  useEffect(() => {
    if (!chatSessionRef.current) return;
    if (typeof chatSessionRef.current.restoreConversation === "function") {
      try {
        chatSessionRef.current.restoreConversation(messages);
      } catch (e) {
        console.error("Failed to restore conversation into GrokChat", e);
      }
    }
  }, [messages, context]);

  useEffect(() => {
    const el = messageListRef.current;
    if (!el) return;
    // Only auto-scroll when the user hasn't scrolled up
    if (shouldAutoScrollRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    if (contextStatus !== "loaded") {
      setError("Чекайте, контекст ще завантажується...");
      return;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      text: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    setError("");

    try {
      if (chatSessionRef.current) {
        const result = await chatSessionRef.current.sendMessage({
          message: userMsg.text,
        });

        if (!result || !result.text) {
          throw new Error("Empty response from AI");
        }

        const modelMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "model",
          text: result.text || "Вибач, я не зміг сформулювати відповідь.",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, modelMsg]);
        // If the response had to be re-prompted to enforce Ukrainian, show a small notice
        if ((result as any).enforcedLanguage) {
          setMessages((prev) => [
            ...prev,
            {
              id: `note-${Date.now()}`,
              role: "model",
              text: "(Відповідь була повторно сформульована українською мовою)",
              timestamp: Date.now(),
            },
          ]);
        }
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      const errorText = error?.message || "Виникла помилка";
      setError(errorText);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "model",
          text: `❌ Помилка: ${errorText}. Спробуй ще раз.`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Track whether to auto scroll - update on user scroll
  useEffect(() => {
    const el = messageListRef.current;
    if (!el) return;

    const onScroll = () => {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
      shouldAutoScrollRef.current = atBottom;
    };

    el.addEventListener("scroll", onScroll);
    // initialize state
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="flex flex-col h-[650px] bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md flex items-center gap-4 sticky top-0 z-10">
        <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/20">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-heading font-bold text-slate-900 dark:text-white text-lg">
            AI Асистент
          </h3>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                contextStatus === "loaded"
                  ? "bg-green-500"
                  : contextStatus === "error"
                  ? "bg-red-500"
                  : "bg-yellow-500"
              } animate-pulse`}
            ></span>
            <p
              className={`text-xs font-medium ${
                contextStatus === "loaded"
                  ? "text-slate-500 dark:text-slate-400"
                  : contextStatus === "error"
                  ? "text-red-500 dark:text-red-400"
                  : "text-yellow-500 dark:text-yellow-400"
              }`}
            >
              {contextStatus === "loaded"
                ? "Online • Контекст завантажено"
                : contextStatus === "error"
                ? "⚠️ " + (error || "Помилка контексту")
                : "Завантаження..."}
            </p>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && contextStatus === "loaded" && (
        <div className="mx-4 mt-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl flex items-start gap-2 text-sm text-red-700 dark:text-red-300 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Messages Area */}
      <div
        ref={messageListRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-900/50"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-4 ${
              msg.role === "user" ? "flex-row-reverse" : ""
            } animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div
              className={`
              w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 border-white dark:border-slate-700 shadow-sm
              ${
                msg.role === "user"
                  ? "bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-200"
                  : "bg-white dark:bg-slate-700 text-primary"
              }
            `}
            >
              {msg.role === "user" ? (
                <User className="w-5 h-5" />
              ) : (
                <Bot className="w-6 h-6" />
              )}
            </div>

            <div
              className={`
              max-w-[85%] p-5 rounded-3xl text-sm leading-relaxed shadow-sm
              ${
                msg.role === "user"
                  ? "bg-slate-900 dark:bg-primary text-white rounded-tr-sm"
                  : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-sm border border-slate-100 dark:border-slate-600"
              }
            `}
            >
              <MessageContent text={msg.text} />
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-4 animate-in fade-in">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 text-primary flex items-center justify-center border-2 border-white dark:border-slate-600 shadow-sm">
              <Bot className="w-6 h-6" />
            </div>
            <div className="bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 p-5 rounded-3xl rounded-tl-sm flex items-center gap-1.5 shadow-sm">
              <div
                className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              ></div>
              <div
                className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              ></div>
              <div
                className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              ></div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSend}
        className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700"
      >
        <div className="relative flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              contextStatus === "loaded"
                ? "Запитай про щось..."
                : "Чекай завантаження..."
            }
            disabled={contextStatus !== "loaded" || isTyping}
            className="w-full pl-5 pr-14 py-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 focus:bg-white dark:focus:bg-slate-600 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping || contextStatus !== "loaded"}
            className="absolute right-2 p-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-all shadow-md hover:shadow-lg hover:scale-105"
          >
            {isTyping ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
