import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export type Stanovisko = {
  slug: string;
  title: string;
  date: string; // ISO yyyy-mm-dd
  perex: string;
  /** cesta k PDF v /public, pokud existuje ke stažení */
  pdf?: string;
  /** draft se zobrazuje jen mimo produkci (viditelně označený) */
  draft?: boolean;
  content: string;
};

const CONTENT_DIR = path.join(process.cwd(), "content", "stanoviska");

function isPublished(s: Stanovisko): boolean {
  return process.env.NODE_ENV !== "production" || !s.draft;
}

export function getStanoviska(): Stanovisko[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((file) => readOne(file.replace(/\.mdx$/, "")))
    .filter((s): s is Stanovisko => s !== null && isPublished(s))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getStanovisko(slug: string): Stanovisko | null {
  const s = readOne(slug);
  return s && isPublished(s) ? s : null;
}

function readOne(slug: string): Stanovisko | null {
  // ochrana proti path traversal ze slugu v URL
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  const file = path.join(CONTENT_DIR, `${slug}.mdx`);
  if (!fs.existsSync(file)) return null;
  const { data, content } = matter(fs.readFileSync(file, "utf8"));
  return {
    slug,
    title: String(data.title ?? slug),
    date: String(data.date ?? ""),
    perex: String(data.perex ?? ""),
    pdf: data.pdf ? String(data.pdf) : undefined,
    draft: Boolean(data.draft),
    content,
  };
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
