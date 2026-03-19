# Betsurezone 메타데이터 및 SEO

## 개요

사이트 브랜드는 **Betsurezone**이며, 모든 메타데이터·OG·푸터는 이에 맞춰 갱신되어 있습니다. Google SEO 및 SNS 공유 시 올바른 제목·설명·이미지가 노출되도록 구성되어 있습니다.

## 적용된 변경 사항

- **SEO 컴포넌트** (`shared/layout-components/seo/seo.tsx`)
  - 사이트명: **Betsurezone**
  - 기본 설명: Quant-grade Surebet & Valuebet Intelligence, 실시간 배당·유동성·슬리피지 대시보드
  - 키워드: valuebet, surebet, expected odds, liquidity, slippage, 밸류벳, 슈어벳 등
  - Open Graph: `og:title`, `og:description`, `og:url`, `og:image`, `og:site_name`, `og:locale`
  - Twitter Card: `summary_large_image`
  - canonical URL 지원 (선택)
- **푸터**: Ynex → Betsurezone, Spruko 크레딧 제거
- **랜딩 푸터**: 동일
- **package.json / package-lock.json**: `name` → `betsurezone`
- **CSS/SCSS**: 프로젝트 주석 → Betsurezone

## 프로덕션 도메인 (Google SEO용)

canonical URL과 `og:url`은 **`NEXT_PUBLIC_APP_URL`** 환경 변수를 사용합니다.

- **로컬**: `.env.local`에 `NEXT_PUBLIC_APP_URL=http://localhost:3000` 등
- **프로덕션**: 실제 사이트 도메인으로 설정  
  예: `NEXT_PUBLIC_APP_URL=https://betsurezone.com`

설정하지 않으면 canonical/og:url은 비워두며, 제목·설명·키워드·OG 이미지(상대 경로)는 그대로 동작합니다.

## 페이지별 SEO (선택)

`<Seo>` 컴포넌트는 다음 props를 지원합니다.

| Prop | 설명 |
|------|------|
| `title` | 페이지 제목 (자동으로 "Betsurezone \| " 접두어 추가. 이미 Betsurezone 포함 시 생략) |
| `description` | 페이지별 메타/OG 설명 (없으면 기본 설명 사용) |
| `keywords` | 페이지별 키워드 (없으면 기본 키워드 사용) |
| `image` | OG/Twitter 이미지 절대 URL (없으면 사이트 로고 사용) |
| `canonicalPath` | canonical 경로 (예: `/valuebet`) → `NEXT_PUBLIC_APP_URL`과 결합해 사용 |

예:

```tsx
<Seo
  title="Value Bet"
  description="실시간 밸류벳 기회를 확인하세요."
  canonicalPath="/valuebet"
/>
```

## 참고

- 브랜드/카피: `docs/[브랜드명].txt`
- 사이트 수정사항: `docs/[사이트 수정사항 전달 - 개발자용].txt`
