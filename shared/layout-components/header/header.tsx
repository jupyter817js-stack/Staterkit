'use client';

import Link from "next/link";
import React, { Fragment, useCallback, useEffect, useState } from "react";
import { ThemeChanger } from "../../redux/action";
import { connect } from "react-redux";
import store from "@/shared/redux/store";
import Modalsearch from "../modal-search/modalsearch";
import { basePath } from "@/next.config";
import { auth } from "@/shared/firebase/firebaseapi";
import router from "next/router";
import { clearAuthToken } from "@/shared/api/auth";
import { getCurrentUser } from "@/shared/api/users";
import type { CurrentUser } from "@/shared/types/users";
import { useRefreshUserOnSubscriptionUpdate } from "@/shared/hooks/useRefreshUserOnSubscriptionUpdate";
import { USER_LEVEL, USER_LEVEL_LABEL } from "@/shared/types/users";
import { useLanguage } from "@/shared/i18n/LanguageContext";

const Header = ({ local_varaiable, ThemeChanger }: any) => {
  const { lang, t, setLang } = useLanguage();
  const [passwordshow1, setpasswordshow1] = useState(false);

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const fetchCurrentUser = useCallback(async () => {
    const user = await getCurrentUser();
    setCurrentUser(user ?? null);
  }, []);
  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);
  useRefreshUserOnSubscriptionUpdate(setCurrentUser);
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setProfilePhotoUrl(user?.photoURL ?? null);
    });
    return () => unsubscribe();
  }, []);
  let [storedata, SetStoreData] = useState(local_varaiable);

  //full screen
  const [fullScreen, setFullScreen] = useState(false);

  const toggleFullscreen = () => {
    const elem = document.documentElement;

    if (!document.fullscreenElement) {
      elem.requestFullscreen().then(() => setFullScreen(true));
    } else {
      document.exitFullscreen().then(() => setFullScreen(false));
    }
  };

  useEffect(() => {
    const handleResize = () => {
      const windowObject = window;
      if (windowObject.innerWidth <= 991) {
        // ThemeChanger({ ...local_varaiable, "dataToggled": "close" })
      } else {
        // ThemeChanger({...local_varaiable,"dataToggled":""})
      }
    };
    handleResize(); // Check on component mount
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault(); // "#!" 이동 막기

    try {
      // Firebase 세션 종료
      console.log("Logging out from Firebase...");
      await auth.signOut();
    } catch {
      // 실패해도 아래는 진행
    } finally {
      // 우리 토큰 제거
      clearAuthToken();
      // 로그인 페이지로 이동
      router.replace("/login");
    }
  };

  // useEffect(() => {
  //   SetStoreData(local_varaiable);
  // }, [local_varaiable]);

  // function menuClose() {
  //   const theme = store.getState();
  //   ThemeChanger({ ...theme, "dataToggled": "close" });
  // }

  function menuClose() {
    const theme = store.getState();
    if (window.innerWidth <= 992) {
      ThemeChanger({ ...theme, dataToggled: "close" });
    }
    if (window.innerWidth >= 992) {
      ThemeChanger({
        ...theme,
        dataToggled: local_varaiable.dataToggled
          ? local_varaiable.dataToggled
          : "",
      });
      // local_varaiable.dataHeaderStyles == 'dark' ? 'light' : 'dark',
    }
  }

  const toggleSidebar = () => {
    const theme = store.getState();
    let sidemenuType = theme.dataNavLayout;
    if (window.innerWidth >= 992) {
      if (sidemenuType === "vertical") {
        let verticalStyle = theme.dataVerticalStyle;
        const navStyle = theme.dataNavStyle;
        switch (verticalStyle) {
          // closed
          case "closed":
            ThemeChanger({ ...theme, dataNavStyle: "" });
            if (theme.dataToggled === "close-menu-close") {
              ThemeChanger({ ...theme, dataToggled: "" });
            } else {
              ThemeChanger({ ...theme, dataToggled: "close-menu-close" });
            }
            break;
          // icon-overlay
          case "overlay":
            ThemeChanger({ ...theme, dataNavStyle: "" });
            if (theme.dataToggled === "icon-overlay-close") {
              ThemeChanger({ ...theme, dataToggled: "", iconOverlay: "" });
            } else {
              if (window.innerWidth >= 992) {
                ThemeChanger({
                  ...theme,
                  dataToggled: "icon-overlay-close",
                  iconOverlay: "",
                });
              }
            }
            break;
          // icon-text
          case "icontext":
            ThemeChanger({ ...theme, dataNavStyle: "" });
            if (theme.dataToggled === "icon-text-close") {
              ThemeChanger({ ...theme, dataToggled: "" });
            } else {
              ThemeChanger({ ...theme, dataToggled: "icon-text-close" });
            }
            break;
          // doublemenu
          case "doublemenu":
            ThemeChanger({ ...theme, dataNavStyle: "" });
            ThemeChanger({ ...theme, dataNavStyle: "" });
            if (theme.dataToggled === "double-menu-open") {
              ThemeChanger({ ...theme, dataToggled: "double-menu-close" });
            } else {
              let sidemenu = document.querySelector(".side-menu__item.active");
              if (sidemenu) {
                ThemeChanger({ ...theme, dataToggled: "double-menu-open" });
                if (sidemenu.nextElementSibling) {
                  sidemenu.nextElementSibling.classList.add(
                    "double-menu-active",
                  );
                } else {
                  ThemeChanger({ ...theme, dataToggled: "" });
                }
              }
            }
            // doublemenu(ThemeChanger);
            break;
          // detached
          case "detached":
            if (theme.dataToggled === "detached-close") {
              ThemeChanger({ ...theme, dataToggled: "", iconOverlay: "" });
            } else {
              ThemeChanger({
                ...theme,
                dataToggled: "detached-close",
                iconOverlay: "",
              });
            }

            break;

          // default
          case "default":
            ThemeChanger({ ...theme, dataToggled: "" });
        }
        switch (navStyle) {
          case "menu-click":
            if (theme.dataToggled === "menu-click-closed") {
              ThemeChanger({ ...theme, dataToggled: "" });
            } else {
              ThemeChanger({ ...theme, dataToggled: "menu-click-closed" });
            }
            break;
          // icon-overlay
          case "menu-hover":
            if (theme.dataToggled === "menu-hover-closed") {
              ThemeChanger({ ...theme, dataToggled: "" });
            } else {
              ThemeChanger({ ...theme, dataToggled: "menu-hover-closed" });
            }
            break;
          case "icon-click":
            if (theme.dataToggled === "icon-click-closed") {
              ThemeChanger({ ...theme, dataToggled: "" });
            } else {
              ThemeChanger({ ...theme, dataToggled: "icon-click-closed" });
            }
            break;
          case "icon-hover":
            if (theme.dataToggled === "icon-hover-closed") {
              ThemeChanger({ ...theme, dataToggled: "" });
            } else {
              ThemeChanger({ ...theme, dataToggled: "icon-hover-closed" });
            }
            break;
        }
      }
    } else {
      if (theme.dataToggled === "close") {
        ThemeChanger({ ...theme, dataToggled: "open" });

        setTimeout(() => {
          if (theme.dataToggled == "open") {
            const overlay = document.querySelector("#responsive-overlay");

            if (overlay) {
              overlay.classList.add("active");
              overlay.addEventListener("click", () => {
                const overlay = document.querySelector("#responsive-overlay");

                if (overlay) {
                  overlay.classList.remove("active");
                  menuClose();
                }
              });
            }
          }

          window.addEventListener("resize", () => {
            if (window.screen.width >= 992) {
              const overlay = document.querySelector("#responsive-overlay");

              if (overlay) {
                overlay.classList.remove("active");
              }
            }
          });
        }, 100);
      } else {
        ThemeChanger({ ...theme, dataToggled: "close" });
      }
    }
  };
  //Dark Model

  const ToggleDark = () => {
    ThemeChanger({
      ...local_varaiable,
      class: local_varaiable.class == "dark" ? "light" : "dark",
      dataHeaderStyles: local_varaiable.class == "dark" ? "light" : "dark",
      dataMenuStyles:
        local_varaiable.dataNavLayout == "horizontal"
          ? local_varaiable.class == "dark"
            ? "light"
            : "dark"
          : "dark",
    });
    const theme = store.getState();

    if (theme.class != "dark") {
      ThemeChanger({
        ...theme,
        bodyBg: "",
        Light: "",
        darkBg: "",
        inputBorder: "",
      });
      localStorage.setItem("bzlighttheme", "light");
      localStorage.removeItem("bzdarktheme");
      localStorage.removeItem("bzMenu");
      localStorage.removeItem("bzHeader");
      localStorage.removeItem("darkBgRGB");
      localStorage.removeItem("bodyBgRGB");
      localStorage.removeItem("Light");
    } else {
      localStorage.setItem("bzdarktheme", "dark");
      localStorage.removeItem("bzlighttheme");
      localStorage.removeItem("bzMenu");
      localStorage.removeItem("bzHeader");
    }
  };

  useEffect(() => {
    const navbar = document?.querySelector(".header");
    const navbar1 = document?.querySelector(".app-sidebar");
    const sticky: any = navbar?.clientHeight;
    // const sticky1 = navbar1.clientHeight;

    function stickyFn() {
      if (window.pageYOffset >= sticky) {
        navbar?.classList.add("sticky-pin");
        navbar1?.classList.add("sticky-pin");
      } else {
        navbar?.classList.remove("sticky-pin");
        navbar1?.classList.remove("sticky-pin");
      }
    }

    window.addEventListener("scroll", stickyFn);
    window.addEventListener("DOMContentLoaded", stickyFn);

    // Cleanup event listeners when the component unmounts
    return () => {
      window.removeEventListener("scroll", stickyFn);
      window.removeEventListener("DOMContentLoaded", stickyFn);
    };
  }, []);

  return (
    <Fragment>
      <div className="app-header">
        <nav className="main-header !h-[3.75rem]" aria-label="Global">
          <div className="main-header-container ps-[0.725rem] pe-[1rem] ">
            <div className="header-content-left">
              <div className="header-element">
                <div className="horizontal-logo">
                  {router.pathname === "/" ? (
                    <Link href="/" className="header-logo">
                      <img
                      src={`${process.env.NODE_ENV === "production" ? basePath : ""}/assets/images/brand-logos/desktop-logo.png`}
                      alt="logo"
                      className="desktop-logo"
                    />
                    <img
                      src={`${process.env.NODE_ENV === "production" ? basePath : ""}/assets/images/brand-logos/toggle-logo.png`}
                      alt="logo"
                      className="toggle-logo"
                    />
                    <img
                      src={`${process.env.NODE_ENV === "production" ? basePath : ""}/assets/images/brand-logos/desktop-dark.png`}
                      alt="logo"
                      className="desktop-dark"
                    />
                    <img
                      src={`${process.env.NODE_ENV === "production" ? basePath : ""}/assets/images/brand-logos/toggle-dark.png`}
                      alt="logo"
                      className="toggle-dark"
                    />
                    <img
                      src={`${process.env.NODE_ENV === "production" ? basePath : ""}/assets/images/brand-logos/desktop-white.png`}
                      alt="logo"
                      className="desktop-white"
                    />
                    <img
                      src={`${process.env.NODE_ENV === "production" ? basePath : ""}/assets/images/brand-logos/toggle-white.png`}
                      alt="logo"
                      className="toggle-white"
                    />
                  </Link>
                  ) : (
                    <a href="/" className="header-logo">
                      <img
                        src={`${process.env.NODE_ENV === "production" ? basePath : ""}/assets/images/brand-logos/desktop-logo.png`}
                        alt="logo"
                        className="desktop-logo"
                      />
                      <img
                        src={`${process.env.NODE_ENV === "production" ? basePath : ""}/assets/images/brand-logos/toggle-logo.png`}
                        alt="logo"
                        className="toggle-logo"
                      />
                      <img
                        src={`${process.env.NODE_ENV === "production" ? basePath : ""}/assets/images/brand-logos/desktop-dark.png`}
                        alt="logo"
                        className="desktop-dark"
                      />
                      <img
                        src={`${process.env.NODE_ENV === "production" ? basePath : ""}/assets/images/brand-logos/toggle-dark.png`}
                        alt="logo"
                        className="toggle-dark"
                      />
                      <img
                        src={`${process.env.NODE_ENV === "production" ? basePath : ""}/assets/images/brand-logos/desktop-white.png`}
                        alt="logo"
                        className="desktop-white"
                      />
                      <img
                        src={`${process.env.NODE_ENV === "production" ? basePath : ""}/assets/images/brand-logos/toggle-white.png`}
                        alt="logo"
                        className="toggle-white"
                      />
                    </a>
                  )}
                </div>
              </div>
              <div
                className="header-element md:px-[0.325rem] !items-center"
                onClick={() => toggleSidebar()}
              >
                <Link
                  aria-label="Hide Sidebar"
                  className="sidemenu-toggle animated-arrow  hor-toggle horizontal-navtoggle inline-flex items-center"
                  href="#!"
                >
                  <span></span>
                </Link>
              </div>
            </div>
            <div className="header-content-right">
              <div className="header-element py-[1rem] md:px-[0.65rem] px-2 header-search">
                <button
                  aria-label="button"
                  type="button"
                  data-hs-overlay="#search-modal"
                  className="inline-flex flex-shrink-0 justify-center items-center gap-2  rounded-full font-medium focus:ring-offset-0 focus:ring-offset-white transition-all text-xs dark:bg-bgdark dark:hover:bg-black/20 dark:text-[#8c9097] dark:text-white/50 dark:hover:text-white dark:focus:ring-white/10 dark:focus:ring-offset-white/10"
                >
                  <i className="bx bx-search-alt-2 header-link-icon"></i>
                </button>
              </div>
              <div className="header-element py-[1rem] md:px-[0.65rem] px-2 header-country hs-dropdown ti-dropdown hidden sm:block [--placement:bottom-left]">
                <button
                  id="dropdown-flag"
                  type="button"
                  className="hs-dropdown-toggle ti-dropdown-toggle !p-0 flex-shrink-0 !border-0 !rounded-full !shadow-none"
                >
                  <img
                    src={lang === "ko" ? "https://flagcdn.com/w40/kr.png" : `${process.env.NODE_ENV === "production" ? basePath : ""}/assets/images/flags/us_flag.jpg`}
                    alt="lang"
                    className="h-[1.75rem] w-[1.75rem] p-1 rounded-full object-cover"
                  />
                </button>
                <div
                  className="hs-dropdown-menu ti-dropdown-menu min-w-[10rem] hidden !-mt-3"
                  aria-labelledby="dropdown-flag"
                >
                  <div className="ti-dropdown-divider divide-y divide-gray-200 dark:divide-white/10">
                    <div className="py-2 first:pt-0 last:pb-0">
                      <button
                        type="button"
                        className="ti-dropdown-item !p-[0.65rem] w-full text-start"
                        onClick={() => setLang("ko")}
                      >
                        <div className="flex items-center space-x-2 rtl:space-x-reverse w-full">
                          <div className="h-[1.375rem] flex items-center w-[1.375rem] rounded-full overflow-hidden">
                            <img src="https://flagcdn.com/w40/kr.png" alt="KR" className="h-[1rem] w-[1rem] object-cover" />
                          </div>
                          <div>
                            <p className="!text-[0.8125rem] font-medium">{t("korean")}</p>
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        className="ti-dropdown-item !p-[0.65rem] w-full text-start"
                        onClick={() => setLang("en")}
                      >
                        <div className="flex items-center space-x-2 rtl:space-x-reverse w-full">
                          <div className="h-[1.375rem] flex items-center w-[1.375rem] rounded-full overflow-hidden">
                            <img
                              src={`${process.env.NODE_ENV === "production" ? basePath : ""}/assets/images/flags/us_flag.jpg`}
                              alt="US"
                              className="h-[1rem] w-[1rem] rounded-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="!text-[0.8125rem] font-medium">{t("english")}</p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div
                className="header-element header-theme-mode hidden !items-center sm:block !py-[1rem] md:!px-[0.65rem] px-2"
                onClick={() => ToggleDark()}
              >
                <Link
                  aria-label="anchor"
                  className="hs-dark-mode-active:hidden flex hs-dark-mode group flex-shrink-0 justify-center items-center gap-2  rounded-full font-medium transition-all text-xs dark:bg-bgdark dark:hover:bg-black/20 dark:text-[#8c9097] dark:text-white/50 dark:hover:text-white dark:focus:ring-white/10 dark:focus:ring-offset-white/10"
                  href="#!"
                  data-hs-theme-click-value="dark"
                >
                  <i className="bx bx-moon header-link-icon"></i>
                </Link>
                <Link
                  aria-label="anchor"
                  className="hs-dark-mode-active:flex hidden hs-dark-mode group flex-shrink-0 justify-center items-center gap-2  rounded-full font-medium text-defaulttextcolor  transition-all text-xs dark:bg-bodybg dark:bg-bgdark dark:hover:bg-black/20 dark:text-[#8c9097] dark:text-white/50 dark:hover:text-white dark:focus:ring-white/10 dark:focus:ring-offset-white/10"
                  href="#!"
                  data-hs-theme-click-value="light"
                >
                  <i className="bx bx-sun header-link-icon"></i>
                </Link>
              </div>
              <div className="header-element header-fullscreen py-[1rem] md:px-[0.65rem] px-2">
                <Link
                  aria-label="anchor"
                  onClick={() => toggleFullscreen()}
                  href="#!"
                  className="inline-flex flex-shrink-0 justify-center items-center gap-2  !rounded-full font-medium dark:hover:bg-black/20 dark:text-[#8c9097] dark:text-white/50 dark:hover:text-white dark:focus:ring-white/10 dark:focus:ring-offset-white/10"
                >
                  {fullScreen ? (
                    <i className="bx bx-exit-fullscreen full-screen-close header-link-icon"></i>
                  ) : (
                    <i className="bx bx-fullscreen full-screen-open header-link-icon"></i>
                  )}
                </Link>
              </div>
              <div className="header-element md:!px-[0.65rem] px-2 hs-dropdown !items-center ti-dropdown [--placement:bottom-left]">
                <button
                  id="dropdown-profile"
                  type="button"
                  className="hs-dropdown-toggle ti-dropdown-toggle !gap-2 !p-0 flex-shrink-0 sm:me-2 me-0 !rounded-full !shadow-none text-xs align-middle !border-0 !shadow-transparent "
                >
                  <img
                    className="inline-block rounded-full object-cover"
                    src={
                      profilePhotoUrl ||
                      `${process.env.NODE_ENV === "production" ? basePath : ""}/assets/images/faces/9.jpg`
                    }
                    width="32"
                    height="32"
                    alt="프로필"
                  />
                </button>
                <div className="md:block hidden dropdown-profile">
                  <p className="font-semibold mb-0 leading-none text-[#536485] text-[0.813rem] ">
                    {currentUser
                      ? (() => {
                          const fn = (currentUser as any).firstName ?? currentUser.firstname ?? "";
                          const ln = (currentUser as any).lastName ?? currentUser.lastname ?? "";
                          return fn || ln ? `${fn} ${ln}`.trim() : currentUser.email;
                        })()
                      : t("user")}
                  </p>
                  <span className="opacity-[0.7] font-normal text-[#536485] block text-[0.6875rem] ">
                    {currentUser
                      ? (currentUser.level === USER_LEVEL.SUPER_ADMIN || currentUser.level === USER_LEVEL.ADMIN
                          ? t("levelSuperAdmin")
                          : currentUser.level === USER_LEVEL.PARTNER
                            ? t("levelPartner")
                            : currentUser.level === USER_LEVEL.STORE
                              ? t("levelStore")
                              : t("levelUser"))
                      : ""}
                  </span>
                </div>
                <div
                  className="hs-dropdown-menu ti-dropdown-menu !-mt-3 border-0 w-[11rem] !p-0 border-defaultborder hidden main-header-dropdown  pt-0 overflow-hidden header-profile-dropdown dropdown-menu-end"
                  aria-labelledby="dropdown-profile"
                >
                  <ul className="text-defaulttextcolor font-medium dark:text-[#8c9097] dark:text-white/50">
                    <li>
                      <Link
                        className="w-full ti-dropdown-item !text-[0.8125rem] !gap-x-0 !p-[0.65rem] !inline-flex"
                        href="/settings"
                      >
                        <i className="ti ti-adjustments-horizontal text-[1.125rem] me-2 opacity-[0.7]"></i>
                        {t("settings")}
                      </Link>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full ti-dropdown-item !text-[0.8125rem] !p-[0.65rem] !gap-x-0 !inline-flex"
                      >
                        <i className="ti ti-logout text-[1.125rem] me-2 opacity-[0.7]"></i>
                        {t("logOut")}
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="header-element md:px-[0.48rem]">
                <button
                  aria-label="button"
                  type="button"
                  className="hs-dropdown-toggle switcher-icon inline-flex flex-shrink-0 justify-center items-center gap-2  rounded-full font-medium  align-middle transition-all text-xs dark:text-[#8c9097] dark:text-white/50 dark:hover:text-white dark:focus:ring-white/10 dark:focus:ring-offset-white/10"
                  data-hs-overlay="#hs-overlay-switcher"
                >
                  <i className="bx bx-cog header-link-icon animate-spin-slow"></i>
                </button>
              </div>
            </div>
          </div>
        </nav>
      </div>
      <Modalsearch />
    </Fragment>
  );
};

const mapStateToProps = (state: any) => ({
  local_varaiable: state,
});
export default connect(mapStateToProps, { ThemeChanger })(Header);
