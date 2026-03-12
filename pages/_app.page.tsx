import '../styles/globals.scss';
import dynamic from 'next/dynamic';
import Authenticationlayout from "../shared/layout-components/layout/authentication-layout";
import Landinglayout from "../shared/layout-components/layout/landing-layout";

/** next/router(useRouter)는 클라이언트에서만 동작 → ContentLayout 래퍼를 SSR 비활성화로 로드. 래퍼가 asPath를 key로 써서 사이드바 전환 시 페이지가 확실히 리마운트됨 */
const ContentLayoutKeyed = dynamic(
  () => import('../shared/layout-components/layout/content-layout-keyed').then((m) => m.default),
  { ssr: false, loading: () => <div className="flex items-center justify-center min-h-screen bg-bodybg"><span className="ti-spinner !w-10 !h-10 !border-2 inline-block text-primary" /></div> }
);

const layouts: any = {
  Contentlayout: ContentLayoutKeyed,
  Authenticationlayout: Authenticationlayout,
  Landinglayout: Landinglayout,
};

function MyApp({ Component, pageProps }: any) {
  const Layout = layouts[Component.layout];

  if (Layout === ContentLayoutKeyed) {
    return <Layout Component={Component} pageProps={pageProps} />;
  }
  if (Layout) {
    return (
      <Layout>
        <Component {...pageProps} />
      </Layout>
    );
  }
  return <Component {...pageProps} />;
}

export default MyApp;