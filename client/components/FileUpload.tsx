import React, { useState, useCallback, useEffect } from "react";
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Loader2,
  FileType,
  Presentation,
  AlertCircle,
  X,
} from "lucide-react";
import { processContent } from "../services/grokService";
import { UPLOAD_CONFIG, ERROR_MESSAGES } from "../constants";
import { StudyMaterial } from "../types";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import mammoth from "mammoth";
import JSZip from "jszip";

interface FileUploadProps {
  onProcessingComplete: (material: StudyMaterial, file?: File) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onProcessingComplete,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const initPdfWorker = () => {
      // Configure PDF.js worker
      try {
        // Try bundler-resolved worker first (works with some bundlers / Vite)
        let workerUrl = "";
        try {
          workerUrl = new URL(
            "pdfjs-dist/legacy/build/pdf.worker.min.js",
            import.meta.url,
          ).toString();
        } catch (_e) {
          // Not available in this bundler environment, fallback to env var or CDN
          workerUrl =
            (globalThis as any).PDF_WORKER_URL ||
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        }
        if ((pdfjsLib as any).GlobalWorkerOptions) {
          (pdfjsLib as any).GlobalWorkerOptions.workerSrc = workerUrl;
        }
      } catch (err) {
        console.warn(
          "Unable to set PDF worker from build; falling back to CDN",
          err,
        );
      }
    };
    if (typeof window !== "undefined") initPdfWorker();
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragging(true);
    else if (e.type === "dragleave") setIsDragging(false);
  }, []);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();

    if (!(pdfjsLib as any).getDocument) {
      throw new Error(
        "PDF parser not initialized - check if pdfjs worker is configured correctly",
      );
    }

    const loadingTask = (pdfjsLib as any).getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = "";
    const numPages = pdf.numPages;
    for (let i = 1; i <= numPages; i++) {
      setProgress(`Читання PDF сторінки ${i} з ${numPages}...`);
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      fullText += pageText + "\n\n";
    }
    return fullText;
  };

  const extractTextFromDOCX = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();

    if (!mammoth.extractRawText) {
      throw new Error("DOCX parser not initialized");
    }

    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };

  const extractTextFromPPTX = async (file: File): Promise<string> => {
    const zip = await JSZip.loadAsync(file);
    const slideFiles: { name: string; content: string }[] = [];
    // Collect slide XMLs
    for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
      if (relativePath.match(/^ppt\/slides\/slide\d+\.xml$/)) {
        const content = await (zipEntry as any).async("string");
        slideFiles.push({ name: relativePath, content });
      }
    }
    slideFiles.sort((a, b) => {
      const numA = parseInt(a.name.match(/slide(\d+)\.xml/)?.[1] || "0");
      const numB = parseInt(b.name.match(/slide(\d+)\.xml/)?.[1] || "0");
      return numA - numB;
    });
    let fullText = "";
    const parser = new DOMParser();
    // slideFiles is already in arbitrary order; sort by numeric slide index
    slideFiles.sort((a, b) => {
      const n1 = parseInt((a.name.match(/slide(\d+)\.xml/) || [])[1] || "0");
      const n2 = parseInt((b.name.match(/slide(\d+)\.xml/) || [])[1] || "0");
      return n1 - n2;
    });
    for (const slide of slideFiles) {
      setProgress(`Обробка ${slide.name}...`);
      const xmlDoc = parser.parseFromString(slide.content, "application/xml");

      // First, try a:t nodes (typical for text runs)
      const textNodes = Array.from(xmlDoc.getElementsByTagName("a:t") || []);

      // Also search common text containers if a:t isn't present
      if (textNodes.length === 0) {
        // fallback: any text nodes under txBody
        const txBodies = Array.from(
          xmlDoc.getElementsByTagName("p:txBody") || [],
        );
        txBodies.forEach((tb) => {
          const innerTextNodes = Array.from(
            tb.getElementsByTagName("a:t") || [],
          );
          innerTextNodes.forEach((n) => textNodes.push(n));
        });
      }

      // Additional attempt: notes slide content
      if (textNodes.length === 0) {
        const slideName = slide.name.replace(/^ppt\//, "");
        const notesPath = slideName.replace(
          /slides\/(slide\d+)\.xml/,
          "notesSlides/notes$1.xml",
        );
        const notesEntry = zip.files[`ppt/${notesPath}`];
        if (notesEntry) {
          const notesXml = await (notesEntry as any).async("string");
          const notesDoc = parser.parseFromString(notesXml, "application/xml");
          const notesNodes = Array.from(
            notesDoc.getElementsByTagName("a:t") || [],
          );
          notesNodes.forEach((n) => textNodes.push(n));
        }
      }

      const slideText = textNodes
        .map((n) => n.textContent?.trim())
        .filter(Boolean)
        .join(" ");
      if (slideText.trim()) {
        fullText += `[Слайд ${slide.name}]\n${slideText}\n\n`;
      }
    }

    // As an extra fallback, extract all text content available if previous attempts failed
    if (!fullText.trim()) {
      // Try to parse everything and take textContent of ppt XML files
      for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
        if (relativePath.startsWith("ppt/")) {
          try {
            const content = await (zipEntry as any).async("string");
            const doc = parser.parseFromString(content, "application/xml");
            const text = (doc?.documentElement?.textContent || "").trim();
            if (text)
              fullText += `
[${relativePath}]
${text}

`;
          } catch (e) {
            // ignore parse errors for non-xml files
          }
        }
      }
    }
    return fullText;
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setProgress("Підготовка файлу...");
    setError("");
    try {
      // Validate file size
      if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE) {
        setError(`❌ ${ERROR_MESSAGES.FILE_TOO_LARGE}`);
        setIsProcessing(false);
        return;
      }
      // Validate MIME types and extension
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      if (
        !UPLOAD_CONFIG.ALLOWED_EXTENSIONS.includes((`.` + ext) as any) ||
        (UPLOAD_CONFIG.ALLOWED_MIME_TYPES.length > 0 &&
          file.type &&
          !(UPLOAD_CONFIG.ALLOWED_MIME_TYPES as any).includes(file.type))
      ) {
        // Allow if extension matches but mime empty -> accept
        if (!UPLOAD_CONFIG.ALLOWED_EXTENSIONS.includes((`.` + ext) as any)) {
          setError(`❌ ${ERROR_MESSAGES.INVALID_FILE}`);
          setIsProcessing(false);
          return;
        }
      }
      let textContent = "";
      if (
        (file.type &&
          (file.type.startsWith("text/") || file.type.includes("markdown"))) ||
        file.name.match(/\.(txt|md)$/i)
      ) {
        setProgress("Читання текстового файлу...");
        textContent = await file.text();
      } else if (
        file.type === "application/pdf" ||
        file.name.endsWith(".pdf")
      ) {
        setProgress("Ініціалізація PDF парсера...");
        try {
          textContent = await extractTextFromPDF(file);
        } catch (pdfErr: any) {
          console.error("PDF parsing error:", pdfErr);
          setError(
            `❌ Не вдалося витягти текст з PDF: ${
              pdfErr?.message || "..."
            }. Можливо файл зашифрований або містить тільки зображення.`,
          );
          setIsProcessing(false);
          return;
        }
      } else if (
        file.type.includes("presentation") ||
        file.name.endsWith(".pptx")
      ) {
        // PPTX must be checked BEFORE DOCX because PPTX MIME type also contains "document"
        setProgress("Розбір PPTX...");
        textContent = await extractTextFromPPTX(file);
      } else if (
        file.type.includes("document") ||
        file.name.endsWith(".docx")
      ) {
        setProgress("Читання DOCX...");
        textContent = await extractTextFromDOCX(file);
      } else {
        setError(
          "❌ Формат файлу не підтримується. Використовуй: PDF, DOCX, PPTX, TXT, MD",
        );
        setIsProcessing(false);
        return;
      }

      if (!textContent.trim()) {
        // Suggest better next steps depending on file type
        const ext = file.name.split(".").pop()?.toLowerCase() || "";
        const suggestion =
          ext === "pdf" || ext === "pptx"
            ? "Цей файл може містити лише графічні зображення (скани). Спробуйте завантажити текстову версію або конвертуйте файл через OCR."
            : "";
        setError(
          `❌ Файл порожній або не містить тексту${
            suggestion ? " — " + suggestion : ""
          }`,
        );
        setIsProcessing(false);
        return;
      }

      setProgress("AI аналізує структуру...");
      const processedData = await processContent(textContent, file.name);

      setProgress("Фіналізація...");
      onProcessingComplete(
        {
          id: Date.now().toString(),
          createdAt: Date.now(),
          ...processedData,
        },
        file,
      );
    } catch (error: any) {
      console.error("File processing error:", error);
      const message = error?.message || "Сталася невідома помилка при обробці.";
      setError(`❌ ${message}`);
    } finally {
      setIsProcessing(false);
      setIsDragging(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) processFile(e.target.files[0]);
  };

  return (
    <div className="w-full max-w-3xl mx-auto mt-12 px-6">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-heading font-bold text-slate-900 dark:text-white mb-2">
          Завантаження матеріалів
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Ми підтримуємо PDF, DOCX, PPTX, TXT та Markdown
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-700 dark:text-red-200 font-medium">
              {error}
            </p>
          </div>
          <button
            onClick={() => setError("")}
            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div
        className={`
          relative group overflow-hidden
          rounded-3xl transition-all duration-500 ease-out
          ${isDragging ? "scale-[1.02] ring-4 ring-primary/20" : ""}
          ${isProcessing ? "opacity-90 pointer-events-none" : ""}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {/* Background Pattern */}
        <div
          className={`absolute inset-0 bg-white dark:bg-slate-800 border-2 border-dashed transition-colors duration-300 z-0 ${
            isDragging
              ? "border-primary bg-primary/5 dark:bg-primary/10"
              : "border-slate-300 dark:border-slate-600 group-hover:border-primary/50"
          }`}
        ></div>

        <div className="relative z-10 p-12 flex flex-col items-center justify-center min-h-[320px]">
          {isProcessing ? (
            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
                <Loader2 className="w-16 h-16 text-primary animate-spin relative z-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mt-8 mb-2">
                Аналізуємо контент
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full animate-pulse">
                {progress}
              </p>
            </div>
          ) : (
            <>
              <div
                className={`w-20 h-20 bg-slate-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-6 shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3 ${
                  isDragging
                    ? "bg-primary/10 text-primary"
                    : "text-slate-400 dark:text-slate-300"
                }`}
              >
                <Upload className="w-10 h-10" />
              </div>

              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">
                Перетягніть файли сюди
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm text-center">
                Або виберіть файл з комп'ютера. Максимальний розмір{" "}
                {Math.round(UPLOAD_CONFIG.MAX_FILE_SIZE / (1024 * 1024))}MB.
              </p>

              <label className="relative overflow-hidden inline-flex group cursor-pointer">
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary to-accent opacity-100 transition-all duration-300 group-hover:opacity-90 group-active:scale-95 rounded-xl"></span>
                <span className="relative px-8 py-3.5 text-white font-bold rounded-xl flex items-center gap-2">
                  Вибрати файл
                </span>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept=".txt,.md,.pdf,.docx,.pptx"
                />
              </label>
            </>
          )}
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm text-slate-500 dark:text-slate-400">
        {[
          { icon: FileText, label: "Лекції та статті", desc: "PDF, DOCX, TXT" },
          { icon: Presentation, label: "Презентації", desc: "PPTX слайди" },
          { icon: FileType, label: "Нотатки", desc: "Markdown" },
        ].map((item, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center text-center p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm"
          >
            <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg mb-2 text-slate-400 dark:text-slate-300">
              <item.icon className="w-5 h-5" />
            </div>
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {item.label}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {item.desc}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
