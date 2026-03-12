import store from '@/shared/redux/store'
import React, { Fragment } from 'react'
import { Provider } from 'react-redux'
import { LanguageProvider } from '@/shared/i18n/LanguageContext'
import Switcher from '../switcher/switcher'
import PrelineScript from '@/pages/PrelineScript.page'

const Authenticationlayout = ({children}:any) => {
  return (
    <Fragment>
      <Provider store={store}>
      <LanguageProvider>
             <Switcher/>
             {children}
              <PrelineScript/>
      </LanguageProvider>
        </Provider>
    </Fragment>
  )
}

export default Authenticationlayout;