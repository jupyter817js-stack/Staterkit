import store from "@/shared/redux/store";
import ThemeprimarycolorDefault, {
  Dark,
  Light,
  Ltr,
  Rtl,
  primaryColor1,
  primaryColor2,
  primaryColor3,
  primaryColor4,
  primaryColor5,
} from "./switcherdata";

export default ThemeprimarycolorDefault;
export { Light, Dark, Ltr, Rtl };
export { primaryColor1, primaryColor2, primaryColor3, primaryColor4, primaryColor5 };

export const LocalStorageBackup1 = (actionfunction: any) => {
  const storedLang = localStorage.getItem("staterkit_lang");
  if (storedLang === "ko" || storedLang === "en") {
    const theme = store.getState();
    actionfunction({ ...theme, lang: storedLang });
  }
  if (localStorage.bzdarktheme) Dark(actionfunction);
  if (localStorage.bzlighttheme) Light(actionfunction);
  if (localStorage.bzrtl) Rtl(actionfunction);
  if (localStorage.primaryRGB === "58, 88, 146") primaryColor1(actionfunction);
  if (localStorage.primaryRGB === "92, 144, 163") primaryColor2(actionfunction);
  if (localStorage.primaryRGB === "161, 90, 223") primaryColor3(actionfunction);
  if (localStorage.primaryRGB === "78, 172, 76") primaryColor4(actionfunction);
  if (localStorage.primaryRGB === "223, 90, 90") primaryColor5(actionfunction);
};

export const LandingpageReset = (actionfunction: any) => {
  const theme = store.getState();
  actionfunction({
    ...theme,
    lang: "en",
    dir: "ltr",
    class: "light",
    dataMenuStyles: "dark",
    dataNavLayout: "horizontal",
    dataHeaderStyles: "light",
    dataVerticalStyle: "",
    dataToggled: "open",
    dataNavStyle: "menu-click",
    horStyle: "",
    dataPageStyle: "regular",
    dataWidth: "fullwidth",
    dataMenuPosition: "fixed",
    dataHeaderPosition: "fixed",
    iconOverlay: "",
    colorPrimaryRgb: "58, 88, 146",
    colorPrimary: "58 88 146",
    bodyBg: "",
    darkBg: "",
    inputBorder: "",
    Light: "",
    bgImg: "",
    loader: "disable",
    iconText: "",
    body: { class: "" },
  });
  localStorage.setItem("bzlayout", "horizontal");
  localStorage.setItem("bzlighttheme", "light");
  localStorage.removeItem("bzdarktheme");
  localStorage.removeItem("bzrtl");
  localStorage.setItem("primaryRGB", "58, 88, 146");
  localStorage.setItem("primaryRGB1", "58 88 146");
  primaryColor1(actionfunction);
};
