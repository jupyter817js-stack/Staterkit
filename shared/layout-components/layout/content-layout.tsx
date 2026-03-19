'use client';

import React, { Fragment, useEffect, useState } from 'react'
import { useRouter } from 'next/router';
import Sidebar from '../sidebar/sidebar';
import { Provider } from 'react-redux';
import store from '@/shared/redux/store';
import { LanguageProvider } from '@/shared/i18n/LanguageContext';
import { BetsCountProvider } from '@/shared/contexts/BetsCountContext';
import Header from '../header/header';
import Footer from '../footer/footer';
import Switcher from '../switcher/switcher';
import Backtotop from '../backtotop/backtotop'
import PrelineScript from '@/pages/PrelineScript.page';
import { Initialload } from '../contextapi';
import { getAuthToken, redirectToLogin } from '@/shared/api/auth';
import PaymentSignalRProvider from '@/shared/contexts/PaymentSignalRContext';

const ContentLayout = ({ children }:any) => {
  const router = useRouter();
  const [lateLoad, setlateLoad] = useState(false);

	const Add = () => {
	  document.querySelector("body")?.classList.remove("error-1");
	  document.querySelector("body")?.classList.remove("landing-body");
	};
	
	useEffect(() => {
	  Add();
	  setlateLoad(true);
	});

	useEffect(() => {
		if (typeof window === "undefined") return;
		if (!getAuthToken()) {
			redirectToLogin({ fallbackReturnUrl: "/valuebet" });
		}
	}, [router]);

  const [MyclassName, setMyClass] = useState("");
  const Bodyclickk = () => {
    const theme = store.getState();
    if (localStorage.getItem("bzverticalstyles") == "icontext") {
      setMyClass("");
    }
    if (window.innerWidth > 992) {
      let html = document.documentElement;
      if (html.getAttribute('icon-overlay') === 'open') {
          html.setAttribute('icon-overlay' ,"");
      }
    }
  }
  const [pageloading, setpageloading] = useState(false);

  return (
    <>
    <Fragment>
      <Initialload.Provider value={{ pageloading, setpageloading }}>
       <Provider store={store}>
       <LanguageProvider>
       <BetsCountProvider>
       <PaymentSignalRProvider>
       <div style={{display: `${lateLoad ? 'block' : 'none'}`}}>
        <Switcher/>
      <div className='page'>
        <Header/>
        <Sidebar/>
        <div className='content'>
          <div className='main-content'  onClick={Bodyclickk}>
            {children}
          </div>
        </div>
        <Footer/>
      </div>
      <Backtotop />
      <PrelineScript/>
        </div>
       </PaymentSignalRProvider>
       </BetsCountProvider>
       </LanguageProvider>
      </Provider>
      </Initialload.Provider>
    </Fragment>
    </>

  )
}

export default ContentLayout;
