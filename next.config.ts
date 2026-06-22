/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        // เมื่อ Frontend เรียก path นี้...
        source: '/api/bitkub-price',
        // ...ให้ Next.js ไปดึงข้อมูลจาก URL นี้มาให้แทน
        destination: 'https://api.bitkub.com/api/market/ticker',
      },
    ]
  },
};

export default nextConfig;