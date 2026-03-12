import { getAuthHeader } from "@/shared/api/auth";
import { fetchWithErrorHandling } from "@/shared/api/http";
import type { SettlementRecord } from "@/shared/types/partner-store";
import type { SettlementTreeNode } from "@/shared/utils/settlementTree";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const auth = getAuthHeader();
  const out = { ...extra };
  if (auth.Authorization) out.Authorization = auth.Authorization;
  return out;
}

/** GET /api/v1/settlements/tree 응답의 정산 한 건 (camelCase) */
export interface SettlementTreeItem {
  netSalesAmount: number;
  commissionRatePercent: number;
  payoutAmount: number;
  network: string | null;
  walletAddress: string | null;
  status?: string;
}

/** 트리 API 총판 노드 (camelCase) */
export interface SettlementTreePartnerNode {
  id: number | string;
  nickName?: string | null;
  commissionRatePercent?: number;
  walletNetwork?: string | null;
  walletAddress?: string | null;
  settlement?: SettlementTreeItem | null;
  stores: SettlementTreeStoreNode[];
}

/** 트리 API 매장 노드 (camelCase) */
export interface SettlementTreeStoreNode {
  id: number | string;
  nickName?: string | null;
  partnerId?: string | null;
  commissionRatePercent?: number;
  walletNetwork?: string | null;
  walletAddress?: string | null;
  settlement?: SettlementTreeItem | null;
}

/** GET /api/v1/settlements/tree 응답 (camelCase) */
export interface SettlementsTreeResponse {
  periodStart: string;
  periodEnd: string;
  partners: SettlementTreePartnerNode[];
  headquartersStores: SettlementTreeStoreNode[];
  /** 해당 기간 총 순매출(USDT) */
  totalNetSales?: number;
  /** 해당 기간 총 지급 예정액(USDT). 본사수익 = totalNetSales - totalPayoutAmount */
  totalPayoutAmount?: number;
}

export interface ListSettlementsParams {
  periodStart?: string;
  periodEnd?: string;
  targetType?: "partner" | "store";
  targetId?: string;
  status?: "paid" | "failed" | "hold" | "pending" | "calculated";
  page?: number;
  per_page?: number;
}

/** 정산 목록 (관리자: 전체 / 총판: 본인 관련만) */
export async function listSettlements(
  params?: ListSettlementsParams
): Promise<{ records: SettlementRecord[]; total?: number }> {
  if (!API_BASE) return { records: [] };
  const search = new URLSearchParams();
  if (params?.periodStart) search.set("period_start", params.periodStart);
  if (params?.periodEnd) search.set("period_end", params.periodEnd);
  if (params?.targetType) search.set("target_type", params.targetType);
  if (params?.targetId) search.set("target_id", params.targetId);
  if (params?.status) search.set("status", params.status);
  if (params?.page != null) search.set("page", String(params.page));
  if (params?.per_page != null) search.set("per_page", String(params.per_page));
  const qs = search.toString();
  const res = await fetchWithErrorHandling(
    `${API_BASE}/api/v1/settlements${qs ? `?${qs}` : ""}`,
    { method: "GET", headers: authHeaders(), redirectOnError: false }
  );
  if (!res.ok) return { records: [] };
  const data = await res.json();
  const records = Array.isArray(data.records)
    ? data.records
    : Array.isArray(data.settlements)
      ? data.settlements
      : [];
  return { records, total: data.total };
}

/**
 * GET /api/v1/settlements/tree — 한 번에 트리 구조 조회.
 * 기간 선택 후 트리 뷰에서 사용. 응답을 SettlementTreeNode[] 로 변환해 기존 트리 UI에 넣을 수 있음.
 */
export async function getSettlementsTree(
  periodStart: string,
  periodEnd: string
): Promise<SettlementsTreeResponse | null> {
  if (!API_BASE || !periodStart || !periodEnd) return null;
  const search = new URLSearchParams();
  search.set("period_start", periodStart);
  search.set("period_end", periodEnd);
  const res = await fetchWithErrorHandling(
    `${API_BASE}/api/v1/settlements/tree?${search.toString()}`,
    { method: "GET", headers: authHeaders(), redirectOnError: false }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data as SettlementsTreeResponse;
}

/** 트리 API 응답을 기존 SettlementTreeNode[] 형식으로 변환 (SettlementTreeView 호환) */
export function mapSettlementsTreeToNodes(
  tree: SettlementsTreeResponse,
  options: { rootLabel?: string } = {}
): SettlementTreeNode[] {
  const rootLabel = options.rootLabel ?? "슈퍼관리자";
  const { periodStart, periodEnd, partners, headquartersStores } = tree;

  const settlementToRecord = (
    item: SettlementTreeItem | null | undefined,
    targetType: "partner" | "store",
    targetId: string
  ): SettlementRecord[] => {
    if (!item) return [];
    return [
      {
        id: `tree-${targetType}-${targetId}`,
        periodStart,
        periodEnd,
        targetType,
        targetId,
        netSalesAmount: item.netSalesAmount,
        commissionRatePercent: item.commissionRatePercent,
        payoutAmount: item.payoutAmount,
        network: item.network ?? "",
        walletAddress: item.walletAddress ?? "",
        txHash: null,
        status: (item.status as SettlementRecord["status"]) ?? "calculated",
        paidAt: null,
        failureReason: null,
      },
    ];
  };

  const partnerNodes: SettlementTreeNode[] = partners.map((p) => {
    const id = String(p.id);
    const partner = {
      id,
      nickName: p.nickName ?? null,
      commissionRatePercent: p.commissionRatePercent ?? 0,
      walletNetwork: p.walletNetwork ?? "",
      walletAddress: p.walletAddress ?? "",
    };
    const records = settlementToRecord(p.settlement, "partner", id);
    const storeChildren: SettlementTreeNode[] = (p.stores ?? []).map((s) => {
      const sid = String(s.id);
      const store = {
        id: sid,
        nickName: s.nickName ?? null,
        partnerId: id,
        commissionRatePercent: s.commissionRatePercent ?? 0,
        walletNetwork: s.walletNetwork ?? "",
        walletAddress: s.walletAddress ?? "",
      };
      return {
        type: "store" as const,
        id: `store-${sid}`,
        label: (s.nickName ?? "").trim() || sid,
        store,
        isDirect: false,
        records: settlementToRecord(s.settlement, "store", sid),
        children: [],
      };
    });
    return {
      type: "partner" as const,
      id: `partner-${id}`,
      label: (p.nickName ?? "").trim() || id,
      partner,
      records,
      children: storeChildren,
    };
  });

  const directStoreNodes: SettlementTreeNode[] = (headquartersStores ?? []).map((s) => {
    const sid = String(s.id);
    const store = {
      id: sid,
      nickName: s.nickName ?? null,
      partnerId: null as string | null,
      commissionRatePercent: s.commissionRatePercent ?? 0,
      walletNetwork: s.walletNetwork ?? "",
      walletAddress: s.walletAddress ?? "",
    };
    return {
      type: "store" as const,
      id: `store-${sid}`,
      label: `${(s.nickName ?? "").trim() || sid} (본사 직속)`,
      store,
      isDirect: true,
      records: settlementToRecord(s.settlement, "store", sid),
      children: [],
    };
  });

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
