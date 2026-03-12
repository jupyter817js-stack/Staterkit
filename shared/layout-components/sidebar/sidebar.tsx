'use client';

import React, { Fragment, useState, useEffect, useMemo, useCallback } from "react";
import { connect } from "react-redux";
import MenuItems from "./nav";
import { ThemeChanger } from "../../redux/action";
import { useRouter } from "next/router";
import Link from "next/link";
import { basePath } from "@/next.config";
import store from "@/shared/redux/store";
import SimpleBar from 'simplebar-react';
import Menuloop from "./menuloop";
import { getCurrentUser } from "@/shared/api/users";
import type { CurrentUser } from "@/shared/types/users";
import { useRefreshUserOnSubscriptionUpdate } from "@/shared/hooks/useRefreshUserOnSubscriptionUpdate";
import { USER_LEVEL } from "@/shared/types/users";
import { useLanguage } from "@/shared/i18n/LanguageContext";
import { useBetsCount } from "@/shared/contexts/BetsCountContext";

const BADGE_CLASS = "badge !py-[0.25rem] !px-[0.45rem] !text-[0.75em] ms-2";

function cloneMenuForBadges(items: any[]): any[] {
	return items.map((item: any) => ({
		...item,
		children: item.children?.map((ch: any) => ({ ...ch })),
	}));
}

const Sidebar = ({ local_varaiable, ThemeChanger }: any) => {
	const { t } = useLanguage();
	const { valuebetCount, surebetCount } = useBetsCount();
	const [menuitems, setMenuitems] = useState(() => cloneMenuForBadges(MenuItems));
	const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
	/** 서브메뉴 열림 상태 (visibleMenuItems 기준). 렌더 트리와 토글 트리 불일치 보정용 */
	const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

	useEffect(() => {
		getCurrentUser().then((u) => setCurrentUser(u ?? null));
	}, []);
	useRefreshUserOnSubscriptionUpdate(setCurrentUser);

	const isAdmin = currentUser?.level === USER_LEVEL.SUPER_ADMIN || currentUser?.level === USER_LEVEL.ADMIN;
	const isPartner = currentUser?.level === USER_LEVEL.PARTNER;
	const isStore = currentUser?.level === USER_LEVEL.STORE;
	const isPro = currentUser?.subscription_plan === "PRO" || currentUser?.level === USER_LEVEL.SUPER_ADMIN;

	const filterChild = useCallback((child: any) => {
		if (child.visibleForManagement && (isAdmin || isPartner || isStore)) return true;
		if (child.adminOnly && !isAdmin) return false;
		if (child.partnerOnly && !isPartner && !isAdmin) return false;
		return true;
	}, [isAdmin, isPartner, isStore]);

	const visibleMenuItems = useMemo(() => {
		return menuitems.filter((item: any) => {
			if (item.adminOnly && !isAdmin) return false;
			if (item.adminOrPartnerOrStoreOnly && !isAdmin && !isPartner && !isStore) return false;
			if (item.partnerOnly && !isPartner && !isAdmin) return false;
			if (item.proOnly && !isPro) return false;
			return true;
		}).map((item: any) => {
			if (item.children) {
				const filteredChildren = item.children.filter(filterChild);
				return { ...item, children: filteredChildren };
			}
			return item;
		}).filter((item: any) => !item.children || item.children.length > 0);
	}, [menuitems, isAdmin, isPartner, isStore, isPro, filterChild]);

	useEffect(() => {
		setMenuitems((prev: any[]) => {
			const next = prev.map((item: any) => {
				if (item.titleKey !== "bets" || !item.children) return item;
				return {
					...item,
					children: item.children.map((ch: any) => {
						if (ch.path === "/valuebet") return { ...ch, badgetxt: String(valuebetCount), class: `!bg-primary/10 !text-primary ${BADGE_CLASS}` };
						if (ch.path === "/surebet") return { ...ch, badgetxt: String(surebetCount), class: `!bg-success/10 !text-success ${BADGE_CLASS}` };
						return ch;
					}),
				};
			});
			return next;
		});
	}, [valuebetCount, surebetCount]);

	function closeMenu() {
		const closeMenudata = (items: any) => {
			items?.forEach((item: any) => {
				item.active = false;
				closeMenudata(item.children);
			});
		};
		closeMenudata(menuitems);
		setMenuitems((arr: any) => [...arr]);
	}

	useEffect(() => {
		const mainContent = document.querySelector(".main-content");
		if (window.innerWidth <= 992) {
			if (mainContent) {
				const theme = store.getState();
				ThemeChanger({ ...theme, dataToggled: "close" });
			} else if (typeof document !== "undefined" && document.documentElement.getAttribute("data-nav-layout") === "horizontal") {
				closeMenu();
			}
		}
		if (mainContent) {
			mainContent.addEventListener("click", menuClose);
		}
		window.addEventListener("resize", menuResizeFn);
		return () => {
			if (mainContent) {
				mainContent.removeEventListener("click", menuClose);
			}
			window.removeEventListener("resize", menuResizeFn);
		};
	}, []);

	const location = useRouter();

	function Onhover() {
		const theme = store.getState();
		if ((theme.dataToggled == 'icon-overlay-close' || theme.dataToggled == 'detached-close') && theme.iconOverlay != 'open') {
			ThemeChanger({ ...theme, "iconOverlay": "open" });
		}
	}
	function Outhover() {
		const theme = store.getState();
		if ((theme.dataToggled == 'icon-overlay-close' || theme.dataToggled == 'detached-close') && theme.iconOverlay == 'open') {
			ThemeChanger({ ...theme, "iconOverlay": "" });
		}
	}

	function menuClose() {
		const theme = store.getState();
		if (window.innerWidth <= 992) {
			ThemeChanger({ ...theme, dataToggled: "close" });
		}
		const overlayElement = document.querySelector("#responsive-overlay") as HTMLElement | null;
		if (overlayElement) {
			overlayElement.classList.remove("active");
		}
		if (theme.dataNavLayout == "horizontal" || theme.dataNavStyle == "menu-click" || theme.dataNavStyle == "icon-click") {
			closeMenu();
		}
	}

	const WindowPreSize = typeof window !== 'undefined' ? [window.innerWidth] : [];

	function menuResizeFn() {
		if (typeof window === 'undefined') {
			// Handle the case where window is not available (server-side rendering)
			return;
		}

		WindowPreSize.push(window.innerWidth);
		if (WindowPreSize.length > 2) { WindowPreSize.shift() }

		const theme = store.getState();
		const currentWidth = WindowPreSize[WindowPreSize.length - 1];
		const prevWidth = WindowPreSize[WindowPreSize.length - 2];

		console.log('Current Width:', currentWidth);
		console.log('Previous Width:', prevWidth);
		console.log('Current dataVerticalStyle:', theme.dataVerticalStyle);

		if (WindowPreSize.length > 1) {
			if (currentWidth < 992 && prevWidth >= 992) {
				// less than 992;
				console.log('Width is less than 992');
				ThemeChanger({ ...theme, dataToggled: "close" });
			}

			if (currentWidth >= 992 && prevWidth < 992) {
				// greater than 992
				console.log('Width is greater than or equal to 992');
				console.log('Current dataVerticalStyle:', theme.dataVerticalStyle);
				ThemeChanger({ ...theme, dataToggled: theme.dataVerticalStyle === "doublemenu" ? "double-menu-open" : "" });
			}
		}
	}

	function switcherArrowFn(): void {

		// Used to remove is-expanded class and remove class on clicking arrow buttons
		function slideClick(): void {
			const slide = document.querySelectorAll<HTMLElement>(".slide");
			const slideMenu = document.querySelectorAll<HTMLElement>(".slide-menu");

			slide.forEach((element) => {
				if (element.classList.contains("is-expanded")) {
					element.classList.remove("is-expanded");
				}
			});

			slideMenu.forEach((element) => {
				if (element.classList.contains("open")) {
					element.classList.remove("open");
					element.style.display = "none";
				}
			});
		}

		slideClick();
	}

	function slideRight(): void {
		const menuNav = document.querySelector<HTMLElement>(".main-menu");
		const mainContainer1 = document.querySelector<HTMLElement>(".main-sidebar");

		if (menuNav && mainContainer1) {
			const marginLeftValue = Math.ceil(
				Number(window.getComputedStyle(menuNav).marginInlineStart.split("px")[0])
			);
			const marginRightValue = Math.ceil(
				Number(window.getComputedStyle(menuNav).marginInlineEnd.split("px")[0])
			);
			const check = menuNav.scrollWidth - mainContainer1.offsetWidth;
			let mainContainer1Width = mainContainer1.offsetWidth;

			if (menuNav.scrollWidth > mainContainer1.offsetWidth) {
				if (!(local_varaiable.dataVerticalStyle.dir === "rtl")) {
					if (Math.abs(check) > Math.abs(marginLeftValue)) {
						menuNav.style.marginInlineEnd = "0";

						if (!(Math.abs(check) > Math.abs(marginLeftValue) + mainContainer1Width)) {
							mainContainer1Width = Math.abs(check) - Math.abs(marginLeftValue);
							const slideRightButton = document.querySelector<HTMLElement>("#slide-right");
							if (slideRightButton) {
								slideRightButton.classList.add("hidden");
							}
						}

						menuNav.style.marginInlineStart =
							(Number(menuNav.style.marginInlineStart.split("px")[0]) -
								Math.abs(mainContainer1Width)) +
							"px";

						const slideRightButton = document.querySelector<HTMLElement>("#slide-right");
						if (slideRightButton) {
							slideRightButton.classList.remove("hidden");
						}
					}
				} else {
					if (Math.abs(check) > Math.abs(marginRightValue)) {
						menuNav.style.marginInlineEnd = "0";

						if (!(Math.abs(check) > Math.abs(marginRightValue) + mainContainer1Width)) {
							mainContainer1Width = Math.abs(check) - Math.abs(marginRightValue);
							const slideRightButton = document.querySelector<HTMLElement>("#slide-right");
							if (slideRightButton) {
								slideRightButton.classList.add("hidden");
							}
						}

						menuNav.style.marginInlineStart =
							(Number(menuNav.style.marginInlineStart.split("px")[0]) -
								Math.abs(mainContainer1Width)) +
							"px";

						const slideLeftButton = document.querySelector<HTMLElement>("#slide-left");
						if (slideLeftButton) {
							slideLeftButton.classList.remove("hidden");
						}
					}
				}
			}

			const element = document.querySelector<HTMLElement>(".main-menu > .slide.open");
			const element1 = document.querySelector<HTMLElement>(".main-menu > .slide.open > ul");
			if (element) {
				element.classList.remove("active");
			}
			if (element1) {
				element1.style.display = "none";
			}
		}

		switcherArrowFn();
	}

	function slideLeft(): void {
		const menuNav = document.querySelector<HTMLElement>(".main-menu");
		const mainContainer1 = document.querySelector<HTMLElement>(".main-sidebar");

		if (menuNav && mainContainer1) {
			const marginLeftValue = Math.ceil(
				Number(window.getComputedStyle(menuNav).marginInlineStart.split("px")[0])
			);
			const marginRightValue = Math.ceil(
				Number(window.getComputedStyle(menuNav).marginInlineEnd.split("px")[0])
			);
			const check = menuNav.scrollWidth - mainContainer1.offsetWidth;
			let mainContainer1Width = mainContainer1.offsetWidth;

			if (menuNav.scrollWidth > mainContainer1.offsetWidth) {
				if (!(local_varaiable.dataVerticalStyle.dir === "rtl")) {
					if (Math.abs(check) <= Math.abs(marginLeftValue)) {
						menuNav.style.marginInlineStart = "0px";
					}
				} else {
					if (Math.abs(check) > Math.abs(marginRightValue)) {
						menuNav.style.marginInlineStart = "0";

						if (!(Math.abs(check) > Math.abs(marginRightValue) + mainContainer1Width)) {
							mainContainer1Width = Math.abs(check) - Math.abs(marginRightValue);
							const slideRightButton = document.querySelector<HTMLElement>("#slide-right");
							if (slideRightButton) {
								slideRightButton.classList.add("hidden");
							}
						}

						menuNav.style.marginInlineStart =
							(Number(menuNav.style.marginInlineStart.split("px")[0]) -
								Math.abs(mainContainer1Width)) +
							"px";

						const slideLeftButton = document.querySelector<HTMLElement>("#slide-left");
						if (slideLeftButton) {
							slideLeftButton.classList.remove("hidden");
						}
					}
				}
			}

			const element = document.querySelector<HTMLElement>(".main-menu > .slide.open");
			const element1 = document.querySelector<HTMLElement>(".main-menu > .slide.open > ul");
			if (element) {
				element.classList.remove("active");
			}
			if (element1) {
				element1.style.display = "none";
			}
		}

		switcherArrowFn();
	}

	const Topup = () => {
		if (typeof window !== 'undefined') {
			if (window.scrollY > 30 && document.querySelector(".app-sidebar")) {
				const Scolls = document.querySelectorAll(".app-sidebar");
				Scolls.forEach((e) => {
					e.classList.add("sticky-pin");
				});
			} else {
				const Scolls = document.querySelectorAll(".app-sidebar");
				Scolls.forEach((e) => {
					e.classList.remove("sticky-pin");
				});
			}
		}
	};
	if (typeof window !== 'undefined') {
		window.addEventListener("scroll", Topup);
	}


	const level = 0;
	let hasParent = false;
	let hasParentLevel = 0;

	function setSubmenu(event: any, targetObject: any, MenuItems = menuitems) {
		const theme = store.getState();
		// if ((window.screen.availWidth <= 992 || theme.dataNavStyle != "icon-hover") && (window.screen.availWidth <= 992 || theme.dataNavStyle != "menu-hover")) {
		if (!event?.ctrlKey) {
			for (const item of MenuItems) {
				if (item === targetObject) {
					item.active = true;
					item.selected = true;
					// setMenuAncestorsActive(MENUITEMS,item);
					setMenuAncestorsActive(item);
				} else if (!item.active && !item.selected) {
					item.active = false; // Set active to false for items not matching the target
					item.selected = false; // Set active to false for items not matching the target
				} else {
					// removeActiveOtherMenus(MENUITEMS,item);
					removeActiveOtherMenus(item);
				}
				if (item.children && item.children.length > 0) {
					setSubmenu(event, targetObject, item.children);
				}
			}

			//   }
		}

		setMenuitems((arr: any) => [...arr]);
	}

	function getParentObject(obj: any, childObject: any) {
		for (const key in obj) {
			if (obj.hasOwnProperty(key)) {
				if (typeof obj[key] === 'object' && JSON.stringify(obj[key]) === JSON.stringify(childObject)) {
					return obj; // Return the parent object
				}
				if (typeof obj[key] === 'object') {
					const parentObject: any = getParentObject(obj[key], childObject);
					if (parentObject !== null) {
						return parentObject;
					}
				}
			}
		}
		return null; // Object not found
	}

	function setMenuAncestorsActive(targetObject: any) {
		const parent = getParentObject(menuitems, targetObject);
		const theme = store.getState();
		if (parent) {
			if (hasParentLevel > 2) {
				hasParent = true;
			}
			parent.active = true;
			parent.selected = true;
			hasParentLevel += 1;
			setMenuAncestorsActive(parent);
		}
		else if (!hasParent) {
			if (theme.dataVerticalStyle == 'doublemenu') {
				ThemeChanger({ ...theme, dataToggled: "double-menu-close" });
			}
		}
	}

	function removeActiveOtherMenus(item: any) {
		if (item) {
			if (Array.isArray(item)) {
				for (const val of item) {
					val.active = false;
					val.selected = false;
				}
			}
			item.active = false;
			item.selected = false;

			if (item.children && item.children.length > 0) {
				removeActiveOtherMenus(item.children);
			}
		}
		else {

		}
	}

	function setMenuUsingUrl(currentPath: any) {
		hasParent = false;
		hasParentLevel = 1;
		// Check current url and trigger the setSidemenu method to active the menu.
		const setSubmenuRecursively = (items: any) => {

			items?.forEach((item: any) => {
				if (item.path == '') { }
				else if (item.path === currentPath) {
					setSubmenu(null, item);
				}
				setSubmenuRecursively(item.children);
			});
		};
		setSubmenuRecursively(menuitems);
	}
	const [previousUrl, setPreviousUrl] = useState("/");

	/** 현재 URL에 해당하는 메뉴의 부모들 titleKey를 expandedKeys에 넣어 서브메뉴가 열리게 함 */
	useEffect(() => {
		const currentPath = location.pathname.endsWith("/") ? location.pathname.slice(0, -1) : location.pathname;
		const keysToOpen: string[] = [];
		const collectAncestorKeys = (items: any[], ancestors: string[]): void => {
			items?.forEach((item: any) => {
				if (item.path && (item.path === currentPath || item.path + "/" === currentPath)) {
					keysToOpen.push(...ancestors);
				}
				if (item.children?.length && item.titleKey != null) {
					collectAncestorKeys(item.children, [...ancestors, item.titleKey]);
				}
			});
		};
		collectAncestorKeys(visibleMenuItems, []);
		setExpandedKeys((prev) => {
			const next = new Set(prev);
			keysToOpen.forEach((k) => next.add(k));
			return next;
		});
	}, [location.pathname, visibleMenuItems]);

	useEffect(() => {

		// Select the target element
		const targetElement = document.documentElement;

		// Create a MutationObserver instance
		const observer = new MutationObserver(handleAttributeChange);

		// Configure the observer to watch for attribute changes
		const config = { attributes: true };

		// Start observing the target element
		observer.observe(targetElement, config);
		let currentPath = location.pathname.endsWith("/") ? location.pathname.slice(0, -1) : location.pathname;
		if (currentPath !== previousUrl) {
			setMenuUsingUrl(currentPath);
			setPreviousUrl(currentPath);
		}
	}, [location]);

	function toggleSidemenu(event: any, targetObject: any, MenuItems = menuitems, state?: any) {
		const theme = store.getState();
		let element = event.target;
		if ((theme.dataNavStyle != "icon-hover" && theme.dataNavStyle != "menu-hover") || (window.innerWidth < 992) || (theme.dataNavLayout != "horizontal") && (theme.dataToggled != "icon-hover-closed" && theme.dataToggled != "menu-hover-closed")) {
			// {
			for (const item of MenuItems) {
				if (item === targetObject) {
					if (theme.dataVerticalStyle == 'doublemenu' && item.active) { return; }
					item.active = !item.active;

					if (item.active) {
						closeOtherMenus(MenuItems, item);
					} else {
						if (theme.dataVerticalStyle == 'doublemenu') {
							ThemeChanger({ ...theme, toggled: "double-menu-close" });
						}
					}
					setAncestorsActive(MenuItems, item);

				}
				else if (!item.active) {
					if (theme.dataVerticalStyle != 'doublemenu') {
						item.active = false; // Set active to false for items not matching the target
					}
				}
				if (item.children && item.children.length > 0) {
					toggleSidemenu(event, targetObject, item.children);
				}
			}
			if (targetObject?.children && targetObject.active) {
				if (theme.dataVerticalStyle == 'doublemenu' && theme.dataToggled != 'double-menu-open') {
					ThemeChanger({ ...theme, toggled: "double-menu-open" });
				}
			}
			if (element && theme.dataNavLayout == 'horizontal' && (theme.dataNavStyle == 'menu-click' || theme.dataNavStyle == 'icon-click')) {
				const listItem = element.closest("li");
				if (listItem) {
					// Find the first sibling <ul> element
					const siblingUL = listItem.querySelector("ul");
					let outterUlWidth = 0;
					let listItemUL = listItem.closest('ul:not(.main-menu)');
					while (listItemUL) {
						listItemUL = listItemUL.parentElement.closest('ul:not(.main-menu)');
						if (listItemUL) {
							outterUlWidth += listItemUL.clientWidth;
						}
					}
					if (siblingUL) {
						// You've found the sibling <ul> element
						let siblingULRect = listItem.getBoundingClientRect();
						if (theme.dir == 'rtl') {
							if ((siblingULRect.left - siblingULRect.width - outterUlWidth + 150 < 0 && outterUlWidth < window.innerWidth) && (outterUlWidth + siblingULRect.width + siblingULRect.width < window.innerWidth)) {
								targetObject.dirchange = true;
							} else {
								targetObject.dirchange = false;
							}
						} else {
							if ((outterUlWidth + siblingULRect.right + siblingULRect.width + 50 > window.innerWidth && siblingULRect.right >= 0) && (outterUlWidth + siblingULRect.width + siblingULRect.width < window.innerWidth)) {
								targetObject.dirchange = true;
							} else {
								targetObject.dirchange = false;
							}
						}
					}
				}
			}
		}
		setMenuitems((arr: any) => [...arr]);
	}

	function setAncestorsActive(MenuItems: any, targetObject: any) {
		const theme = store.getState();
		const parent = findParent(MenuItems, targetObject);
		if (parent) {
			parent.active = true;
			if (parent.active) {
				ThemeChanger({ ...theme, dataToggled: "double-menu-open" });
			}

			setAncestorsActive(MenuItems, parent);
		}
		// else {
		// 	if (theme.dataVerticalStyle == "doublemenu") {
		// 		ThemeChanger({ ...theme, dataToggled: "double-menu-close" });
		// 	}
		// }
	}
	function closeOtherMenus(MenuItems: any, targetObject: any) {
		for (const item of MenuItems) {
			if (item !== targetObject) {
				item.active = false;
				if (item.children && item.children.length > 0) {
					closeOtherMenus(item.children, targetObject);
				}
			}
		}
	}
	function findParent(MenuItems: any, targetObject: any) {
		for (const item of MenuItems) {
			if (item.children && item.children.includes(targetObject)) {
				return item;
			}
			if (item.children && item.children.length > 0) {
				const parent: any = findParent(MenuItems = item.children, targetObject);
				if (parent) {
					return parent;
				}
			}
		}
		return null;
	}

	const Sideclick = () => {
		if (window.innerWidth > 992) {
			let html = document.documentElement;
			if (html.getAttribute('icon-overlay') != 'open') {
				html.setAttribute('icon-overlay', 'open');
			}
		}
	};

	function HoverToggleInnerMenuFn(event: any, item: any) {
		const theme = store.getState();
		let element = event.target;
		if (element && theme.dataNavLayout == "horizontal" && (theme.dataNavStyle == "menu-hover" || theme.dataNavStyle == "icon-hover")) {
			const listItem = element.closest("li");
			if (listItem) {
				// Find the first sibling <ul> element
				const siblingUL = listItem.querySelector("ul");
				let outterUlWidth = 0;
				let listItemUL = listItem.closest("ul:not(.main-menu)");
				while (listItemUL) {
					listItemUL = listItemUL.parentElement.closest("ul:not(.main-menu)");
					if (listItemUL) {
						outterUlWidth += listItemUL.clientWidth;
					}
				}
				if (siblingUL) {
					// You've found the sibling <ul> element
					let siblingULRect = listItem.getBoundingClientRect();
					if (theme.dir == "rtl") {
						if ((siblingULRect.left - siblingULRect.width - outterUlWidth + 150 < 0 && outterUlWidth < window.innerWidth) && (outterUlWidth + siblingULRect.width + siblingULRect.width < window.innerWidth)) {
							item.dirchange = true;
						} else {
							item.dirchange = false;
						}
					} else {
						if ((outterUlWidth + siblingULRect.right + siblingULRect.width + 50 > window.innerWidth && siblingULRect.right >= 0) && (outterUlWidth + siblingULRect.width + siblingULRect.width < window.innerWidth)) {
							item.dirchange = true;
						} else {
							item.dirchange = false;
						}
					}
				}
			}
		}
	}

	function handleAttributeChange(mutationsList: any) {
		for (const mutation of mutationsList) {
			if (mutation.type === 'attributes' && mutation.attributeName === 'data-nav-layout') {
				const newValue = mutation.target.getAttribute('data-nav-layout');
				if (newValue == 'vertical') {
					let currentPath = location.pathname.endsWith('/') ? location.pathname.slice(0, -1) : location.pathname;
					currentPath = !currentPath ? '/dashboard/ecommerce' : currentPath;
					setMenuUsingUrl(currentPath);
				} else {
					closeMenu();
				}
			}
		}
	}
	return (

		<Fragment>
			<div id="responsive-overlay"
				onClick={() => { menuClose(); }}> </div>
			<aside className="app-sidebar" id="sidebar" onMouseOver={() => Onhover()}
				onMouseLeave={() => Outhover()}>
				<div className="main-sidebar-header">
					{location.pathname === "/" ? (
						<Link href="/" className="header-logo">
							<img src={`${process.env.NODE_ENV === "production" ? basePath : ""}/assets/images/brand-logos/desktop-logo.png`} alt="logo" className="main-logo desktop-logo" />
							<img src={`${process.env.NODE_ENV === "production" ? basePath : ""}/assets/images/brand-logos/toggle-logo.png`} alt="logo" className="main-logo toggle-logo" />
							<img src={`${process.env.NODE_ENV === "production" ? basePath : ""}/assets/images/brand-logos/desktop-dark.png`} alt="logo" className="main-logo desktop-dark" />
							<img src={`${process.env.NODE_ENV === "production" ? basePath : ""}/assets/images/brand-logos/toggle-dark.png`} alt="logo" className="main-logo toggle-dark" />
							<img src={`${process.env.NODE_ENV === "production" ? basePath : ""}/assets/images/brand-logos/desktop-white.png`} alt="logo" className="main-logo desktop-white" />
							<img src={`${process.env.NODE_ENV === "production" ? basePath : ""}/assets/images/brand-logos/toggle-white.png`} alt="logo" className="main-logo toggle-white" />
						</Link>
					) : (
						<a href="/" className="header-logo">
							<img src={`${process.env.NODE_ENV === "production" ? basePath : ""}/assets/images/brand-logos/desktop-logo.png`} alt="logo" className="main-logo desktop-logo" />
							<img src={`${process.env.NODE_ENV === "production" ? basePath : ""}/assets/images/brand-logos/toggle-logo.png`} alt="logo" className="main-logo toggle-logo" />
							<img src={`${process.env.NODE_ENV === "production" ? basePath : ""}/assets/images/brand-logos/desktop-dark.png`} alt="logo" className="main-logo desktop-dark" />
							<img src={`${process.env.NODE_ENV === "production" ? basePath : ""}/assets/images/brand-logos/toggle-dark.png`} alt="logo" className="main-logo toggle-dark" />
							<img src={`${process.env.NODE_ENV === "production" ? basePath : ""}/assets/images/brand-logos/desktop-white.png`} alt="logo" className="main-logo desktop-white" />
							<img src={`${process.env.NODE_ENV === "production" ? basePath : ""}/assets/images/brand-logos/toggle-white.png`} alt="logo" className="main-logo toggle-white" />
						</a>
					)}
				</div>

				<div className="main-sidebar " id="sidebar-scroll">
					<SimpleBar >
						<nav className="main-menu-container nav nav-pills flex-column sub-open">
							<div className="slide-left" id="slide-left" onClick={() => { slideLeft(); }}><svg xmlns="http://www.w3.org/2000/svg" fill="#7b8191" width="24"
								height="24" viewBox="0 0 24 24">
								<path d="M13.293 6.293 7.586 12l5.707 5.707 1.414-1.414L10.414 12l4.293-4.293z"></path>
							</svg></div>

							<ul className="main-menu" onClick={() => Sideclick()}>
								{visibleMenuItems.map((levelone: any) => (
									<Fragment key={Math.random()}>
										<li className={`${(levelone.menutitle || levelone.menutitleKey) ? 'slide__category' : ''} ${levelone.type === 'link' ? 'slide' : ''}
                       ${levelone.type === 'sub' ? 'slide has-sub' : ''} ${(levelone?.active || (levelone?.titleKey && expandedKeys.has(levelone.titleKey))) ? 'open' : ''} ${levelone?.selected ? 'active' : ''}`}>
											{(levelone.menutitle || levelone.menutitleKey) ?
												<span className='category-name'>
													{levelone.menutitleKey ? t(levelone.menutitleKey) : levelone.menutitle}
												</span>
												: ""}
											{levelone.type === "link" ?
												levelone.path.includes("#") ? (
													<a href={levelone.path} className={`side-menu__item ${levelone.selected ? 'active' : ''}`}>{levelone.icon}
														<span className="side-menu__label">{levelone.titleKey ? t(levelone.titleKey) : levelone.title} {levelone.badgetxt ? (<span className={levelone.class}> {levelone.badgetxt}</span>) : ""}</span>
													</a>
												) : (
													<Link href={levelone.path + "/"} className={`side-menu__item ${levelone.selected ? 'active' : ''}`}>{levelone.icon}
														<span className="side-menu__label">{levelone.titleKey ? t(levelone.titleKey) : levelone.title} {levelone.badgetxt ? (<span className={levelone.class}> {levelone.badgetxt}</span>) : ""}</span>
													</Link>
												)
												: ""}
											{levelone.type === "empty" ?
												<Link href="#" className='side-menu__item'>{levelone.icon}<span className=""> {levelone.title} {levelone.badgetxt ? (
													<span className={levelone.class}>{levelone.badgetxt} </span>
												) : (
													""
												)}
												</span>
												</Link>
												: ""}
											{levelone.type === "sub" ?
												<Menuloop
													MenuItems={levelone}
													level={level + 1}
													toggleSidemenu={toggleSidemenu}
													HoverToggleInnerMenuFn={HoverToggleInnerMenuFn}
													t={t}
													expandedKeys={expandedKeys}
													setExpandedKeys={setExpandedKeys}
												/>
												: ''}
										</li>
									</Fragment>
								))}
							</ul>

							<div className="slide-right" onClick={() => { slideRight(); }} id="slide-right">
								<svg xmlns="http://www.w3.org/2000/svg" fill="#7b8191" width="24" height="24" viewBox="0 0 24 24"><path d="M10.707 17.707 16.414 12l-5.707-5.707-1.414 1.414L13.586 12l-4.293 4.293z"></path></svg>
							</div>
						</nav>
					</SimpleBar>
				</div>
			</aside>
		</Fragment>
	);
};

const mapStateToProps = (state: any) => ({
	local_varaiable: state
});

export default connect(mapStateToProps, { ThemeChanger })(Sidebar);
