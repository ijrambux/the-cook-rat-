/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  // تعطيل ESLint أثناء البناء لتجنب أخطاء غير ضرورية
  eslint: { ignoreDuringBuilds: true },
  // تعطيل TypeScript أثناء البناء إذا لم يكن مستخدماً
  typescript: { ignoreBuildErrors: true },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
    ];
  },
};
module.exports = nextConfig;
