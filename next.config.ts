import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: import.meta.dirname,
  },
  experimental: {
    serverActions: {
      /** Adjuntos (PDF, imágenes) vía FormData; default Next.js = 1mb. */
      bodySizeLimit: "30mb",
    },
  },
};

export default nextConfig;
