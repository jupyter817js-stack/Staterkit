import React from "react";
import Head from "next/head";
import favicon from "../../../public/assets/images/brand-logos/favicon.png";

const SITE_NAME = "Betsurezone";
const DEFAULT_DESCRIPTION =
  "Quant-grade Surebet & Valuebet Intelligence. 실시간 배당 데이터, 유동성 기반 예상 체결값, 슬리피지 허용 범위를 하나의 대시보드에서 확인하세요. Data-driven betting intelligence.";
const DEFAULT_KEYWORDS =
  "valuebet, surebet, value bet, sure bet, arbitrage betting, expected odds, liquidity, slippage, safe stake, betting intelligence, 배팅 분석, 밸류벳, 슈어벳, 가치배팅, 베팅 인텔리전스, Betsurezone";

const APP_URL = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_APP_URL ?? "" : "";

export interface SeoProps {
  /** 페이지 제목 (사이트명은 자동으로 앞에 붙음) */
  title: string;
  /** 페이지별 설명 (없으면 기본 설명 사용) */
  description?: string;
  /** 페이지별 키워드 (없으면 기본 키워드 사용) */
  keywords?: string;
  /** OG 이미지 절대 URL (없으면 사이트 기본) */
  image?: string;
  /** canonical URL (없으면 현재 경로로 APP_URL 기반 생성) */
  canonicalPath?: string;
}

const Seo = ({ title, description, keywords, image, canonicalPath }: SeoProps) => {
  const fullTitle = !title ? SITE_NAME : (title.includes(SITE_NAME) || title.toUpperCase().includes("BETSUREZONE") ? title : `${SITE_NAME} | ${title}`);
  const metaDescription = description ?? DEFAULT_DESCRIPTION;
  const metaKeywords = keywords ?? DEFAULT_KEYWORDS;
  const canonicalUrl = canonicalPath != null && APP_URL ? `${APP_URL.replace(/\/$/, "")}${canonicalPath.startsWith("/") ? canonicalPath : `/${canonicalPath}`}` : undefined;
  const ogImage = image ?? (APP_URL ? `${APP_URL.replace(/\/$/, "")}/assets/images/brand-logos/desktop-logo.png` : undefined);

  return (
    <Head>
      <title>{fullTitle}</title>
      <link href={favicon.src} rel="icon" />
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      <meta name="application-name" content={SITE_NAME} />
      <meta name="description" content={metaDescription} />
      <meta name="author" content="Betsurezone" />
      <meta name="keywords" content={metaKeywords} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta property="og:locale" content="ko_KR" />
      <meta property="og:locale:alternate" content="en_US" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}
    </Head>
  );
};

export default Seo;
