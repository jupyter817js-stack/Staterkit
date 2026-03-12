This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## 빌드 방법 (Build)

### 1. 의존성 설치

```bash
npm install
# 또는 yarn / pnpm
```

### 2. (선택) 스타일 빌드

SCSS/테마를 수정한 경우, CSS를 다시 생성합니다.

```bash
npm run postcss
```

- `public/assets/scss/style.scss` → `public/assets/css/style.css` 로 컴파일 후 PostCSS 처리.
- 이미 `public/assets/css/style.css` 가 있으면 빌드만 해도 동작합니다.

### 3. 프로덕션 빌드

```bash
npm run build
```

- **Windows**: `next build` 실행 후 "API routes and middleware" 메시지를 필터링합니다.
- **Linux/macOS**: 위 스크립트가 `findstr`를 사용하므로 실패할 수 있습니다. 그때는 직접 실행:
  ```bash
  npx next build
  ```

### 4. 프로덕션 서버 실행

```bash
npm run start
```

- 빌드 결과물로 서버를 띄웁니다. 기본 포트는 3000입니다.

### 환경 변수

- `NEXT_PUBLIC_API_URL`: 백엔드 API 베이스 URL (예: `https://api.example.com`).
- 기타 필요한 값은 `.env.local` 또는 배포 환경에 설정합니다.

---

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
