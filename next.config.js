/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "e-cdns-images.dzcdn.net" },
      { protocol: "https", hostname: "cdns-images.dzcdn.net" },
      { protocol: "https", hostname: "api.deezer.com" }
    ]
  }
};

module.exports = nextConfig;
