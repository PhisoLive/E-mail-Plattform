const replacements: Record<string, string> = { ä: "ae", ö: "oe", ü: "ue", ß: "ss" };

export function slugify(input: string): string {
  const slug = input
    .toLowerCase()
    .replace(/[äöüß]/g, (char) => replacements[char] ?? char)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug.length > 0 ? slug : "arbeitsbereich";
}
