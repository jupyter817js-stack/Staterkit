
/**@type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";
const nextConfig = {
  // pages/ 아래 컴포넌트는 라우트에서 제외; 실제 페이지만 .page.tsx 로 노출
  pageExtensions: ["page.tsx", "page.ts", "page.jsx", "page.js"],
  // output: "export" 제거함 — API 라우트(pages/api) 사용 시 static export 불가
  reactStrictMode: true,
  trailingSlash: true,
  // swcMinify: false,
  basePath:"",
  assetPrefix:"",
  images: {
    loader: "imgix",
    path: "/",
  },
};

module.exports = nextConfig;
