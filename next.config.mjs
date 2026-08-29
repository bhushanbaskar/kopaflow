/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push("fake-indexeddb");
    }
    return config;
  },
};

export default nextConfig;
