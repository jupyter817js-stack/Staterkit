import MenuItems from "@/shared/layout-components/sidebar/nav";
import store from "@/shared/redux/store";
import { ClassAttributes, InputHTMLAttributes, JSX, useState } from "react";

export function Dark(actionfunction:any) {
    const theme :any = store.getState()
    actionfunction({
        ...theme,
        "class": "dark",
        "dataHeaderStyles": "dark",
        "dataMenuStyles": "dark",
        "bodyBg": "",
        "darkBg": "",
        "inputBorder": "",
        "Light": "",
        
    })
    localStorage.setItem("bzdarktheme", "dark");
    localStorage.setItem("bzMenu", "dark");
	localStorage.setItem("bzHeader", "dark");
    localStorage.removeItem("bzlighttheme");
    localStorage.removeItem('bodyBgRGB');
    localStorage.removeItem('darkBgRGB');
}
export function Light(actionfunction:any) {
    const theme = store.getState()
    actionfunction({
        ...theme,
        "class": "light",
        "dataHeaderStyles": "light",
        "bodyBg": "",
        "darkBg": "",
        "inputBorder": "",
        "Light": "",
        "dataMenuStyles": "dark",
        
    })
    localStorage.setItem("bzlighttheme", "light");
    localStorage.removeItem("bzdarktheme");
    localStorage.removeItem("bodyBgRGB");
    localStorage.removeItem("primaryRGB");
    localStorage.removeItem("primaryRGB1");
    localStorage.removeItem("inputBorder");
    localStorage.removeItem("Light");
    localStorage.removeItem("bzMenu");
    localStorage.removeItem("bzHeader");

}

export function Ltr(actionfunction:any) {
    const theme = store.getState()
    actionfunction({
        ...theme, "dir": "ltr",
        
    })
    localStorage.removeItem("bzrtl");
};
export function Rtl(actionfunction:any) {
    const theme = store.getState()
    actionfunction({
        ...theme, "dir": "rtl",
        
    })
    localStorage.setItem("bzrtl", "rtl");
};
export const Vertical = (actionfunction:any) => {
    const theme = store.getState()
    actionfunction({
        ...theme,
        "dataNavLayout": "vertical",
        "dataMenuStyles": "dark",
        "dataVerticalStyle": "overlay",
        "dataToggled": "",
        "dataNavStyle": '',
        
    })
    localStorage.setItem("bzlayout", "vertical");
    localStorage.removeItem("bznavstyles");

};

export const HorizontalClick = (actionfunction:any) => {
    const theme = store.getState()
    setTimeout(() => {
        document.querySelector<HTMLElement>(".main-content")?.click();
    }, 100);
    actionfunction({
        ...theme,
        "dataNavLayout": "horizontal",
        // "dataMenuStyles": localStorage.bzdarktheme ? 'dark' : localStorage.darkBgRGB ? 'dark' : localStorage.bzMenu ? localStorage.bzMenu : "light",
        "dataVerticalStyle": "",
        "dataNavStyle": localStorage.bznavstyles ? localStorage.bznavstyles : "menu-click",
        
    })
    localStorage.setItem("bzlayout", "horizontal");
    localStorage.removeItem("bzverticalstyles");
};
export const Menuclick = (actionfunction:any) => {
    const theme = store.getState()
    actionfunction({
        ...theme,
        "dataNavStyle": "menu-click",
        "dataToggled": "menu-click-closed",
        "dataVerticalStyle": "",
        
    })
    localStorage.setItem("bznavstyles", "menu-click");
    localStorage.removeItem("bzverticalstyles");

};
export const MenuHover = (actionfunction:any) => {
    const theme = store.getState()
    actionfunction({
        ...theme,
        "dataNavStyle": "menu-hover",
        "dataVerticalStyle": "",
        "dataToggled": "menu-hover-closed",
        "horStyle": "",
        
    })
    localStorage.setItem("bznavstyles", "menu-hover");
    localStorage.removeItem("bzverticalstyles");
    closeMenuFn();
};

export const IconClick = (actionfunction:any) => {
    const theme = store.getState()
    actionfunction({
        ...theme,
        "dataVerticalStyle": "",
        "dataNavStyle": "icon-click",
        "dataToggled": "icon-click-closed",
        
    })
    localStorage.setItem("bznavstyles", "icon-click");
    localStorage.removeItem("bzverticalstyles");
    const Sidebar:any = document.querySelector(".main-menu");
    Sidebar.style.marginInline = "0px";
};
function closeMenuFn() {
    const closeMenuRecursively = (items: any) => {

        items?.forEach((item: any) => {
            item.active = false;
            closeMenuRecursively(item.children);
        });
    };
    closeMenuRecursively(MenuItems);
}
export const IconHover = (actionfunction:any) => {

    const theme = store.getState();
    actionfunction({
        ...theme,
        "dataVerticalStyle": "",
        "dataNavStyle": "icon-hover",
        "dataToggled": "icon-hover-closed",
        
    })
    localStorage.setItem("bznavstyles", "icon-hover");
    localStorage.removeItem("bzverticalstyles");
    const Sidebar:any = document.querySelector(".main-menu");
    Sidebar.style.marginInline = "0px";
    closeMenuFn()
};

export const Regular = (actionfunction:any) => {
    const theme = store.getState();
    actionfunction({
        ...theme,
        "dataPageStyle": "regular",
        
    });
    localStorage.setItem("bzregular", "Regular");
    localStorage.removeItem("bzclassic");
    localStorage.removeItem("bzmodern");
};
export const Classic = (actionfunction:any) => {
    const theme = store.getState();
    actionfunction({
        ...theme,
        "dataPageStyle": "classic",
        
    });
    localStorage.setItem("bzclassic", "Classic");
    localStorage.removeItem("bzregular");
    localStorage.removeItem("bzmodern");
};
export const Modern = (actionfunction:any) => {
    const theme = store.getState();
    actionfunction({
        ...theme,
        "dataPageStyle": "modern",
        
    });
    localStorage.setItem("bzmodern", "Modern");
    localStorage.removeItem("bzregular");
    localStorage.removeItem("bzclassic");
};
export function Enable(actionfunction:any) {
    const theme = store.getState();
    actionfunction({
        ...theme,
        "loader": "enable",
        
    });
    localStorage.setItem("bzloaderenable", "enable");
    localStorage.removeItem("bzloaderdisable");
}
export function Disable(actionfunction:any) {
    const theme = store.getState();
    actionfunction({
        ...theme,
        "loader": "disable",
        
    });
    localStorage.setItem("bzloaderdisable", "disable");
    localStorage.removeItem("bzloaderenable");
}

export const Fullwidth = (actionfunction:any) => {
    const theme = store.getState()
    actionfunction({
        ...theme,
        "dataWidth": "fullwidth",
        
    })
    localStorage.setItem("bzfullwidth", "Fullwidth");
    localStorage.removeItem("bzboxed");

};
export const Boxed = (actionfunction:any) => {
    const theme = store.getState()
    actionfunction({
        ...theme,
        "dataWidth": "boxed",
        
    })
    localStorage.setItem("bzboxed", "Boxed");
    localStorage.removeItem("bzfullwidth");
};
export const FixedMenu = (actionfunction:any) => {
    const theme = store.getState()
    actionfunction({
        ...theme,
        "dataMenuPosition": "fixed",
        
    })
    localStorage.setItem("bzmenufixed", "MenuFixed");
    localStorage.removeItem("bzmenuscrollable");
};
export const scrollMenu = (actionfunction:any) => {
    const theme = store.getState()
    actionfunction({
        ...theme,
        "dataMenuPosition": "scrollable",
        
    })
    localStorage.setItem("bzmenuscrollable", "Menuscrolled");
    localStorage.removeItem("bzmenufixed")
};
export const Headerpostionfixed = (actionfunction:any) => {
    const theme = store.getState()
    actionfunction({
        ...theme,
        "dataHeaderPosition": "fixed",
        
    })
    localStorage.setItem("bzheaderfixed", 'FixedHeader');
    localStorage.removeItem("bzheaderscrollable");
};
export const Headerpostionscroll = (actionfunction:any) => {
    const theme = store.getState()
    actionfunction({
        ...theme,
        "dataHeaderPosition": "scrollable",
        
    })
    localStorage.setItem("bzheaderscrollable", "ScrollableHeader");
    localStorage.removeItem("bzheaderfixed");
};

export const Defaultmenu = (actionfunction:any) => {
    const theme = store.getState()
    actionfunction({
        ...theme,
        "dataVerticalStyle": "overlay",
        "dataNavLayout": "vertical",
        "dataToggled": "",
        "dataNavStyle": "",
        
    })
    localStorage.removeItem("bzverticalstyles");
    localStorage.removeItem('bznavstyles')
};

export const Closedmenu = (actionfunction:any) => {
    const theme = store.getState()
    actionfunction({
        ...theme,
        "dataNavLayout": "vertical",
        "dataVerticalStyle": "closed",
        "dataToggled": "close-menu-close",
        
    })
    localStorage.setItem("bzverticalstyles", "closed");
    localStorage.removeItem('bznavstyles')
};
function icontextOpenFn() {
    let html = document.documentElement;
    if (html.getAttribute('data-toggled') === 'icon-text-close') {
        html.setAttribute('icon-text', 'open');
    }
}
function icontextCloseFn() {
    let html = document.documentElement;
    if (html.getAttribute('data-toggled') === 'icon-text-close') {
        html.removeAttribute('icon-text');
    }
}
export const iconText = (actionfunction:any) => {
    const theme = store.getState()
    actionfunction({
        ...theme,
        "dataNavLayout": "vertical",
        "dataVerticalStyle": "icontext",
        "dataToggled": "icon-text-close",
        "dataNavStyle": "",
        
    })
    localStorage.setItem("bzverticalstyles", "icontext");
    const MainContent = document.querySelector(".main-content");
    const appSidebar = document.querySelector('.app-sidebar');
    localStorage.removeItem('bznavstyles')
    appSidebar?.addEventListener("click", () => {
        console.log("clicking");
        icontextOpenFn();
    });
    MainContent?.addEventListener("click", () => {
        icontextCloseFn();
    });
};

export const iconOverayFn = (actionfunction:any) => {
    const theme = store.getState()
    actionfunction({
        ...theme,
        "dataNavLayout": "vertical",
        "dataVerticalStyle": "overlay",
        "dataToggled": "icon-overlay-close",
        
    })
    localStorage.setItem("bzverticalstyles", "overlay");
    localStorage.removeItem('bznavstyles')
    var icon = document.getElementById("switcher-icon-overlay") as HTMLInputElement;
    if(icon){
        icon.checked=true
    }
    const MainContent = document.querySelector(".main-content");
    const appSidebar = document.querySelector('.app-sidebar');
    appSidebar?.addEventListener("click", () => {
        DetachedOpenFn();
    });
    MainContent?.addEventListener("click", () => {
        console.log("detachedclose");
        DetachedCloseFn();
    });
};
function DetachedOpenFn() {
    if (window.innerWidth > 992) {
        let html = document.documentElement;
        if (html.getAttribute('data-toggled') === 'detached-close' || html.getAttribute('data-toggled') === 'icon-overlay-close') {
            html.setAttribute('icon-overlay', 'open');
        }
    }
}
function DetachedCloseFn() {
    if (window.innerWidth > 992) {
        let html = document.documentElement;
        if (html.getAttribute('data-toggled') === 'detached-close' || html.getAttribute('data-toggled') === 'icon-overlay-close') {
            html.removeAttribute('icon-overlay');
        }
    }
}
export const DetachedFn = (actionfunction:any) => {
    const theme = store.getState()
    actionfunction({
        ...theme,
        "dataNavLayout": "vertical",
        "dataVerticalStyle": "detached",
        "dataToggled": "detached-close",
        "dataNavStyle": "",
        
    })
    localStorage.setItem("bzverticalstyles", "detached");
    localStorage.removeItem('bznavstyles')
    const MainContent = document.querySelector(".main-content");
    const appSidebar = document.querySelector('.app-sidebar');

    appSidebar?.addEventListener("click", () => {
        DetachedOpenFn();
    });
    MainContent?.addEventListener("click", () => {
        console.log("detachedclose");
        DetachedCloseFn();
    });
};

export const DoubletFn = (actionfunction:any) => {
    const theme = store.getState()
    actionfunction({
        ...theme,
        "dataNavLayout": "vertical",
        "dataVerticalStyle": "doublemenu",
        "dataToggled": "double-menu-open",
        "dataNavStyle": "",
        
    })
    localStorage.setItem("bzverticalstyles", "doublemenu");
    localStorage.removeItem('bznavstyles')
    setTimeout(() => {
        if (!document.querySelector(".main-menu .has-sub.open")) {
            const theme = store.getState();
            actionfunction(
                {
                    ...theme,
                    "dataToggled": "double-menu-close",
                    
                }
            );
        }
    }, 100);
}

export const colorMenu = (actionfunction:any) => {
    const theme = store.getState()
    actionfunction({
        ...theme,
        "dataMenuStyles": "color",
        
    })
    localStorage.setItem("bzMenu", "color");
    localStorage.removeItem("gradient");

};

export const lightMenu = (actionfunction:any) => {
    const theme = store.getState()
    actionfunction({
        ...theme,
        "dataMenuStyles": "light",
        
    })
    localStorage.setItem("bzMenu", "light");
    localStorage.removeItem("dark");
};

export const darkMenu = (actionfunction:any) => {
    const theme = store.getState()
    actionfunction({
        ...theme,
        "dataMenuStyles": "dark",
        
    })
    localStorage.setItem("bzMenu", "dark");
    localStorage.removeItem("light");
};

export const gradientMenu = (actionfunction:any) => {
    const theme = store.getState()
    actionfunction({
        ...theme,
        "dataMenuStyles": "gradient",
        
    })
    localStorage.setItem("bzMenu", "gradient");
    localStorage.removeItem("color");
};
export const transparentMenu = (actionfunction:any) => {
    const theme = store.getState()
    actionfunction({
        ...theme,
        "dataMenuStyles": "transparent",
        
    })
    localStorage.setItem("bzMenu", "transparent");
    localStorage.removeItem("gradient");
};

export const lightHeader = (actionfunction:any) => {
    const theme = store.getState()
    actionfunction({
        ...theme,
        "dataHeaderStyles": "light",
        
    })
    localStorage.setItem("bzHeader", "light");
    localStorage.removeItem("dark");
};
export const darkHeader = (actionfunction:any) => {
    const theme = store.getState()
    actionfunction({
        ...theme,
        "dataHeaderStyles": "dark",
        
    })
    localStorage.setItem("bzHeader", "dark");
    localStorage.removeItem("light");
};
export const colorHeader = (actionfunction:any) => {
    const theme = store.getState()
    actionfunction({
        ...theme,
        "dataHeaderStyles": "color",
        
    })
    localStorage.removeItem("dark");
    localStorage.setItem("bzHeader", "color");
};
export const gradientHeader = (actionfunction:any) => {
    const theme = store.getState()
    actionfunction({
        ...theme,
        "dataHeaderStyles": "gradient",
        
    })
    localStorage.removeItem("transparent");
    localStorage.setItem("bzHeader", "gradient");
};
export const transparentHeader = (actionfunction:any) => {
    const theme = store.getState()
    actionfunction({
        ...theme,
        "dataHeaderStyles": "transparent",
        
    })
    localStorage.removeItem("gradient");
    localStorage.setItem("bzHeader", "transparent");
};

export const primaryColor1 = (actionfunction:any) => {
    const theme = store.getState();
    actionfunction({
        ...theme,
        "colorPrimaryRgb": "58, 88, 146",
        "colorPrimary": "58 88 146",
        
    });
    localStorage.setItem("primaryRGB", "58, 88, 146");
    localStorage.setItem("primaryRGB1", "58 88 146");
};
export const primaryColor2 = (actionfunction:any) => {
    const theme = store.getState();
    actionfunction({
        ...theme,
        "colorPrimaryRgb": "92, 144, 163",
        "colorPrimary": "92 144 163",
        
    });
    localStorage.setItem("primaryRGB", "92, 144, 163");
    localStorage.setItem("primaryRGB1", "92 144 163");
};
export const primaryColor3 = (actionfunction:any) => {
    const theme = store.getState();
    actionfunction({
        ...theme,
        "colorPrimaryRgb": "161, 90, 223",
        "colorPrimary": "161 90 223",
        
    });
    localStorage.setItem("primaryRGB", "161, 90, 223");
    localStorage.setItem("primaryRGB1", "161 90 223");
};
export const primaryColor4 = (actionfunction:any) => {
    const theme = store.getState();
    actionfunction({
        ...theme,
        "colorPrimaryRgb": "78, 172, 76",
        "colorPrimary": "78 172 76",
        
    });
    localStorage.setItem("primaryRGB", "78, 172, 76");
    localStorage.setItem("primaryRGB1", "78 172 76");
};
export const primaryColor5 = (actionfunction:any) => {
    const theme = store.getState();
    actionfunction({
        ...theme,
        "colorPrimaryRgb": "223, 90, 90",
        "colorPrimary": "223 90 90",
        
    });
    localStorage.setItem("primaryRGB", "223, 90, 90");
    localStorage.setItem("primaryRGB1", "223 90 90");
};

export const backgroundColor1 = (actionfunction:any) => {
    const theme = store.getState();
    actionfunction({
        ...theme,
        "bodyBg": "34 44 110",
        "darkBg": "20 30 96",
        "inputBorder": "25 35 102",
        "Light": "25 35 102",
        "class": "dark",
        "dataMenuStyles": "dark",
        "dataHeaderStyles": "dark",
        
    });
    localStorage.setItem('darkBgRGB', "20 30 96");
    localStorage.setItem('bodyBgRGB', "34 44 110");
    localStorage.setItem('Light', "25 35 102");
    localStorage.setItem('bzMenu', "dark");
    localStorage.setItem('bzHeader', "dark");


};
export const backgroundColor2 = (actionfunction:any) => {
    const theme = store.getState();
    actionfunction({
        ...theme,
        "bodyBg": "22 92 129",
        "Light": "13 83 120",
        "darkBg": "8 78 115",
        "inputBorder": "13 83 120",
        "class": "dark",
        "dataMenuStyles": "dark",
        "dataHeaderStyles": "dark",
        
    });
    localStorage.setItem('darkBgRGB', "8 78 115");
    localStorage.setItem('bodyBgRGB', "22 92 129");
    localStorage.setItem('Light', "13 83 120",);
    localStorage.setItem('bzMenu', "dark");
    localStorage.setItem('bzHeader', "dark");
};
export const backgroundColor3 = (actionfunction:any) => {
    const theme = store.getState();
    actionfunction({
        ...theme,
        "bodyBg": "104 51 149",
        "Light": "95 42 140",
        "darkBg": "90 37 135",
        "inputBorder": "95 42 140",
        "class": "dark",
        "dataMenuStyles": "dark",
        "dataHeaderStyles": "dark",
        
    });
    localStorage.setItem('darkBgRGB', "90 37 135");
    localStorage.setItem('bodyBgRGB', "104 51 149");
    localStorage.setItem('Light', "95 42 140");
    localStorage.setItem('bzMenu', "dark");
    localStorage.setItem('bzHeader', "dark");
};
export const backgroundColor4 = (actionfunction:any) => {
    const theme = store.getState();
    actionfunction({
        ...theme,
        "Light": "29 106 56",
        "bodyBg": "38 115 64",
        "darkBg": "24 101 51",
        "inputBorder": "29 106 56;",
        "class": "dark",
        "dataMenuStyles": "dark",
        "dataHeaderStyles": "dark",
        
    });
    localStorage.setItem('darkBgRGB', "24 101 51");
    localStorage.setItem('bodyBgRGB', "38 115 64");
    localStorage.setItem('Light', "29 106 56");
    localStorage.setItem('bzMenu', "dark");
    localStorage.setItem('bzHeader', "dark");
};
export const backgroundColor5 = (actionfunction:any) => {
    const theme = store.getState();
    actionfunction({
        ...theme,
        "bodyBg": " 134 80 34",
        "Light": "125 71 25",
        "darkBg": "120 66 20",
        "inputBorder": "125 71 25",
        "class": "dark",
        "dataMenuStyles": "dark",
        "dataHeaderStyles": "dark",
        
    });
    localStorage.setItem('darkBgRGB', "120 66 20");
    localStorage.setItem('bodyBgRGB', "134 80 34");
    localStorage.setItem('Light', "125 71 25");
    localStorage.setItem('bzMenu', "dark");
    localStorage.setItem('bzHeader', "dark");
};

const ColorPicker = (props: JSX.IntrinsicAttributes & ClassAttributes<HTMLInputElement> & InputHTMLAttributes<HTMLInputElement>) => {
    return (
        <div className="color-picker-input">
            <input type="color" {...props} />
        </div>
    );
};

function hexToRgb(hex: string) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}
//themeprimarycolor
const Themeprimarycolor = ({ actionfunction }:any) => {
    const theme = store.getState();
    const [state, updateState] = useState("#FFFFFF");
    const handleInput = (e:any) => {
        let { r, g, b }:any = hexToRgb(e.target.value);
        updateState(e.target.value);
        actionfunction({
            ...theme,
            "colorPrimaryRgb": `${r} ${g} ${b}`,
            "colorPrimary": `${r} ${g} ${b}`
        });
        localStorage.setItem("dynamiccolor", `${r} ${g} ${b}`);
    };
    return (
        <div className="Themeprimarycolor theme-container-primary pickr-container-primary">
            <ColorPicker onChange={handleInput} value={state} />
        </div>
    );
};

export default Themeprimarycolor;

//themeBackground
export const Themebackgroundcolor = ({ actionfunction }:any) => {
    const theme = store.getState();
    const [state, updateState] = useState("#FFFFFF");
    const handleInput = (e:any) => {
        let { r, g, b }:any = hexToRgb(e.target.value);
        updateState(e.target.value);
        actionfunction({
            ...theme,
            "bodyBg": `${r + 14} ${g + 14} ${b + 14}`,
            "darkBg": `${r} ${g} ${b}`,
            "inputBorder": `${r + 5} ${g + 5} ${b + 5}`,
            "Light": `${r + 5} ${g + 5} ${b + 5}`,
            "class": "dark",
            "dataHeaderStyles": "dark",
            "dataMenuStyles": "dark",
        });
        localStorage.setItem("bodyBgRGB", `${r + 14} ${g + 14} ${b + 14}`);
        localStorage.setItem('darkBgRGB', `${r} ${g} ${b}`);
        localStorage.setItem('Light', `${r + 5} ${g + 5} ${b + 5}`);
        localStorage.setItem('inputBorder', `${r + 5} ${g + 5} ${b + 5}`);
        localStorage.setItem('bzMenu', "dark");
        localStorage.setItem('bzHeader', "dark");

    };
    return (
        <div className="Themebackgroundcolor">
            <ColorPicker onChange={handleInput} value={state} />
        </div>
    );
};

export const bgImage1 = (actionfunction:any) => {
    const theme = store.getState()
    actionfunction({
        ...theme,
        "bgImg": "bgimg1",
        
    })
    localStorage.setItem("bgimage1", "bgimg1");
};
export const bgImage2 = (actionfunction:any) => {
    const theme = store.getState()
    actionfunction({
        ...theme,
        "bgImg": "bgimg2",
        
    })
    localStorage.setItem("bgimage2", "bgimg2");
};
export const bgImage3 = (actionfunction:any) => {
    const theme = store.getState()
    actionfunction({
        ...theme,
        "bgImg": "bgimg3",
        
    })
    localStorage.setItem("bgimage3", "bgimg3");
};
export const bgImage4 = (actionfunction:any) => {
    const theme = store.getState()
    actionfunction({
        ...theme,
        "bgImg": "bgimg4",
        
    })
    localStorage.setItem("bgimage4", "bgimg4");
};
export const bgImage5 = (actionfunction:any) => {
    const theme = store.getState()
    actionfunction({
        ...theme,
        "bgImg": "bgimg5",
        
    })
    localStorage.setItem("bgimage5", "bgimg5");
};
export const Reset = (actionfunction: any) => {
    const theme = store.getState()
    Vertical(actionfunction)
    actionfunction({
        ...theme,
        lang: "en",
        dir: "ltr",
        class: "light",
        dataMenuStyles: "dark",
        dataNavLayout: "vertical",
        dataHeaderStyles: "light",
        dataVerticalStyle: "overlay",
        dataToggled: "",
        dataNavStyle: "",
        horStyle: "",
        dataPageStyle: "regular",
        dataWidth: "fullwidth",
        dataMenuPosition: "fixed",
        dataHeaderPosition: "fixed",
        iconOverlay: "",
        colorPrimaryRgb: "",
        colorPrimary: "",
        bodyBg: "",
        darkBg: "",
        inputBorder: "",
        Light: "",
        bgImg: "",
        loader: "disable",
        iconText: "",
        body: {
            class: ""
        }
    })
    localStorage.clear();
}

export const LocalStorageBackup = (actionfunction:any) => {
    const storedLang = localStorage.getItem("staterkit_lang");
    if (storedLang === "ko" || storedLang === "en") {
        const theme = store.getState();
        actionfunction({ ...theme, lang: storedLang });
    }
    (localStorage.bzdarktheme) ? Dark(actionfunction) : "";
    (localStorage.bzlighttheme) ? Light(actionfunction) : "";
    (localStorage.bzrtl) ? Rtl(actionfunction) : "";
    (localStorage.bzregular) ? Regular(actionfunction) : "";
    (localStorage.bzclassic) ? Classic(actionfunction) : "";
    (localStorage.bzmodern) ? Modern(actionfunction) : "";
    (localStorage.bzloaderenable) ? Enable(actionfunction) : "";
    (localStorage.bzloaderdisable) ? Disable(actionfunction) : "";
    (localStorage.bzfullwidth) ? Fullwidth(actionfunction) : "";
    (localStorage.bzboxed) ? Boxed(actionfunction) : "";
    (localStorage.bzmenufixed) ? FixedMenu(actionfunction) : "";
    (localStorage.bzmenuscrollable) ? scrollMenu(actionfunction) : "";
    (localStorage.bzheaderfixed) ? Headerpostionfixed(actionfunction) : "";
    (localStorage.bzheaderscrollable) ? Headerpostionscroll(actionfunction) : "";
    (localStorage.bgimage1) ? bgImage1(actionfunction) : '';
    (localStorage.bgimage2) ? bgImage2(actionfunction) : '';
    (localStorage.bgimage3) ? bgImage3(actionfunction) : '';
    (localStorage.bgimage4) ? bgImage4(actionfunction) : '';
    (localStorage.bgimage5) ? bgImage5(actionfunction) : '';

    (localStorage.bznavstyles === "menu-click") ? Menuclick(actionfunction) : '';
    (localStorage.bznavstyles === "menu-hover") ? MenuHover(actionfunction) : '';
    (localStorage.bznavstyles === "icon-click") ? IconClick(actionfunction) : '';
    (localStorage.bznavstyles === "icon-hover") ? IconHover(actionfunction) : '';


    (localStorage.bzlayout == 'horizontal') && HorizontalClick(actionfunction);

    // // ThemeColor MenuColor Start
    switch (localStorage.bzMenu) {
        case 'light':
            lightMenu(actionfunction);
            break;
        case 'dark':
            darkMenu(actionfunction);

            break;
        case 'color':
            colorMenu(actionfunction);

            break;
        case 'gradient':
            gradientMenu(actionfunction);

            break;
        case 'transparent':
            transparentMenu(actionfunction);

            break;
        default:
            break;
    }

    // ThemeColor MenuColor End

    // ThemeColor Header Colors: start
    switch (localStorage.bzHeader) {
        case 'light':
            lightHeader(actionfunction);

            break;
        case 'dark':
            darkHeader(actionfunction);

            break;
        case 'color':
            colorHeader(actionfunction);

            break;
        case 'gradient':
            gradientHeader(actionfunction);

            break;
        case 'transparent':
            transparentHeader(actionfunction);

            break;
        default:
            break;
    }
    // ThemeColor Header Colors: End

    // Theme Primary: Colors: Start
    switch (localStorage.primaryRGB) {
        case '58, 88, 146':
            primaryColor1(actionfunction);

            break;
        case '92, 144, 163':
            primaryColor2(actionfunction);

            break;
        case '161, 90, 223':
            primaryColor3(actionfunction);

            break;
        case '78, 172, 76':
            primaryColor4(actionfunction);

            break;
        case '223, 90, 90':
            primaryColor5(actionfunction);

            break;
        default:
            break;
    }
    // Theme Primary: Colors: End

    switch (localStorage.bodyBgRGB) {
        case '50 62 93':
            backgroundColor1(actionfunction);

            break;
        case '81 93 50':
            backgroundColor2(actionfunction);

            break;
        case '93 64 107':
            backgroundColor3(actionfunction);

            break;
        case '64 101 107':
            backgroundColor4(actionfunction);

            break;
        case '107 64 64':
            backgroundColor5(actionfunction);

            break;
        default:
            break;
    }
    switch (localStorage.darkBgRGB) {
        case '50 62 93':
            backgroundColor1(actionfunction);

            break;
        case '81 93 50':
            backgroundColor2(actionfunction);

            break;
        case '93 64 107':
            backgroundColor3(actionfunction);

            break;
        case '64 101 107':
            backgroundColor4(actionfunction);

            break;
        case '107 64 64':
            backgroundColor5(actionfunction);

            break;
        default:
            break;
    }
    switch (localStorage.Light) {
        case '50 62 93':
            backgroundColor1(actionfunction);

            break;
        case '81 93 50':
            backgroundColor2(actionfunction);

            break;
        case '93 64 107':
            backgroundColor3(actionfunction);

            break;
        case '64 101 107':
            backgroundColor4(actionfunction);

            break;
        case '107 64 64':
            backgroundColor5(actionfunction);

            break;
        default:
            break;
    }
    switch (localStorage.inputBorder) {
        case '50 62 93':
            backgroundColor1(actionfunction);

            break;
        case '81 93 50':
            backgroundColor2(actionfunction);

            break;
        case '93 64 107':
            backgroundColor3(actionfunction);

            break;
        case '64 101 107':
            backgroundColor4(actionfunction);

            break;
        case '107 64 64':
            backgroundColor5(actionfunction);

            break;
        default:
            break;
    }

    if (localStorage.bzverticalstyles) {
        let verticalStyles = localStorage.getItem("bzverticalstyles");

        switch (verticalStyles) {
            case "default":
                let defaultid = document.getElementById("switcher-default-menu") as HTMLInputElement;
                defaultid.checked = true;
                Defaultmenu(actionfunction)

                break;
            case "closed":
                let closedid = document.getElementById("switcher-icontext-menu") as HTMLInputElement;
                closedid.checked = true;
                Closedmenu(actionfunction)

                break;
            case "icontext":
                let icontextid = document.getElementById("switcher-icontext-menu") as HTMLInputElement;
                icontextid.checked = true;
                iconText(actionfunction)


                break;
            case "overlay":
                let overlayid = document.getElementById("switcher-detached") as HTMLInputElement;
                overlayid.checked = true;
                iconOverayFn(actionfunction)

                break;
            case "detached":
                let detachedid = document.getElementById("switcher-detached") as HTMLInputElement;
                detachedid.checked = true;
                DetachedFn(actionfunction)

                break;
            case "doublemenu":
                let doubleMenuid = document.getElementById("switcher-double-menu") as HTMLInputElement; 
                doubleMenuid.checked = true;
                DoubletFn(actionfunction)

                break;

            default:
                let defaultbutton = document.getElementById("switcher-default-menu") as HTMLInputElement;
                defaultbutton.checked = true;
                break;
        }
    }

    //Theme Primary:
    if (localStorage.dynamiccolor) {
        const theme = store.getState()
        actionfunction({
            ...theme,
            "colorPrimaryRgb": localStorage.dynamiccolor,
            "colorPrimary": localStorage.dynamiccolor,
            
        })
    }
    //Theme BAckground:
    if (localStorage.bodyBgRGB) {
        let updateddarkBg = `${Number(localStorage.bodyBgRGB.split(" ")[0]) + 14} ${Number(localStorage.bodyBgRGB.split(" ")[1]) + 14} ${Number(localStorage.bodyBgRGB.split(" ")[2]) + 14}`
        const theme = store.getState()
        actionfunction({
            ...theme,
            "bodyBg": updateddarkBg,
            "darkBg": localStorage.bodyBgRGB,
            "class": "dark",
            "dataHeaderStyles": "dark",
            "Light": localStorage.Light,
            "inputBorder": localStorage.inputBorder,
            
        })
    }
    switch (localStorage.bzMenu) {
        case 'light':
            lightMenu(actionfunction);
            break;
        case 'dark':
            darkMenu(actionfunction);

            break;
        case 'color':
            colorMenu(actionfunction);

            break;
        case 'gradient':
            gradientMenu(actionfunction);

            break;
        case 'transparent':
            transparentMenu(actionfunction);

            break;
        default:
            break;
    }
    // ThemeColor Header Colors: start
    switch (localStorage.bzHeader) {
        case 'light':
            lightHeader(actionfunction);

            break;
        case 'dark':
            darkHeader(actionfunction);

            break;
        case 'color':
            colorHeader(actionfunction);

            break;
        case 'gradient':
            gradientHeader(actionfunction);

            break;
        case 'transparent':
            transparentHeader(actionfunction);

            break;
        default:
            break;
    }
}
