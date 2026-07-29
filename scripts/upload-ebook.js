// Upload (ghi đè) book.epub + book.pdf lên Supabase Storage bucket "ebooks".
// Dùng SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY lấy qua `vercel env pull .env.local --environment=production`.
// Chạy: node scripts/upload-ebook.js

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

function loadEnvLocal(envPath) {
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (!match) continue;
    const key = match[1];
    let value = match[2].trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal(path.join(__dirname, "..", ".env.local"));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.EBOOK_STORAGE_BUCKET || "ebooks";
const BUILD_DIR = path.join(__dirname, "..", "..", "build");

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Thiếu SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY trong .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const files = [
  { local: "book.epub", remote: process.env.EBOOK_FILE_PATH || "book.epub", type: "application/epub+zip" },
  { local: "book.pdf", remote: process.env.EBOOK_FILE_PATH_PDF || "book.pdf", type: "application/pdf" },
];

async function main() {
  for (const f of files) {
    const localPath = path.join(BUILD_DIR, f.local);
    if (!fs.existsSync(localPath)) {
      console.error(`Không tìm thấy ${localPath}, bỏ qua.`);
      continue;
    }
    const buffer = fs.readFileSync(localPath);
    process.stdout.write(`Đang tải ${f.local} (${buffer.length} bytes) -> ${BUCKET}/${f.remote} ... `);
    const { error } = await supabase.storage.from(BUCKET).upload(f.remote, buffer, {
      contentType: f.type,
      upsert: true,
    });
    if (error) {
      console.log("LỖI");
      console.error(error);
      process.exitCode = 1;
    } else {
      console.log("xong.");
    }
  }
}

main();
