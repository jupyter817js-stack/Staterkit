"use client";

import React, { useState } from "react";
import { useLanguage } from "@/shared/i18n/LanguageContext";
import type { User } from "@/shared/types/users";
import { updateUser } from "@/shared/api/users";

interface EditUserModalProps {
  user: User;
  onClose: () => void;
  onSaved: (updated: User) => void;
}

export default function EditUserModal({ user, onClose, onSaved }: EditUserModalProps) {
  const { t } = useLanguage();
  const [firstName, setFirstName] = useState(user.firstName ?? "");
  const [lastName, setLastName] = useState(user.lastName ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const updated = await updateUser(user.id, { firstName, lastName });
      onSaved(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("saveFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg bg-white dark:bg-bodybg rounded-lg shadow-lg border border-defaultborder dark:border-white/10 overflow-hidden">
        {/* 헤더: 보라색 세로 바 + 제목 (Overview 스타일) */}
        <div className="flex items-center justify-between border-b border-defaultborder dark:border-white/10 px-5 py-4">
          <div className="box-title flex items-center gap-2 font-semibold text-[1rem] text-defaulttextcolor dark:text-defaulttextcolor/80">
            <span className="w-1 h-5 rounded-full bg-primary shrink-0"></span>
            {t("editNameTitle")}
          </div>
          <button
            type="button"
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 text-[#8c9097] dark:text-white/50 transition-colors"
            onClick={onClose}
            aria-label={t("closeAria")}
          >
            <i className="ri-close-line text-[1.25rem]"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          {error && (
            <div className="alert alert-danger mb-4 flex rounded-md" role="alert">
              <i className="ri-error-warning-line me-2 text-[1.125rem]"></i>
              <span className="text-[0.875rem]">{error}</span>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-[0.8125rem] font-semibold text-defaulttextcolor dark:text-white/70 mb-2">
                First Name
              </label>
              <input
                type="text"
                className="ti-form-control w-full rounded-md border border-defaultborder dark:border-white/10 bg-white dark:bg-bodybg px-3 py-2.5 text-[0.8125rem] text-defaulttextcolor placeholder:text-[#8c9097] dark:placeholder:text-white/50 focus:border-primary focus:ring-1 focus:ring-primary"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
                required
              />
            </div>
            <div>
              <label className="block text-[0.8125rem] font-semibold text-defaulttextcolor dark:text-white/70 mb-2">
                Last Name
              </label>
              <input
                type="text"
                className="ti-form-control w-full rounded-md border border-defaultborder dark:border-white/10 bg-white dark:bg-bodybg px-3 py-2.5 text-[0.8125rem] text-defaulttextcolor placeholder:text-[#8c9097] dark:placeholder:text-white/50 focus:border-primary focus:ring-1 focus:ring-primary"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last Name"
                required
              />
              <p className="mt-1.5 text-[0.75rem] text-[#8c9097] dark:text-white/50 italic">
                {t("editSaveHint")}
              </p>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              type="submit"
              className={`ti-btn bg-primary text-white btn-wave font-semibold rounded-md shadow-sm hover:opacity-90 transition-opacity !py-2.5 !px-5 !text-[0.875rem] ${loading ? "ti-btn-loader btn-loader" : ""}`}
              disabled={loading}
            >
              {loading ? (
                <span className="ti-spinner !w-4 !h-4 !border-2 me-1.5 align-middle inline-block" />
              ) : null}
              {t("save")}
            </button>
            <button
              type="button"
              className="ti-btn ti-btn-outline-secondary btn-wave font-medium rounded-md !py-2.5 !px-5 !text-[0.875rem]"
              onClick={onClose}
              disabled={loading}
            >
              {t("cancel")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
