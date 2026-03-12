'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ContentLayout from './content-layout';

/**
 * ContentLayout + 라우트별 key로 페이지 전환 시 컴포넌트가 확실히 리마운트되도록 함.
 * (사이드바에서 밸류벳↔슈어벳, 유저↔파트너 등 관리 메뉴 전환 시 URL만 바뀌고 화면이 안 바뀌는 현상 방지)
 */
export default function ContentLayoutWrapper({
  Component,
  pageProps,
}: {
  Component: React.ComponentType<any>;
  pageProps: any;
}) {
  const router = useRouter();
  const [routeKey, setRouteKey] = useState(router.asPath);

  useEffect(() => {
    setRouteKey(router.asPath);
  }, [router.asPath]);

  useEffect(() => {
    const handleRouteChange = (url: string) => setRouteKey(url);
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router.events]);

  return (
    <ContentLayout>
      <Component key={routeKey} {...pageProps} />
    </ContentLayout>
  );
}
