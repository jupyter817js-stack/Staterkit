import type { User } from "@/shared/types/users";
import type { Partner } from "@/shared/types/partner-store";
import type { Store } from "@/shared/types/partner-store";
import { displayPartnerName, displayStoreName } from "@/shared/types/partner-store";
import { USER_LEVEL } from "@/shared/types/users";

/** 트리 노드: 슈퍼관리자(루트) / 총판 / 매장(본사 직속 포함) / 회원(유저) */
export type OrgTreeNode =
  | { type: "root"; id: "root"; label: string; children: OrgTreeNode[] }
  | {
      type: "partner";
      id: string;
      label: string;
      partner: Partner;
      managerUser?: User;
      children: OrgTreeNode[];
    }
  | {
      type: "store";
      id: string;
      label: string;
      store: Store;
      managerUser?: User;
      isDirect: boolean;
      children: OrgTreeNode[];
    }
  | { type: "user"; user: User; children: [] };

/** 슈퍼관리자 기준 전체 조직 트리 구성
 * - 루트 밑: 총판들 → 각 총판 밑 매장 + 직속 회원
 * - 루트 밑: 본사 직속 매장들 → 각 매장 밑 회원
 * - 루트 밑: 본사 직속 회원
 */
export function buildOrgTree(
  users: User[],
  partners: Partner[],
  stores: Store[],
  options: {
    rootLabel?: string;
    /** 본사 직속 매장: partnerId가 없거나 빈 문자열인 store */
    isDirectStore?: (s: Store) => boolean;
  } = {}
): OrgTreeNode[] {
  const rootLabel = options.rootLabel ?? "슈퍼관리자";
  const isDirectStore = options.isDirectStore ?? ((s: Store) => !s.partnerId || s.partnerId.trim() === "");

  const partnerList = partners;
  const storeList = stores;
  const memberUsers = users.filter((u) => u.level === USER_LEVEL.USER);
  const partnerUsers = users.filter((u) => u.level === USER_LEVEL.PARTNER);
  const storeUsers = users.filter((u) => u.level === USER_LEVEL.STORE);

  /** 총판 매니저: partners[].managerUserId(백엔드 반환) 우선, 없으면 users 목록의 managed_partner_id로 매핑 */
  const managerUserIdByPartnerId = new Map<string, number>();
  partnerList.forEach((p) => {
    if (p.managerUserId != null && Number.isFinite(p.managerUserId)) {
      managerUserIdByPartnerId.set(p.id, p.managerUserId as number);
    }
  });
  partnerUsers.forEach((u) => {
    const pid = (u as User & { managed_partner_id?: string }).managed_partner_id ?? (u as User & { managedPartnerId?: string }).managedPartnerId ?? (u as User & { partnerId?: string }).partnerId;
    if (pid && !managerUserIdByPartnerId.has(pid)) managerUserIdByPartnerId.set(pid, u.id);
  });
  /** 매장 매니저: stores[].managerUserId(백엔드 반환) 우선, 없으면 users 목록의 managed_store_id로 매핑 */
  const managerUserIdByStoreId = new Map<string, number>();
  storeList.forEach((s) => {
    if (s.managerUserId != null && Number.isFinite(s.managerUserId)) {
      managerUserIdByStoreId.set(s.id, s.managerUserId as number);
    }
  });
  storeUsers.forEach((u) => {
    const sid = (u as User & { managed_store_id?: string }).managed_store_id ?? (u as User & { managedStoreId?: string }).managedStoreId ?? (u as User & { storeId?: string }).storeId;
    if (sid && !managerUserIdByStoreId.has(sid)) managerUserIdByStoreId.set(sid, u.id);
  });

  const directStores = storeList.filter(isDirectStore);
  const partnerStores = storeList.filter((s) => !isDirectStore(s));

  const directMembers = memberUsers.filter((u) => !u.partnerId && !u.storeId);
  const membersByPartnerId = new Map<string, User[]>();
  const membersByStoreId = new Map<string, User[]>();
  memberUsers.forEach((u) => {
    if (u.storeId) {
      const arr = membersByStoreId.get(u.storeId) ?? [];
      arr.push(u);
      membersByStoreId.set(u.storeId, arr);
    } else if (u.partnerId) {
      const arr = membersByPartnerId.get(u.partnerId) ?? [];
      arr.push(u);
      membersByPartnerId.set(u.partnerId, arr);
    }
  });

  const partnerNodes: OrgTreeNode[] = partnerList.map((p) => {
    const managerUserId = managerUserIdByPartnerId.get(p.id);
    const managerUser = managerUserId != null ? users.find((u) => u.id === managerUserId) : undefined;
    const storesUnder = partnerStores.filter((s) => s.partnerId === p.id);
    const directMembersUnder = membersByPartnerId.get(p.id) ?? [];

    const storeChildren: OrgTreeNode[] = storesUnder.map((s) => {
      const managerUid = managerUserIdByStoreId.get(s.id);
      const manager = managerUid != null ? users.find((u) => u.id === managerUid) : undefined;
      const members = membersByStoreId.get(s.id) ?? [];
      const storeUserChildren: OrgTreeNode[] = manager
        ? [{ type: "user" as const, user: manager, children: [] as [] }, ...members.map((u) => ({ type: "user" as const, user: u, children: [] as [] }))]
        : members.map((u) => ({ type: "user" as const, user: u, children: [] as [] }));
      return {
        type: "store" as const,
        id: `store-${s.id}`,
        label: displayStoreName(s),
        store: s,
        managerUser: manager,
        isDirect: false,
        children: storeUserChildren,
      };
    });
    const memberChildren: OrgTreeNode[] = directMembersUnder.map((u) => ({
      type: "user" as const,
      user: u,
      children: [] as [],
    }));
    const partnerUserChild: OrgTreeNode[] = managerUser
      ? [{ type: "user" as const, user: managerUser, children: [] as [] }]
      : [];
    const children = [...partnerUserChild, ...storeChildren, ...memberChildren].sort((a, b) => {
      const order = (n: OrgTreeNode) => (n.type === "user" ? 0 : n.type === "store" ? 1 : 2);
      return order(a) - order(b) || (a.type === "store" && b.type === "store" ? String(a.id).localeCompare(String(b.id)) : 0);
    });

    return {
      type: "partner" as const,
      id: `partner-${p.id}`,
      label: displayPartnerName(p),
      partner: p,
      managerUser,
      children,
    };
  });

  const directStoreNodes: OrgTreeNode[] = directStores.map((s) => {
    const managerUid = managerUserIdByStoreId.get(s.id);
    const manager = managerUid != null ? users.find((u) => u.id === managerUid) : undefined;
    const members = membersByStoreId.get(s.id) ?? [];
    const storeUserChildren: OrgTreeNode[] = manager
      ? [{ type: "user" as const, user: manager, children: [] as [] }, ...members.map((u) => ({ type: "user" as const, user: u, children: [] as [] }))]
      : members.map((u) => ({ type: "user" as const, user: u, children: [] as [] }));
    return {
      type: "store" as const,
      id: `store-${s.id}`,
      label: `${displayStoreName(s)} (본사 직속)`,
      store: s,
      managerUser: manager,
      isDirect: true,
      children: storeUserChildren,
    };
  });

  const directMemberNodes: OrgTreeNode[] = directMembers.map((u) => ({
    type: "user" as const,
    user: u,
    children: [] as [],
  }));

  const rootChildren: OrgTreeNode[] = [
    ...partnerNodes,
    ...directStoreNodes,
    ...directMemberNodes,
  ].sort((a, b) => {
    const order = (n: OrgTreeNode) =>
      n.type === "partner" ? 0 : n.type === "store" ? 1 : 2;
    const sortId = (n: OrgTreeNode) =>
      n.type === "user" ? String(n.user.id) : String(n.id);
    return order(a) - order(b) || sortId(a).localeCompare(sortId(b));
  });

  return [
    {
      type: "root",
      id: "root",
      label: rootLabel,
      children: rootChildren,
    },
  ];
}

/** 총판 권한일 때: 해당 총판 하나를 루트로, 총판 본인 + 매장(매장관리자 + 회원) + 직속 회원 */
export function buildPartnerScopeTree(
  users: User[],
  partner: Partner,
  stores: Store[],
  options: { rootLabel?: string } = {}
): OrgTreeNode[] {
  const rootLabel = options.rootLabel ?? displayPartnerName(partner);
  const storesUnder = stores.filter((s) => s.partnerId === partner.id);
  const memberUsers = users.filter((u) => u.level === USER_LEVEL.USER);
  const storeUsers = users.filter((u) => u.level === USER_LEVEL.STORE);
  const membersByStoreId = new Map<string, User[]>();
  const directMembers: User[] = [];
  memberUsers.forEach((u) => {
    if (u.storeId) {
      const arr = membersByStoreId.get(u.storeId) ?? [];
      arr.push(u);
      membersByStoreId.set(u.storeId, arr);
    } else if (u.partnerId === partner.id) directMembers.push(u);
  });

  const partnerUser = users.find(
    (u) => u.level === USER_LEVEL.PARTNER && ((u as User & { partnerId?: string }).partnerId === partner.id || (u as User & { managed_partner_id?: string }).managed_partner_id === partner.id)
  );
  const partnerUserChild: OrgTreeNode[] = partnerUser
    ? [{ type: "user" as const, user: partnerUser, children: [] as [] }]
    : [];

  const storeNodes: OrgTreeNode[] = storesUnder.map((s) => {
    const members = membersByStoreId.get(s.id) ?? [];
    const managerUser = storeUsers.find(
      (u) =>
        (u as User & { managed_store_id?: string }).managed_store_id === s.id ||
        (u as User & { storeId?: string }).storeId === s.id ||
        (u as User & { store_id?: string }).store_id === s.id
    );
    const storeUserChildren: OrgTreeNode[] = managerUser
      ? [{ type: "user" as const, user: managerUser, children: [] as [] }, ...members.map((u) => ({ type: "user" as const, user: u, children: [] as [] }))]
      : members.map((u) => ({ type: "user" as const, user: u, children: [] as [] }));
    return {
      type: "store" as const,
      id: `store-${s.id}`,
      label: displayStoreName(s),
      store: s,
      managerUser: managerUser ?? undefined,
      isDirect: false,
      children: storeUserChildren,
    };
  });
  const directMemberNodes: OrgTreeNode[] = directMembers.map((u) => ({
    type: "user" as const,
    user: u,
    children: [] as [],
  }));

  const children: OrgTreeNode[] = [...partnerUserChild, ...storeNodes, ...directMemberNodes].sort((a, b) => {
    const order = (n: OrgTreeNode) => (n.type === "user" ? 0 : n.type === "store" ? 1 : 2);
    return order(a) - order(b) || (a.type === "store" && b.type === "store" ? String(a.id).localeCompare(String(b.id)) : 0);
  });

  return [
    {
      type: "partner",
      id: `partner-${partner.id}`,
      label: rootLabel,
      partner,
      managerUser: partnerUser,
      children,
    },
  ];
}

/** 매장 권한일 때: 해당 매장 하나를 루트로, 매장관리자(자기 계정) + 회원 자식 */
export function buildStoreScopeTree(
  users: User[],
  store: Store,
  options: { rootLabel?: string } = {}
): OrgTreeNode[] {
  const rootLabel = options.rootLabel ?? displayStoreName(store);
  const managerUser = users.find(
    (u) =>
      u.level === USER_LEVEL.STORE &&
      ((u as User & { managed_store_id?: string }).managed_store_id === store.id || u.storeId === store.id || (u as User & { store_id?: string }).store_id === store.id)
  );
  const members = users.filter(
    (u) => u.level === USER_LEVEL.USER && (u.storeId === store.id || (u as User & { store_id?: string }).store_id === store.id)
  );
  const managerNode: OrgTreeNode[] = managerUser
    ? [{ type: "user" as const, user: managerUser, children: [] as [] }]
    : [];
  const children: OrgTreeNode[] = [
    ...managerNode,
    ...members.map((u) => ({
      type: "user" as const,
      user: u,
      children: [] as [],
    })),
  ];

  return [
    {
      type: "store",
      id: `store-${store.id}`,
      label: displayStoreName(store),
      store,
      managerUser: managerUser ?? undefined,
      isDirect: !store.partnerId || store.partnerId.trim() === "",
      children,
    },
  ];
}
