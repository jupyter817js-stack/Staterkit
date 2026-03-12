'use client';

import React from 'react';
import { useRouter } from 'next/router';
import ContentLayoutWrapper from './content-layout-wrapper';

/**
 * router.asPath를 key로 해서 라우트가 바뀔 때마다 ContentLayoutWrapper를 통째로 리마운트.
 * (valuebet 페이지에서만 사이드바 클릭 시 URL만 바뀌고 화면이 안 바뀌는 현상 방지)
 */
export default function ContentLayoutKeyed({
  Component,
  pageProps,
}: {
  Component: React.ComponentType<any>;
  pageProps: any;
}) {
  const router = useRouter();
  return (
    <ContentLayoutWrapper
      key={router.asPath}
      Component={Component}
      pageProps={pageProps}
    />
  );
}
