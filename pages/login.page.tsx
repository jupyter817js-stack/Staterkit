'use client';

import { basePath } from "@/next.config";
import { auth } from "@/shared/firebase/firebaseapi";
import { loginWithFirebaseToken } from "@/shared/api/auth";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { Fragment, useState, useEffect } from "react";
import { useLanguage } from "@/shared/i18n/LanguageContext";

const REMEMBER_KEY = "staterkit_remember_login";

const LoginPage = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const returnUrl =
    typeof router.query.returnUrl === "string" && router.query.returnUrl.startsWith("/")
      ? router.query.returnUrl
      : "/";
  const [passwordShow, setPasswordShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setError] = useState("");
  const [rememberPassword, setRememberPassword] = useState(false);
  const [data, setData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(REMEMBER_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { email?: string; password?: string };
      if (parsed?.email || parsed?.password) {
        setData({
          email: parsed.email ?? "",
          password: parsed.password ?? "",
        });
        setRememberPassword(true);
      }
    } catch {
      localStorage.removeItem(REMEMBER_KEY);
    }
  }, []);

  const changeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({ ...data, [e.target.name]: e.target.value });
    setError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!data.email.trim()) {
      setError("이메일을 입력해 주세요.");
      return;
    }
    if (!data.password) {
      setError("비밀번호를 입력해 주세요.");
      return;
    }
    setLoading(true);
    try {
      const userCredential = await auth.signInWithEmailAndPassword(
        data.email.trim(),
        data.password,
      );
      const user = userCredential.user;
      if (!user) throw new Error("로그인 정보를 가져올 수 없습니다.");
      const idToken = await user.getIdToken();
      await loginWithFirebaseToken(idToken);
      if (rememberPassword) {
        localStorage.setItem(REMEMBER_KEY, JSON.stringify({ email: data.email.trim(), password: data.password }));
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
      router.push(returnUrl);
    } catch (error: any) {
      const rawMsg =
        error?.code === "auth/invalid-credential"
          ? "이메일 또는 비밀번호가 올바르지 않습니다."
          : error?.code === "auth/user-not-found"
            ? "존재하지 않는 계정입니다."
            : error?.code === "auth/wrong-password"
              ? "비밀번호가 올바르지 않습니다."
              : error?.code === "auth/invalid-email"
                ? "이메일 형식이 올바르지 않습니다."
                : error?.code === "auth/too-many-requests"
                  ? "시도가 너무 많습니다. 잠시 후 다시 시도해 주세요."
                  : error instanceof Error
                    ? error.message
                    : "로그인에 실패했습니다.";
      const isBlocked =
        typeof rawMsg === "string" &&
        /blocked|block|차단|forbidden|account_blocked|user_blocked|403/i.test(rawMsg);
      setError(isBlocked ? t("accountBlocked") : rawMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRememberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setRememberPassword(checked);
    if (!checked && typeof window !== "undefined") {
      localStorage.removeItem(REMEMBER_KEY);
    }
  };

  return (
    <Fragment>
      <div className="min-h-screen w-full flex items-center justify-center py-8 px-4">
        <div className="authentication authentication-basic w-full max-w-[26rem] text-defaultsize text-defaulttextcolor flex flex-col items-center">
              <div className="my-[2.5rem] w-full flex justify-center">
                <Link href="/">
                  <img
                    src={`${process.env.NODE_ENV === "production" ? basePath : ""}/assets/images/brand-logos/desktop-logo.png`}
                    alt="logo"
                    className="desktop-logo"
                  />
                  <img
                    src={`${process.env.NODE_ENV === "production" ? basePath : ""}/assets/images/brand-logos/desktop-dark.png`}
                    alt="logo"
                    className="desktop-dark"
                  />
                </Link>
              </div>

              <div className="mb-6 w-full max-w-md px-2 text-center">
                <p className="text-[0.9375rem] font-semibold text-defaulttextcolor dark:text-white/90 mb-1">
                  {t("loginTagline1")}
                </p>
                <div className="text-[0.8125rem] text-[#8c9097] dark:text-white/50 leading-relaxed space-y-1.5 text-center">
                  <p className="mb-0">{t("loginTagline2")}</p>
                  <p className="text-[0.75rem] text-[#6b7280] dark:text-white/40 mb-0">
                    {t("loginTagline3")}
                  </p>
                </div>
              </div>
              <div className="box !p-[3rem] w-full max-w-full min-w-0">
                <div className="box-body min-w-0">
                  <p className="h5 font-semibold mb-2 text-center">{t("signIn")}</p>
                  {err && (
                    <div
                      className="p-4 mb-4 bg-danger/40 text-[0.75rem] w-full min-w-0 border-t-4 border-danger text-danger/60 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 break-words"
                      role="alert"
                    >
                      {err}
                    </div>
                  )}
                  <p className="mb-4 text-[#8c9097] dark:text-white/50 opacity-[0.7] font-normal text-center">
                    {t("welcomeBack")}
                  </p>

                  <form
                    onSubmit={handleLogin}
                    className="grid grid-cols-12 gap-y-4"
                  >
                    <div className="xl:col-span-12 col-span-12">
                      <label
                        htmlFor="signin-email"
                        className="form-label text-default"
                      >
                        {t("email")}
                      </label>
                      <input
                        type="email"
                        name="email"
                        className="form-control form-control-lg w-full !rounded-md"
                        id="signin-email"
                        onChange={changeHandler}
                        value={data.email}
                        placeholder="email@example.com"
                        autoComplete="email"
                        disabled={loading}
                      />
                    </div>
                    <div className="xl:col-span-12 col-span-12 mb-2">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <label
                          htmlFor="signin-password"
                          className="form-label text-default mb-0"
                        >
                          {t("password")}
                        </label>
                        <Link
                          href="/forgot-password"
                          className="text-[0.8125rem] text-danger hover:underline"
                        >
                          {t("forgetPassword")}
                        </Link>
                      </div>
                      <div className="input-group">
                        <input
                          name="password"
                          type={passwordShow ? "text" : "password"}
                          value={data.password}
                          onChange={changeHandler}
                          className="form-control form-control-lg !rounded-s-md"
                          id="signin-password"
                          placeholder="password"
                          autoComplete="current-password"
                          disabled={loading}
                        />
                        <button
                          onClick={() => setPasswordShow(!passwordShow)}
                          aria-label="toggle password visibility"
                          className="ti-btn ti-btn-light !rounded-s-none !mb-0"
                          type="button"
                        >
                          <i
                            className={`${passwordShow ? "ri-eye-line" : "ri-eye-off-line"} align-middle`}
                          ></i>
                        </button>
                      </div>
                      <div className="mt-2">
                        <div className="form-check !ps-0">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="remember-password"
                            checked={rememberPassword}
                            onChange={handleRememberChange}
                            disabled={loading}
                          />
                          <label
                            className="form-check-label text-[#8c9097] dark:text-white/50 font-normal"
                            htmlFor="remember-password"
                          >
                            {t("rememberPassword")}
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="xl:col-span-12 col-span-12 grid mt-2">
                      <button
                        type="submit"
                        className={`ti-btn ti-btn-primary !bg-primary !text-white !font-medium ${loading ? "ti-btn-loader btn-loader" : ""}`}
                        disabled={loading}
                      >
                        {loading ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="ti-spinner !w-4 !h-4 !border-2" />
                            {t("loadingSignIn")}
                          </span>
                        ) : (
                          t("signIn")
                        )}
                      </button>
                    </div>
                  </form>

                  <div className="text-center">
                    <p className="text-[0.75rem] text-[#8c9097] dark:text-white/50 mt-4">
                      {t("dontHaveAccount")}{" "}
                      <Link href="/join" className="text-primary">
                        {t("signUp")}
                      </Link>
                    </p>
                  </div>
                  <div className="text-center my-4 authentication-barrier">
                    <span>OR</span>
                  </div>
                  <div className="btn-list text-center">
                    <button
                      aria-label="button"
                      type="button"
                      className="ti-btn ti-btn-icon ti-btn-light me-[0.365rem]"
                    >
                      <i className="ri-facebook-line font-bold text-dark opacity-[0.7]"></i>
                    </button>
                    <button
                      aria-label="button"
                      type="button"
                      className="ti-btn ti-btn-icon ti-btn-light me-[0.365rem]"
                    >
                      <i className="ri-google-line font-bold text-dark opacity-[0.7]"></i>
                    </button>
                    <button
                      aria-label="button"
                      type="button"
                      className="ti-btn ti-btn-icon ti-btn-light"
                    >
                      <i className="ri-twitter-x-line font-bold text-dark opacity-[0.7]"></i>
                    </button>
                  </div>
                </div>
              </div>
        </div>
      </div>
    </Fragment>
  );
};

LoginPage.layout = "Authenticationlayout";

export default LoginPage;
