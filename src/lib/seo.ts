/** Per-page head metadata in one place so every route sets a unique title and description. */
export function pageHead(title: string, description: string) {
  const full = `${title} — Convrtln Outreach OS`;
  return {
    meta: [
      { title: full },
      { name: "description", content: description },
      { property: "og:title", content: full },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  };
}
