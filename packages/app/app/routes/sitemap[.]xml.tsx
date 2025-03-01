import dayjs from "dayjs";
import { env } from "~/utils/env.server";

export const loader = async () => {
  const elements: string[] = [];

  const route = (args: { path: string; priority?: number }) => {
    const url = new URL(args.path, env.server.PUBLIC_WEBSITE_URL);

    elements.push(`
      <url>
        <loc>${url.toString()}</loc>
        <lastmod>${dayjs().format("YYYY-MM-DD")}</lastmod>
        <priority>${args.priority ?? 0.7}</priority>
      </url>`);
  };

  route({ path: "/", priority: 1 });

  return new Response(
    `
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${elements.join("\n")}
      </urlset>
    `,
    {
      headers: {
        "Content-Type": "application/xml",
      },
    },
  );
};
