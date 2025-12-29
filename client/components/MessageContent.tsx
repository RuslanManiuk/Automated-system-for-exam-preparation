import React from "react";
import { Flashcard, MindMapNode } from "../types";
import { parseJsonSafely } from "../services/grokService";

// Ensure a mind map node and its children are valid objects, filtering out any
// null/undefined entries and providing defaults where appropriate. This helps
// protect against inconsistent JSON coming from the AI.
const sanitizeMindMap = (node?: MindMapNode | null): MindMapNode | null => {
  if (!node || typeof node !== "object") return null;
  const sanitized: MindMapNode = {
    id: node.id || `n-${Math.random().toString(36).slice(2, 9)}`,
    label: node.label || "(без назви)",
    children: undefined,
  };
  if (Array.isArray(node.children) && node.children.length > 0) {
    sanitized.children = node.children
      .filter(Boolean)
      .map((c) => sanitizeMindMap(c))
      .filter(Boolean) as MindMapNode[];
  }
  return sanitized;
};

interface MessageContentProps {
  text: string;
}

const Paragraph: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="mb-3 leading-relaxed text-sm">{children}</p>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
    {children}
  </h4>
);

const GlossaryTerm: React.FC<{ term: string; definition: string }> = ({
  term,
  definition,
}) => (
  <div className="mb-2">
    <span className="font-bold text-slate-800 dark:text-white">{term}</span>
    <div className="text-sm text-slate-600 dark:text-slate-300">
      {definition}
    </div>
  </div>
);

const KeyFacts: React.FC<{ facts: string[] }> = ({ facts }) => (
  <ul className="list-disc ml-5 text-sm text-slate-700 dark:text-slate-200">
    {facts.map((f, idx) => (
      <li key={idx} className="mb-1">
        {f}
      </li>
    ))}
  </ul>
);

const FlashcardItem: React.FC<{ fc: Flashcard }> = ({ fc }) => (
  <div className="mb-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
    <div className="font-semibold mb-1">{fc.question}</div>
    <div className="text-sm text-slate-600 dark:text-slate-300">
      {fc.answer}
    </div>
  </div>
);

// Render Mind Map as nested lists (simple formatting)
const MindMap: React.FC<{ node: MindMapNode }> = ({ node }) => {
  if (!node) return null;
  const children = Array.isArray(node.children)
    ? node.children.filter(Boolean)
    : [];
  return (
    <div className="mb-3 text-sm text-slate-700 dark:text-slate-200">
      <div className="font-semibold mb-2">{node.label || "(без назви)"}</div>
      {children.length > 0 && (
        <ul className="list-disc ml-5">
          {children.map((c, idx) => {
            if (!c) return null;
            const cChildren = Array.isArray(c.children)
              ? c.children.filter(Boolean)
              : [];
            return (
              <li key={c.id || `c-${idx}`} className="mb-1">
                <div className="font-medium">{c.label || "(без назви)"}</div>
                {cChildren.length > 0 && (
                  <ul className="list-disc ml-5">
                    {cChildren.map((cc, ccIdx) => {
                      if (!cc) return null;
                      return (
                        <li key={cc.id || `cc-${ccIdx}`}>
                          {cc.label || "(без назви)"}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

const splitParagraphs = (text: string) => {
  return text.split(/\n\n+/g).filter(Boolean);
};

const renderInlineSimple = (text: string | undefined): React.ReactNode => {
  if (!text) return null;
  const italicRegex = /\*(.+?)\*/g;
  let lastIndex = 0;
  const nodes: React.ReactNode[] = [];
  let m: RegExpExecArray | null;
  while ((m = italicRegex.exec(text)) !== null) {
    if (m.index > lastIndex) {
      nodes.push(text.substring(lastIndex, m.index));
    }
    nodes.push(<em key={`i-${m.index}`}>{m[1]}</em>);
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length) nodes.push(text.substring(lastIndex));
  return nodes.length === 1 ? nodes[0] : <>{nodes}</>;
};

const renderInline = (text: string | undefined): React.ReactNode => {
  if (!text) return null;
  const boldRegex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  const nodes: React.ReactNode[] = [];
  let m: RegExpExecArray | null;
  while ((m = boldRegex.exec(text)) !== null) {
    if (m.index > lastIndex) {
      nodes.push(renderInlineSimple(text.substring(lastIndex, m.index)));
    }
    nodes.push(
      <strong key={`b-${m.index}`}>{renderInlineSimple(m[1])}</strong>,
    );
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length)
    nodes.push(renderInlineSimple(text.substring(lastIndex)));
  return nodes.length === 1 ? nodes[0] : <>{nodes}</>;
};

const renderSimpleFormatted = (text: string) => {
  const chunks = splitParagraphs(text);
  return (
    <div>
      {chunks.map((ch, idx) => {
        // list patterns
        const lines = ch.split(/\n+/g);
        const isList = lines.every((l) => /^\s*([-*•]|\d+\.)\s+/.test(l));
        if (isList) {
          return (
            <ul
              key={idx}
              className="list-disc ml-5 mb-3 text-sm text-slate-700 dark:text-slate-200"
            >
              {lines.map((l, i) => (
                <li key={i}>
                  {renderInline(l.replace(/^\s*([-*•]|\d+\.)\s+/, ""))}
                </li>
              ))}
            </ul>
          );
        }

        // blockquote
        if (/^>\s?/.test(lines[0])) {
          const content = lines.map((l) => l.replace(/^>\s?/, "")).join("\n");
          return (
            <blockquote
              key={idx}
              className="mb-3 pl-4 border-l-2 border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200 italic"
            >
              {renderInline(content)}
            </blockquote>
          );
        }

        return (
          <Paragraph key={idx}>{renderInline(lines.join("\n"))}</Paragraph>
        );
      })}
    </div>
  );
};

export const MessageContent: React.FC<MessageContentProps> = ({ text }) => {
  // try parse JSON safely
  try {
    const parsed = parseJsonSafely<any>(text);
    const sanitizedMM = parsed?.mindMap
      ? sanitizeMindMap(parsed.mindMap as MindMapNode)
      : null;

    // If parsed and looks like the material structure
    if (
      parsed &&
      typeof parsed === "object" &&
      (parsed.summary ||
        parsed.flashcards ||
        parsed.glossary ||
        parsed.keyFacts)
    ) {
      return (
        <div className="space-y-4">
          {parsed.summary && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-900/20">
              <SectionTitle>Стислий конспект</SectionTitle>
              <div className="text-sm text-slate-700 dark:text-slate-200">
                {parsed.summary}
              </div>
            </div>
          )}

          {parsed.keyFacts && parsed.keyFacts.length > 0 && (
            <div className="p-4 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
              <SectionTitle>Ключові факти</SectionTitle>
              <KeyFacts facts={parsed.keyFacts} />
            </div>
          )}

          {parsed.glossary && parsed.glossary.length > 0 && (
            <div className="p-4 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
              <SectionTitle>Глосарій</SectionTitle>
              {parsed.glossary.map((g: any, idx: number) => (
                <GlossaryTerm
                  key={idx}
                  term={g.term}
                  definition={g.definition}
                />
              ))}
            </div>
          )}

          {sanitizedMM && (
            <div className="p-4 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
              <SectionTitle>Ментальна карта</SectionTitle>
              <MindMap node={sanitizedMM} />
            </div>
          )}

          {parsed.flashcards && parsed.flashcards.length > 0 && (
            <div className="p-4 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
              <SectionTitle>Флеш-картки</SectionTitle>
              {parsed.flashcards.map((f: any, i: number) => (
                <FlashcardItem
                  key={i}
                  fc={{
                    id: `fc-${i}`,
                    question: f.question || f.q || f.prompt || "Питання",
                    answer: f.answer || f.a || "Відповідь",
                    status: "new",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      );
    }
  } catch (err) {
    // Not JSON — fallback to formatted text
  }

  // Fallback to simple markdown-like formatting
  return (
    <div className="text-sm text-slate-700 dark:text-slate-200">
      {renderSimpleFormatted(text)}
    </div>
  );
};

export default MessageContent;
