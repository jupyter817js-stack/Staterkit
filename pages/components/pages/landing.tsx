'use client';

import Link from 'next/link'
import React, { Fragment, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { ThemeChanger } from "../../../shared/redux/action";
import { connect } from 'react-redux';
import store from '@/shared/redux/store';
import { Pagination, Autoplay } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper';
import Seo from '../../../shared/layout-components/seo/seo';
import { getCurrentUser } from '@/shared/api/users';
import { clearAuthToken } from '@/shared/api/auth';
import { auth } from '@/shared/firebase/firebaseapi';
import { SUBSCRIPTION_PLAN } from '@/shared/types/subscription';
import CryptoSubscriptionModal from '@/pages/components/subscription/CryptoSubscriptionModal';
import type { CurrentUser } from '@/shared/types/users';
import { useLanguage } from '@/shared/i18n/LanguageContext';
import { basePath } from '@/next.config';
import ToastContainer from '@/shared/ui/ToastContainer';
import type { ToastItem } from '@/shared/ui/Toast';
import { useRefreshUserOnSubscriptionUpdate } from '@/shared/hooks/useRefreshUserOnSubscriptionUpdate';

/** 언어별 랜딩 슬라이드 이미지 4장 (en: slide-1, slilde-2 오타 있음, slide-3, slide-4 / kr: slide-1~4) */
const LANDING_SLIDES_EN = ['slide-1.png', 'slide-2.png', 'slide-3.png', 'slide-4.png'];
const LANDING_SLIDES_KR = ['slide-1.png', 'slide-2.png', 'slide-3.png', 'slide-4.png'];
const PROMO_VIDEOS = ['video-1.mp4', 'video-2.mp4'];

const Landing = ({ local_varaiable, ThemeChanger }: any) => {
    const { t, lang, setLang } = useLanguage();
    const landingSlideDir = lang === 'ko' ? 'kr' : 'en';
    const landingSlides = lang === 'ko' ? LANDING_SLIDES_KR : LANDING_SLIDES_EN;
    const heroSwiperInstanceRef = useRef<SwiperType | null>(null);
    const [heroSlideIndex, setHeroSlideIndex] = useState(0);
    const [promoVideoIndex, setPromoVideoIndex] = useState(0);
    const HERO_AUTOPLAY_DELAY = 4000;
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [currentUserReady, setCurrentUserReady] = useState(false);
    const [cryptoModalOpen, setCryptoModalOpen] = useState(false);
    const [cryptoModalPlan, setCryptoModalPlan] = useState<'STANDARD' | 'PRO' | null>(null);
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    /** 당분간 미사용: TESTIMONIALS, OUR TEAM, F.A.Q, CONTACT US — true면 숨김, false로 바꾸면 표시 */
    const HIDE_EXTRA_LANDING_SECTIONS = true;

    const addToast = useCallback((type: ToastItem['type'], message: string) => {
        setToasts((prev) => [...prev, { id: `toast-${Date.now()}`, type, message }]);
    }, []);
    const dismissToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((x) => x.id !== id));
    }, []);

    const promoVideoSrc = `${process.env.NODE_ENV === 'production' ? basePath : ''}/assets/video/${PROMO_VIDEOS[promoVideoIndex]}`;

    useEffect(() => {
        getCurrentUser().then((me) => {
            setCurrentUser(me ?? null);
            setCurrentUserReady(true);
        });
    }, []);
    useRefreshUserOnSubscriptionUpdate(setCurrentUser);

    /* 자동 재생: Swiper autoplay 대신 setInterval로 4초마다 다음 슬라이드 */
    useEffect(() => {
        const id = setInterval(() => {
            const sw = heroSwiperInstanceRef.current;
            if (!sw) return;
            if (sw.realIndex >= landingSlides.length - 1) sw.slideTo(0);
            else sw.slideNext();
        }, HERO_AUTOPLAY_DELAY);
        return () => clearInterval(id);
    }, [landingSlides.length]);

    const handleLogout = useCallback(async (e: React.MouseEvent) => {
        e.preventDefault();
        try {
            await auth.signOut();
        } catch {
            // ignore
        } finally {
            clearAuthToken();
            setCurrentUser(null);
        }
    }, []);

    useEffect(() => {
        const q = router.query;
        const successParam = q.payment_success ?? q.subscription_success;
        if (successParam === '1' || successParam === 'true') {
            getCurrentUser().then((me) => {
                setCurrentUser(me ?? null);
                addToast('success', t('landing_paymentUpgradeSuccess'));
            });
            if (typeof window !== 'undefined') {
                const u = new URL(window.location.href);
                u.searchParams.delete('payment_success');
                u.searchParams.delete('subscription_success');
                window.history.replaceState({}, '', u.pathname + u.hash + (u.search || ''));
            }
        }
    }, [router.query?.payment_success, router.query?.subscription_success, addToast, t]);

    useEffect(() => {
        if (!router.isReady || typeof window === 'undefined' || !currentUserReady) return;
        const openSubscription = router.query.openSubscription;
        const shouldOpen =
            openSubscription === '1' ||
            openSubscription === 'true' ||
            (Array.isArray(openSubscription) && (openSubscription[0] === '1' || openSubscription[0] === 'true'));
        if (!shouldOpen) return;

        const rawPlan = router.query.plan;
        const requestedPlan =
            rawPlan === 'STANDARD' || rawPlan === 'PRO'
                ? rawPlan
                : Array.isArray(rawPlan) && (rawPlan[0] === 'STANDARD' || rawPlan[0] === 'PRO')
                    ? rawPlan[0]
                    : 'PRO';

        if (!currentUser?.id) {
            router.replace('/login?returnUrl=' + encodeURIComponent(`/?openSubscription=1&plan=${requestedPlan}#pricing`));
            return;
        }

        setCryptoModalPlan(requestedPlan);
        setCryptoModalOpen(true);

        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('openSubscription');
        cleanUrl.searchParams.delete('plan');
        window.history.replaceState({}, '', `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`);
    }, [currentUser?.id, currentUserReady, router, router.isReady, router.query.openSubscription, router.query.plan]);

    /* 다른 페이지(슈어벳/밸류벳 등)에서 /#pricing 등으로 진입 시 해당 섹션으로 스크롤 */
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const hash = window.location.hash.slice(1);
        if (!hash) return;
        const scrollToId = () => {
            const el = document.getElementById(hash);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        };
        const t1 = setTimeout(scrollToId, 150);
        const t2 = setTimeout(scrollToId, 600);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [router.asPath, router.isReady]);

    const handlePricingSubscribe = useCallback(async (plan: 'STANDARD' | 'PRO') => {
        const user = await getCurrentUser();
        if (!user?.id) {
            router.push('/login?returnUrl=' + encodeURIComponent('/#pricing'));
            return;
        }
        setCryptoModalPlan(plan);
        setCryptoModalOpen(true);
    }, [router]);

    useEffect(() => {
        ThemeChanger({
            ...local_varaiable,
            "dataNavLayout": "vertical",
            "dataMenuStyles": "dark",
        });
        function handleResize() {
            if (window.innerWidth <= 992) {
                const theme = store.getState();
                ThemeChanger({ ...theme, "dataToggled": "close", "dataNavLayout": "horizontal" });
            } else {
                const theme = store.getState();
                ThemeChanger({ ...theme, "dataToggled": "open", "dataNavLayout": "horizontal" });
            }
        }

        handleResize(); // Initial check

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    function toggleNavigation() {
        if (window.innerWidth <= 992) {
            const theme = store.getState();
            ThemeChanger({ ...theme, "dataToggled": "open", "dataNavLayout": "horizontal" });
        }
    }
    function handleClick() {
        const theme = store.getState();
        ThemeChanger({ ...theme, "dataToggled": "close", "dataNavLayout": "horizontal" });
    }

    useEffect(() => {
        const landingpages = () => {
            if (window.scrollY > 30 && document.querySelector(".app-sidebar")) {
                let Scolls = document?.querySelectorAll(".sticky");
                Scolls.forEach((e) => {
                    e.classList.add("sticky-pin");
                });
            } else {
                let Scolls = document?.querySelectorAll(".sticky");
                Scolls.forEach((e) => {
                    e.classList.remove("sticky-pin");
                });
            }
        };

        if (typeof window !== "undefined") {
            window.addEventListener("scroll", landingpages);
        }
    });

    //
    //// Template Highlights collapse
    const onScroll = () => {
        const sections = document.querySelectorAll(".side-menu__item");
        const scrollPos =
            window.scrollY ||
            document.documentElement.scrollTop ||
            (document.querySelector("body")?.scrollTop || 0);

        sections.forEach((elem) => {
            const value = elem.getAttribute("href") ?? "";
            const fragmentIndex = value.indexOf("#");
            const fragment = fragmentIndex !== -1 ? value.substring(fragmentIndex + 1) : "";

            if (fragment) {
                const refElement = document.getElementById(fragment);

                if (refElement) {
                    const scrollTopMinus = scrollPos + 73;
                    if (
                        refElement.offsetTop <= scrollTopMinus &&
                        refElement.offsetTop + refElement.offsetHeight > scrollTopMinus
                    ) {
                        elem.classList.add("active");
                    } else {
                        elem.classList.remove("active");
                    }
                }
            }
        });
    };

    useEffect(() => {
        window.addEventListener("scroll", onScroll);

        return () => {
            window.removeEventListener("scroll", onScroll);
        };
    }, []);

    const breakpoints = {
        // when window width is >= 320px
        320: {
            slidesPerView: 1,
            spaceBetween: 20,
        },
        // when window width is >= 480px
        480: {
            slidesPerView: 2,
            spaceBetween: 30,
        },
        // when window width is >= 780px
        780: {
            slidesPerView: 3,
            spaceBetween: 40,
        },
        // when window width is >= 990px
        990: {
            slidesPerView: 3,
            spaceBetween: 40,
        },
        // for full-screen mode
        1920: {
            slidesPerView: 3,
            spaceBetween: 40,
        },
    };

    return (
        <Fragment>
                <Seo title={"BETSUREZONE | Quant-grade Surebet & Valuebet Intelligence"} />
                <div className="landing-body">
                <header className="app-header">
                    <div className="main-header-container container-fluid">
                        <div className="header-content-left">
                            <div className="header-element">
                                <div className="horizontal-logo">
                                    <Link href="/" className="header-logo">
                                    <img src="../../../assets/images/brand-logos/toggle-logo.png" alt="logo" className="toggle-logo" />
                                        <img src="../../../assets/images/brand-logos/toggle-dark.png" alt="logo" className="toggle-dark" /> 
                                    </Link>
                                    
                                </div> </div>
                            <div className="header-element">
                                <Link aria-label="anchor" href="#!" className="sidemenu-toggle header-link" >
                                    <span className="open-toggle" onClick={() => toggleNavigation()}> <i className="ri-menu-3-line text-xl"></i> </span> </Link>
                            </div>
                        </div>
                        <div className="header-content-right">
                            <div className="header-element !items-center">
                                <div className="lg:hidden block flex items-center gap-2">
                                    {!currentUser && (
                                        <>
                                            <Link href="/login" className="ti-btn ti-btn-light !m-0 !me-2 whitespace-nowrap"> {t('signIn')} </Link>
                                            <Link href="/join" className="ti-btn ti-btn-primary !m-0 !me-2 whitespace-nowrap"> {t('signUp')} </Link>
                                        </>
                                    )}
                                    {currentUser && (
                                        <button type="button" onClick={handleLogout} className="ti-btn ti-btn-outline-danger !m-0 !me-2" aria-label={t('signOut')}>
                                            <i className="ri-logout-box-r-line me-1 align-middle"></i>
                                            {t('signOut')}
                                        </button>
                                    )}
                                    <Link aria-label="anchor" href="#!" className="ti-btn m-0 p-2 px-3 ti-btn-success" data-hs-overlay="#hs-overlay-switcher"><i className="ri-settings-3-line animate-spin-slow"></i></Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>
                <aside className="app-sidebar sticky !topacity-0" id="sidebar">
                    <div className="container-xl xl:!p-0">
                        <div className="main-sidebar mx-0">
                            <nav className="main-menu-container nav nav-pills flex-column sub-open">
                                <div className="landing-logo-container my-auto hidden lg:block">
                                    <div className="responsive-logo">
                                        <Link className="responsive-logo-light" href="/" aria-label="Brand"><img
                                            src="../../../assets/images/brand-logos/desktop-logo.png" alt="logo" className="mx-auto logo-desktop" /></Link>
                                        <Link className="responsive-logo-dark" href="/" aria-label="Brand"><img
                                            src="../../../assets/images/brand-logos/desktop-white.png" alt="logo" className="mx-auto logo-desktop" /></Link>
                                    </div>
                                </div>
                                <div className="slide-left hidden" id="slide-left"><svg xmlns="http://www.w3.org/2000/svg" fill="#7b8191" width="24" height="24" viewBox="0 0 24 24"> <path d="M13.293 6.293 7.586 12l5.707 5.707 1.414-1.414L10.414 12l4.293-4.293z"></path> </svg></div>
                                <ul className="main-menu">
                                    <li className="slide">
                                        <Link className="side-menu__item" href="#home">
                                            <span className="side-menu__label">{t('landing_home')}</span>
                                        </Link>
                                    </li>

                                    <li className="slide">
                                        <Link href="#about" className="side-menu__item">
                                            <span className="side-menu__label">{t('landing_about')}</span>
                                        </Link>
                                    </li>
                                    <li className="slide">
                                        <Link href="/valuebet" className="side-menu__item">
                                            <span className="side-menu__label">{t('valueBets')}</span>
                                        </Link>
                                    </li>
                                    <li className="slide">
                                        <Link href="/surebet" className="side-menu__item">
                                            <span className="side-menu__label">{t('sureBets')}</span>
                                        </Link>
                                    </li>
                                    {!HIDE_EXTRA_LANDING_SECTIONS && (
                                    <li className="slide">
                                        <Link href="#team" className="side-menu__item">
                                            <span className="side-menu__label">{t('landing_team')}</span>
                                        </Link>
                                    </li>
                                    )}

                                    <li className="slide">
                                        <Link href="#pricing" className="side-menu__item">
                                            <span className="side-menu__label">{t('landing_pricing')}</span>
                                        </Link>
                                    </li>

                                    {!HIDE_EXTRA_LANDING_SECTIONS && (
                                    <li className="slide">
                                        <Link href="#faq" className="side-menu__item">
                                            <span className="side-menu__label">{t('landing_faq')}</span>
                                        </Link>
                                    </li>
                                    )}

                                    {!HIDE_EXTRA_LANDING_SECTIONS && (
                                    <li className="slide">
                                        <Link href="#contact" className="side-menu__item">
                                            <span className="side-menu__label">{t('landing_contact')}</span>
                                        </Link>
                                    </li>
                                    )}
                                </ul>
                                <div className="slide-right hidden" id="slide-right"><svg xmlns="http://www.w3.org/2000/svg" fill="#7b8191" width="24" height="24" viewBox="0 0 24 24"> <path d="M10.707 17.707 16.414 12l-5.707-5.707-1.414 1.414L13.586 12l-4.293 4.293z"></path> </svg></div>
                                <div className="lg:flex hidden items-center gap-2">
                                    <div className="header-country hs-dropdown ti-dropdown [--placement:bottom-left]">
                                        <button
                                            id="dropdown-flag-landing"
                                            type="button"
                                            className="hs-dropdown-toggle ti-dropdown-toggle !p-0 flex-shrink-0 !border-0 !rounded-full !shadow-none"
                                            aria-label={lang === 'ko' ? '언어' : 'Language'}
                                        >
                                            <img
                                                src={lang === 'ko' ? 'https://flagcdn.com/w40/kr.png' : `${process.env.NODE_ENV === 'production' ? basePath : ''}/assets/images/flags/us_flag.jpg`}
                                                alt=""
                                                className="h-[1.75rem] w-[1.75rem] rounded-full object-cover border border-white/20"
                                            />
                                        </button>
                                        <div
                                            className="hs-dropdown-menu ti-dropdown-menu min-w-[10rem] hidden !-mt-3"
                                            aria-labelledby="dropdown-flag-landing"
                                        >
                                            <div className="ti-dropdown-divider divide-y divide-gray-200 dark:divide-white/10">
                                                <div className="py-2 first:pt-0 last:pb-0">
                                                    <button
                                                        type="button"
                                                        className="ti-dropdown-item !p-[0.65rem] w-full text-start"
                                                        onClick={() => setLang('ko')}
                                                    >
                                                        <div className="flex items-center space-x-2 rtl:space-x-reverse w-full">
                                                            <img src="https://flagcdn.com/w40/kr.png" alt="" className="h-[1rem] w-[1rem] rounded-full object-cover" />
                                                            <span className="!text-[0.8125rem] font-medium">{t('korean')}</span>
                                                        </div>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="ti-dropdown-item !p-[0.65rem] w-full text-start"
                                                        onClick={() => setLang('en')}
                                                    >
                                                        <div className="flex items-center space-x-2 rtl:space-x-reverse w-full">
                                                            <img src={`${process.env.NODE_ENV === 'production' ? basePath : ''}/assets/images/flags/us_flag.jpg`} alt="" className="h-[1rem] w-[1rem] rounded-full object-cover" />
                                                            <span className="!text-[0.8125rem] font-medium">{t('english')}</span>
                                                        </div>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {!currentUser && (
                                        <>
                                            <Link href="/login" className="ti-btn ti-btn-light m-0 p-2 whitespace-nowrap">{t('signIn')}</Link>
                                            <Link href="/join" className="ti-btn ti-btn-primary-full m-0 p-2 whitespace-nowrap w-[6.375rem]">{t('signUp')}</Link>
                                        </>
                                    )}
                                    {currentUser && (
                                        <button type="button" onClick={handleLogout} className="ti-btn ti-btn-outline-danger m-0 p-2" aria-label={t('signOut')}>
                                            <i className="ri-logout-box-r-line me-1 align-middle"></i>
                                            {t('signOut')}
                                        </button>
                                    )}
                                    <Link aria-label="anchor" href="#!" className="ti-btn m-0 p-2 px-3 bg-light !font-medium"
                                        data-hs-overlay="#hs-overlay-switcher"><i className="ri-settings-3-line animate-spin-slow"></i></Link>
                                </div>
                            </nav>
                        </div>
                    </div>
                </aside>
                <div className="main-content !p-0 landing-main dark:text-defaulttextcolor/70 overflow-x-hidden" onClick={() => handleClick()}>
                    <div className="landing-banner landing-banner-with-spacing" id="home">
                        <section className="section landing-hero-section">
                            <div className="container-xl main-banner-container px-3 w-full max-w-full">
                                <div className="grid grid-cols-12 gap-4 lg:gap-6 items-stretch min-h-0 py-2 lg:py-3">
                                    <div className="xxl:col-span-5 xl:col-span-5 lg:col-span-5 col-span-12 flex flex-col justify-between min-h-[220px] lg:min-h-[280px] py-4 sm:py-5 lg:py-6 lg:pr-4">
                                        <div className="w-full max-w-lg landing-hero-text-block">
                                            <span className="landing-hero-badge">{t('landing_heroBadge')}</span>
                                            <p className="landing-brand-name mt-3 mb-2 sm:mb-3 opacity-95">{t('landing_brilliance')}</p>
                                            <h1 className="landing-banner-heading landing-hero-headline mb-3 sm:mb-4 font-bold leading-[1.15] text-white tracking-tight">{t('landing_heroHeadline')}</h1>
                                            <p className="text-base sm:text-[1.0625rem] text-white/95 font-medium leading-snug mb-2">{t('landing_heroSubline')}</p>
                                            <p className="text-[0.875rem] sm:text-[0.9375rem] text-white/80 leading-relaxed mb-4 w-full max-w-lg">{t('landing_bannerDesc')}</p>
                                            <div className="h-px w-16 bg-gradient-to-r from-white/30 to-transparent mb-4" aria-hidden />
                                            <div className="flex flex-nowrap items-center gap-2 sm:gap-2.5 mb-5 sm:mb-6 overflow-x-auto min-w-0">
                                                <span className="landing-hero-pill flex-shrink-0">{t('landing_heroPill1')}</span>
                                                <span className="landing-hero-pill flex-shrink-0">{t('landing_heroPill2')}</span>
                                                <span className="landing-hero-pill flex-shrink-0">{t('landing_heroPill3')}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-nowrap items-center gap-3 sm:gap-4 flex-shrink-0 min-w-0">
                                            <Link
                                                href={currentUser ? '/valuebet' : '/login?returnUrl=' + encodeURIComponent('/valuebet')}
                                                className="landing-hero-cta-primary"
                                                aria-label={t('landing_viewDemos')}
                                            >
                                                {t('landing_viewDemos')}
                                                <i className="ri-line-chart-line ms-2 align-middle text-lg" aria-hidden />
                                            </Link>
                                            <Link
                                                href={currentUser ? '/surebet' : '/login?returnUrl=' + encodeURIComponent('/surebet')}
                                                className="landing-hero-cta-secondary"
                                                aria-label={t('landing_viewOpportunities')}
                                            >
                                                {t('landing_viewOpportunities')}
                                                <i className="ri-arrow-right-line ms-2 align-middle" aria-hidden />
                                            </Link>
                                        </div>
                                    </div>
                                    <div className="xxl:col-span-7 xl:col-span-7 lg:col-span-7 col-span-12 flex items-center justify-center lg:justify-end">
                                        <div className="landing-hero-slider relative w-full min-w-0 min-h-[220px] lg:min-h-[280px] shrink-0 max-w-full lg:max-w-2xl flex justify-center lg:justify-end overflow-visible">
                                            <span className="landing-frame-corner landing-frame-corner-tl" aria-hidden>
                                                <svg viewBox="0 0 44 44" className="landing-corner-svg">
                                                    <defs>
                                                        <linearGradient id="gold-laur-tl" x1="0%" y1="0%" x2="100%" y2="100%">
                                                            <stop offset="0%" stopColor="#e8d48b" />
                                                            <stop offset="100%" stopColor="#8b6914" />
                                                        </linearGradient>
                                                    </defs>
                                                    <path d="M 6 6 Q 6 0 24 0 M 6 6 Q 0 6 0 24" stroke="url(#gold-laur-tl)" fill="none" strokeWidth="2.5" strokeLinecap="round" />
                                                </svg>
                                            </span>
                                            <span className="landing-frame-corner landing-frame-corner-tr" aria-hidden>
                                                <svg viewBox="0 0 44 44" className="landing-corner-svg">
                                                    <defs>
                                                        <linearGradient id="gold-laur-tr" x1="100%" y1="0%" x2="0%" y2="100%">
                                                            <stop offset="0%" stopColor="#e8d48b" />
                                                            <stop offset="100%" stopColor="#8b6914" />
                                                        </linearGradient>
                                                    </defs>
                                                    <path d="M 38 6 Q 44 6 44 24 M 38 6 Q 38 0 20 0" stroke="url(#gold-laur-tr)" fill="none" strokeWidth="2.5" strokeLinecap="round" />
                                                </svg>
                                            </span>
                                            <span className="landing-frame-corner landing-frame-corner-bl" aria-hidden>
                                                <svg viewBox="0 0 44 44" className="landing-corner-svg">
                                                    <defs>
                                                        <linearGradient id="gold-laur-bl" x1="0%" y1="100%" x2="100%" y2="0%">
                                                            <stop offset="0%" stopColor="#8b6914" />
                                                            <stop offset="100%" stopColor="#e8d48b" />
                                                        </linearGradient>
                                                    </defs>
                                                    <path d="M 6 38 Q 6 44 24 44 M 6 38 Q 0 38 0 20" stroke="url(#gold-laur-bl)" fill="none" strokeWidth="2.5" strokeLinecap="round" />
                                                </svg>
                                            </span>
                                            <span className="landing-frame-corner landing-frame-corner-br" aria-hidden>
                                                <svg viewBox="0 0 44 44" className="landing-corner-svg">
                                                    <defs>
                                                        <linearGradient id="gold-laur-br" x1="100%" y1="100%" x2="0%" y2="0%">
                                                            <stop offset="0%" stopColor="#8b6914" />
                                                            <stop offset="100%" stopColor="#e8d48b" />
                                                        </linearGradient>
                                                    </defs>
                                                    <path d="M 38 38 Q 38 44 20 44 M 38 38 Q 44 38 44 20" stroke="url(#gold-laur-br)" fill="none" strokeWidth="2.5" strokeLinecap="round" />
                                                </svg>
                                            </span>
                                            <Swiper
                                                modules={[Pagination]}
                                                slidesPerView={1}
                                                loop={false}
                                                speed={400}
                                                pagination={false}
                                                grabCursor
                                                onSwiper={(sw) => {
                                                    heroSwiperInstanceRef.current = sw;
                                                    setHeroSlideIndex(sw.realIndex);
                                                }}
                                                onSlideChangeTransitionStart={(sw) => setHeroSlideIndex(sw.realIndex)}
                                                className="landing-hero-swiper h-full w-full rounded-xl overflow-hidden landing-hero-swiper-3d"
                                            >
                                                {landingSlides.map((name, idx) => (
                                                    <SwiperSlide key={`${name}-${idx}`}>
                                                        <div className="flex items-center justify-center w-full h-full min-h-[220px] lg:min-h-[280px]">
                                                            <img
                                                                src={`/assets/images/landing/${landingSlideDir}/${name}`}
                                                                alt={`BETSUREZONE ${idx + 1}`}
                                                                className="w-full h-auto object-contain max-h-[75vh]"
                                                                draggable={false}
                                                            />
                                                        </div>
                                                    </SwiperSlide>
                                                ))}
                                            </Swiper>
                                            <button
                                                type="button"
                                                className="landing-hero-prev absolute left-2 top-1/2 -translate-y-1/2 z-[30] w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-all duration-300 backdrop-blur-md pointer-events-auto cursor-pointer border border-white/20 hover:scale-105"
                                                aria-label="Previous"
                                                onClick={() => {
                                                    const sw = heroSwiperInstanceRef.current;
                                                    if (!sw) return;
                                                    if (sw.realIndex <= 0) sw.slideTo(landingSlides.length - 1);
                                                    else sw.slidePrev();
                                                }}
                                            >
                                                <i className="ri-arrow-left-s-line text-2xl" />
                                            </button>
                                            <button
                                                type="button"
                                                className="landing-hero-next absolute right-2 top-1/2 -translate-y-1/2 z-[30] w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-all duration-300 backdrop-blur-md pointer-events-auto cursor-pointer border border-white/20 hover:scale-105"
                                                aria-label="Next"
                                                onClick={() => {
                                                    const sw = heroSwiperInstanceRef.current;
                                                    if (!sw) return;
                                                    if (sw.realIndex >= landingSlides.length - 1) sw.slideTo(0);
                                                    else sw.slideNext();
                                                }}
                                            >
                                                <i className="ri-arrow-right-s-line text-2xl" />
                                            </button>
                                            {/* 하단: 작은 너비·반투명 슬라이드 미리보기 스트립 */}
                                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex justify-center gap-1.5 py-2 px-3 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 shadow-lg">
                                                {landingSlides.map((name, idx) => (
                                                    <button
                                                        key={`thumb-${name}-${idx}`}
                                                        type="button"
                                                        onClick={() => heroSwiperInstanceRef.current?.slideTo(idx)}
                                                        className={`flex-shrink-0 w-12 h-7 rounded-lg overflow-hidden border transition-all duration-300 ${
                                                            heroSlideIndex === idx
                                                                ? 'border-white opacity-100 ring-2 ring-white/40 shadow-md scale-105'
                                                                : 'border-white/20 opacity-50 hover:opacity-80 hover:scale-[1.02]'
                                                        }`}
                                                        aria-label={`Slide ${idx + 1}`}
                                                    >
                                                        <img
                                                            src={`/assets/images/landing/${landingSlideDir}/${name}`}
                                                            alt=""
                                                            className="w-full h-full object-cover pointer-events-none"
                                                            draggable={false}
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                    {/* 3단계로 수익 배팅 — 이미지 완전히 아래에서 시작 */}
                    <section className="section landing-section-how !pt-16 !pb-16 w-full" id="how-it-works">
                        <div className="container-xl px-3 w-full max-w-full">
                            <p className="text-center text-[0.75rem] font-semibold text-success mb-1 uppercase tracking-wider">{t('landing_howItWorks')}</p>
                            <h2 className="text-center font-bold text-[1.75rem] sm:text-[2rem] text-defaulttextcolor dark:text-white mb-2 w-full">{t('landing_simpleExplain')}</h2>
                            <p className="text-center text-[#8c9097] dark:text-white/60 text-[0.9375rem] mb-10 w-full">{t('landing_thatIsAll')}</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 w-full">
                                <div className="relative flex flex-col items-center text-center p-6 rounded-2xl bg-white dark:bg-white/5 border border-defaultborder/10 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow">
                                    <span className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary font-bold text-[1.25rem] mb-4">1</span>
                                    <h3 className="font-semibold text-[1.0625rem] text-defaulttextcolor dark:text-white mb-2">{t('landing_step1')}</h3>
                                    <p className="text-[0.8125rem] text-[#8c9097] dark:text-white/60 mb-0">{t('landing_step1Desc')}</p>
                                    <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-primary/30 rounded -translate-y-1/2" aria-hidden />
                                </div>
                                <div className="relative flex flex-col items-center text-center p-6 rounded-2xl bg-white dark:bg-white/5 border border-defaultborder/10 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow">
                                    <span className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary font-bold text-[1.25rem] mb-4">2</span>
                                    <h3 className="font-semibold text-[1.0625rem] text-defaulttextcolor dark:text-white mb-2">{t('landing_step2')}</h3>
                                    <p className="text-[0.8125rem] text-[#8c9097] dark:text-white/60 mb-0">{t('landing_step2Desc')}</p>
                                    <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-primary/30 rounded -translate-y-1/2" aria-hidden />
                                </div>
                                <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white dark:bg-white/5 border border-defaultborder/10 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow">
                                    <span className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary font-bold text-[1.25rem] mb-4">3</span>
                                    <h3 className="font-semibold text-[1.0625rem] text-defaulttextcolor dark:text-white mb-2">{t('landing_step3')}</h3>
                                    <p className="text-[0.8125rem] text-[#8c9097] dark:text-white/60 mb-0">{t('landing_step3Desc')}</p>
                                </div>
                            </div>
                        </div>
                    </section>
                    {/* 홍보 하이라이트 — 배너 4종 메시지 (너비 꽉 채움) */}
                    <section className="section landing-section-features !py-12 w-full">
                        <div className="container-xl px-3 w-full max-w-full">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-white/5 border border-defaultborder/10 dark:border-white/10 shadow-sm">
                                    <span className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center text-primary"><i className="ri-radar-line text-[1.5rem]" /></span>
                                    <p className="font-semibold text-defaulttextcolor dark:text-white text-[0.9375rem] mb-0">{t('landing_banner1')}</p>
                                </div>
                                <div className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-white/5 border border-defaultborder/10 dark:border-white/10 shadow-sm">
                                    <span className="flex-shrink-0 w-12 h-12 rounded-xl bg-success/15 flex items-center justify-center text-success"><i className="ri-money-dollar-circle-line text-[1.5rem]" /></span>
                                    <p className="font-semibold text-defaulttextcolor dark:text-white text-[0.9375rem] mb-0">{t('landing_banner2')}</p>
                                </div>
                                <div className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-white/5 border border-defaultborder/10 dark:border-white/10 shadow-sm">
                                    <span className="flex-shrink-0 w-12 h-12 rounded-xl bg-warning/15 flex items-center justify-center text-warning"><i className="ri-calculator-line text-[1.5rem]" /></span>
                                    <p className="font-semibold text-defaulttextcolor dark:text-white text-[0.9375rem] mb-0">{t('landing_banner3')}</p>
                                </div>
                                <div className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-white/5 border border-defaultborder/10 dark:border-white/10 shadow-sm">
                                    <span className="flex-shrink-0 w-12 h-12 rounded-xl bg-info/15 flex items-center justify-center text-info"><i className="ri-mouse-line text-[1.5rem]" /></span>
                                    <p className="font-semibold text-defaulttextcolor dark:text-white text-[0.9375rem] mb-0">{t('landing_banner4')}</p>
                                </div>
                            </div>
                        </div>
                    </section>
                    {/* 홍보 영상 — 영상 제작 후 비디오 URL 또는 iframe으로 교체 */}
                    <section className="section landing-section-promo !py-12 w-full" id="promo-video">
                        <div className="container-xl px-3 text-center w-full max-w-full">
                            <h2 className="font-bold text-[1.5rem] text-defaulttextcolor dark:text-white mb-4">{t('landing_videoTitle')}</h2>
                            <div className="landing-promo-frame w-full aspect-video flex items-center justify-center">
                                <div className="landing-promo-inner relative w-full h-full rounded-xl overflow-hidden bg-black">
                                    <video
                                        key={promoVideoSrc}
                                        className="block w-full h-full object-cover"
                                        src={promoVideoSrc}
                                        autoPlay
                                        muted
                                        controls
                                        playsInline
                                        preload="metadata"
                                        onEnded={() => setPromoVideoIndex((prev) => (prev + 1) % PROMO_VIDEOS.length)}
                                    >
                                        {t('landing_videoPlaceholder')}
                                    </video>
                                </div>
                            </div>
                        </div>
                    </section>
                    <section className="section landing-section-about text-defaulttextcolor dark:text-defaulttextcolor/70 text-[0.813rem] w-full" id="about">
                        <div className="container-xl px-3 text-center w-full max-w-full">
                            <p className="text-[0.75rem] font-semibold text-success mb-1"><span className="landing-section-heading">{t('landing_about')}</span></p>
                            <h3 className="font-semibold mb-2 dark:text-defaulttextcolor">{t('landing_aboutSubtitle')}</h3>
                            <div className="grid grid-cols-12 justify-center w-full">
                                <div className="col-span-12">
                                    <p className="text-[#8c9097] dark:text-white/50 text-[0.9375rem] mb-0 font-normal">{t('landing_heroDesc')}</p>
                                </div>
                            </div>
                        </div>
                    </section>
                    {!HIDE_EXTRA_LANDING_SECTIONS && (
                    <section className="section landing-section-testimonials landing-testimonials text-defaulttextcolor dark:text-defaulttextcolor/70 text-[0.813rem]" id="testimonials">
                        <div className="container-xl px-3 text-center">
                            <p className="text-[0.75rem] font-semibold text-success mb-1"><span className="landing-section-heading">TESTIMONIALS</span></p>
                            <h3 className="font-semibold mb-2">We never failed to reach expectations</h3>
                            <div>
                                <div className="xl:col-span-7 col-span-12">
                                    <p className="text-[#8c9097] dark:text-white/50 text-[0.9375rem] mb-[3rem] font-normal">Some of the reviews our clients gave which brings motivation to work for future projects.</p>
                                </div>
                            </div>
                            <Swiper spaceBetween={30} centeredSlides={false} breakpoints={breakpoints}
                                slidesPerView={3}
                                autoplay={{ delay: 2500, disableOnInteraction: false, }} pagination={{ dynamicBullets: true, clickable: true }} modules={[Pagination, Autoplay]} className="mySwiper">
                                <SwiperSlide className="rtl:dir-rtl">
                                    <div className="box testimonial-card">
                                        <div className="box-body">
                                            <div className="flex items-center mb-4">
                                                <span className="avatar avatar-md avatar-rounded me-4">
                                                    <img src="../../../assets/images/faces/15.jpg" alt="" />
                                                </span>
                                                <div>
                                                    <p className="mb-0 font-semibold text-[0.875rem]">Json Taylor</p>
                                                    <p className="mb-0 text-[0.625rem] font-semibold text-[#8c9097] dark:text-white/50">CEO OF NORJA</p>
                                                </div>
                                            </div>
                                            <div className="mb-4 text-start">
                                                <span className="text-[#8c9097] dark:text-white/50">- Lorem ipsum dolor sit amet consectetur adipisicing elit. Earum autem quaerat distinctio  --</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <span className="text-[#8c9097] dark:text-white/50">Rating : </span>
                                                    <span className="text-warning block ms-1">
                                                        <i className="ri-star-fill"></i>
                                                        <i className="ri-star-fill"></i>
                                                        <i className="ri-star-fill"></i>
                                                        <i className="ri-star-fill"></i>
                                                        <i className="ri-star-half-fill"></i>
                                                    </span>
                                                </div>
                                                <div className="ltr:float-right rtl:float-left text-[0.75rem] font-semibold text-[#8c9097] dark:text-white/50 text-end">
                                                    <span>12 days ago</span>
                                                    <span className="block font-normal text-[0.75rem] text-success"><i>Json Taylor</i></span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </SwiperSlide>
                                <SwiperSlide className="rtl:dir-rtl">
                                    <div className="box testimonial-card">
                                        <div className="box-body">
                                            <div className="flex items-center mb-4">
                                                <span className="avatar avatar-md avatar-rounded me-4">
                                                    <img src="../../../assets/images/faces/4.jpg" alt="" />
                                                </span>
                                                <div>
                                                    <p className="mb-0 font-semibold text-[0.875rem]">Melissa Blue</p>
                                                    <p className="mb-0 text-[0.625rem] font-semibold text-[#8c9097] dark:text-white/50">MANAGER CHO</p>
                                                </div>
                                            </div>
                                            <div className="mb-4 text-start">
                                                <span className="text-[#8c9097] dark:text-white/50">- Lorem ipsum dolor sit amet consectetur adipisicing elit. Earum autem quaerat distinctio  --</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <span className="text-[#8c9097] dark:text-white/50">Rating : </span>
                                                    <span className="text-warning block ms-1">
                                                        <i className="ri-star-fill"></i>
                                                        <i className="ri-star-fill"></i>
                                                        <i className="ri-star-fill"></i>
                                                        <i className="ri-star-fill"></i>
                                                        <i className="ri-star-half-fill"></i>
                                                    </span>
                                                </div>
                                                <div className="ltr:float-right rtl:float-left text-[0.75rem] font-semibold text-[#8c9097] dark:text-white/50 text-end">
                                                    <span>7 days ago</span>
                                                    <span className="block font-normal text-[0.75rem] text-success"><i>Melissa Blue</i></span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </SwiperSlide>
                                <SwiperSlide className="rtl:dir-rtl">
                                    <div className="box testimonial-card">
                                        <div className="box-body">
                                            <div className="flex items-center mb-4">
                                                <span className="avatar avatar-md avatar-rounded me-4">
                                                    <img src="../../../assets/images/faces/2.jpg" alt="" />
                                                </span>
                                                <div>
                                                    <p className="mb-0 font-semibold text-[0.875rem]">Kiara Advain</p>
                                                    <p className="mb-0 text-[0.625rem] font-semibold text-[#8c9097] dark:text-white/50">CEO OF EMPIRO</p>
                                                </div>
                                            </div>
                                            <div className="mb-4 text-start">
                                                <span className="text-[#8c9097] dark:text-white/50">- Lorem ipsum dolor sit amet consectetur adipisicing elit. Earum autem quaerat distinctio  --</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <span className="text-[#8c9097] dark:text-white/50">Rating : </span>
                                                    <span className="text-warning block ms-1">
                                                        <i className="ri-star-fill"></i>
                                                        <i className="ri-star-fill"></i>
                                                        <i className="ri-star-fill"></i>
                                                        <i className="ri-star-fill"></i>
                                                        <i className="ri-star-line"></i>
                                                    </span>
                                                </div>
                                                <div className="ltr:float-right rtl:float-left text-[0.75rem] font-semibold text-[#8c9097] dark:text-white/50 text-end">
                                                    <span>2 days ago</span>
                                                    <span className="block font-normal text-[0.75rem] text-success"><i>Kiara Advain</i></span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </SwiperSlide>
                                <SwiperSlide className="rtl:dir-rtl">
                                    <div className="box testimonial-card">
                                        <div className="box-body">
                                            <div className="flex items-center mb-4">
                                                <span className="avatar avatar-md avatar-rounded me-4">
                                                    <img src="../../../assets/images/faces/10.jpg" alt="" />
                                                </span>
                                                <div>
                                                    <p className="mb-0 font-semibold text-[0.875rem]">Jhonson Smith</p>
                                                    <p className="mb-0 text-[0.625rem] font-semibold text-[#8c9097] dark:text-white/50">CHIEF SECRETARY MBIO</p>
                                                </div>
                                            </div>
                                            <div className="mb-4 text-start">
                                                <span className="text-[#8c9097] dark:text-white/50">- Lorem ipsum dolor sit amet consectetur adipisicing elit. Earum autem quaerat distinctio  --</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <span className="text-[#8c9097] dark:text-white/50">Rating : </span>
                                                    <span className="text-warning block ms-1">
                                                        <i className="ri-star-fill"></i>
                                                        <i className="ri-star-fill"></i>
                                                        <i className="ri-star-fill"></i>
                                                        <i className="ri-star-fill"></i>
                                                        <i className="ri-star-half-fill"></i>
                                                    </span>
                                                </div>
                                                <div className="ltr:float-right rtl:float-left text-[0.75rem] font-semibold text-[#8c9097] dark:text-white/50 text-end">
                                                    <span>16 hrs ago</span>
                                                    <span className="block font-normal text-[0.75rem] text-success"><i>Jhonson Smith</i></span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </SwiperSlide>
                                <SwiperSlide className="rtl:dir-rtl">
                                    <div className="box testimonial-card">
                                        <div className="box-body">
                                            <div className="flex items-center mb-4">
                                                <span className="avatar avatar-md avatar-rounded me-4">
                                                    <img src="../../../assets/images/faces/12.jpg" alt="" />
                                                </span>
                                                <div>
                                                    <p className="mb-0 font-semibold text-[0.875rem]">Dwayne Stort</p>
                                                    <p className="mb-0 text-[0.625rem] font-semibold text-[#8c9097] dark:text-white/50">CEO ARMEDILLO</p>
                                                </div>
                                            </div>
                                            <div className="mb-4 text-start">
                                                <span className="text-[#8c9097] dark:text-white/50">- Lorem ipsum dolor sit amet consectetur adipisicing elit. Earum autem quaerat distinctio  --</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <span className="text-[#8c9097] dark:text-white/50">Rating : </span>
                                                    <span className="text-warning block ms-1">
                                                        <i className="ri-star-fill"></i>
                                                        <i className="ri-star-fill"></i>
                                                        <i className="ri-star-fill"></i>
                                                        <i className="ri-star-fill"></i>
                                                        <i className="ri-star-line"></i>
                                                    </span>
                                                </div>
                                                <div className="ltr:float-right rtl:float-left text-[0.75rem] font-semibold text-[#8c9097] dark:text-white/50 text-end">
                                                    <span>22 days ago</span>
                                                    <span className="block font-normal text-[0.75rem] text-success"><i>Dwayne Stort</i></span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </SwiperSlide>
                                <SwiperSlide className="rtl:dir-rtl">
                                    <div className="box testimonial-card">
                                        <div className="box-body">
                                            <div className="flex items-center mb-4">
                                                <span className="avatar avatar-md avatar-rounded me-4">
                                                    <img src="../../../assets/images/faces/3.jpg" alt="" />
                                                </span>
                                                <div>
                                                    <p className="mb-0 font-semibold text-[0.875rem]">Jasmine Kova</p>
                                                    <p className="mb-0 text-[0.625rem] font-semibold text-[#8c9097] dark:text-white/50">AGGENT AMIO</p>
                                                </div>
                                            </div>
                                            <div className="mb-4 text-start">
                                                <span className="text-[#8c9097] dark:text-white/50">- Lorem ipsum dolor sit amet consectetur adipisicing elit. Earum autem quaerat distinctio  --</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <span className="text-[#8c9097] dark:text-white/50">Rating : </span>
                                                    <span className="text-warning block ms-1">
                                                        <i className="ri-star-fill"></i>
                                                        <i className="ri-star-fill"></i>
                                                        <i className="ri-star-fill"></i>
                                                        <i className="ri-star-fill"></i>
                                                        <i className="ri-star-half-fill"></i>
                                                    </span>
                                                </div>
                                                <div className="ltr:float-right rtl:float-left text-[0.75rem] font-semibold text-[#8c9097] dark:text-white/50 text-end">
                                                    <span>26 days ago</span>
                                                    <span className="block font-normal text-[0.75rem] text-success"><i>Jasmine Kova</i></span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </SwiperSlide>
                                <SwiperSlide className="rtl:dir-rtl">
                                    <div className="box testimonial-card">
                                        <div className="box-body">
                                            <div className="flex items-center mb-4">
                                                <span className="avatar avatar-md avatar-rounded me-4">
                                                    <img src="../../../assets/images/faces/16.jpg" alt="" />
                                                </span>
                                                <div>
                                                    <p className="mb-0 font-semibold text-[0.875rem]">Dolph MR</p>
                                                    <p className="mb-0 text-[0.625rem] font-semibold text-[#8c9097] dark:text-white/50">CEO MR BRAND</p>
                                                </div>
                                            </div>
                                            <div className="mb-4 text-start">
                                                <span className="text-[#8c9097] dark:text-white/50">- Lorem ipsum dolor sit amet consectetur adipisicing elit. Earum autem quaerat distinctio  --</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <span className="text-[#8c9097] dark:text-white/50">Rating : </span>
                                                    <span className="text-warning block ms-1">
                                                        <i className="ri-star-fill"></i>
                                                        <i className="ri-star-fill"></i>
                                                        <i className="ri-star-fill"></i>
                                                        <i className="ri-star-fill"></i>
                                                        <i className="ri-star-fill"></i>
                                                    </span>
                                                </div>
                                                <div className="ltr:float-right rtl:float-left text-[0.75rem] font-semibold text-[#8c9097] dark:text-white/50 text-end">
                                                    <span>1 month ago</span>
                                                    <span className="block font-normal text-[0.75rem] text-success"><i>Dolph MR</i></span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </SwiperSlide>
                                <SwiperSlide className="rtl:dir-rtl">
                                    <div className="box testimonial-card">
                                        <div className="box-body">
                                            <div className="flex items-center mb-4">
                                                <span className="avatar avatar-md avatar-rounded me-4">
                                                    <img src="../../../assets/images/faces/5.jpg" alt="" />
                                                </span>
                                                <div>
                                                    <p className="mb-0 font-semibold text-[0.875rem]">Brenda Simpson</p>
                                                    <p className="mb-0 text-[0.625rem] font-semibold text-[#8c9097] dark:text-white/50">CEO AIBMO</p>
                                                </div>
                                            </div>
                                            <div className="mb-4 text-start">
                                                <span className="text-[#8c9097] dark:text-white/50">- Lorem ipsum dolor sit amet consectetur adipisicing elit. Earum autem quaerat distinctio  --</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <span className="text-[#8c9097] dark:text-white/50">Rating : </span>
                                                    <span className="text-warning block ms-1">
                                                        <i className="ri-star-fill"></i>
                                                        <i className="ri-star-fill"></i>
                                                        <i className="ri-star-fill"></i>
                                                        <i className="ri-star-fill"></i>
                                                        <i className="ri-star-half-fill"></i>
                                                    </span>
                                                </div>
                                                <div className="ltr:float-right rtl:float-left text-[0.75rem] font-semibold text-[#8c9097] dark:text-white/50 text-end">
                                                    <span>1 month ago</span>
                                                    <span className="block font-normal text-[0.75rem] text-success"><i>Brenda Simpson</i></span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </SwiperSlide>
                                <SwiperSlide className="rtl:dir-rtl">
                                    <div className="box testimonial-card">
                                        <div className="box-body">
                                            <div className="flex items-center mb-4">
                                                <span className="avatar avatar-md avatar-rounded me-4">
                                                    <img src="../../../assets/images/faces/7.jpg" alt="" />
                                                </span>
                                                <div>
                                                    <p className="mb-0 font-semibold text-[0.875rem]">Julia Sams</p>
                                                    <p className="mb-0 text-[0.625rem] font-semibold text-[#8c9097] dark:text-white/50">CHIEF SECRETARY BHOL</p>
                                                </div>
                                            </div>
                                            <div className="mb-4 text-start">
                                                <span className="text-[#8c9097] dark:text-white/50">- Lorem ipsum dolor sit amet consectetur adipisicing elit. Earum autem quaerat distinctio  --</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <span className="text-[#8c9097] dark:text-white/50">Rating : </span>
                                                    <span className="text-warning block ms-1">
                                                        <i className="ri-star-fill"></i>
                                                        <i className="ri-star-fill"></i>
                                                        <i className="ri-star-fill"></i>
                                                        <i className="ri-star-fill"></i>
                                                        <i className="ri-star-fill"></i>
                                                    </span>
                                                </div>
                                                <div className="ltr:float-right rtl:float-left text-[0.75rem] font-semibold text-[#8c9097] dark:text-white/50 text-end">
                                                    <span>2 month ago</span>
                                                    <span className="block font-normal text-[0.75rem] text-success"><i>Julia Sams</i></span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </SwiperSlide>
                            </Swiper>
                        </div>
                    </section>
                    )}
                    {!HIDE_EXTRA_LANDING_SECTIONS && (
                    <section className="section landing-section-team text-defaulttextcolor dark:text-defaulttextcolor/70 text-[0.813rem]" id="team">
                        <div className="container-xl px-3 text-center">
                            <p className="text-[0.75rem] font-semibold text-success mb-1"><span className="landing-section-heading">OUR TEAM</span></p>
                            <h3 className="font-semibold mb-2">Great things in business are done by a team.</h3>
                            <div>
                                <div className="xl:col-span-7 col-span-12">
                                    <p className="text-[#8c9097] dark:text-white/50 text-[0.9375rem] mb-12 font-normal">Our team consists of highly qulified employees that works hard to raise company standards.</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-12 gap-6">
                                <div className="xxl:col-span-3 xl:col-span-3 lg:col-span-6 md:col-span-6 sm:col-span-12 col-span-12">
                                    <div className="box text-center team-card ">
                                        <div className="box-body p-[3rem]">
                                            <span className="avatar avatar-xxl avatar-rounded !mb-4 team-avatar">
                                                <img src="../../../assets/images/faces/15.jpg" alt="" />
                                            </span>
                                            <p className="font-semibold text-[1.0625rem] mb-0 text-default">Peter Parker</p>
                                            <span className="text-[#8c9097] dark:text-white/50 text-[0.875rem] !text-primary font-semibold">Director</span>
                                            <p className="text-[#8c9097] dark:text-white/50 mt-2 text-[0.8125rem] mb-4"> Lorem ipsum dolor sit amet, consectetur adipisicing elit.</p>
                                            <div className="mt-2">
                                                <Link href="/components/pages/profile/" className="ti-btn ti-btn-light !font-medium" target="_blank">View profile</Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="xxl:col-span-3 xl:col-span-3 lg:col-span-6 md:col-span-6 sm:col-span-12 col-span-12">
                                    <div className="box text-center team-card ">
                                        <div className="box-body p-[3rem]">
                                            <span className="avatar avatar-xxl avatar-rounded !mb-4 team-avatar">
                                                <img src="../../../assets/images/faces/12.jpg" alt="" />
                                            </span>
                                            <p className="font-semibold text-[1.0625rem] mb-0 text-default">Andrew garfield</p>
                                            <span className="text-[#8c9097] dark:text-white/50 text-[0.875rem] !text-primary font-semibold">Manager</span>
                                            <p className="text-[#8c9097] dark:text-white/50 mt-2 text-[0.8125rem] mb-4"> Lorem ipsum dolor sit amet, consectetur adipisicing elit.</p>
                                            <div className="mt-2">
                                                <Link href="/components/pages/profile/" className="ti-btn ti-btn-light !font-medium" target="_blank">View profile</Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="xxl:col-span-3 xl:col-span-3 lg:col-span-6 md:col-span-6 sm:col-span-12 col-span-12">
                                    <div className="box text-center team-card ">
                                        <div className="box-body p-[3rem]">
                                            <span className="avatar avatar-xxl avatar-rounded !mb-4 team-avatar">
                                                <img src="../../../assets/images/faces/5.jpg" alt="" />
                                            </span>
                                            <p className="font-semibold text-[1.0625rem] mb-0 text-default">Json Taylor</p>
                                            <span className="text-[#8c9097] dark:text-white/50 text-[0.875rem] !text-primary font-semibold">Web Designer</span>
                                            <p className="text-[#8c9097] dark:text-white/50 mt-2 text-[0.8125rem] mb-4"> Lorem ipsum dolor sit amet, consectetur adipisicing elit.</p>
                                            <div className="mt-2">
                                                <Link href="/components/pages/profile/" className="ti-btn ti-btn-light !font-medium" target="_blank">View profile</Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="xxl:col-span-3 xl:col-span-3 lg:col-span-6 md:col-span-6 sm:col-span-12 col-span-12">
                                    <div className="box text-center team-card ">
                                        <div className="box-body p-[3rem]">
                                            <span className="avatar avatar-xxl avatar-rounded !mb-4 team-avatar">
                                                <img src="../../../assets/images/faces/1.jpg" alt="" />
                                            </span>
                                            <p className="font-semibold text-[1.0625rem] mb-0 text-default">Elizabeth Rose</p>
                                            <span className="text-[#8c9097] dark:text-white/50 text-[0.875rem] !text-primary font-semibold">HR</span>
                                            <p className="text-[#8c9097] dark:text-white/50 mt-2 text-[0.8125rem] mb-4"> Lorem ipsum dolor sit amet, consectetur adipisicing elit.</p>
                                            <div className="mt-2">
                                                <Link href="/components/pages/profile/" className="ti-btn ti-btn-light !font-medium" target="_blank">View profile</Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-[3rem]">
                                <button type="button" className="ti-btn bg-primary text-white">View All</button>
                            </div>
                        </div>
                    </section>
                    )}
                    <section className="section landing-section-pricing text-defaulttextcolor dark:text-defaulttextcolor/70 text-[0.813rem]" id="pricing">
                        <div className="container-xl px-3 text-center">
                            <p className="text-[0.75rem] font-semibold text-success mb-1"><span className="landing-section-heading">{t('landing_pricingLabel')}</span></p>
                            <h3 className="font-semibold mb-2">{t('landing_pricingTitle')}</h3>
                            <div className="grid grid-cols-12 justify-center">
                                <div className="col-span-12">
                                    <p className="text-[#8c9097] dark:text-white/50 text-[0.9375rem] mb-12 font-normal">{t('landing_pricingDesc')}</p>
                                </div>
                            </div>
                            <div className="box landing-pricing-box overflow-hidden shadow-none justify-center">
                                <div className="box-body !p-0">
                                    <div className="dark:!border-defaultborder/10">
                                            <div className="grid grid-cols-12 justify-center">
                                                <div className="xxl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-4 sm:col-span-12 col-span-12  md:border-e md:border-b-0 border-b border-dashed dark:border-defaultborder/10 flex flex-col">
                                                    <div className="p-6 flex flex-col flex-1 min-h-0">
                                                        <div className="flex-1">
                                                        <div className="flex items-center justify-center gap-2 flex-wrap">
                                                            <h6 className="font-semibold text-center text-[1rem]">{t('landing_free')}</h6>
                                                            {currentUser && !currentUser.subscription_plan && (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[0.6875rem] font-medium bg-defaultborder dark:bg-white/10 text-defaulttextcolor dark:text-white/80">{t('landing_currentPlan')}</span>
                                                            )}
                                                        </div>
                                                        <div className="py-6 flex items-center justify-center">
                                                            <div className="pricing-svg1">
                                                                <svg xmlns="http://www.w3.org/2000/svg" data-name="Layer 1" viewBox="0 0 168 168"><path fill="#845adf" d="M48.877 36.254c3.742 4.464 10.559 4.995 10.847 5.016.048.003.096.005.143.005A2 2 0 0 0 61.84 39.6c.045-.274 1.07-6.786-2.716-11.306-3.742-4.464-10.559-4.995-10.848-5.015a2.017 2.017 0 0 0-2.114 1.669c-.045.274-1.07 6.786 2.715 11.304zm7.18-5.39a9.88 9.88 0 0 1 1.938 6.072 11.383 11.383 0 0 1-6.053-3.252v.001a9.88 9.88 0 0 1-1.938-6.071 11.378 11.378 0 0 1 6.053 3.25zm74.388 24.431c-.278.041-6.858 1.055-10.205 6.168-3.3 5.043-1.996 11.909-1.938 12.199a2 2 0 0 0 1.96 1.613 2.104 2.104 0 0 0 .29-.02c.279-.042 6.859-1.055 10.205-6.169 3.3-5.043 1.996-11.908 1.939-12.198a2.004 2.004 0 0 0-2.251-1.593zm-3.035 11.601a10.55 10.55 0 0 1-5.397 3.854 12.464 12.464 0 0 1 1.575-7.095v-.001a10.549 10.549 0 0 1 5.396-3.855 12.47 12.47 0 0 1-1.574 7.097z" /><path fill="#403161" d="M138.16 29.515c-5.92-2.54-12.61-1.07-17.12.25-3.73 1.09-7.42 2.45-11.03 3.82a26.346 26.346 0 0 0 5.19-7.49 2 2 0 0 0-3.65-1.64c-4.46 9.92-16.63 14.39-19.27 15.26-.69.19-2.33.65-2.4.68a160.941 160.941 0 0 1-34.03 5.64 62.167 62.167 0 0 1-28.93-5.56c-.15-.06-2.81-1.31-3.99-1.93a2.002 2.002 0 0 0-1.85 3.55c.92.48 4.09 1.98 4.13 2 6.21 2.96 8.89 5.82 8.37 13.04a2.05 2.05 0 0 0 2 2.14 1.998 1.998 0 0 0 1.99-1.86 17.056 17.056 0 0 0-1.64-9.49A65.547 65.547 0 0 0 54 50.095v47.33a2.052 2.052 0 0 0-.5.39 2.017 2.017 0 0 0 .17 2.83l.33.29v12.34h-1a2 2 0 1 0 0 4s1 0 1 .01h11v13.99a3.999 3.999 0 0 0 4 4h12a3.999 3.999 0 0 0 4-4v-13.99s11 0 11-.01h1a2 2 0 0 0 0-4h-1v-12.34l.33-.29a2.017 2.017 0 0 0 .17-2.83 2.052 2.052 0 0 0-.5-.39v-53.96a34.048 34.048 0 0 1 12.77 1.16c1.9.56 5.13 1.9 5.55 4.59a2.04 2.04 0 0 0 2.28 1.67 2.003 2.003 0 0 0 1.67-2.29c-.56-3.6-3.53-6.37-8.35-7.81a36.359 36.359 0 0 0-4.83-1.06c1.37-.51 2.73-1.02 4.07-1.54 4.25-1.62 8.64-3.3 13.01-4.58 6.23-1.83 10.81-1.96 14.41-.41 3.99 1.71 8.47 5.05 7.2 11.29a6.907 6.907 0 0 1-4.21 4.86 5.702 5.702 0 0 1-5.49-.58 4.408 4.408 0 0 1-1.18-5.23 2.003 2.003 0 0 0-3.43-2.07c-2.16 3.59-.57 8.53 2.3 10.56a9.485 9.485 0 0 0 5.51 1.77 10.214 10.214 0 0 0 3.76-.73 10.847 10.847 0 0 0 6.66-7.79c1.39-6.82-2.09-12.56-9.54-15.76ZM63 113.275h-5v-8.79l.32.29a2.04 2.04 0 0 0 1.33.5 2.013 2.013 0 0 0 1.27-.45l2.08-1.7Zm10 18h-4v-13.99h4Zm8 0h-4v-13.99h4Zm2-18H67v-11c0-2.76 1.96-5 4.36-5h7.28c2.4 0 4.36 2.24 4.36 5Zm9 0h-5v-10.15l2.08 1.7a2.013 2.013 0 0 0 1.27.45 2.04 2.04 0 0 0 1.33-.5l.32-.29Zm0-14.14-1.71 1.51-5.62-4.59a8.31 8.31 0 0 0-3.74-2.43H69.07a8.31 8.31 0 0 0-3.74 2.43l-5.63 4.59-1.7-1.51v-49.22a168.852 168.852 0 0 0 33.11-5.71c.29-.07.59-.11.89-.17Z" /><path fill="#845adf" d="M146 147.275h-12.199a1.406 1.406 0 0 1 .124-.69.803.803 0 0 1 .468-.35 2 2 0 0 0-.732-3.93 4.834 4.834 0 0 0-3.152 2.198 5.182 5.182 0 0 0-.703 2.772h-1.612a5.182 5.182 0 0 0-.703-2.772 4.834 4.834 0 0 0-3.152-2.199 2.026 2.026 0 0 0-2.341 1.626 1.973 1.973 0 0 0 1.603 2.304.819.819 0 0 1 .474.351 1.406 1.406 0 0 1 .124.69H115.8a1.406 1.406 0 0 1 .124-.69.803.803 0 0 1 .468-.35 2 2 0 0 0-.732-3.93 4.834 4.834 0 0 0-3.152 2.198 5.182 5.182 0 0 0-.703 2.772h-1.612a5.182 5.182 0 0 0-.703-2.772 4.834 4.834 0 0 0-3.152-2.199 2.026 2.026 0 0 0-2.34 1.626 1.973 1.973 0 0 0 1.602 2.304.819.819 0 0 1 .474.351 1.406 1.406 0 0 1 .124.69H97.8a1.406 1.406 0 0 1 .124-.69.803.803 0 0 1 .468-.35 2 2 0 0 0-.732-3.93 4.834 4.834 0 0 0-3.152 2.198 5.182 5.182 0 0 0-.703 2.772h-1.612a5.182 5.182 0 0 0-.703-2.772 4.834 4.834 0 0 0-3.152-2.199 2.026 2.026 0 0 0-2.34 1.626 1.973 1.973 0 0 0 1.602 2.304.819.819 0 0 1 .474.351 1.406 1.406 0 0 1 .124.69h-8.397a1.41 1.41 0 0 1 .123-.69.805.805 0 0 1 .468-.35 2 2 0 0 0-.731-3.93 4.838 4.838 0 0 0-3.154 2.198 5.182 5.182 0 0 0-.702 2.772h-1.612a5.182 5.182 0 0 0-.702-2.772 4.838 4.838 0 0 0-3.154-2.199 2 2 0 1 0-.676 3.942.875.875 0 0 1 .401.319 1.384 1.384 0 0 1 .127.71h-8.388a1.41 1.41 0 0 1 .123-.69.805.805 0 0 1 .468-.35 2 2 0 0 0-.731-3.93 4.838 4.838 0 0 0-3.154 2.198 5.182 5.182 0 0 0-.702 2.772h-1.612a5.182 5.182 0 0 0-.702-2.772 4.838 4.838 0 0 0-3.154-2.199 2 2 0 1 0-.676 3.942.875.875 0 0 1 .401.319 1.384 1.384 0 0 1 .127.71h-8.388a1.41 1.41 0 0 1 .123-.69.805.805 0 0 1 .468-.35 2 2 0 0 0-.731-3.93 4.838 4.838 0 0 0-3.154 2.198 5.182 5.182 0 0 0-.702 2.772h-1.612a5.182 5.182 0 0 0-.702-2.772 4.838 4.838 0 0 0-3.154-2.199 2 2 0 1 0-.676 3.942.875.875 0 0 1 .401.319 1.384 1.384 0 0 1 .127.71H22a2 2 0 0 0-2 2c0 1.105 128 1.105 128 0a2 2 0 0 0-2-2Z" /><circle cx="2" cy="149.275" r="2" fill="#403161" /><path fill="#403161" d="M11 147.275H8a2 2 0 0 0 0 4h3a2 2 0 0 0 0-4zm149 0h-3a2 2 0 0 0 0 4h3a2 2 0 0 0 0-4z" /><circle cx="166" cy="149.275" r="2" fill="#403161" /><path fill="#845adf" d="M118.154 155.275h-8.308a2.006 2.006 0 0 0 0 4h8.308a2.006 2.006 0 0 0 0-4zm-60 0h-8.308a2.006 2.006 0 0 0 0 4h8.308a2.006 2.006 0 0 0 0-4zm45.846 0H64a2 2 0 0 0 0 4h15.94v2H72a2 2 0 0 0 0 4h25a2 2 0 0 0 0-4h-8.94v-2H104a2 2 0 0 0 0-4z" /><path fill="#403161" d="M150.721 151.275H17.28a2.017 2.017 0 1 1 0-4H150.72a2.017 2.017 0 1 1 0 4Z" /><path fill="#845adf" d="M75 80.275a7.986 7.986 0 0 0-5.93 13.35h11.86A7.986 7.986 0 0 0 75 80.275Zm0 12a4 4 0 1 1 4-4 3.999 3.999 0 0 1-4 4Z" /><path fill="#403161" d="M75.971 29.608a3 3 0 1 0-3-3 3.003 3.003 0 0 0 3 3zm0-4.5a1.5 1.5 0 1 1-1.5 1.5 1.501 1.501 0 0 1 1.5-1.5zm82.334 43.167a2 2 0 1 0 2 2 2.002 2.002 0 0 0-2-2zm0 3a1 1 0 1 1 1-1 1.001 1.001 0 0 1-1 1zM31.97 3.608a2 2 0 1 0 2 2 2.002 2.002 0 0 0-2-2zm0 3a1 1 0 1 1 1-1 1.001 1.001 0 0 1-1 1zm127.362-3.333a2 2 0 1 0 2 2 2.002 2.002 0 0 0-2-2zm0 3a1 1 0 1 1 1-1 1.001 1.001 0 0 1-1 1zm-148 42.666a2 2 0 1 0-2 2 2.002 2.002 0 0 0 2-2zm-3 0a1 1 0 1 1 1 1 1.001 1.001 0 0 1-1-1z" /><path fill="#845adf" d="m5.888 16.953 1.487-1.956-.939-.532-.955 2.19H5.45l-.97-2.174-.955.547 1.471 1.909v.032l-2.301-.298v1.064l2.316-.297v.031l-1.486 1.909.891.563 1.018-2.206h.031l.939 2.191.986-.564-1.502-1.877v-.032l2.362.282v-1.064l-2.362.313v-.031zM92.334 4.455l-.856 1.099.513.325.586-1.271h.018l.541 1.262.568-.325-.865-1.081v-.018l1.36.162v-.612l-1.36.18v-.018l.856-1.126-.541-.307-.55 1.261h-.018l-.558-1.252-.55.315.847 1.1v.018L91 3.996v.612l1.334-.171v.018zM165.638 38.988v-1.043l-2.317.307v-.031l1.459-1.918-.921-.522-.936 2.148h-.032l-.951-2.133-.937.537 1.444 1.873v.031l-2.257-.292v1.043l2.272-.291v.031l-1.459 1.872.875.553.998-2.165h.03l.921 2.149.968-.552-1.474-1.842v-.031l2.317.276zM129.667 19.158l1.258-1.654-.795-.451-.807 1.853h-.027l-.82-1.84-.809.464 1.245 1.615v.027l-1.947-.252v.9l1.96-.251v.026l-1.258 1.615.755.477.861-1.867h.026l.794 1.853.835-.476-1.271-1.589v-.026l1.998.238v-.9l-1.998.265v-.027z" /></svg>
                                                            </div>
                                                            <div className="text-end ms-[3rem]">
                                                                <p className="text-[1.5625rem] font-semibold mb-0">$0</p>
                                                                <p className="text-[#8c9097] dark:text-white/50 text-[0.6875rem] font-semibold mb-0">{t('landing_perMonth')}</p>
                                                            </div>
                                                        </div>
                                                        <ul className="list-unstyled text-center text-[0.75rem] px-4 pt-4 mb-0">
                                                            <li className="mb-4">
                                                                <span className="text-[#8c9097] dark:text-white/50">{t('landing_freeFeature1')}</span>
                                                            </li>
                                                            <li className="mb-4">
                                                                <span className="text-[#8c9097] dark:text-white/50">{t('landing_freeFeature2')}</span>
                                                            </li>
                                                            <li className="mb-4">
                                                                <span className="text-[#8c9097] dark:text-white/50">{t('landing_freeFeature3')}</span>
                                                            </li>
                                                            <li className="mb-4">
                                                                <span className="text-[#8c9097] dark:text-white/50">—</span>
                                                            </li>
                                                            <li className="mb-4">
                                                                <span className="text-[#8c9097] dark:text-white/50">—</span>
                                                            </li>
                                                        </ul>
                                                        </div>
                                                        {currentUser && !currentUser.subscription_plan && (
                                                            <p className="text-center text-[0.75rem] text-primary/90 dark:text-primary mb-3 px-2">{t('landing_upgradeCtaFree')}</p>
                                                        )}
                                                        <div className="grid mt-auto pt-2">
                                                            <Link href={currentUser ? '/#pricing' : '/login'} className="ti-btn ti-btn-primary !font-medium">{t('landing_getStarted')}</Link>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="xxl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-4 sm:col-span-12 col-span-12  md:border-e md:border-b-0 border-b border-dashed dark:border-defaultborder/10 flex flex-col">
                                                    <div className="p-6 flex flex-col flex-1 min-h-0">
                                                        <div className="flex-1">
                                                        <div className="flex items-center justify-center gap-2 flex-wrap">
                                                            <h6 className="font-semibold text-center text-[1rem]">{t('landing_advanced')}</h6>
                                                            {currentUser?.subscription_plan === SUBSCRIPTION_PLAN.STANDARD && (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[0.6875rem] font-medium bg-primary/20 text-primary">{t('landing_currentPlan')}</span>
                                                            )}
                                                        </div>
                                                        <div className="py-6 flex items-center justify-center">
                                                            <div className="pricing-svg1">
                                                                <svg xmlns="http://www.w3.org/2000/svg" data-name="Layer 1" viewBox="0 0 168 168"><path fill="#845adf" d="M84 58.25a9.01 9.01 0 0 0-9 9v4a9 9 0 0 0 18 0v-4a9.01 9.01 0 0 0-9-9Zm5 13a5 5 0 0 1-10 0v-4a5 5 0 0 1 10 0Z" /><circle cx="2" cy="149.75" r="2" fill="#403161" /><path fill="#403161" d="M11 147.75H8a2 2 0 0 0 0 4h3a2 2 0 0 0 0-4zm149 0h-3a2 2 0 0 0 0 4h3a2 2 0 0 0 0-4z" /><circle cx="166" cy="149.75" r="2" fill="#403161" /><path fill="#845adf" d="M118.154 155.75h-8.308a2.006 2.006 0 0 0 0 4h8.308a2.006 2.006 0 0 0 0-4zm-60 0h-8.308a2.006 2.006 0 0 0 0 4h8.308a2.006 2.006 0 0 0 0-4zm45.846 0H64a2 2 0 0 0 0 4h15.94v2H72a2 2 0 0 0 0 4h25a2 2 0 0 0 0-4h-8.94v-2H104a2 2 0 0 0 0-4zm-44-109a7 7 0 1 1 7-7 7.008 7.008 0 0 1-7 7zm0-10a3 3 0 1 0 3 3 3.003 3.003 0 0 0-3-3zm48 10a7 7 0 1 1 7-7 7.008 7.008 0 0 1-7 7zm0-10a3 3 0 1 0 3 3 3.003 3.003 0 0 0-3-3z" /><path fill="#403161" d="M114 82.25a5.008 5.008 0 0 0-4-4.899V46.455a6.932 6.932 0 0 1-4 0V77.25h-6.91a10.063 10.063 0 0 0-2.731-1.986 12.95 12.95 0 0 1-1.815 3.56A6.002 6.002 0 0 1 98 84.25v14h-2a6.994 6.994 0 0 0-12-4.89 6.994 6.994 0 0 0-12 4.89h-2v-14a6.002 6.002 0 0 1 3.456-5.426 12.95 12.95 0 0 1-1.815-3.56 10.063 10.063 0 0 0-2.731 1.986H62V46.455a6.932 6.932 0 0 1-4 0v30.896a5.008 5.008 0 0 0-4 4.899v16h-1a4.005 4.005 0 0 0-4 4v6a4.005 4.005 0 0 0 4 4h19a6.994 6.994 0 0 0 12 4.89 6.994 6.994 0 0 0 12-4.89h19a4.005 4.005 0 0 0 4-4v-6a4.005 4.005 0 0 0-4-4h-1Zm-56 0a1.001 1.001 0 0 1 1-1h7.472a9.906 9.906 0 0 0-.472 3v14h-8Zm14 26H53v-6h19Zm10 4a3 3 0 0 1-6 0v-14a3 3 0 0 1 6 0Zm10 0a3 3 0 0 1-6 0v-14a3 3 0 0 1 6 0Zm17-31a1.001 1.001 0 0 1 1 1v16h-8v-14a9.906 9.906 0 0 0-.472-3Zm6 21 .002 6H96v-6h19Z" /><path fill="#403161" d="M150.721 147.75H148v-5.5a4.005 4.005 0 0 0-4-4h-1v-4a4.005 4.005 0 0 0-4-4h-3v-88.5h10a2 2 0 0 0 0-4h-5v-10a4.005 4.005 0 0 0-4-4H31a4.005 4.005 0 0 0-4 4v10h-5a2 2 0 0 0 0 4h10v88.5h-3a4.005 4.005 0 0 0-4 4v4h-1a4.005 4.005 0 0 0-4 4v5.5h-2.721a2.017 2.017 0 1 0 0 4H150.72a2.017 2.017 0 1 0 0-4ZM31 37.75v-10h106v10h-22.295a6.932 6.932 0 0 1 0 4H124v88.5H44v-88.5h9.295a6.932 6.932 0 0 1 0-4Zm101 4v88.5h-4v-88.5Zm-92 0v88.5h-4v-88.5Zm-11 92.5h110v4H29Zm115 13.5H24v-5.5h120Z" /><path fill="#403161" d="M67 39.75a6.972 6.972 0 0 1-.295 2h34.59a6.932 6.932 0 0 1 0-4h-34.59a6.972 6.972 0 0 1 .295 2zm22.058-21a3 3 0 1 0-3-3 3.003 3.003 0 0 0 3 3zm0-4.5a1.5 1.5 0 1 1-1.5 1.5 1.501 1.501 0 0 1 1.5-1.5zm36-9a2 2 0 1 0 2 2 2.002 2.002 0 0 0-2-2zm0 3a1 1 0 1 1 1-1 1.001 1.001 0 0 1-1 1zm-64-6a2 2 0 1 0 2 2 2.002 2.002 0 0 0-2-2zm0 3a1 1 0 1 1 1-1 1.001 1.001 0 0 1-1 1zm86.359 16.5a2 2 0 1 0 2 2 2.002 2.002 0 0 0-2-2zm0 3a1 1 0 1 1 1-1 1.001 1.001 0 0 1-1 1zM9.76 43.75a2 2 0 1 0-2 2 2.002 2.002 0 0 0 2-2zm-3 0a1 1 0 1 1 1 1 1.001 1.001 0 0 1-1-1z" /><path fill="#845adf" d="m34.193 14.913 1.486-1.956-.939-.532-.954 2.19h-.032l-.969-2.174-.956.547 1.472 1.909v.032L31 14.631v1.064l2.316-.297v.031l-1.487 1.909.892.563 1.018-2.206h.031l.938 2.191.987-.564-1.502-1.877v-.032l2.361.282v-1.064l-2.361.313v-.031zM3.896 8.403 3.04 9.502l.513.325.587-1.271h.017l.541 1.262.568-.325-.865-1.081v-.018l1.36.162v-.612l-1.36.18v-.018l.856-1.126-.541-.307-.549 1.261h-.019L3.59 6.682l-.55.315.847 1.1v.018l-1.325-.171v.612l1.334-.171v.018zM159.058 47.963V46.92l-2.317.307v-.031l1.458-1.918-.921-.522-.936 2.148h-.031l-.951-2.133-.937.538 1.443 1.872v.031l-2.257-.292v1.043l2.272-.291v.031l-1.458 1.872.875.553.998-2.165h.03l.921 2.149.967-.552-1.473-1.842v-.031l2.317.276zM158.501 5.836l1.258-1.655-.794-.45-.808 1.853h-.027l-.82-1.84-.809.464 1.245 1.615v.026l-1.946-.251v.9l1.959-.252v.027l-1.258 1.615.755.477.861-1.867h.026l.795 1.853.834-.476-1.271-1.589v-.027l1.998.239v-.9l-1.998.264v-.026z" /></svg>
                                                            </div>
                                                            <div className="text-end ms-[3rem]">
                                                                <p className="text-[1.5625rem] font-semibold mb-0">$29</p>
                                                                <p className="text-[#8c9097] dark:text-white/50 text-[0.6875rem] font-semibold mb-0">{t('landing_perMonth')}</p>
                                                            </div>
                                                        </div>
                                                        <ul className="list-unstyled text-center text-[0.75rem] px-4 pt-4 mb-0">
                                                            <li className="mb-4">
                                                                <span className="text-[#8c9097] dark:text-white/50">{t('landing_advancedFeature1')}</span>
                                                            </li>
                                                            <li className="mb-4">
                                                                <span className="text-[#8c9097] dark:text-white/50">{t('landing_advancedFeature2')}</span>
                                                            </li>
                                                            <li className="mb-4">
                                                                <span className="text-[#8c9097] dark:text-white/50">{t('landing_advancedFeature3')}</span>
                                                            </li>
                                                            <li className="mb-4">
                                                                <span className="text-[#8c9097] dark:text-white/50">{t('landing_advancedFeature4')}</span>
                                                            </li>
                                                            <li className="mb-4">
                                                                <span className="text-[#8c9097] dark:text-white/50">{t('landing_advancedFeature5')}</span>
                                                            </li>
                                                            <li className="mb-4">
                                                                <span className="text-[#8c9097] dark:text-white/50">{t('landing_advancedFeature6')}</span>
                                                            </li>
                                                        </ul>
                                                        </div>
                                                        <div className="grid mt-auto pt-2">
                                                            {currentUser?.subscription_plan === SUBSCRIPTION_PLAN.STANDARD ? (
                                                                <span className="ti-btn ti-btn-outline-primary !font-medium cursor-default">{t('landing_currentPlan')}</span>
                                                            ) : (
                                                                <button type="button" className="ti-btn ti-btn-primary !font-medium" onClick={() => handlePricingSubscribe(SUBSCRIPTION_PLAN.STANDARD)}>
                                                                    {t('landing_getStarted')}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="xxl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-4 sm:col-span-12 col-span-12 flex flex-col">
                                                    <div className="p-6 pricing-offer overflow-hidden flex flex-col flex-1 min-h-0">
                                                        <div className="flex-1">
                                                        <span className="pricing-offer-details shadow">
                                                            <span className="font-semibold">10%</span> <span className="text-[0.625rem] op-8 ms-1">{t('landing_off')}</span>
                                                        </span>
                                                        <div className="flex items-center justify-center gap-2 flex-wrap">
                                                            <h6 className="font-semibold text-center text-[1rem]">{t('landing_premium')}</h6>
                                                            {currentUser?.subscription_plan === SUBSCRIPTION_PLAN.PRO && (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[0.6875rem] font-medium bg-primary/20 text-primary">{t('landing_currentPlan')}</span>
                                                            )}
                                                        </div>
                                                        <div className="py-6 flex items-center justify-center">
                                                            <div className="pricing-svg1">
                                                                <svg xmlns="http://www.w3.org/2000/svg" data-name="Layer 1" viewBox="0 0 168 168"><path fill="#845adf" d="M84 43.87a10 10 0 1 0-10-10 10.011 10.011 0 0 0 10 10Zm0-16a6 6 0 1 1-6 6 6.007 6.007 0 0 1 6-6Z" /><path fill="#403161" d="M39.405 89.93c2.384 2.883 3.825 3.958 5.2 3.94l21.04-1.557a6.076 6.076 0 0 0 2.588-.801l15.81-9.209 15.815 9.209a6.07 6.07 0 0 0 2.589.8l21.024 1.56.118-.005c2.36-.104 4.061-2.476 4.975-3.75.102-.141.182-.257.24-.33a3.781 3.781 0 0 0 1.065-3.601 3.383 3.383 0 0 0-2.613-2.188l-20.75-3.746a2.001 2.001 0 0 1-1.035-.525L98 72.51V54.156c1.612-1.265 6.7-5.02 20.359-13.665a5.704 5.704 0 0 0 1.055-8.758l-.122-.126a5.606 5.606 0 0 0-6.99-.914L96.181 40.745a14.078 14.078 0 0 1-5.965 5.65c1.111 0 2.385 0 3.889.002a1.997 1.997 0 0 0 1.058-.303l19.23-11.991a1.692 1.692 0 0 1 2.136.401 1.722 1.722 0 0 1-.31 2.608C98.303 48.452 94.79 51.607 94.65 51.736A2 2 0 0 0 94 53.21V71.87H74.07V53.211a2 2 0 0 0-.833-1.625c-.172-.123-4.393-3.141-21.475-14.346a1.739 1.739 0 0 1-.293-2.6 1.608 1.608 0 0 1 1.985-.288l18.814 11.741a1.996 1.996 0 0 0 1.044.304c1.825.013 3.291.022 4.531.027a14.073 14.073 0 0 1-5.678-5.11l-16.62-10.371a5.596 5.596 0 0 0-6.963.93 5.71 5.71 0 0 0 .986 8.71c13.01 8.535 18.59 12.344 20.502 13.67v18.279l-7.449 7.195a1.985 1.985 0 0 1-1.033.524l-20.751 3.747a3.572 3.572 0 0 0-2.712 2.149c-.516 1.638.703 3.092 1.162 3.64Zm22.893-5.742a5.978 5.978 0 0 0 3.101-1.584l6.973-6.735h23.347l6.973 6.735a5.99 5.99 0 0 0 3.103 1.585l19.57 3.525-.052.072c-1.091 1.523-1.643 1.977-1.87 2.074l-20.698-1.536a2.05 2.05 0 0 1-.875-.269l-16.054-9.346a3.759 3.759 0 0 0-1.746-.428 4.033 4.033 0 0 0-1.876.472l-15.973 9.302a2.054 2.054 0 0 1-.873.27l-20.506 1.52a13.116 13.116 0 0 1-2.081-2.137Z" /><path fill="#845adf" d="M104.78 116.06A160.279 160.279 0 0 0 84 114.87a160.279 160.279 0 0 0-20.78 1.19c-7.45 1.027-10.22 2.33-10.22 4.81s2.77 3.782 10.22 4.809a160.279 160.279 0 0 0 20.78 1.19 160.279 160.279 0 0 0 20.78-1.19c7.45-1.027 10.22-2.331 10.22-4.81s-2.77-3.782-10.22-4.81ZM84 122.87c-12.637 0-20.997-1.051-24.905-2 3.908-.95 12.268-2 24.905-2s20.997 1.05 24.905 2c-3.908.949-12.268 2-24.905 2Z" /><circle cx="2" cy="149.869" r="2" fill="#403161" /><path fill="#403161" d="M11 147.87H8a2 2 0 0 0 0 4h3a2 2 0 0 0 0-4zm149 0h-3a2 2 0 0 0 0 4h3a2 2 0 0 0 0-4z" /><circle cx="166" cy="149.869" r="2" fill="#403161" /><path fill="#845adf" d="M118.154 155.87h-8.308a2.006 2.006 0 0 0 0 4h8.308a2.006 2.006 0 0 0 0-4zm-60 0h-8.308a2.006 2.006 0 0 0 0 4h8.308a2.006 2.006 0 0 0 0-4zm45.846 0H64a2 2 0 0 0 0 4h15.94v2H72a2 2 0 0 0 0 4h25a2 2 0 1 0 0-4h-8.94v-2H104a2 2 0 1 0 0-4z" /><path fill="#403161" d="M150.721 147.87H86v-14.008c14.696-.103 36.55-1.35 50.005-4.967v10.974H136a2 2 0 0 0 0 4h4a2 2 0 0 0 .005-4v-12.213c4.92-1.772 7.995-4.001 7.995-6.787 0-10.283-41.864-13-64-13s-64 2.717-64 13c0 2.787 3.078 5.017 8 6.788v12.212a2 2 0 0 0 0 4h4a2 2 0 0 0 0-4v-10.972c13.455 3.615 35.306 4.862 50 4.965v14.007H17.279a2.017 2.017 0 1 0 0 4H150.72a2.017 2.017 0 1 0 0-4zM40.725 126.715C26.984 124.303 24.037 121.49 24 120.87c.037-.62 2.984-3.433 16.725-5.846C52.3 112.99 67.668 111.869 84 111.869s31.7 1.12 43.275 3.154c13.74 2.413 16.687 5.225 16.725 5.846-.038.621-2.985 3.434-16.725 5.847C115.7 128.75 100.332 129.87 84 129.87s-31.7-1.12-43.275-3.153zm64.58-113.013a3 3 0 1 0-3-3 3.003 3.003 0 0 0 3 3zm0-4.5a1.5 1.5 0 1 1-1.5 1.5 1.501 1.501 0 0 1 1.5-1.5zm22.666 19.166a2 2 0 1 0 2 2 2.002 2.002 0 0 0-2-2zm0 3a1 1 0 1 1 1-1 1.001 1.001 0 0 1-1 1zM9 5.203a2 2 0 1 0 2 2 2.002 2.002 0 0 0-2-2zm0 3a1 1 0 1 1 1-1 1.001 1.001 0 0 1-1 1zm153.667 8.75a2 2 0 1 0 2 2 2.002 2.002 0 0 0-2-2zm0 3a1 1 0 1 1 1-1 1.001 1.001 0 0 1-1 1zM35.333 24.869a2 2 0 1 0-2 2 2.002 2.002 0 0 0 2-2zm-3 0a1 1 0 1 1 1 1 1.001 1.001 0 0 1-1-1z" /><path fill="#845adf" d="m8.498 50.126 1.487-1.955-.939-.532-.954 2.19H8.06l-.97-2.175-.955.548 1.471 1.909v.031l-2.301-.297v1.064l2.316-.297v.031l-1.486 1.908.892.564 1.017-2.206h.031l.939 2.19.986-.563-1.502-1.878v-.031l2.362.282v-1.064l-2.362.313v-.032zM69.829 3.861l-.857 1.099.514.324.586-1.27h.018l.54 1.261.568-.324-.865-1.082v-.018l1.361.163v-.613l-1.361.18v-.018l.856-1.126-.54-.306-.55 1.261h-.018l-.558-1.253-.551.316.848 1.099v.018l-1.325-.171v.613l1.334-.171v.018zM142.055 7.333V6.289l-2.317.307v-.031l1.458-1.918-.921-.521-.936 2.148h-.031l-.951-2.133-.937.537 1.443 1.872v.031l-2.257-.292v1.044l2.272-.291v.03l-1.458 1.872.875.553.998-2.164h.03l.921 2.148.967-.552-1.473-1.842v-.03l2.317.276zM151.396 50.164l1.258-1.655-.795-.45-.807 1.853h-.027l-.82-1.84-.809.464 1.245 1.615v.026l-1.946-.251v.9l1.959-.251v.026l-1.258 1.615.755.477.861-1.867h.026l.794 1.853.835-.476-1.271-1.589v-.026l1.998.238v-.9l-1.998.264v-.026z" /></svg>
                                                            </div>
                                                            <div className="text-end ms-[3rem]">
                                                                <p className="text-[1.5625rem] font-semibold mb-0 !text-primary">$89</p>
                                                                <p className="text-[#8c9097] dark:text-white/50 text-[0.6875rem] font-semibold mb-0">{t('landing_perMonth')}</p>
                                                            </div>
                                                        </div>
                                                        <ul className="list-unstyled text-center text-[0.75rem] px-4 pt-4 mb-0">
                                                            <li className="mb-4">
                                                                <span className="text-[#8c9097] dark:text-white/50">{t('landing_advancedFeature1')}</span>
                                                            </li>
                                                            <li className="mb-4">
                                                                <span className="text-[#8c9097] dark:text-white/50">{t('landing_premiumFeature2')}</span>
                                                            </li>
                                                            <li className="mb-4">
                                                                <span className="text-[#8c9097] dark:text-white/50">{t('landing_premiumFeature3')}</span>
                                                            </li>
                                                            <li className="mb-4">
                                                                <span className="text-[#8c9097] dark:text-white/50">{t('landing_premiumFeature4')}</span>
                                                            </li>
                                                            <li className="mb-4">
                                                                <span className="text-[#8c9097] dark:text-white/50">{t('landing_premiumFeature5')}</span>
                                                            </li>
                                                            <li className="mb-4">
                                                                <span className="text-[#8c9097] dark:text-white/50">{t('landing_advancedFeature6')}</span>
                                                            </li>
                                                        </ul>
                                                        </div>
                                                        <div className="grid mt-auto pt-2">
                                                            {currentUser?.subscription_plan === SUBSCRIPTION_PLAN.PRO ? (
                                                                <span className="ti-btn ti-btn-outline-primary !font-medium cursor-default">{t('landing_currentPlan')}</span>
                                                            ) : (
                                                                <button type="button" className="ti-btn ti-btn-primary !font-medium" onClick={() => handlePricingSubscribe(SUBSCRIPTION_PLAN.PRO)}>
                                                                    {t('landing_getStarted')}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                    {!HIDE_EXTRA_LANDING_SECTIONS && (
                    <section className="section landing-section-faq text-defaulttextcolor dark:text-defaulttextcolor/70 text-[0.813rem]" id="faq">
                        <div className="container-xl px-3 text-center">
                            <p className="text-[0.75rem] font-semibold text-success mb-1"><span className="landing-section-heading">F.A.Q</span></p>
                            <h3 className="font-semibold mb-2">Frequently asked questions ?</h3>
                            <div className="grid grid-cols-12 justify-center">
                                <div className="col-span-12">
                                    <p className="text-[#8c9097] dark:text-white/50 text-[0.9375rem] mb-12 font-normal">We have shared some of the most frequently asked questions to help you out.</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-12 gap-6 text-start">
                                <div className="xl:col-span-12 col-span-12">
                                    <div className="grid grid-cols-12 gap-6">
                                        <div className="xl:col-span-6 col-span-12">
                                            <div className="accordion accordion-customicon1 accordion-primary accordions-items-seperate" id="accordionFAQ1">
                                                <div className="hs-accordion-group">
                                                    <div className="hs-accordion active bg-white dark:bg-bodybg  border dark:border-defaultborder/10 mt-[0.5rem] rounded-sm  dark:border dark:border-defaultborder/10-white/10"
                                                        id="faq-one">
                                                        <button type="button"
                                                            className="hs-accordion-toggle hs-accordion-active:!text-primary hs-accordion-active:border dark:border-defaultborder/10-b hs-accordion-active:bg-primary/10   dark:border-defaultborder/10 dark:hs-accordion-active:border dark:border-defaultborder/10-white/10 justify-between inline-flex items-center w-full font-semibold text-start text-[0.85rem] transition py-3 px-4 dark:hs-accordion-active:!text-primary dark:text-gray-200 dark:hover:text-white/80"
                                                            aria-controls="faq-collapse-one">
                                                            Where can I subscribe to your newsletter?
                                                            <svg
                                                                className="hs-accordion-active:hidden hs-accordion-active:!text-primary hs-accordion-active:group-hover:!text-primary block w-3 h-3 text-gray-600 group-hover:text-defaulttextcolor dark:text-defaulttextcolor/70 "
                                                                width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M1.5 8.85999L14.5 8.85998" stroke="currentColor" strokeWidth="2"
                                                                    strokeLinecap="round" />
                                                                <path d="M8 15.36L8 2.35999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                            </svg>
                                                            <svg
                                                                className="hs-accordion-active:block hs-accordion-active:!text-primary hs-accordion-active:group-hover:!text-primary hidden w-3 h-3 text-gray-600 group-hover:text-defaulttextcolor dark:text-defaulttextcolor/70 "
                                                                width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M1.5 8.85999L14.5 8.85998" stroke="currentColor" strokeWidth="2"
                                                                    strokeLinecap="round" />
                                                            </svg>
                                                        </button>
                                                        <div id="faq-collapse-one"
                                                            className="hs-accordion-content w-full overflow-hidden transition-[height] duration-300"
                                                            aria-labelledby="faq-one">
                                                            <div className="p-5">
                                                                <p className="text-defaulttextcolor dark:text-defaulttextcolor/70 ">
                                                                    <strong>This is the first item's accordion body.</strong> It is shown by
                                                                    default, until the collapse plugin adds the appropriate classes that we
                                                                    use to style each element. These classes control the overall appearance,
                                                                    as well as the showing and hiding via CSS transitions. You can modify
                                                                    any of this with custom CSS or overriding our default variables. It's
                                                                    also worth noting that just about any HTML can go within the
                                                                    <code>.accordion-body</code>, though the transition does limit overflow.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="hs-accordion bg-white dark:bg-bodybg border dark:border-defaultborder/10 mt-[0.5rem] rounded-sm dark:border-defaultborder/10-white/10"
                                                        id="faq-two">
                                                        <button type="button"
                                                            className="hs-accordion-toggle hs-accordion-active:!text-primary hs-accordion-active:border dark:border-defaultborder/10-b hs-accordion-active:bg-primary/10   dark:border-defaultborder/10 dark:hs-accordion-active:border dark:border-defaultborder/10-white/10 justify-between inline-flex items-center w-full font-semibold text-start text-[0.85rem] transition py-3 px-4 dark:hs-accordion-active:!text-primary dark:text-gray-200 dark:hover:text-white/80"
                                                            aria-controls="faq-collapse-two">
                                                            Where can in edit my address?
                                                            <svg
                                                                className="hs-accordion-active:hidden hs-accordion-active:!text-primary hs-accordion-active:group-hover:!text-primary block w-3 h-3 text-gray-600 group-hover:text-defaulttextcolor dark:text-defaulttextcolor/70 "
                                                                width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M1.5 8.85999L14.5 8.85998" stroke="currentColor" strokeWidth="2"
                                                                    strokeLinecap="round" />
                                                                <path d="M8 15.36L8 2.35999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                            </svg>
                                                            <svg
                                                                className="hs-accordion-active:block hs-accordion-active:!text-primary hs-accordion-active:group-hover:!text-primary hidden w-3 h-3 text-gray-600 group-hover:text-defaulttextcolor dark:text-defaulttextcolor/70 "
                                                                width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M1.5 8.85999L14.5 8.85998" stroke="currentColor" strokeWidth="2"
                                                                    strokeLinecap="round" />
                                                            </svg>
                                                        </button>
                                                        <div id="faq-collapse-two"
                                                            className="hs-accordion-content w-full overflow-hidden hidden transition-[height] duration-300"
                                                            aria-labelledby="faq-two">
                                                            <div className="p-5">
                                                                <p className="text-defaulttextcolor dark:text-defaulttextcolor/70 ">
                                                                    <strong>This is the first item's accordion body.</strong> It is shown by
                                                                    default, until the collapse plugin adds the appropriate classes that we
                                                                    use to style each element. These classes control the overall appearance,
                                                                    as well as the showing and hiding via CSS transitions. You can modify
                                                                    any of this with custom CSS or overriding our default variables. It's
                                                                    also worth noting that just about any HTML can go within the
                                                                    <code>.accordion-body</code>, though the transition does limit overflow.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="hs-accordion bg-white dark:bg-bodybg border dark:border-defaultborder/10 mt-[0.5rem] rounded-sm dark:border-defaultborder/10-white/10"
                                                        id="faq-twenty">
                                                        <button type="button"
                                                            className="hs-accordion-toggle hs-accordion-active:!text-primary hs-accordion-active:border dark:border-defaultborder/10-b hs-accordion-active:bg-primary/10   dark:border-defaultborder/10 dark:hs-accordion-active:border dark:border-defaultborder/10-white/10 justify-between inline-flex items-center w-full font-semibold text-start text-[0.85rem] transition py-3 px-4 dark:hs-accordion-active:!text-primary dark:text-gray-200 dark:hover:text-white/80"
                                                            aria-controls="faq-collapse-three">
                                                            What are your opening hours?
                                                            <svg
                                                                className="hs-accordion-active:hidden hs-accordion-active:!text-primary hs-accordion-active:group-hover:!text-primary block w-3 h-3 text-gray-600 group-hover:text-defaulttextcolor dark:text-defaulttextcolor/70 "
                                                                width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M1.5 8.85999L14.5 8.85998" stroke="currentColor" strokeWidth="2"
                                                                    strokeLinecap="round" />
                                                                <path d="M8 15.36L8 2.35999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                            </svg>
                                                            <svg
                                                                className="hs-accordion-active:block hs-accordion-active:!text-primary hs-accordion-active:group-hover:!text-primary hidden w-3 h-3 text-gray-600 group-hover:text-defaulttextcolor dark:text-defaulttextcolor/70 "
                                                                width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M1.5 8.85999L14.5 8.85998" stroke="currentColor" strokeWidth="2"
                                                                    strokeLinecap="round" />
                                                            </svg>
                                                        </button>
                                                        <div id="faq-collapse-three"
                                                            className="hs-accordion-content w-full overflow-hidden hidden transition-[height] duration-300"
                                                            aria-labelledby="faq-twenty">
                                                            <div className="p-5">
                                                                <p className="text-defaulttextcolor dark:text-defaulttextcolor/70 ">
                                                                    <strong>This is the first item's accordion body.</strong> It is shown by
                                                                    default, until the collapse plugin adds the appropriate classes that we
                                                                    use to style each element. These classes control the overall appearance,
                                                                    as well as the showing and hiding via CSS transitions. You can modify
                                                                    any of this with custom CSS or overriding our default variables. It's
                                                                    also worth noting that just about any HTML can go within the
                                                                    <code>.accordion-body</code>, though the transition does limit overflow.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="hs-accordion bg-white dark:bg-bodybg border dark:border-defaultborder/10 mt-[0.5rem] rounded-sm dark:border-defaultborder/10-white/10"
                                                        id="faq-thirty">
                                                        <button type="button"
                                                            className="hs-accordion-toggle hs-accordion-active:!text-primary hs-accordion-active:border dark:border-defaultborder/10-b hs-accordion-active:bg-primary/10   dark:border-defaultborder/10 dark:hs-accordion-active:border dark:border-defaultborder/10-white/10 justify-between inline-flex items-center w-full font-semibold text-start text-[0.85rem] transition py-3 px-4 dark:hs-accordion-active:!text-primary dark:text-gray-200 dark:hover:text-white/80"
                                                            aria-controls="faq-collapse-four">
                                                            Do I have the right to return an item?
                                                            <svg
                                                                className="hs-accordion-active:hidden hs-accordion-active:!text-primary hs-accordion-active:group-hover:!text-primary block w-3 h-3 text-gray-600 group-hover:text-defaulttextcolor dark:text-defaulttextcolor/70 "
                                                                width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M1.5 8.85999L14.5 8.85998" stroke="currentColor" strokeWidth="2"
                                                                    strokeLinecap="round" />
                                                                <path d="M8 15.36L8 2.35999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                            </svg>
                                                            <svg
                                                                className="hs-accordion-active:block hs-accordion-active:!text-primary hs-accordion-active:group-hover:!text-primary hidden w-3 h-3 text-gray-600 group-hover:text-defaulttextcolor dark:text-defaulttextcolor/70 "
                                                                width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M1.5 8.85999L14.5 8.85998" stroke="currentColor" strokeWidth="2"
                                                                    strokeLinecap="round" />
                                                            </svg>
                                                        </button>
                                                        <div id="faq-collapse-four"
                                                            className="hs-accordion-content w-full overflow-hidden hidden transition-[height] duration-300"
                                                            >
                                                            <div className="p-5">
                                                                <p className="text-defaulttextcolor dark:text-defaulttextcolor/70 ">
                                                                    <strong>This is the first item's accordion body.</strong> It is shown by
                                                                    default, until the collapse plugin adds the appropriate classes that we
                                                                    use to style each element. These classes control the overall appearance,
                                                                    as well as the showing and hiding via CSS transitions. You can modify
                                                                    any of this with custom CSS or overriding our default variables. It's
                                                                    also worth noting that just about any HTML can go within the
                                                                    <code>.accordion-body</code>, though the transition does limit overflow.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="hs-accordion bg-white dark:bg-bodybg border dark:border-defaultborder/10 mt-[0.5rem] rounded-sm dark:border-defaultborder/10-white/10"
                                                        id="faq-three">
                                                        <button type="button"
                                                            className="hs-accordion-toggle hs-accordion-active:!text-primary hs-accordion-active:border dark:border-defaultborder/10-b hs-accordion-active:bg-primary/10   dark:border-defaultborder/10 dark:hs-accordion-active:border dark:border-defaultborder/10-white/10 justify-between inline-flex items-center w-full font-semibold text-start text-[0.85rem] transition py-3 px-4 dark:hs-accordion-active:!text-primary dark:text-gray-200 dark:hover:text-white/80"
                                                            aria-controls="faq-collapse-five">
                                                            General Terms &amp; Conditions (GTC)
                                                            <svg
                                                                className="hs-accordion-active:hidden hs-accordion-active:!text-primary hs-accordion-active:group-hover:!text-primary block w-3 h-3 text-gray-600 group-hover:text-defaulttextcolor dark:text-defaulttextcolor/70 "
                                                                width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M1.5 8.85999L14.5 8.85998" stroke="currentColor" strokeWidth="2"
                                                                    strokeLinecap="round" />
                                                                <path d="M8 15.36L8 2.35999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                            </svg>
                                                            <svg
                                                                className="hs-accordion-active:block hs-accordion-active:!text-primary hs-accordion-active:group-hover:!text-primary hidden w-3 h-3 text-gray-600 group-hover:text-defaulttextcolor dark:text-defaulttextcolor/70 "
                                                                width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M1.5 8.85999L14.5 8.85998" stroke="currentColor" strokeWidth="2"
                                                                    strokeLinecap="round" />
                                                            </svg>
                                                        </button>
                                                        <div id="faq-collapse-five"
                                                            className="hs-accordion-content w-full overflow-hidden hidden transition-[height] duration-300"
                                                            aria-labelledby="faq-three">
                                                            <div className="p-5">
                                                                <p className="text-defaulttextcolor dark:text-defaulttextcolor/70 ">
                                                                    <strong>This is the first item's accordion body.</strong> It is shown by
                                                                    default, until the collapse plugin adds the appropriate classes that we
                                                                    use to style each element. These classes control the overall appearance,
                                                                    as well as the showing and hiding via CSS transitions. You can modify
                                                                    any of this with custom CSS or overriding our default variables. It's
                                                                    also worth noting that just about any HTML can go within the
                                                                    <code>.accordion-body</code>, though the transition does limit overflow.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="hs-accordion bg-white dark:bg-bodybg border dark:border-defaultborder/10 mt-[0.5rem] rounded-sm dark:border-defaultborder/10-white/10"
                                                        id="faq-four">
                                                        <button type="button"
                                                            className="hs-accordion-toggle hs-accordion-active:!text-primary hs-accordion-active:border dark:border-defaultborder/10-b hs-accordion-active:bg-primary/10   dark:border-defaultborder/10 dark:hs-accordion-active:border dark:border-defaultborder/10-white/10 justify-between inline-flex items-center w-full font-semibold text-start text-[0.85rem] transition py-3 px-4 dark:hs-accordion-active:!text-primary dark:text-gray-200 dark:hover:text-white/80"
                                                            aria-controls="faq-collapse-six">
                                                            Do I need to create an account to make an order?
                                                            <svg
                                                                className="hs-accordion-active:hidden hs-accordion-active:!text-primary hs-accordion-active:group-hover:!text-primary block w-3 h-3 text-gray-600 group-hover:text-defaulttextcolor dark:text-defaulttextcolor/70 "
                                                                width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M1.5 8.85999L14.5 8.85998" stroke="currentColor" strokeWidth="2"
                                                                    strokeLinecap="round" />
                                                                <path d="M8 15.36L8 2.35999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                            </svg>
                                                            <svg
                                                                className="hs-accordion-active:block hs-accordion-active:!text-primary hs-accordion-active:group-hover:!text-primary hidden w-3 h-3 text-gray-600 group-hover:text-defaulttextcolor dark:text-defaulttextcolor/70 "
                                                                width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M1.5 8.85999L14.5 8.85998" stroke="currentColor" strokeWidth="2"
                                                                    strokeLinecap="round" />
                                                            </svg>
                                                        </button>
                                                        <div id="faq-collapse-six"
                                                            className="hs-accordion-content w-full overflow-hidden hidden transition-[height] duration-300"
                                                            aria-labelledby="faq-four">
                                                            <div className="p-5">
                                                                <p className="text-defaulttextcolor dark:text-defaulttextcolor/70 ">
                                                                    <strong>This is the first item's accordion body.</strong> It is shown by
                                                                    default, until the collapse plugin adds the appropriate classes that we
                                                                    use to style each element. These classes control the overall appearance,
                                                                    as well as the showing and hiding via CSS transitions. You can modify
                                                                    any of this with custom CSS or overriding our default variables. It's
                                                                    also worth noting that just about any HTML can go within the
                                                                    <code>.accordion-body</code>, though the transition does limit overflow.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="xl:col-span-6 col-span-12">
                                            <div className="accordion accordion-customicon1 accordion-primary accordions-items-seperate" id="accordionFAQ2">
                                                <div className="hs-accordion-group">
                                                    <div className="hs-accordion active bg-white dark:bg-bodybg border dark:border-defaultborder/10 mt-[0.5rem] rounded-sm dark:border dark:border-defaultborder/10-white/10"
                                                        id="faq-five">
                                                        <button type="button"
                                                            className="hs-accordion-toggle hs-accordion-active:!text-primary hs-accordion-active:border dark:border-defaultborder/10-b hs-accordion-active:bg-primary/10   dark:border-defaultborder/10 dark:hs-accordion-active:border dark:border-defaultborder/10-white/10 justify-between inline-flex items-center w-full font-semibold text-start text-[0.85rem] transition py-3 px-4 dark:hs-accordion-active:!text-primary dark:text-gray-200 dark:hover:text-white/80"
                                                            aria-controls="faq-collapse-seven">
                                                            General Terms &amp; Conditions (GTC)
                                                            <svg
                                                                className="hs-accordion-active:hidden hs-accordion-active:!text-primary hs-accordion-active:group-hover:!text-primary block w-3 h-3 text-gray-600 group-hover:text-defaulttextcolor dark:text-defaulttextcolor/70 "
                                                                width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M1.5 8.85999L14.5 8.85998" stroke="currentColor" strokeWidth="2"
                                                                    strokeLinecap="round" />
                                                                <path d="M8 15.36L8 2.35999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                            </svg>
                                                            <svg
                                                                className="hs-accordion-active:block hs-accordion-active:!text-primary hs-accordion-active:group-hover:!text-primary hidden w-3 h-3 text-gray-600 group-hover:text-defaulttextcolor dark:text-defaulttextcolor/70 "
                                                                width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M1.5 8.85999L14.5 8.85998" stroke="currentColor" strokeWidth="2"
                                                                    strokeLinecap="round" />
                                                            </svg>
                                                        </button>
                                                        <div id="faq-collapse-seven"
                                                            className="hs-accordion-content w-full overflow-hidden transition-[height] duration-300"
                                                            aria-labelledby="faq-five">
                                                            <div className="p-5">
                                                                <p className="text-defaulttextcolor dark:text-defaulttextcolor/70 ">
                                                                    <strong>This is the first item's accordion body.</strong> It is shown by
                                                                    default, until the collapse plugin adds the appropriate classes that we
                                                                    use to style each element. These classes control the overall appearance,
                                                                    as well as the showing and hiding via CSS transitions. You can modify
                                                                    any of this with custom CSS or overriding our default variables. It's
                                                                    also worth noting that just about any HTML can go within the
                                                                    <code>.accordion-body</code>, though the transition does limit overflow.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="hs-accordion bg-white dark:bg-bodybg border dark:border-defaultborder/10 mt-[0.5rem] rounded-sm dark:border dark:border-defaultborder/10-white/10"
                                                        id="faq-six">
                                                        <button type="button"
                                                            className="hs-accordion-toggle hs-accordion-active:!text-primary hs-accordion-active:border dark:border-defaultborder/10-b hs-accordion-active:bg-primary/10   dark:border-defaultborder/10 dark:hs-accordion-active:border dark:border-defaultborder/10-white/10 justify-between inline-flex items-center w-full font-semibold text-start text-[0.85rem] transition py-3 px-4 dark:hs-accordion-active:!text-primary dark:text-gray-200 dark:hover:text-white/80"
                                                            aria-controls="faq-collapse-eight">
                                                            Do I need to create an account to make an order?
                                                            <svg
                                                                className="hs-accordion-active:hidden hs-accordion-active:!text-primary hs-accordion-active:group-hover:!text-primary block w-3 h-3 text-gray-600 group-hover:text-defaulttextcolor dark:text-defaulttextcolor/70 "
                                                                width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M1.5 8.85999L14.5 8.85998" stroke="currentColor" strokeWidth="2"
                                                                    strokeLinecap="round" />
                                                                <path d="M8 15.36L8 2.35999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                            </svg>
                                                            <svg
                                                                className="hs-accordion-active:block hs-accordion-active:!text-primary hs-accordion-active:group-hover:!text-primary hidden w-3 h-3 text-gray-600 group-hover:text-defaulttextcolor dark:text-defaulttextcolor/70 "
                                                                width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M1.5 8.85999L14.5 8.85998" stroke="currentColor" strokeWidth="2"
                                                                    strokeLinecap="round" />
                                                            </svg>
                                                        </button>
                                                        <div id="faq-collapse-eight"
                                                            className="hs-accordion-content w-full overflow-hidden hidden transition-[height] duration-300"
                                                            aria-labelledby="faq-six">
                                                            <div className="p-5">
                                                                <p className="text-defaulttextcolor dark:text-defaulttextcolor/70 ">
                                                                    <strong>This is the first item's accordion body.</strong> It is shown by
                                                                    default, until the collapse plugin adds the appropriate classes that we
                                                                    use to style each element. These classes control the overall appearance,
                                                                    as well as the showing and hiding via CSS transitions. You can modify
                                                                    any of this with custom CSS or overriding our default variables. It's
                                                                    also worth noting that just about any HTML can go within the
                                                                    <code>.accordion-body</code>, though the transition does limit overflow.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="hs-accordion bg-white dark:bg-bodybg border dark:border-defaultborder/10 mt-[0.5rem] rounded-sm dark:border dark:border-defaultborder/10-white/10"
                                                        id="faq-seven">
                                                        <button type="button"
                                                            className="hs-accordion-toggle hs-accordion-active:!text-primary hs-accordion-active:border dark:border-defaultborder/10-b hs-accordion-active:bg-primary/10   dark:border-defaultborder/10 dark:hs-accordion-active:border dark:border-defaultborder/10-white/10 justify-between inline-flex items-center w-full font-semibold text-start text-[0.85rem] transition py-3 px-4 dark:hs-accordion-active:!text-primary dark:text-gray-200 dark:hover:text-white/80"
                                                            aria-controls="faq-collapse-nine">
                                                            Where can I subscribe to your newsletter?
                                                            <svg
                                                                className="hs-accordion-active:hidden hs-accordion-active:!text-primary hs-accordion-active:group-hover:!text-primary block w-3 h-3 text-gray-600 group-hover:text-defaulttextcolor dark:text-defaulttextcolor/70 "
                                                                width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M1.5 8.85999L14.5 8.85998" stroke="currentColor" strokeWidth="2"
                                                                    strokeLinecap="round" />
                                                                <path d="M8 15.36L8 2.35999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                            </svg>
                                                            <svg
                                                                className="hs-accordion-active:block hs-accordion-active:!text-primary hs-accordion-active:group-hover:!text-primary hidden w-3 h-3 text-gray-600 group-hover:text-defaulttextcolor dark:text-defaulttextcolor/70 "
                                                                width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M1.5 8.85999L14.5 8.85998" stroke="currentColor" strokeWidth="2"
                                                                    strokeLinecap="round" />
                                                            </svg>
                                                        </button>
                                                        <div id="faq-collapse-nine"
                                                            className="hs-accordion-content w-full overflow-hidden hidden transition-[height] duration-300"
                                                            aria-labelledby="faq-seven">
                                                            <div className="p-5">
                                                                <p className="text-defaulttextcolor dark:text-defaulttextcolor/70 ">
                                                                    <strong>This is the first item's accordion body.</strong> It is shown by
                                                                    default, until the collapse plugin adds the appropriate classes that we
                                                                    use to style each element. These classes control the overall appearance,
                                                                    as well as the showing and hiding via CSS transitions. You can modify
                                                                    any of this with custom CSS or overriding our default variables. It's
                                                                    also worth noting that just about any HTML can go within the
                                                                    <code>.accordion-body</code>, though the transition does limit overflow.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="hs-accordion bg-white dark:bg-bodybg border dark:border-defaultborder/10 mt-[0.5rem] rounded-sm dark:border dark:border-defaultborder/10-white/10"
                                                        id="faq-eight">
                                                        <button type="button"
                                                            className="hs-accordion-toggle hs-accordion-active:!text-primary hs-accordion-active:border dark:border-defaultborder/10-b hs-accordion-active:bg-primary/10   dark:border-defaultborder/10 dark:hs-accordion-active:border dark:border-defaultborder/10-white/10 justify-between inline-flex items-center w-full font-semibold text-start text-[0.85rem] transition py-3 px-4 dark:hs-accordion-active:!text-primary dark:text-gray-200 dark:hover:text-white/80"
                                                            aria-controls="faq-collapse-ten">
                                                            Where can in edit my address?
                                                            <svg
                                                                className="hs-accordion-active:hidden hs-accordion-active:!text-primary hs-accordion-active:group-hover:!text-primary block w-3 h-3 text-gray-600 group-hover:text-defaulttextcolor dark:text-defaulttextcolor/70 "
                                                                width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M1.5 8.85999L14.5 8.85998" stroke="currentColor" strokeWidth="2"
                                                                    strokeLinecap="round" />
                                                                <path d="M8 15.36L8 2.35999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                            </svg>
                                                            <svg
                                                                className="hs-accordion-active:block hs-accordion-active:!text-primary hs-accordion-active:group-hover:!text-primary hidden w-3 h-3 text-gray-600 group-hover:text-defaulttextcolor dark:text-defaulttextcolor/70 "
                                                                width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M1.5 8.85999L14.5 8.85998" stroke="currentColor" strokeWidth="2"
                                                                    strokeLinecap="round" />
                                                            </svg>
                                                        </button>
                                                        <div id="faq-collapse-ten"
                                                            className="hs-accordion-content w-full overflow-hidden hidden transition-[height] duration-300"
                                                            aria-labelledby="faq-eight">
                                                            <div className="p-5">
                                                                <p className="text-defaulttextcolor dark:text-defaulttextcolor/70 ">
                                                                    <strong>This is the first item's accordion body.</strong> It is shown by
                                                                    default, until the collapse plugin adds the appropriate classes that we
                                                                    use to style each element. These classes control the overall appearance,
                                                                    as well as the showing and hiding via CSS transitions. You can modify
                                                                    any of this with custom CSS or overriding our default variables. It's
                                                                    also worth noting that just about any HTML can go within the
                                                                    <code>.accordion-body</code>, though the transition does limit overflow.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="hs-accordion bg-white dark:bg-bodybg border dark:border-defaultborder/10 mt-[0.5rem] rounded-sm dark:border dark:border-defaultborder/10-white/10"
                                                        id="faq-nine">
                                                        <button type="button"
                                                            className="hs-accordion-toggle hs-accordion-active:!text-primary hs-accordion-active:border dark:border-defaultborder/10-b hs-accordion-active:bg-primary/10   dark:border-defaultborder/10 dark:hs-accordion-active:border dark:border-defaultborder/10-white/10 justify-between inline-flex items-center w-full font-semibold text-start text-[0.85rem] transition py-3 px-4 dark:hs-accordion-active:!text-primary dark:text-gray-200 dark:hover:text-white/80"
                                                            aria-controls="faq-collapse-eleven">
                                                            What are your opening hours?
                                                            <svg
                                                                className="hs-accordion-active:hidden hs-accordion-active:!text-primary hs-accordion-active:group-hover:!text-primary block w-3 h-3 text-gray-600 group-hover:text-defaulttextcolor dark:text-defaulttextcolor/70 "
                                                                width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M1.5 8.85999L14.5 8.85998" stroke="currentColor" strokeWidth="2"
                                                                    strokeLinecap="round" />
                                                                <path d="M8 15.36L8 2.35999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                            </svg>
                                                            <svg
                                                                className="hs-accordion-active:block hs-accordion-active:!text-primary hs-accordion-active:group-hover:!text-primary hidden w-3 h-3 text-gray-600 group-hover:text-defaulttextcolor dark:text-defaulttextcolor/70 "
                                                                width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M1.5 8.85999L14.5 8.85998" stroke="currentColor" strokeWidth="2"
                                                                    strokeLinecap="round" />
                                                            </svg>
                                                        </button>
                                                        <div id="faq-collapse-eleven"
                                                            className="hs-accordion-content w-full overflow-hidden hidden transition-[height] duration-300"
                                                            aria-labelledby="faq-nine">
                                                            <div className="p-5">
                                                                <p className="text-defaulttextcolor dark:text-defaulttextcolor/70 ">
                                                                    <strong>This is the first item's accordion body.</strong> It is shown by
                                                                    default, until the collapse plugin adds the appropriate classes that we
                                                                    use to style each element. These classes control the overall appearance,
                                                                    as well as the showing and hiding via CSS transitions. You can modify
                                                                    any of this with custom CSS or overriding our default variables. It's
                                                                    also worth noting that just about any HTML can go within the
                                                                    <code>.accordion-body</code>, though the transition does limit overflow.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="hs-accordion bg-white dark:bg-bodybg border dark:border-defaultborder/10 mt-[0.5rem] rounded-sm dark:border dark:border-defaultborder/10-white/10"
                                                        id="faq-ten">
                                                        <button type="button"
                                                            className="hs-accordion-toggle hs-accordion-active:!text-primary hs-accordion-active:border dark:border-defaultborder/10-b hs-accordion-active:bg-primary/10   dark:border-defaultborder/10 dark:hs-accordion-active:border dark:border-defaultborder/10-white/10 justify-between inline-flex items-center w-full font-semibold text-start text-[0.85rem] transition py-3 px-4 dark:hs-accordion-active:!text-primary dark:text-gray-200 dark:hover:text-white/80"
                                                            aria-controls="faq-collapse-twelve">
                                                            Do I have the right to return an item?
                                                            <svg
                                                                className="hs-accordion-active:hidden hs-accordion-active:!text-primary hs-accordion-active:group-hover:!text-primary block w-3 h-3 text-gray-600 group-hover:text-defaulttextcolor dark:text-defaulttextcolor/70 "
                                                                width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M1.5 8.85999L14.5 8.85998" stroke="currentColor" strokeWidth="2"
                                                                    strokeLinecap="round" />
                                                                <path d="M8 15.36L8 2.35999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                            </svg>
                                                            <svg
                                                                className="hs-accordion-active:block hs-accordion-active:!text-primary hs-accordion-active:group-hover:!text-primary hidden w-3 h-3 text-gray-600 group-hover:text-defaulttextcolor dark:text-defaulttextcolor/70 "
                                                                width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M1.5 8.85999L14.5 8.85998" stroke="currentColor" strokeWidth="2"
                                                                    strokeLinecap="round" />
                                                            </svg>
                                                        </button>
                                                        <div id="faq-collapse-twelve"
                                                            className="hs-accordion-content w-full overflow-hidden hidden transition-[height] duration-300"
                                                            aria-labelledby="faq-ten">
                                                            <div className="p-5">
                                                                <p className="text-defaulttextcolor dark:text-defaulttextcolor/70 ">
                                                                    <strong>This is the first item's accordion body.</strong> It is shown by
                                                                    default, until the collapse plugin adds the appropriate classes that we
                                                                    use to style each element. These classes control the overall appearance,
                                                                    as well as the showing and hiding via CSS transitions. You can modify
                                                                    any of this with custom CSS or overriding our default variables. It's
                                                                    also worth noting that just about any HTML can go within the
                                                                    <code>.accordion-body</code>, though the transition does limit overflow.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                    )}
                    {!HIDE_EXTRA_LANDING_SECTIONS && (
                    <section className="section landing-section-contact text-defaulttextcolor dark:text-defaulttextcolor/70 text-[0.813rem]" id="contact">
                        <div className="container-xl px-3 text-center">
                            <p className="text-[0.75rem] font-semibold text-success mb-1"><span className="landing-section-heading">CONTACT US</span></p>
                            <h3 className="font-semibold mb-2">Have any questions ? We would love to hear from you.</h3>
                            <div className="grid grid-cols-12 justify-center">
                                <div className="col-span-12">
                                    <p className="text-[#8c9097] dark:text-white/50 text-[0.9375rem] mb-12 font-normal">You can contact us anytime regarding any queries or deals,dont hesitate to clear your doubts before trying our product.</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-12 gap-6 text-start">
                                <div className="xxl:col-span-6 xl:col-span-6 lg:col-span-6 md:col-span-12 sm:col-spam-12 col-span-12">
                                    <div className="box border dark:border-defaultborder/10 shadow-none">
                                        <div className="box-body !p-0">
                                            <iframe title="map" src="https://www.google.com/maps/embed?pb=!1m26!1m12!1m3!1d30444.274596168965!2d78.54114692513858!3d17.48198883339408!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!4m11!3e6!4m3!3m2!1d17.4886524!2d78.5495041!4m5!1s0x3bcb9c7ec139a15d%3A0x326d1c90786b2ab6!2sspruko%20technologies!3m2!1d17.474805099999998!2d78.570258!5e0!3m2!1sen!2sin!4v1670225507254!5m2!1sen!2sin" height="365" loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
                                        </div>
                                    </div>
                                </div>
                                <div className="xxl:col-span-6 xl:col-span-6 lg:col-span-6 md:col-span-12 sm:col-span-12 col-span-12">
                                    <div className="box  overflow-hidden !bg-[#f2f6fa] dark:!bg-bodybg border dark:border-defaultborder/10 shadow-none">
                                        <div className="box-body">
                                            <div className="grid grid-cols-12 gap-4 mt-2 px-4">
                                                <div className="xl:col-span-6 col-span-12">
                                                    <div className="grid grid-cols-12 gap-4">
                                                        <div className="xl:col-span-12 col-span-12">
                                                            <label htmlFor="contact-address-name" className="form-label ">Full Name :</label>
                                                            <input type="text" className="form-control w-full !rounded-md" id="contact-address-name" placeholder="Enter Name" />
                                                        </div>
                                                        <div className="xl:col-span-12 col-span-12">
                                                            <label htmlFor="contact-address-phone" className="form-label ">Phone No :</label>
                                                            <input type="text" className="form-control w-full !rounded-md" id="contact-address-phone" placeholder="Enter Phone No" />
                                                        </div>
                                                        <div className="xl:col-span-12 col-span-12">
                                                            <label htmlFor="contact-address-address" className="form-label ">Address :</label>
                                                            <textarea className="form-control w-full !rounded-md" id="contact-address-address" rows={1}></textarea>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="xl:col-span-6 col-span-12">
                                                    <label htmlFor="contact-address-message" className="form-label ">Message :</label>
                                                    <textarea className="form-control w-full !rounded-md" id="contact-address-message" rows={8}></textarea>
                                                </div>
                                                <div className="xl:col-span-12 col-span-12">
                                                    <div className="flex  mt-6 ">
                                                        <div className="">
                                                            <div className="btn-list">
                                                                <button aria-label="button" type="button" className="ti-btn ti-btn-icon ti-btn-primary me-[0.375rem]">
                                                                    <i className="ri-facebook-line font-bold"></i>
                                                                </button>
                                                                <button aria-label="button" type="button" className="ti-btn ti-btn-icon ti-btn-primary me-[0.375rem]">
                                                                    <i className="ri-twitter-x-line font-bold"></i>
                                                                </button>
                                                                <button aria-label="button" type="button" className="ti-btn ti-btn-icon ti-btn-primary">
                                                                    <i className="ri-instagram-line font-bold"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="ms-auto">
                                                            <button type="button" className="ti-btn bg-primary  text-white !font-medium">Send Message</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                    )}
                    <section className="section landing-footer text-white text-[0.813rem] opacity-[0.87]">
                        <div className="container-xl landing-footer-container px-4 sm:px-5 lg:px-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 py-4">
                                <div className="lg:col-span-1 sm:col-span-2">
                                    <div className="footer-block">
                                        <p className="font-semibold mb-3"><Link aria-label="anchor" href="/"><img src="../../../assets/images/brand-logos/desktop-dark.png" alt="Betsurezone" className="logo-desktop max-w-[220px] w-full h-auto" /></Link></p>
                                        <p className="mb-2 opacity-[0.6] font-normal text-[0.8125rem]">{t('landing_footerDesc1')}</p>
                                        <p className="mb-0 opacity-[0.6] font-normal text-[0.8125rem]">{t('landing_footerDesc2')}</p>
                                    </div>
                                </div>
                                <div>
                                    <h6 className="font-semibold text-[1rem] mb-3">{t('landing_footerService')}</h6>
                                    <ul className="list-unstyled opacity-[0.6] font-normal landing-footer-list space-y-2">
                                        <li><Link href="/valuebet" className="text-white hover:opacity-100">{t('landing_footerValueBet')}</Link></li>
                                        <li><Link href="/surebet" className="text-white hover:opacity-100">{t('landing_footerSureBet')}</Link></li>
                                        <li><Link href="/#about" className="text-white hover:opacity-100">{t('landing_footerAbout')}</Link></li>
                                        <li><Link href="/#pricing" className="text-white hover:opacity-100">{t('landing_footerPricing')}</Link></li>
                                        <li><Link href="/login" className="text-white hover:opacity-100">{t('landing_footerLogin')}</Link></li>
                                    </ul>
                                </div>
                                <div>
                                    <h6 className="font-semibold text-[1rem] mb-3">{t('landing_footerInfo')}</h6>
                                    <ul className="list-unstyled opacity-[0.6] font-normal landing-footer-list space-y-2">
                                        <li><Link href="/#about" className="text-white hover:opacity-100">{t('landing_about')}</Link></li>
                                        <li><Link href="/#pricing" className="text-white hover:opacity-100">{t('landing_pricing')}</Link></li>
                                        <li><Link href="/" className="text-white hover:opacity-100">{t('landing_home')}</Link></li>
                                    </ul>
                                </div>
                                <div>
                                    <h6 className="font-semibold text-[1rem] mb-3">{t('landing_footerContact')}</h6>
                                    <ul className="list-unstyled font-normal landing-footer-list space-y-1 mb-0">
                                        <li><span className="text-white opacity-[0.6]"><i className="ri-global-line me-1 align-middle"></i> api.betsurezone.com</span></li>
                                        <li><a href="mailto:support@betsurezone.com" className="text-white opacity-[0.6] hover:opacity-100"><i className="ri-mail-line me-1 align-middle"></i> support@betsurezone.com</a></li>
                                        <li className="mb-3"><span className="text-white opacity-[0.6] text-[0.75rem]">{t('landing_footerTagline')}</span></li>
                                        <li>
                                            <p className="mb-2 font-semibold opacity-90 text-[0.875rem]">{t('landing_followUs')}</p>
                                            <div className="flex flex-wrap gap-2">
                                                <a href="https://t.me/betsurezone" target="_blank" rel="noopener noreferrer" className="ti-btn ti-btn-sm ti-btn-icon ti-btn-primary !rounded-full" aria-label="Telegram"><i className="ri-telegram-line text-[1.125rem]"></i></a>
                                                <a href="https://twitter.com/betsurezone" target="_blank" rel="noopener noreferrer" className="ti-btn ti-btn-sm ti-btn-icon ti-btn-secondary !rounded-full" aria-label="Twitter/X"><i className="ri-twitter-x-line text-[1.125rem]"></i></a>
                                                <a href="https://discord.gg/betsurezone" target="_blank" rel="noopener noreferrer" className="ti-btn ti-btn-sm ti-btn-icon !rounded-full !bg-[#5865F2] !border-[#5865F2] hover:!opacity-90 text-white" aria-label="Discord"><i className="ri-discord-line text-[1.125rem]"></i></a>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>
                    <div className="text-center landing-main-footer py-4 opacity-[0.87] landing-footer-container px-4 sm:px-5 lg:px-4">
                        <span className="text-[#8c9097] dark:text-white/50 text-[0.9375rem]"> {t('landing_copyright')} 2026<span id="year"></span> <Link
                            href="/" className="!text-primary font-semibold">Betsurezone</Link>. {t('landing_allRightsReserved')}
                        </span>
                    </div>
                </div>
                </div>
            <CryptoSubscriptionModal
                isOpen={cryptoModalOpen}
                onClose={() => { setCryptoModalOpen(false); setCryptoModalPlan(null); }}
                preselectedPlanType={cryptoModalPlan ?? undefined}
                onSuccess={() => { setCurrentUser(null); getCurrentUser().then((me) => setCurrentUser(me ?? null)); }}
            />
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </Fragment>
    )
}

Landing.layout = "Landinglayout"

const mapStateToProps = (state: any) => ({
    local_varaiable: state
});

export default connect(mapStateToProps, { ThemeChanger })(Landing);
