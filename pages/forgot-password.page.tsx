"use client";

import { basePath } from "@/next.config";
import { auth } from "@/shared/firebase/firebaseapi";
import Link from "next/link";
import React, { Fragment, useState } from "react";
import Seo from "@/shared/layout-components/seo/seo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("이메일을 입력해 주세요.");
      return;
    }
    setLoading(true);
    try {
      const trimmedEmail = email.trim();
      const origin = typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL ?? "");
      await auth.sendPasswordResetEmail(trimmedEmail, {
        url: `${origin || ""}/`,
        handleCodeInApp: false,
      });
      setSent(true);
    } catch (error: any) {
      const msg =
        error?.code === "auth/user-not-found"
          ? "등록되지 않은 이메일입니다."
          : error?.code === "auth/invalid-email"
            ? "이메일 형식이 올바르지 않습니다."
            : error?.code === "auth/invalid-credential"
              ? "등록되지 않은 이메일입니다."
              : error instanceof Error
                ? error.message
                : "비밀번호 재설정 이메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Fragment>
      <Seo title="비밀번호 찾기" />
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

              <div className="box !p-[3rem]">
                <div className="box-body">
                  <p className="h5 font-semibold mb-2 text-center">
                    비밀번호 찾기
                  </p>
                  <p className="mb-4 text-[#8c9097] dark:text-white/50 opacity-[0.7] font-normal text-center text-[0.875rem]">
                    가입 시 사용한 이메일을 입력하시면 비밀번호 재설정 링크를
                    보내드립니다.
                  </p>

                  {sent ? (
                    <div className="space-y-4">
                      <div
                        className="p-4 mb-4 bg-success/10 text-success text-[0.875rem] w-full rounded-lg border border-success/20"
                        role="alert"
                      >
                        <p className="mb-0 font-medium">
                          비밀번호 재설정 이메일을 발송했습니다.
                        </p>
                        <p className="mb-0 mt-2 opacity-90">
                          {email} 주소로 이메일을 보냈습니다. 이메일 안의 링크를
                          클릭하여 새 비밀번호를 설정해 주세요.
                        </p>
                        <p className="mb-0 mt-2 text-[0.75rem] opacity-80">
                          이메일이 보이지 않는다면 스팸 폴더를 확인해 주세요.
                        </p>
                      </div>
                      <Link
                        href="/login"
                        className="ti-btn ti-btn-primary-full !font-medium w-full block text-center"
                      >
                        로그인으로 돌아가기
                      </Link>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-y-4">
                      {err && (
                        <div className="col-span-12">
                          <div
                            className="p-4 bg-danger/40 text-[0.75rem] w-full border-t-4 border-danger text-danger/60 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400"
                            role="alert"
                          >
                            {err}
                          </div>
                        </div>
                      )}
                      <div className="xl:col-span-12 col-span-12">
                        <label
                          htmlFor="forgot-email"
                          className="form-label text-default"
                        >
                          Email
                        </label>
                        <input
                          type="email"
                          className="form-control form-control-lg w-full !rounded-md"
                          id="forgot-email"
                          placeholder="email@example.com"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setError("");
                          }}
                          disabled={loading}
                          autoComplete="email"
                        />
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
                              발송 중...
                            </span>
                          ) : (
                            "재설정 이메일 보내기"
                          )}
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="text-center mt-4">
                    <Link
                      href="/login"
                      className="text-[0.875rem] text-primary hover:underline"
                    >
                      ← 로그인으로 돌아가기
                    </Link>
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
}

ForgotPasswordPage.layout = "Authenticationlayout";
