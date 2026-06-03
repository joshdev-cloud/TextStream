import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Server Function: Uploads a document file, saves it locally on the server host,
 * and extracts its text contents for immediate use in the client reader viewport.
 */
export const uploadLocalDocument = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      fileName: z.string().min(1),
      fileBase64: z.string().min(1),
    })
  )
  .handler(async ({ data }) => {
    // Dynamic import to isolate server-only module from Vite client-side code splitting
    const { saveDocumentAndExtractText } = await import("./document.server");
    return await saveDocumentAndExtractText(data.fileName, data.fileBase64);
  });

/**
 * Server Function: Scans the local folder backend/documents and parses all PDF/TXT files,
 * returning them to the client to synchronize the UI file vault.
 */
export const syncLocalDocuments = createServerFn({ method: "GET" })
  .handler(async () => {
    // Dynamic import to isolate server-only module from Vite client-side code splitting
    const { scanLocalDocumentsFolder } = await import("./document.server");
    return await scanLocalDocumentsFolder();
  });
