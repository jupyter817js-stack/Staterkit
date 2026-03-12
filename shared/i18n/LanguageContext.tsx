"use client";

import React, { createContext, useContext, useCallback } from "react";
import { connect } from "react-redux";
import store from "@/shared/redux/store";
import { ThemeChanger } from "@/shared/redux/action";
import { translations, t as translate, type Lang } from "./translations";

const LANG_STORAGE_KEY = "staterkit_lang";

export function getStoredLang(): Lang {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem(LANG_STORAGE_KEY);
  if (stored === "ko" || stored === "en") return stored;
  return "en";
}

const LanguageContext = createContext<{
  lang: Lang;
  t: (key: string) => string;
  setLang: (lang: Lang) => void;
} | null>(null);

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    const fallbackLang: Lang = getStoredLang();
    return {
      lang: fallbackLang,
      t: (key: string) => translate(fallbackLang, key),
      setLang: () => {},
    };
  }
  return ctx;
}

function LanguageProviderInner({
  children,
  local_varaiable,
  ThemeChanger,
}: {
  children: React.ReactNode;
  local_varaiable: { lang?: string };
  ThemeChanger: (v: any) => void;
}) {
  const lang: Lang = (local_varaiable?.lang === "ko" ? "ko" : "en") as Lang;

  const t = useCallback(
    (key: string) => translate(lang, key),
    [lang]
  );

  const setLang = useCallback(
    (newLang: Lang) => {
      localStorage.setItem(LANG_STORAGE_KEY, newLang);
      const theme = store.getState();
      ThemeChanger({ ...theme, lang: newLang });
    },
    [ThemeChanger]
  );

  return (
    <LanguageContext.Provider value={{ lang, t, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

const mapStateToProps = (state: any) => ({
  local_varaiable: state,
});

export const LanguageProvider = connect(mapStateToProps, { ThemeChanger })(
  LanguageProviderInner
);
