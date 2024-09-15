import type { MetaDescriptor } from "@remix-run/node";
import { images } from "./images";

type RequiredOptions = { title: string };
type Optionals = { description: string; imageId: string; noIndex?: boolean; separator: string; canonical: string };

const keywords: string[] = [];

export const FLY_DEPLOY_URL = "deadlock-index.fly.dev";

export const seo = {
  name: "Ticket Marketplace",
  description: "Ticket marketplace",
  imageId: "",
};

export const createMetadata = (args: RequiredOptions & Partial<Optionals>) => {
  const { separator = "-", description = seo.description } = args;
  const imageUrl = images.optimizeId(args.imageId ?? seo.imageId, { width: 1200 });

  const title = `${args.title} ${separator} ${seo.name}`;

  const tags: MetaDescriptor[] = [
    { title },
    { name: "keywords", content: keywords.join(",") },
    { name: "description", content: description },
    { property: "og:description", content: description },
    { property: "og:title", content: title },
    { property: "og:image", content: imageUrl },
    { name: "twitter:image", content: imageUrl },
    { name: "twitter:card", content: "summary_large_image" },
  ];

  if (args.noIndex) {
    tags.push({ name: "googlebot", content: "noindex,nofollow" });
  }

  if (args.canonical) {
    const url = new URL(args.canonical, "http://localhost:3000");

    tags.push({
      tagName: "link",
      rel: "canonical",
      href: url.toString(),
    });
  }

  return tags;
};
