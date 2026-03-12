"use client";

import React, { useEffect, useState } from "react";
import { useLanguage } from "@/shared/i18n/LanguageContext";
import type { Store } from "@/shared/types/partner-store";
import type { Partner } from "@/shared/types/partner-store";
import { displayPartnerName } from "@/shared/types/partner-store";
import { createStore, updateStore } from "@/shared/api/stores";

type Mode = "add" | "edit";

interface StoreFormModalProps {
  mode: Mode;
  store?: Store | null;
  partners: Partner[];
  isAdmin: boolean;
  myPartnerId: string | null;
  onClose: () => void;
  onSaved: (s: Store, wasEdit: boolean) => void;
}

const emptyForm = {
  nickName: "",
  partnerId: "",
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  commissionRatePercent: 30,
  walletNetwork: "POLYGON",
  walletAddress: "",
};

export default function StoreFormModal({ mode, store, partners, isAdmin, myPartnerId, onClose, onSaved }: StoreFormModalProps) {
  const { t } = useLanguage();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "edit" && store) {
      setForm({
        nickName: store.nickName ?? "",
        partnerId: store.partnerId ?? "",
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        commissionRatePercent: store.commissionRatePercent ?? 30,
        walletNetwork: store.walletNetwork ?? "POLYGON",
        walletAddress: store.walletAddress ?? "",
      });
    } else {
      setForm({
        ...emptyForm,
        partnerId: myPartnerId ?? (isAdmin && partners[0] ? partners[0].id : ""),
      });
    }
    setError(null);
  }, [mode, store, isAdmin, myPartnerId, partners]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "add") {
        const { nickName, partnerId, firstName, lastName, email, password, walletNetwork, walletAddress } = form;
        if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim() || !walletAddress.trim()) {
          setError("이름·이메일·비밀번호·지갑 주소를 입력하세요.");
          setLoading(false);
          return;
        }
        if (!isAdmin && !myPartnerId) {
          setError("총판을 선택하세요.");
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError("비밀번호는 6자 이상이어야 합니다.");
          setLoading(false);
          return;
        }
        const partnerIdVal = isAdmin && !partnerId ? null : (partnerId || myPartnerId);
        const created = await createStore({
          nickName: nickName.trim() || undefined,
          partnerId: partnerIdVal,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          password,
          commissionRatePercent: form.commissionRatePercent,
          walletNetwork,
          walletAddress: walletAddress.trim(),
        });
        onSaved(created, false);
      } else if (store) {
        const updated = await updateStore(store.id, {
          nickName: form.nickName.trim() || null,
          commissionRatePercent: form.commissionRatePercent,
          walletNetwork: form.walletNetwork,
          walletAddress: form.walletAddress.trim(),
        });
        onSaved(updated, true);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("saveFailed"));
    } finally {
      setLoading(false);
    }
  };

  const isEdit = mode === "edit";

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col bg-white dark:bg-bodybg rounded-lg shadow-lg border border-defaultborder dark:border-white/10">
        <div className="flex items-center justify-between border-b border-defaultborder dark:border-white/10 px-5 py-4 shrink-0">
          <div className="box-title flex items-center gap-2 font-semibold text-[1rem] text-defaulttextcolor dark:text-defaulttextcolor/80">
            <span className="w-1 h-5 rounded-full bg-primary shrink-0" />
            {isEdit ? "매장 수정" : t("addStore")}
          </div>
          <button type="button" className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 text-[#8c9097] dark:text-white/50" onClick={onClose} aria-label={t("closeAria")}>
            <i className="ri-close-line text-[1.25rem]" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto">
          {error && (
            <div className="alert alert-danger mb-4 flex rounded-md" role="alert">
              <i className="ri-error-warning-line me-2 text-[1.125rem]" />
              <span className="text-[0.875rem]">{error}</span>
            </div>
          )}
          <div className="space-y-4">
            {isAdmin && !isEdit && (
              <div>
                <label className="block text-[0.8125rem] font-semibold mb-2">총판</label>
                <select className="form-select rounded-md w-full !py-2.5 !text-[0.8125rem] bg-white dark:bg-bodybg border-defaultborder dark:border-white/10" value={form.partnerId} onChange={(e) => setForm((p) => ({ ...p, partnerId: e.target.value }))}>
                  <option value="">본사 직속 매장</option>
                  {partners.map((pt) => (
                    <option key={pt.id} value={pt.id}>{displayPartnerName(pt)}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-[0.8125rem] font-semibold mb-2">표시명 (화면에 보일 이름)</label>
              <input type="text" className="ti-form-control w-full rounded-sm border border-defaultborder dark:border-white/10 bg-white dark:bg-bodybg px-3 py-2.5 text-[0.8125rem]" value={form.nickName} onChange={(e) => setForm((p) => ({ ...p, nickName: e.target.value }))} placeholder="예: 강남점" />
            </div>
            {!isEdit && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[0.8125rem] font-semibold mb-2">{t("firstName")}</label>
                    <input type="text" className="ti-form-control w-full rounded-sm border border-defaultborder dark:border-white/10 bg-white dark:bg-bodybg px-3 py-2.5 text-[0.8125rem]" value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="block text-[0.8125rem] font-semibold mb-2">{t("lastName")}</label>
                    <input type="text" className="ti-form-control w-full rounded-sm border border-defaultborder dark:border-white/10 bg-white dark:bg-bodybg px-3 py-2.5 text-[0.8125rem]" value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} required />
                  </div>
                </div>
                <div>
                  <label className="block text-[0.8125rem] font-semibold mb-2">{t("email")}</label>
                  <input type="email" className="ti-form-control w-full rounded-sm border border-defaultborder dark:border-white/10 bg-white dark:bg-bodybg px-3 py-2.5 text-[0.8125rem]" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-[0.8125rem] font-semibold mb-2">{t("password")}</label>
                  <input type="password" className="ti-form-control w-full rounded-sm border border-defaultborder dark:border-white/10 bg-white dark:bg-bodybg px-3 py-2.5 text-[0.8125rem]" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} placeholder="6자 이상" minLength={6} required />
                </div>
              </>
            )}
            <div>
              <label className="block text-[0.8125rem] font-semibold mb-2">{t("commissionRate")}</label>
              <input type="number" min={0} max={100} step={0.1} className="ti-form-control w-full rounded-sm border border-defaultborder dark:border-white/10 bg-white dark:bg-bodybg px-3 py-2.5 text-[0.8125rem]" value={form.commissionRatePercent} onChange={(e) => setForm((p) => ({ ...p, commissionRatePercent: Number(e.target.value) || 0 }))} />
            </div>
            <div>
              <label className="block text-[0.8125rem] font-semibold mb-2">{t("walletNetwork")}</label>
              <select className="ti-form-select rounded-sm w-full !py-2.5 !px-3 !text-[0.8125rem] border border-defaultborder dark:border-white/10 bg-white dark:bg-bodybg" value={form.walletNetwork} onChange={(e) => setForm((p) => ({ ...p, walletNetwork: e.target.value }))}>
                <option value="TRON">TRON</option>
                <option value="POLYGON">POLYGON</option>
                <option value="ETH">ETH</option>
              </select>
            </div>
            <div>
              <label className="block text-[0.8125rem] font-semibold mb-2">{t("walletAddress")}</label>
              <input type="text" className="ti-form-control w-full rounded-sm border border-defaultborder dark:border-white/10 bg-white dark:bg-bodybg px-3 py-2.5 text-[0.8125rem]" value={form.walletAddress} onChange={(e) => setForm((p) => ({ ...p, walletAddress: e.target.value }))} required />
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <button type="submit" className={`ti-btn bg-primary text-white btn-wave font-semibold rounded-md !py-2.5 !px-5 !text-[0.875rem] ${loading ? "ti-btn-loader btn-loader" : ""}`} disabled={loading}>
              {loading ? <span className="ti-spinner !w-4 !h-4 !border-2 me-1.5 inline-block" /> : null}
              {t("save")}
            </button>
            <button type="button" className="ti-btn ti-btn-outline-danger btn-wave font-medium rounded-md !py-2.5 !px-5 !text-[0.875rem]" onClick={onClose} disabled={loading}>
              {t("cancel")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
