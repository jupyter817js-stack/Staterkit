'use client';

import React, { Fragment, useCallback, useEffect, useRef, useState } from "react";
import type { GetServerSideProps } from "next";
import Seo from "@/shared/layout-components/seo/seo";
import Pageheader from "@/shared/layout-components/page-header/pageheader";
import { getCurrentUser, updateUser } from "@/shared/api/users";
import type { CurrentUser } from "@/shared/types/users";
import { auth, storage } from "@/shared/firebase/firebaseapi";
import firebase from "firebase/compat/app";
import { useRouter } from "next/router";
import ToastContainer from "@/shared/ui/ToastContainer";
import type { ToastItem } from "@/shared/ui/Toast";
import { basePath } from "@/next.config";

type TabId = "profile" | "security";

export default function SettingsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordShow, setPasswordShow] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const addToast = useCallback((type: ToastItem["type"], message: string) => {
    setToasts((prev) => [
      ...prev,
      { id: `toast-${Date.now()}`, type, message },
    ]);
  }, []);
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const user = await getCurrentUser();
      setCurrentUser(user ?? null);
      if (user) {
        const fn = (user as any).firstName ?? user.firstname ?? "";
        const ln = (user as any).lastName ?? user.lastname ?? "";
        setProfileForm({ firstName: fn, lastName: ln });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setProfilePhotoUrl(user?.photoURL ?? null);
    });
    return () => unsubscribe();
  }, []);

  const openFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImageChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!validTypes.includes(file.type)) {
        addToast("error", "JPG, PNG, GIF, WebP 형식만 업로드 가능합니다.");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        addToast("error", "이미지 크기는 2MB 이하여야 합니다.");
        return;
      }
      const user = auth.currentUser;
      if (!user) {
        addToast("error", "로그인이 필요합니다.");
        return;
      }
      setPhotoUploading(true);
      try {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `profiles/${user.uid}/avatar.${ext}`;
        const ref = storage.ref(path);
        await ref.put(file, { contentType: file.type });
        const downloadURL = await ref.getDownloadURL();
        await user.updateProfile({ photoURL: downloadURL });
        setProfilePhotoUrl(downloadURL);
        addToast("success", "프로필 사진이 변경되었습니다.");
      } catch (err) {
        addToast(
          "error",
          err instanceof Error ? err.message : "프로필 사진 업로드에 실패했습니다."
        );
      } finally {
        setPhotoUploading(false);
        e.target.value = "";
      }
    },
    [addToast]
  );

  const handleRemovePhoto = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;
    setPhotoUploading(true);
    try {
      await user.updateProfile({ photoURL: null });
      setProfilePhotoUrl(null);
      addToast("success", "프로필 사진이 제거되었습니다.");
    } catch (err) {
      addToast(
        "error",
        err instanceof Error ? err.message : "프로필 사진 제거에 실패했습니다."
      );
    } finally {
      setPhotoUploading(false);
    }
  }, [addToast]);

  const handleProfileSave = useCallback(async () => {
    if (!currentUser?.id) return;
    setProfileSaving(true);
    try {
      await updateUser(currentUser.id, {
        firstName: profileForm.firstName.trim() || undefined,
        lastName: profileForm.lastName.trim() || undefined,
      });
      setCurrentUser((prev) =>
        prev ? { ...prev, firstname: profileForm.firstName, lastname: profileForm.lastName } : null
      );
      addToast("success", "프로필이 저장되었습니다.");
    } catch (e) {
      addToast("error", e instanceof Error ? e.message : "저장에 실패했습니다.");
    } finally {
      setProfileSaving(false);
    }
  }, [currentUser?.id, profileForm, addToast]);

  const handlePasswordChange = useCallback(async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordForm;
    if (!currentPassword || !newPassword || !confirmPassword) {
      addToast("error", "모든 필드를 입력해 주세요.");
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast("error", "새 비밀번호가 일치하지 않습니다.");
      return;
    }
    if (newPassword.length < 8) {
      addToast("error", "비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    const user = auth.currentUser;
    if (!user?.email) {
      addToast("error", "이메일 로그인 사용자만 비밀번호를 변경할 수 있습니다.");
      return;
    }
    setPasswordSaving(true);
    try {
      const credential = firebase.auth.EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await user.reauthenticateWithCredential(credential);
      await user.updatePassword(newPassword);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      addToast("success", "비밀번호가 변경되었습니다.");
    } catch (error: any) {
      const msg =
        error?.code === "auth/wrong-password"
          ? "현재 비밀번호가 올바르지 않습니다."
          : error?.code === "auth/weak-password"
            ? "비밀번호가 너무 약합니다."
            : error?.code === "auth/requires-recent-login"
              ? "보안을 위해 다시 로그인한 후 시도해 주세요."
              : error instanceof Error
                ? error.message
                : "비밀번호 변경에 실패했습니다.";
      addToast("error", msg);
    } finally {
      setPasswordSaving(false);
    }
  }, [passwordForm, addToast]);

  if (loading && !currentUser) {
    return (
      <Fragment>
        <Seo title="설정" />
        <div className="container-xl">
          <Pageheader currentpage="설정" activepage="설정" mainpage="설정" />
          <div className="grid grid-cols-12 gap-6 mb-[3rem]">
            <div className="col-span-12">
              <div className="box">
                <div className="box-body flex items-center justify-center py-20">
                  <i className="ri-loader-4-line text-4xl text-primary animate-spin"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Fragment>
    );
  }

  if (!currentUser) {
    router.replace("/login");
    return null;
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: "profile", label: "프로필 정보" },
    { id: "security", label: "보안" },
  ];

  return (
    <Fragment>
      <Seo title="설정" />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <div className="container-xl">
        <Pageheader currentpage="설정" activepage="설정" mainpage="설정" />
        <div className="grid grid-cols-12 gap-6 mb-[3rem]">
          <div className="xl:col-span-12 col-span-12">
            <div className="box">
              <div className="box-header sm:flex block !justify-start">
                <nav
                  aria-label="Tabs"
                  className="md:flex block !justify-start whitespace-nowrap"
                  role="tablist"
                >
                  {tabs.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveTab(t.id)}
                      className={`m-1 block w-full cursor-pointer py-2 px-3 flex-grow text-[0.75rem] font-medium rounded-md hover:text-primary ${
                        activeTab === t.id
                          ? "bg-primary/10 text-primary"
                          : "text-defaulttextcolor dark:text-defaulttextcolor/70 hover:text-primary"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </nav>
              </div>
              <div className="box-body">
                {activeTab === "profile" && (
                  <div className="sm:p-4 p-0">
                    <h6 className="font-semibold mb-4 text-[1rem]">프로필 사진</h6>
                    <div className="mb-6 sm:flex items-center">
                      <div className="mb-0 me-[3rem]">
                        <span className="avatar avatar-xxl avatar-rounded relative">
                          <img
                            src={
                              profilePhotoUrl ||
                              `${process.env.NODE_ENV === "production" ? basePath : ""}/assets/images/faces/9.jpg`
                            }
                            alt="프로필"
                            id="profile-img"
                            className="object-cover"
                          />
                          <span
                            aria-label="사진 변경"
                            className="badge rounded-full avatar-badge bg-primary w-8 h-8 flex items-center justify-center cursor-pointer"
                            onClick={openFileInput}
                            style={{ pointerEvents: photoUploading ? "none" : "auto" }}
                          >
                            {photoUploading ? (
                              <span className="ti-spinner !w-4 !h-4 !border-2 !border-white/80" />
                            ) : (
                              <i className="ri-camera-line !text-[0.8rem] !text-white"></i>
                            )}
                          </span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          className="hidden"
                          ref={fileInputRef}
                          onChange={handleImageChange}
                        />
                        </span>
                      </div>
                      <div className="inline-flex gap-1">
                        <button
                          type="button"
                          className="ti-btn ti-btn-primary-full !rounded-e-none !font-medium"
                          onClick={openFileInput}
                          disabled={photoUploading}
                        >
                          변경
                        </button>
                        <button
                          type="button"
                          className="ti-btn ti-btn-light !font-medium !rounded-s-none"
                          onClick={handleRemovePhoto}
                          disabled={photoUploading || !profilePhotoUrl}
                        >
                          제거
                        </button>
                      </div>
                    </div>
                    <h6 className="font-semibold mb-4 text-[1rem]">프로필</h6>
                    <div className="sm:grid grid-cols-12 gap-6 mb-6">
                      <div className="xl:col-span-6 col-span-12">
                        <label htmlFor="last-name" className="form-label">
                          성
                        </label>
                        <input
                          type="text"
                          className="form-control w-full !rounded-md"
                          id="last-name"
                          placeholder="성"
                          value={profileForm.lastName}
                          onChange={(e) =>
                            setProfileForm((p) => ({
                              ...p,
                              lastName: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="xl:col-span-6 col-span-12">
                        <label htmlFor="first-name" className="form-label">
                          이름
                        </label>
                        <input
                          type="text"
                          className="form-control w-full !rounded-md"
                          id="first-name"
                          placeholder="이름"
                          value={profileForm.firstName}
                          onChange={(e) =>
                            setProfileForm((p) => ({
                              ...p,
                              firstName: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="xl:col-span-12 col-span-12">
                        <label className="form-label">이메일</label>
                        <input
                          type="text"
                          className="form-control w-full !rounded-md bg-gray-100 dark:bg-white/5 cursor-not-allowed"
                          value={currentUser.email}
                          readOnly
                          disabled
                        />
                        <span className="text-[0.75rem] text-[#8c9097] dark:text-white/50">
                          이메일은 변경할 수 없습니다.
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`ti-btn ti-btn-primary-full !font-medium ${profileSaving ? "ti-btn-loader btn-loader" : ""}`}
                      onClick={handleProfileSave}
                      disabled={profileSaving}
                    >
                      {profileSaving ? (
                        <span className="ti-spinner !w-4 !h-4 !border-2 me-1 inline-block" />
                      ) : (
                        <i className="ri-save-line me-1"></i>
                      )}
                      저장
                    </button>
                  </div>
                )}

                {activeTab === "security" && (
                  <div className="sm:p-4 p-0">
                    <h6 className="font-semibold mb-4 text-[1rem]">
                      비밀번호 변경
                    </h6>
                    <p className="text-[0.75rem] text-[#8c9097] dark:text-white/50 mb-4">
                      비밀번호는 최소 8자 이상이어야 하며, 대문자, 소문자, 숫자,
                      특수문자를 포함하는 것이 권장됩니다.
                    </p>
                    <div className="mb-4 max-w-md">
                      <label
                        htmlFor="current-password"
                        className="form-label"
                      >
                        현재 비밀번호
                      </label>
                      <div className="input-group">
                        <input
                          type={passwordShow ? "text" : "password"}
                          className="form-control w-full !rounded-md"
                          id="current-password"
                          placeholder="현재 비밀번호"
                          value={passwordForm.currentPassword}
                          onChange={(e) =>
                            setPasswordForm((p) => ({
                              ...p,
                              currentPassword: e.target.value,
                            }))
                          }
                        />
                        <button
                          type="button"
                          className="ti-btn ti-btn-light !rounded-s-none"
                          onClick={() => setPasswordShow(!passwordShow)}
                        >
                          <i
                            className={
                              passwordShow
                                ? "ri-eye-off-line"
                                : "ri-eye-line"
                            }
                          ></i>
                        </button>
                      </div>
                    </div>
                    <div className="mb-4 max-w-md">
                      <label htmlFor="new-password" className="form-label">
                        새 비밀번호
                      </label>
                      <input
                        type={passwordShow ? "text" : "password"}
                        className="form-control w-full !rounded-md"
                        id="new-password"
                        placeholder="새 비밀번호"
                        value={passwordForm.newPassword}
                        onChange={(e) =>
                          setPasswordForm((p) => ({
                            ...p,
                            newPassword: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="mb-4 max-w-md">
                      <label htmlFor="confirm-password" className="form-label">
                        새 비밀번호 확인
                      </label>
                      <input
                        type={passwordShow ? "text" : "password"}
                        className="form-control w-full !rounded-md"
                        id="confirm-password"
                        placeholder="새 비밀번호 확인"
                        value={passwordForm.confirmPassword}
                        onChange={(e) =>
                          setPasswordForm((p) => ({
                            ...p,
                            confirmPassword: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <button
                      type="button"
                      className={`ti-btn ti-btn-primary-full !font-medium ${passwordSaving ? "ti-btn-loader btn-loader" : ""}`}
                      onClick={handlePasswordChange}
                      disabled={passwordSaving}
                    >
                      {passwordSaving ? (
                        <span className="ti-spinner !w-4 !h-4 !border-2 me-1 inline-block" />
                      ) : (
                        <i className="ri-lock-password-line me-1"></i>
                      )}
                      비밀번호 변경
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
}

SettingsPage.layout = "Contentlayout";

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};
