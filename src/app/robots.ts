import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/api/", "/super-admin/", "/onboarding/"],
      },
    ],
    sitemap: "https://immoprox.com/sitemap.xml",
  };
}
