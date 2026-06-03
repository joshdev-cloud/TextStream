import * as fs from "fs";
import * as path from "path";
import { PDFParse } from "pdf-parse";

/**
 * Saves a file to the backend/documents directory and extracts its text contents.
 */
export async function saveDocumentAndExtractText(fileName: string, base64Data: string) {
  const buffer = Buffer.from(base64Data, "base64");
  
  // Resolve path to backend/documents
  const docsDir = path.join(process.cwd(), "..", "backend", "documents");
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  
  const filePath = path.join(docsDir, fileName);
  fs.writeFileSync(filePath, buffer);
  console.log(`[TextStream Server] Saved file locally to: ${filePath}`);
  
  let paragraphs: string[] = [];
  let extractedPages = 1;
  
  if (fileName.toLowerCase().endsWith(".pdf")) {
    try {
      const parser = new PDFParse({ data: buffer });
      const parseResult = await parser.getText();
      extractedPages = parseResult.total || 1;
      paragraphs = parseResult.text
        .split(/\r?\n\r?\n/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0);
      
      // If paragraphs are too few, split by single newlines of reasonable length
      if (paragraphs.length <= 1) {
        paragraphs = parseResult.text
          .split(/\r?\n/)
          .map((p) => p.trim())
          .filter((p) => p.length > 15);
      }
      
      // Fallback if still empty
      if (paragraphs.length === 0) {
        paragraphs = [
          "This PDF document contains no readable text extractable by the server (it might be scanned or image-based).",
          "You can still reference it in RAG queries if OCR is enabled in your backend system."
        ];
      }
    } catch (error) {
      console.error("[TextStream Server] pdf-parse failed:", error);
      paragraphs = [
        "Error extracting text from PDF. The file may be image-only (scanned) or password-protected.",
        `Document Name: ${fileName}`
      ];
    }
  } else {
    // Treat as text
    const text = buffer.toString("utf-8");
    paragraphs = text
      .split(/\r?\n\r?\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }

  // Attempt to notify the python backend to synchronize and index the new document
  try {
    const syncRes = await fetch("http://localhost:8000/api/sync", {
      method: "POST"
    });
    if (syncRes.ok) {
      console.log("[TextStream Server] Notified Python RAG backend to sync database.");
    }
  } catch (err) {
    console.log("[TextStream Server] Python backend is not running or failed to sync:", err);
  }
  
  return {
    success: true,
    paragraphs,
    pages: extractedPages
  };
}

/**
 * Scans the local backend/documents directory and returns metadata and text content
 * for all discovered PDF/TXT files.
 */
export async function scanLocalDocumentsFolder() {
  const docsDir = path.join(process.cwd(), "..", "backend", "documents");
  
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
    return [];
  }
  
  const files = fs.readdirSync(docsDir);
  const pdfAndTxtFiles = files.filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return ext === ".pdf" || ext === ".txt";
  });
  
  const results = [];
  for (const file of pdfAndTxtFiles) {
    const filePath = path.join(docsDir, file);
    try {
      const stat = fs.statSync(filePath);
      const buffer = fs.readFileSync(filePath);
      
      let paragraphs: string[] = [];
      let docPages = 1;
      if (file.toLowerCase().endsWith(".pdf")) {
        try {
          const parser = new PDFParse({ data: buffer });
          const parseResult = await parser.getText();
          docPages = parseResult.total || 1;
          paragraphs = parseResult.text
            .split(/\r?\n\r?\n/)
            .map((p) => p.trim())
            .filter((p) => p.length > 0);
          
          if (paragraphs.length <= 1) {
            paragraphs = parseResult.text
              .split(/\r?\n/)
              .map((p) => p.trim())
              .filter((p) => p.length > 15);
          }
        } catch (err) {
          console.error(`[TextStream Server] scan failed for PDF ${file}:`, err);
          paragraphs = ["Error reading this PDF file from disk.", `Filename: ${file}`];
        }
      } else {
        const text = buffer.toString("utf-8");
        paragraphs = text
          .split(/\r?\n\r?\n/)
          .map((p) => p.trim())
          .filter((p) => p.length > 0);
      }
      
      results.push({
        id: `doc-${stat.birthtimeMs || Date.now()}-${file.replace(/[^a-zA-Z0-9]/g, "-")}`,
        name: file,
        pages: docPages,
        active: true,
        uploadedAt: stat.mtime.toISOString(),
        paragraphs
      });
    } catch (err) {
      console.error(`[TextStream Server] failed reading stat or file ${file}:`, err);
    }
  }
  
  return results;
}
