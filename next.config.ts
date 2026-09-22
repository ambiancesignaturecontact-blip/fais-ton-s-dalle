import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/webp", "image/avif"],
    deviceSizes: [375, 640, 750, 828, 1080, 1200, 1920],
  },
  compress: true,

  async redirects() {
    return [
      // Anciennes pages .html → routes Next.js
      {
        source: "/cgv.html",
        destination: "/cgv",
        permanent: true,
      },
      {
        source: "/mentions-legales.html",
        destination: "/mentions-legales",
        permanent: true,
      },
      {
        source: "/404.html",
        destination: "/404",
        permanent: true,
      },
      // Ancien site vanilla → accueil
      {
        source: "/app.js",
        destination: "/",
        permanent: false,
      },
      {
        source: "/style.css",
        destination: "/",
        permanent: false,
      },
    ];
  },

  async headers() {
    return [
      // Images : cache long terme
      {
        source: "/images/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },

      // SW + HTML + tout le reste : jamais de cache
      {
        source: "/:path((?!images/).*)",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },

  turbopack: {
    root: "/home/user/ftsd-next",
  },
};

export default nextConfig;
