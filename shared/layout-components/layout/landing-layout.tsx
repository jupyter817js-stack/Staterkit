import PrelineScript from '@/pages/PrelineScript.page';
import store from '@/shared/redux/store';
import PaymentSignalRProvider from '@/shared/contexts/PaymentSignalRContext';
import React, { Fragment, useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import Landingswitcher from '../switcher/landingswitcher';
import { Initialload } from '../contextapi';
import { LanguageProvider } from '@/shared/i18n/LanguageContext';

const Landinglayout = ({children}:any) => {

  const [mounted, setMounted] = useState(false);
  const [pageloading, setpageloading] = useState(false)

  useEffect(() => {
    setMounted(true);
  }, []);

  /* 서버/클라이언트 동일한 placeholder로 hydration 불일치(React #418) 방지 */
  if (!mounted) {
    return <div className="min-h-screen bg-bodybg" />;
  }

  return (
    <Fragment>
   <Initialload.Provider value={{ pageloading, setpageloading }}>
       <Provider store={store}>
       <LanguageProvider>
       <PaymentSignalRProvider>
       <div>
        <Landingswitcher />
        {children}
      <div id="responsive-overlay"></div>
       <PrelineScript/>
     </div>
       </PaymentSignalRProvider>
       </LanguageProvider>
          </Provider>
          </Initialload.Provider>
  </Fragment>
  )
}

export default Landinglayout
