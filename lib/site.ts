/** Shared site copy and URLs for metadata, Open Graph, and sitemap. */
export const site = {
  name: "Cosmorrow",
  title: "Cosmorrow — Journey Into the Future of the Universe",
  description:
    "From our lifetime to the final moments of the cosmos. Explore upcoming astronomical events on an interactive timeline of the universe.",
  locale: "en_US",
  creator: "Dmitri Pushkarev",
  ogImage: "/images/hero-image.jpg",
} as const;

export function getSiteUrl(): URL {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) {
    try {
      return new URL(fromEnv);
    } catch {
      /* fall through */
    }
  }

  const vercelHost = process.env.VERCEL_URL?.trim();
  if (vercelHost) {
    return new URL(`https://${vercelHost}`);
  }

  return new URL("http://localhost:3000");
}
