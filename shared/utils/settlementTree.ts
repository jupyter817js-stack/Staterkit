/**
 * 정산 페이지용 트리 구조 (유저 관리 트리와 동일 계층: 슈퍼관리자 → 총판/본사 직속 매장)
 * 각 노드에 해당 target의 정산 기록(records)을 붙여 "왜 이 금액인지" 표시용.
 */

import type { Partner, Store, SettlementRecord } from "@/shared/types/partner-store";
import { displayPartnerName, displayStoreName } from "@/shared/types/partner-store";

export type SettlementTreeNode =
  | { type: "root"; id: "root"; label: string; children: SettlementTreeNode[] }
  | {
      type: "partner";
      id: string;
      label: string;
      partner: Partner;
      records: SettlementRecord[];
      children: SettlementTreeNode[];
    }
  | {
      type: "store";
      id: string;
      label: string;
      store: Store;
      isDirect: boolean;
      records: SettlementRecord[];
      children: SettlementTreeNode[];
    };

function isDirectStore(s: Store): boolean {
  return !s.partnerId || s.partnerId.trim() === "";
}

/**
 * 정산 트리 구성: 루트(슈퍼관리자) → 총판들(각 하위 매장) / 본사 직속 매장들.
 * records를 target_type + target_id로 그룹하여 각 노드에 붙임.
 */
export function buildSettlementTree(
  partners: Partner[],
  stores: Store[],
  records: SettlementRecord[],
  options: { rootLabel?: string } = {}
): SettlementTreeNode[] {
  const rootLabel = options.rootLabel ?? "슈퍼관리자";

  const recordsByPartner = new Map<string, SettlementRecord[]>();
  const recordsByStore = new Map<string, SettlementRecord[]>();
  records.forEach((r) => {
    if (r.targetType === "partner") {
      const arr = recordsByPartner.get(r.targetId) ?? [];
      arr.push(r);
      recordsByPartner.set(r.targetId, arr);
    } else {
      const arr = recordsByStore.get(r.targetId) ?? [];
      arr.push(r);
      recordsByStore.set(r.targetId, arr);
    }
  });

  const directStores = stores.filter(isDirectStore);
  const partnerStores = stores.filter((s) => !isDirectStore(s));

  const partnerNodes: SettlementTreeNode[] = partners.map((p) => {
    const partnerRecords = recordsByPartner.get(p.id) ?? [];
    const storesUnder = partnerStores.filter((s) => s.partnerId === p.id);
    const storeChildren: SettlementTreeNode[] = storesUnder.map((s) => ({
      type: "store" as const,
      id: `store-${s.id}`,
      label: displayStoreName(s),
      store: s,
      isDirect: false,
      records: recordsByStore.get(s.id) ?? [],
      children: [],
    }));
    return {
      type: "partner" as const,
      id: `partner-${p.id}`,
      label: displayPartnerName(p),
      partner: p,
      records: partnerRecords,
      children: storeChildren,
    };
  });

  const directStoreNodes: SettlementTreeNode[] = directStores.map((s) => ({
    type: "store" as const,
    id: `store-${s.id}`,
    label: `${displayStoreName(s)} (본사 직속)`,
    store: s,
    isDirect: true,
    records: recordsByStore.get(s.id) ?? [],
    children: [],
  }));

  const rootChildren: SettlementTreeNode[] = [
    ...partnerNodes,
    ...directStoreNodes,
  ].sort((a, b) => {
    const order = (n: SettlementTreeNode) => (n.type === "partner" ? 0 : 1);
    return order(a) - order(b) || String(a.id).localeCompare(String(b.id));
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

/** 트리 전체에서 총 지급 예정액 합계 (루트 제외, 모든 partner/store records의 payoutAmount 합) */
export function sumTotalPayoutFromTree(nodes: SettlementTreeNode[]): number {
  let sum = 0;
  for (const node of nodes) {
    if (node.type === "root") {
      sum += sumTotalPayoutFromTree(node.children);
    } else {
      for (const r of node.records) sum += Number(r.payoutAmount) || 0;
      if ("children" in node && node.children.length) {
        sum += sumTotalPayoutFromTree(node.children);
      }
    }
  }
  return sum;
}
