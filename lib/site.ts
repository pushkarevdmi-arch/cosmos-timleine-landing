/** Shared site copy and URLs for metadata, Open Graph, and sitemap. */
export const site = {
  name: "Cosmorrow",
  title: "Cosmorrow — Journey into the Future of the Universe",
  /** Matches hero subtitle + value proposition (EN). */
  description:
    "From our lifetime to the final moments of the cosmos. Explore upcoming astronomical events on an interactive timeline of the universe.",
  descriptionRu:
    "От нашего времени до последних мгновений жизни космоса. Изучайте предстоящие астрономические события на интерактивной временной шкале Вселенной.",
  locale: "en_US",
  creator: "Dmitri Pushkarev",
  ogImage: "/images/hero-image.jpg",
  favicon: "/icons/favicon.svg",
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
