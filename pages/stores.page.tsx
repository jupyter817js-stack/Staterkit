'use client';

import React, { Fragment, useCallback, useEffect, useState } from "react";
import type { GetServerSideProps } from "next";
import Seo from "@/shared/layout-components/seo/seo";
import { getCurrentUser } from "@/shared/api/users";
import type { CurrentUser } from "@/shared/types/users";
import { USER_LEVEL } from "@/shared/types/users";
import { useRouter } from "next/router";
import { listStores, createStore, updateStore, deleteStore, getStoreJoinLink } from "@/shared/api/stores";
import { listPartners } from "@/shared/api/partners";
import type { Store } from "@/shared/types/partner-store";
import type { Partner } from "@/shared/types/partner-store";
import { displayStoreName, displayPartnerName } from "@/shared/types/partner-store";
import { useLanguage } from "@/shared/i18n/LanguageContext";
import StoresPageHeader from "./components/stores/StoresPageHeader";
import StoreFormModal from "./components/stores/StoreFormModal";
import ToastContainer from "@/shared/ui/ToastContainer";
import type { ToastItem } from "@/shared/ui/Toast";

export default function StoresPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<Store[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [copyId, setCopyId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const isAdmin = currentUser && (currentUser.level === USER_LEVEL.SUPER_ADMIN || currentUser.level === USER_LEVEL.ADMIN);
  const isPartner = currentUser?.level === USER_LEVEL.PARTNER;
  const isStore = currentUser?.level === USER_LEVEL.STORE;
  const canAccess = isAdmin || isPartner || isStore;
  const myPartnerId = isPartner ? (currentUser?.managed_partner_id ?? (currentUser as unknown as { managedPartnerId?: string })?.managedPartnerId) ?? null : null;
  const myStoreId = isStore ? (currentUser?.managed_store_id ?? (currentUser as unknown as { managedStoreId?: string })?.managedStoreId) ?? null : null;

  const loadStores = useCallback((partnerId?: string) => {
    listStores(partnerId).then(setStores);
  }, []);
  const loadPartners = useCallback(() => {
    listPartners().then(setPartners);
  }, []);

  const addToast = useCallback((type: ToastItem["type"], message: string) => {
    setToasts((prev) => [...prev, { id: `toast-${Date.now()}`, type, message }]);
  }, []);
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  useEffect(() => {
    getCurrentUser().then((me) => {
      setCurrentUser(me ?? null);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!canAccess) return;
    if (isAdmin) {
      loadPartners();
      loadStores();
    } else if (isPartner && myPartnerId) {
      loadPartners();
      loadStores(myPartnerId);
    } else if (isStore && myStoreId) {
      loadPartners();
      loadStores();
    }
  }, [canAccess, isAdmin, isPartner, isStore, myPartnerId, myStoreId, loadStores, loadPartners]);

  const handleAdd = useCallback(() => {
    setEditingStore(null);
    setModalMode("add");
  }, []);

  const handleEdit = useCallback((s: Store) => {
    setEditingStore(s);
    setModalMode("edit");
  }, []);

  const handleModalSaved = useCallback(
    (s: Store, wasEdit: boolean) => {
      setStores((prev) => {
        const idx = prev.findIndex((x) => x.id === s.id);
        if (idx >= 0) return prev.map((x, i) => (i === idx ? s : x));
        return [...prev, s];
      });
      setModalMode(null);
      setEditingStore(null);
      addToast("success", wasEdit ? "매장이 수정되었습니다." : "매장이 등록되었습니다.");
    },
    [addToast]
  );

  const handleDelete = useCallback(
    async (s: Store) => {
      if (!confirm(`"${displayStoreName(s)}" 매장을 삭제하시겠습니까?`)) return;
      try {
        await deleteStore(s.id);
        setStores((prev) => prev.filter((x) => x.id !== s.id));
        addToast("success", "매장이 삭제되었습니다.");
      } catch (err) {
        addToast("error", err instanceof Error ? err.message : "삭제에 실패했습니다.");
      }
    },
    [addToast]
  );

  const copyLink = useCallback((storeId: string) => {
    const url = getStoreJoinLink(storeId);
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopyId(storeId);
        setTimeout(() => setCopyId(null), 2000);
      });
    }
  }, []);

  const getPartnerDisplay = useCallback(
    (s: Store) => {
      if (!s.partnerId) return "본사 직속";
      const p = partners.find((x) => x.id === s.partnerId);
      return p ? displayPartnerName(p) : s.partnerId;
    },
    [partners]
  );

  if (loading) {
    return (
      <Fragment>
        <Seo title={t("storeManagement")} />
        <div className="box-body flex items-center justify-center py-20">
          <i className="ri-loader-4-line text-4xl text-primary animate-spin" />
        </div>
      </Fragment>
    );
  }

  if (!canAccess) {
    router.replace("/login");
    return null;
  }

  if (isPartner && !myPartnerId) {
    return (
      <Fragment>
        <Seo title={t("storeManagement")} />
        <div className="box">
          <div className="box-body">
            <p className="text-defaulttextcolor/70">총판 정보가 없습니다. 관리자에게 문의하세요.</p>
          </div>
        </div>
      </Fragment>
    );
  }

  return (
    <Fragment>
      <Seo title={t("storeManagement")} />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          <StoresPageHeader onRefresh={() => (isAdmin ? loadStores() : loadStores(myPartnerId ?? undefined))} onAdd={handleAdd} loading={loading} />
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[1rem] text-defaulttextcolor dark:text-defaulttextcolor/80 mb-0 flex items-center gap-2">
                <i className="ri-store-2-line text-primary" />
                매장 목록
              </h3>
              <span className="text-[0.8125rem] text-primary font-medium bg-primary/10 dark:bg-primary/20 dark:text-primary rounded-full py-1 px-3">
                {stores.length}건
              </span>
            </div>
            <div className="rounded-2xl overflow-hidden border border-defaultborder/70 dark:border-white/10 bg-white dark:bg-bodybg shadow-lg shadow-black/5 dark:shadow-black/20">
              <div className="overflow-x-auto">
                {stores.length === 0 ? (
                  <div className="p-8 text-center text-[0.8125rem] text-[#8c9097] dark:text-white/50">
                    등록된 매장이 없습니다. &quot;{t("addStore")}&quot;로 추가하세요.
                  </div>
                ) : (
                  <table className="table min-w-full text-[0.8125rem] border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-100/90 to-gray-50/80 dark:from-white/[0.06] dark:to-white/[0.02] border-b-2 border-defaultborder/80 dark:border-white/10">
                        <th className="text-start text-[0.7rem] sm:text-[0.8rem] font-semibold uppercase tracking-wider text-[#5a5e66] dark:text-white/70 py-3.5 pl-4 pr-3"><i className="ri-store-2-line me-1 align-middle" />표시명</th>
                        <th className="text-start text-[0.7rem] sm:text-[0.8rem] font-semibold uppercase tracking-wider text-[#5a5e66] dark:text-white/70 py-3.5 px-3"><i className="ri-team-line me-1 align-middle" />총판</th>
                        <th className="text-start text-[0.7rem] sm:text-[0.8rem] font-semibold uppercase tracking-wider text-[#5a5e66] dark:text-white/70 py-3.5 px-3"><i className="ri-percent-line me-1 align-middle" />{t("commissionRate")}</th>
                        <th className="text-start text-[0.7rem] sm:text-[0.8rem] font-semibold uppercase tracking-wider text-[#5a5e66] dark:text-white/70 py-3.5 px-3"><i className="ri-wallet-3-line me-1 align-middle" />{t("walletNetwork")}</th>
                        <th className="text-start text-[0.7rem] sm:text-[0.8rem] font-semibold uppercase tracking-wider text-[#5a5e66] dark:text-white/70 py-3.5 px-3 hidden sm:table-cell"><i className="ri-map-pin-line me-1 align-middle" />지갑 주소</th>
                        <th className="text-start text-[0.7rem] sm:text-[0.8rem] font-semibold uppercase tracking-wider text-[#5a5e66] dark:text-white/70 py-3.5 pl-3 pr-4"><i className="ri-links-line me-1 align-middle" />링크 · 조작</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-defaultborder/60 dark:divide-white/10">
                      {stores.map((s) => {
                        const joinUrl = getStoreJoinLink(s.id);
                        return (
                          <tr key={s.id} className="hover:bg-primary/[0.05] dark:hover:bg-white/[0.04] transition-colors">
                            <td className="py-2.5 sm:py-3 pl-4 pr-3 font-medium text-defaulttextcolor dark:text-white/80">
                              {displayStoreName(s)}
                            </td>
                            <td className="py-2.5 sm:py-3 px-3 text-[#6b7280] dark:text-white/50">{getPartnerDisplay(s)}</td>
                            <td className="py-2.5 sm:py-3 px-3 text-[#6b7280] dark:text-white/50">{s.commissionRatePercent != null ? `${s.commissionRatePercent}%` : "—"}</td>
                            <td className="py-2.5 sm:py-3 px-3 text-[#6b7280] dark:text-white/50">{s.walletNetwork ?? "—"}</td>
                            <td className="py-2.5 sm:py-3 px-3 text-[#6b7280] dark:text-white/50 max-w-[8rem] truncate hidden sm:table-cell" title={s.walletAddress}>{s.walletAddress || "—"}</td>
                            <td className="py-2.5 sm:py-3 pl-3 pr-4 align-middle">
                              <div className="flex items-center gap-2 flex-nowrap justify-between min-w-0">
                                <span className="relative inline-block min-w-0">
                                  <button
                                    type="button"
                                    className="text-primary hover:text-primary/80 text-[0.75rem] truncate max-w-[10rem] sm:max-w-[14rem] text-left bg-transparent border-0 p-0 cursor-pointer"
                                    onClick={() => copyLink(s.id)}
                                    title={joinUrl}
                                  >
                                    {joinUrl}
                                  </button>
                                  {copyId === s.id && (
                                    <span className="absolute left-0 bottom-full mb-1 px-2 py-1 text-[0.7rem] font-medium text-white bg-gray-800 dark:bg-gray-700 rounded shadow-lg whitespace-nowrap z-10">
                                      Copied
                                    </span>
                                  )}
                                </span>
                                <div className="flex items-center gap-0.5 shrink-0">
                                  <button type="button" className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-primary hover:bg-primary/10" onClick={() => handleEdit(s)} title="수정">
                                    <i className="ri-pencil-line text-[1rem]" />
                                  </button>
                                  <button type="button" className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-danger hover:bg-danger/10" onClick={() => handleDelete(s)} title="삭제">
                                    <i className="ri-delete-bin-line text-[1rem]" />
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {modalMode && (
        <StoreFormModal
          mode={modalMode}
          store={editingStore ?? undefined}
          partners={partners}
          isAdmin={!!isAdmin}
          myPartnerId={myPartnerId}
          onClose={() => { setModalMode(null); setEditingStore(null); }}
          onSaved={handleModalSaved}
        />
      )}
    </Fragment>
  );
}

StoresPage.layout = "Contentlayout";

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};
