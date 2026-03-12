'use client';

import React, { Fragment, useCallback, useEffect, useState } from "react";
import type { GetServerSideProps } from "next";
import Seo from "@/shared/layout-components/seo/seo";
import { getCurrentUser, listUsers, updateUser } from "@/shared/api/users";
import type { CurrentUser, User } from "@/shared/types/users";
import { USER_LEVEL, USER_LEVEL_LABEL } from "@/shared/types/users";
import { useRouter } from "next/router";
import { useLanguage } from "@/shared/i18n/LanguageContext";
import { getPartner, listPartners } from "@/shared/api/partners";
import { getStore, listStores } from "@/shared/api/stores";
import type { Partner } from "@/shared/types/partner-store";
import type { Store } from "@/shared/types/partner-store";
import { displayPartnerName, displayStoreName } from "@/shared/types/partner-store";
import { buildOrgTree, buildPartnerScopeTree, buildStoreScopeTree } from "@/shared/utils/orgTree";
import type { OrgTreeNode } from "@/shared/utils/orgTree";
import UsersPageHeader from "./components/users/UsersPageHeader";
import UsersDataTable from "./components/users/UsersDataTable";
import OrgTreeView from "./components/users/OrgTreeView";
import ToastContainer from "@/shared/ui/ToastContainer";
import type { ToastItem } from "@/shared/ui/Toast";

/** 유저 관리 페이지 접근: 본사/관리자(0), 총판(1), 매장(2) */
const canAccessUserManagement = (level: number) =>
  level === USER_LEVEL.SUPER_ADMIN || level === USER_LEVEL.ADMIN || level === USER_LEVEL.PARTNER || level === USER_LEVEL.STORE;

export default function UsersPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const currentUserLevel = currentUser?.level ?? 10;
  const isSuperAdmin = currentUserLevel === USER_LEVEL.SUPER_ADMIN || currentUserLevel === USER_LEVEL.ADMIN;
  const isPartner = currentUserLevel === USER_LEVEL.PARTNER;
  const isStore = currentUserLevel === USER_LEVEL.STORE;
  const managedPartnerId = (currentUser as CurrentUser & { managed_partner_id?: string })?.managed_partner_id ?? (currentUser as CurrentUser & { managedPartnerId?: string })?.managedPartnerId ?? null;
  const managedStoreId = (currentUser as CurrentUser & { managed_store_id?: string })?.managed_store_id ?? (currentUser as CurrentUser & { managedStoreId?: string })?.managedStoreId ?? null;

  const addToast = useCallback((type: ToastItem["type"], message: string) => {
    setToasts((prev) => [
      ...prev,
      { id: `toast-${Date.now()}`, type, message },
    ]);
  }, []);
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const me = await getCurrentUser();
      setCurrentUser(me ?? null);
      if (!me) return;
      const midPartner = (me as CurrentUser & { managed_partner_id?: string }).managed_partner_id ?? (me as CurrentUser & { managedPartnerId?: string }).managedPartnerId;
      const midStore = (me as CurrentUser & { managed_store_id?: string }).managed_store_id ?? (me as CurrentUser & { managedStoreId?: string }).managedStoreId;
      const params: { per_page: number; partner_id?: string; store_id?: string } = { per_page: 500 };
      if (me.level === USER_LEVEL.PARTNER && midPartner) params.partner_id = midPartner;
      if (me.level === USER_LEVEL.STORE && midStore) params.store_id = midStore;
      // 총판/매장관리자 계정에서는 목록 API 호출 안 함(403). me.managed_partner_id / managed_store_id로 단건만 조회
      const needPartners = me.level === USER_LEVEL.SUPER_ADMIN || me.level === USER_LEVEL.ADMIN;
      const needStores = me.level === USER_LEVEL.SUPER_ADMIN || me.level === USER_LEVEL.ADMIN || (me.level === USER_LEVEL.PARTNER && midPartner);
      const [userRes, partnersRes, storesRes] = await Promise.all([
        listUsers(params),
        needPartners ? listPartners() : Promise.resolve([]),
        needStores ? (me.level === USER_LEVEL.PARTNER && midPartner ? listStores(midPartner) : listStores()) : Promise.resolve([]),
      ]);
      let userList = userRes.users;
      let partnersList = Array.isArray(partnersRes) ? partnersRes : [];
      let storesList = Array.isArray(storesRes) ? storesRes : [];
      if (me.level === USER_LEVEL.PARTNER && midPartner) {
        const single = await getPartner(midPartner);
        if (single) partnersList = [single];
      }
      if (me.level === USER_LEVEL.STORE && midStore) {
        const single = await getStore(midStore);
        if (single) storesList = [single];
      }
      if (me.level === USER_LEVEL.PARTNER || me.level === USER_LEVEL.STORE) {
        const hasMe = userList.some((u: User) => u.id === me.id);
        if (!hasMe) {
          let displayNick = "";
          if (me.level === USER_LEVEL.PARTNER && midPartner) {
            const p = partnersList.find((x: Partner) => x.id === midPartner);
            displayNick = p ? displayPartnerName(p) : "";
          } else if (me.level === USER_LEVEL.STORE && midStore) {
            const s = storesList.find((x: Store) => x.id === midStore);
            displayNick = s ? displayStoreName(s) : "";
          }
          const meAsUser: User = {
            id: me.id,
            email: me.email ?? "",
            firstName: (me as CurrentUser & { firstname?: string }).firstname ?? (me as CurrentUser & { firstName?: string }).firstName ?? "",
            lastName: (me as CurrentUser & { lastname?: string }).lastname ?? (me as CurrentUser & { lastName?: string }).lastName ?? "",
            registerTime: me.registerTime ?? "",
            lastLoginTime: me.lastLoginTime ?? null,
            level: me.level,
            levelName: USER_LEVEL_LABEL[me.level] ?? "",
            status: "ACTIVE",
            parentId: null,
            nickName: displayNick,
            storeId: me.level === USER_LEVEL.STORE ? (me.managed_store_id ?? null) : null,
            partnerId: me.level === USER_LEVEL.PARTNER ? (me.managed_partner_id ?? null) : null,
          };
          userList = [meAsUser, ...userList];
        }
      }
      setUsers(userList);
      setPartners(partnersList);
      setStores(storesList);
    } catch (e) {
      setError(e instanceof Error ? e.message : "데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const treeRoots = React.useMemo((): OrgTreeNode[] => {
    if (!currentUser) return [];
    if (isSuperAdmin) {
      return buildOrgTree(users, partners, stores, { rootLabel: t("orgTreeRoot") });
    }
    if (isPartner && managedPartnerId) {
      const partner = partners.find((p) => p.id === managedPartnerId) ?? {
        id: managedPartnerId,
        commissionRatePercent: 0,
        walletNetwork: "",
        walletAddress: "",
      };
      return buildPartnerScopeTree(users, partner, stores.filter((s) => s.partnerId === managedPartnerId));
    }
    if (isStore && managedStoreId) {
      const store = stores.find((s) => s.id === managedStoreId) ?? {
        id: managedStoreId,
        partnerId: null,
        commissionRatePercent: 0,
        walletNetwork: "",
        walletAddress: "",
      };
      return buildStoreScopeTree(users, store);
    }
    return [];
  }, [currentUser, isSuperAdmin, isPartner, isStore, users, partners, stores, managedPartnerId, managedStoreId, t]);

  const STATUS_LABEL: Record<string, string> = {
    ACTIVE: "활성",
    PENDING: "대기",
    SUSPENDED: "정지",
  };

  /** 귀속 컬럼 라벨 (총판/매장 표시명으로 표시) */
  const getAttributionLabel = useCallback(
    (u: User) => {
      if (u.storeId) {
        const s = stores.find((x) => x.id === u.storeId);
        return s ? `매장: ${displayStoreName(s)}` : `매장: ${u.storeId}`;
      }
      if (u.partnerId) {
        const p = partners.find((x) => x.id === u.partnerId);
        return p ? `총판: ${displayPartnerName(p)}` : `총판: ${u.partnerId}`;
      }
      return "본사 직속";
    },
    [partners, stores]
  );

  /** 총판: 자기·직속·매장관리자만 전체 기능, 매장 회원은 열람만. 매장: 자기·해당 매장 회원만 전체 기능. 슈퍼관리자: 전체 권한(UI는 활성/삭제만) */
  const getCanManageUser = useCallback(
    (target: User) => {
      if (isSuperAdmin) return true;
      const targetPartnerId = (target as User & { partnerId?: string }).partnerId ?? target.partnerId;
      const targetStoreId = (target as User & { managed_store_id?: string }).managed_store_id ?? target.storeId;
      if (isPartner && managedPartnerId) {
        if (target.id === currentUser?.id) return true;
        if (target.level === USER_LEVEL.PARTNER && targetPartnerId === managedPartnerId) return true;
        if (target.level === USER_LEVEL.STORE) {
          const underMyStores = stores.some((s) => s.partnerId === managedPartnerId && s.id === targetStoreId);
          return !!underMyStores;
        }
        if (target.level === USER_LEVEL.USER) {
          if (target.storeId) return false;
          if (targetPartnerId === managedPartnerId) return true;
          return false;
        }
        return false;
      }
      if (isStore && managedStoreId) {
        if (target.id === currentUser?.id) return true;
        if (target.level === USER_LEVEL.USER && (target.storeId === managedStoreId || targetStoreId === managedStoreId)) return true;
        return false;
      }
      return true;
    },
    [isSuperAdmin, isPartner, isStore, managedPartnerId, managedStoreId, currentUser?.id, stores]
  );

  const handleLevelChange = useCallback(
    async (user: User, level: number) => {
      if (editingId === user.id) return;
      setEditingId(user.id);
      try {
        await updateUser(user.id, { level });
        setUsers((prev) =>
          prev.map((u) =>
            u.id === user.id ? { ...u, level } : u
          )
        );
        const label = USER_LEVEL_LABEL[level] ?? String(level);
        addToast("success", `${user.firstName} ${user.lastName}님의 등급이 ${label}(으)로 변경되었습니다.`);
      } catch {
        // 롤백 또는 에러 표시
      } finally {
        setEditingId(null);
      }
    },
    [editingId, addToast]
  );

  const handleStatusChange = useCallback(
    async (user: User, status: string) => {
      if (editingId === user.id) return;
      setEditingId(user.id);
      try {
        await updateUser(user.id, { status });
        setUsers((prev) =>
          prev.map((u) =>
            u.id === user.id ? { ...u, status } : u
          )
        );
        const label = STATUS_LABEL[status] ?? status;
        addToast("success", `${user.firstName} ${user.lastName}님의 상태가 ${label}(으)로 변경되었습니다.`);
      } catch {
        // 롤백 또는 에러 표시
      } finally {
        setEditingId(null);
      }
    },
    [editingId, addToast]
  );

  const handleNameEdit = useCallback(
    (updated: User) => {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === updated.id
            ? { ...u, firstName: updated.firstName, lastName: updated.lastName }
            : u
        )
      );
      addToast(
        "success",
        `${updated.firstName} ${updated.lastName}님의 이름이 저장되었습니다.`
      );
    },
    [addToast]
  );

  const handleDeleteClick = useCallback(() => {
    // 삭제 기능은 추후 구현 (슈퍼관리자 전용)
  }, []);

  const handleDeleteForbidden = useCallback(() => {
    addToast("info", "삭제는 슈퍼관리자에게 문의하세요.");
  }, [addToast]);

  const isPartnerOrStore = isPartner || isStore;

  if (loading && !currentUser) {
    return (
      <Fragment>
        <Seo title="유저 관리" />
        <div className="grid grid-cols-12 gap-x-6">
          <div className="col-span-12">
            <div className="box border-0 shadow-none bg-transparent dark:bg-transparent">
              <div className="box-body flex items-center justify-center py-20">
                <i className="ri-loader-4-line text-4xl text-primary animate-spin"></i>
              </div>
            </div>
          </div>
        </div>
      </Fragment>
    );
  }

  if (!currentUser || !canAccessUserManagement(currentUser.level)) {
    return (
      <Fragment>
        <Seo title="유저 관리" />
        <div className="grid grid-cols-12 gap-x-6">
          <div className="col-span-12">
            <div className="box">
              <div className="box-body flex flex-col items-center justify-center py-20">
                <span className="!w-16 !h-16 rounded-2xl bg-danger/10 inline-flex items-center justify-center text-danger mb-4">
                  <i className="ri-lock-line text-3xl"></i>
                </span>
                <p className="text-defaulttextcolor dark:text-white/80 text-[0.9375rem] mb-0 font-medium">
                  접근 권한이 없습니다.
                </p>
                <p className="text-[#8c9097] dark:text-white/50 text-[0.8125rem] mt-1">
                  유저 관리는 본사/관리자, 총판, 매장만 이용할 수 있습니다.
                </p>
                <button
                  type="button"
                  className="ti-btn ti-btn-primary mt-4 btn-wave !font-medium !text-[0.85rem] !rounded-[0.35rem] !py-[0.51rem] !px-[0.86rem]"
                  onClick={() => router.push("/login")}
                >
                  홈으로
                </button>
              </div>
            </div>
          </div>
        </div>
      </Fragment>
    );
  }

  return (
    <Fragment>
      <Seo title="유저 관리" />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          <UsersPageHeader onRefresh={fetchData} loading={loading} />
          {error && (
            <div className="alert alert-danger mb-4 flex" role="alert">
              <i className="ri-error-warning-line me-2 text-[1.125rem]"></i>
              <span className="text-[0.875rem]">{error}</span>
            </div>
          )}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[1rem] text-defaulttextcolor dark:text-defaulttextcolor/80 mb-0 flex items-center gap-2">
                <i className="ri-user-line text-primary"></i>
                회원 목록 (계층 구조)
              </h3>
              <span className="text-[0.8125rem] text-primary font-medium bg-primary/10 dark:bg-primary/20 dark:text-primary rounded-full py-1 px-3">
                {users.length}명
              </span>
            </div>
            {treeRoots.length > 0 ? (
              <OrgTreeView
                treeRoots={treeRoots}
                currentUserLevel={currentUserLevel}
                isSuperAdmin={isSuperAdmin}
                isPartnerOrStore={isPartnerOrStore}
                getCanManageUser={getCanManageUser}
                getAttributionLabel={getAttributionLabel}
                editingId={editingId}
                onLevelChange={handleLevelChange}
                onStatusChange={handleStatusChange}
                onNameEdit={handleNameEdit}
                onDeleteClick={handleDeleteClick}
                onDeleteForbidden={handleDeleteForbidden}
              />
            ) : (
              <UsersDataTable
                users={users}
                currentUserLevel={currentUserLevel}
                isSuperAdmin={isSuperAdmin}
                isPartnerOrStore={isPartnerOrStore}
                getCanManageUser={getCanManageUser}
                getAttributionLabel={getAttributionLabel}
                editingId={editingId}
                onLevelChange={handleLevelChange}
                onStatusChange={handleStatusChange}
                onNameEdit={handleNameEdit}
                onDeleteClick={handleDeleteClick}
                onDeleteForbidden={handleDeleteForbidden}
              />
            )}
          </div>
        </div>
      </div>
    </Fragment>
  );
}

UsersPage.layout = "Contentlayout";

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};
