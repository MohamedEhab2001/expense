import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {
  /* config options here */
};

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  reloadOnOnline: true,
});

// Serwist patches the webpack config, which conflicts with `next dev`'s
// default Turbopack bundler. Only apply it for the production build, which
// runs via `next build --webpack` (see package.json).
export default process.env.NODE_ENV === "development" ? nextConfig : withSerwist(nextConfig);
