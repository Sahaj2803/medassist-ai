import crypto from "crypto";
import fs from "fs";

/**
 * Streams a file from disk and returns its SHA-256 hex digest. Used to
 * recognize a byte-identical prescription re-upload before spending an
 * AI call on it.
 */
export function hashFile(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);
    stream.on("error", reject);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

export default { hashFile };