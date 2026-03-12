'use client';

import { basePath } from "@/next.config";
import { auth } from "@/shared/firebase/firebaseapi";
import { registerWithFirebaseToken } from "@/shared/api/auth";
import Seo from "@/shared/layout-components/seo/seo";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { Fragment, useEffect, useState } from "react";
import {
  saveAttributionFromQuery,
  getAttributionFromCookie,
  clearAttributionCookie,
} from "@/shared/utils/attribution";

/**
 * 단일 가입 페이지 (/join). 링크 파라미터 p=총판ID, s=매장ID 로 접속 시 쿠키 저장 후 가입 시 귀속 전송.
 */
const JoinPage = () => {
  const router = useRouter();
  const [passwordShow1, setPasswordShow1] = useState(false);
  const [passwordShow2, setPasswordShow2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setError] = useState("");
  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  useEffect(() => {
    if (router.isReady) saveAttributionFromQuery(router.query);
  }, [router.isReady, router.query]);

  const changeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name;
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSignup = async (e: React.FormEvent) => {
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
    if (data.password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (data.password !== data.confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (!data.firstName.trim() || !data.lastName.trim()) {
      setError("이름과 성을 입력해 주세요.");
      return;
    }
    if (!data.agreeTerms) {
      setError("약관에 동의해 주세요.");
      return;
    }

    setLoading(true);
    const attribution = getAttributionFromCookie();
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(
        data.email.trim(),
        data.password,
      );
      const user = userCredential.user;
      if (!user) throw new Error("회원가입 정보를 가져올 수 없습니다.");
      try {
        await user.updateProfile({
          displayName: `${data.firstName.trim()} ${data.lastName.trim()}`.trim(),
        });
      } catch {
        // ignore
      }
      const idToken = await user.getIdToken();
      await registerWithFirebaseToken(
        idToken,
        data.firstName.trim(),
        data.lastName.trim(),
        attribution.store_id || attribution.partner_id ? attribution : undefined,
      );
      clearAttributionCookie();
      router.push("/");
    } catch (error: any) {
      const msg =
        error?.code === "auth/email-already-in-use"
          ? "이미 사용 중인 이메일입니다."
          : error?.code === "auth/invalid-email"
            ? "이메일 형식이 올바르지 않습니다."
            : error?.code === "auth/weak-password"
              ? "비밀번호가 너무 약합니다."
              : error instanceof Error
                ? error.message
                : "회원가입에 실패했습니다.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const hasAttribution =
    typeof router.query.p === "string" || typeof router.query.s === "string";

  return (
    <Fragment>
      <Seo title="회원가입" />
      <div className="container">
        <div className="flex justify-center authentication authentication-basic items-center h-full text-defaultsize text-defaulttextcolor">
          <div className="grid grid-cols-12">
            <div className="xxl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-3 sm:col-span-2"></div>
            <div className="xxl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6 sm:col-span-8 col-span-12">
              <div className="my-[2.5rem] flex justify-center">
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
              <div className="box">
                <div className="box-body !p-[3rem]">
                  <p className="h5 font-semibold mb-2 text-center">회원가입</p>
                  {hasAttribution && (
                    <p className="mb-3 text-center text-[0.75rem] text-primary/90">
                      링크로 접속하셨습니다. 가입 시 해당 매장/총판에 자동 귀속됩니다.
                    </p>
                  )}
                  {err && (
                    <div
                      className="p-4 mb-4 bg-danger/40 text-[0.75rem] w-full border-t-4 border-danger text-danger/60 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400"
                      role="alert"
                    >
                      {err}
                    </div>
                  )}
                  <p className="mb-4 text-[#8c9097] dark:text-white/50 opacity-[0.7] font-normal text-center">
                    무료 계정을 만들어 이용을 시작하세요.
                  </p>
                  <form
                    onSubmit={handleSignup}
                    className="grid grid-cols-12 gap-y-4"
                  >
                    <div className="xl:col-span-12 col-span-12">
                      <label htmlFor="join-firstname" className="form-label text-default">이름</label>
                      <input
                        type="text"
                        name="firstName"
                        className="form-control form-control-lg w-full !rounded-md"
                        id="join-firstname"
                        placeholder="이름"
                        value={data.firstName}
                        onChange={changeHandler}
                        disabled={loading}
                      />
                    </div>
                    <div className="xl:col-span-12 col-span-12">
                      <label htmlFor="join-lastname" className="form-label text-default">성</label>
                      <input
                        type="text"
                        name="lastName"
                        className="form-control form-control-lg w-full !rounded-md"
                        id="join-lastname"
                        placeholder="성"
                        value={data.lastName}
                        onChange={changeHandler}
                        disabled={loading}
                      />
                    </div>
                    <div className="xl:col-span-12 col-span-12">
                      <label htmlFor="join-email" className="form-label text-default">이메일</label>
                      <input
                        type="email"
                        name="email"
                        className="form-control form-control-lg w-full !rounded-md"
                        id="join-email"
                        placeholder="email@example.com"
                        value={data.email}
                        onChange={changeHandler}
                        disabled={loading}
                        autoComplete="email"
                      />
                    </div>
                    <div className="xl:col-span-12 col-span-12">
                      <label htmlFor="join-password" className="form-label text-default">비밀번호</label>
                      <div className="input-group">
                        <input
                          type={passwordShow1 ? "text" : "password"}
                          name="password"
                          className="form-control form-control-lg !rounded-e-none"
                          id="join-password"
                          placeholder="비밀번호 (8자 이상)"
                          value={data.password}
                          onChange={changeHandler}
                          disabled={loading}
                          autoComplete="new-password"
                        />
                        <button
                          onClick={() => setPasswordShow1(!passwordShow1)}
                          aria-label="비밀번호 보기"
                          type="button"
                          className="ti-btn ti-btn-light !rounded-s-none !mb-0"
                        >
                          <i className={`${passwordShow1 ? "ri-eye-line" : "ri-eye-off-line"} align-middle`}></i>
                        </button>
                      </div>
                    </div>
                    <div className="xl:col-span-12 col-span-12 mb-2">
                      <label htmlFor="join-confirmpassword" className="form-label text-default">비밀번호 확인</label>
                      <div className="input-group">
                        <input
                          type={passwordShow2 ? "text" : "password"}
                          name="confirmPassword"
                          className="form-control form-control-lg !rounded-e-none"
                          id="join-confirmpassword"
                          placeholder="비밀번호 확인"
                          value={data.confirmPassword}
                          onChange={changeHandler}
                          disabled={loading}
                          autoComplete="new-password"
                        />
                        <button
                          aria-label="비밀번호 보기"
                          type="button"
                          className="ti-btn ti-btn-light !rounded-s-none !mb-0"
                          onClick={() => setPasswordShow2(!passwordShow2)}
                        >
                          <i className={`${passwordShow2 ? "ri-eye-line" : "ri-eye-off-line"} align-middle`}></i>
                        </button>
                      </div>
                      <div className="mt-4">
                        <div className="form-check !flex !ps-0">
                          <input
                            className="form-check-input me-1"
                            type="checkbox"
                            name="agreeTerms"
                            id="join-agreeTerms"
                            checked={data.agreeTerms}
                            onChange={changeHandler}
                            disabled={loading}
                          />
                          <label className="ps-2 form-check-label text-[#8c9097] dark:text-white/50 font-normal block" htmlFor="join-agreeTerms">
                            가입 시{" "}
                            <Link href="/components/pages/terms&conditions/" className="text-success"><u>이용약관</u></Link>
                            {" "}및{" "}
                            <Link href="#!" className="text-success"><u>개인정보처리방침</u></Link>
                            에 동의합니다.
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="xl:col-span-12 col-span-12 grid mt-2">
                      <button
                        type="submit"
                        className={`ti-btn ti-btn-lg bg-primary text-white !font-medium dark:border-defaultborder/10 ${loading ? "ti-btn-loader btn-loader" : ""}`}
                        disabled={loading}
                      >
                        {loading ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="ti-spinner !w-4 !h-4 !border-2" />
                            가입 중...
                          </span>
                        ) : (
                          "가입하기"
                        )}
                      </button>
                    </div>
                  </form>
                  <div className="text-center">
                    <p className="text-[0.75rem] text-[#8c9097] dark:text-white/50 mt-4">
                      이미 계정이 있으신가요?{" "}
                      <Link href="/login" className="text-primary">로그인</Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="xxl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-3 sm:col-span-2"></div>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

JoinPage.layout = "Authenticationlayout";
export default JoinPage;
