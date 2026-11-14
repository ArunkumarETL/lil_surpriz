const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "").hostname;
  } catch {
    return "localhost";
  }
})();

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
      { protocol: "http", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" },
      { protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
