import type { SubscriptionPlanType } from "./subscription";

/** API 응답 형식 (camelCase / snake_case 혼용 가능) */
export interface UserApiResponse {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  firstname?: string;
  lastname?: string;
  registerTime?: string;
  register_time?: string;
  lastLoginTime?: string | null;
  lastlogin_time?: string | null;
  level: number;
  levelName?: string;
  level_name?: string;
  status: string;
  parent_id?: number | null;
  parentId?: number | null;
  nick_name?: string;
  nickName?: string;
  /** 링크 귀속: 매장 ID (가입 시 /join?s=store_1 등) */
  store_id?: string | null;
  /** 링크 귀속: 총판 ID (가입 시 /join?p=partner_A 또는 매장으로부터 자동 연결) */
  partner_id?: string | null;
}

/** 프론트엔드 통일 User 타입 */
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  registerTime: string;
  lastLoginTime: string | null;
  level: number;
  levelName: string;
  status: string;
  /** 트리 구조: 부모 유저 id. 0 또는 null = 루트 */
  parentId: number | null;
  /** 역할 표시명 (슈퍼관리자, 총판관리자, 일반고객 등) */
  nickName: string;
  /** 링크 귀속: 매장 ID */
  storeId?: string | null;
  /** 링크 귀속: 총판 ID */
  partnerId?: string | null;
}

export interface CurrentUser {
  id: number;
  email: string;
  firstname?: string;
  lastname?: string;
  level: number;
  /** 구독 등급. 없으면 미구독(STANDARD 권한으로 제한) */
  subscription_plan?: SubscriptionPlanType | null;
  /** 구독 시작일 (ISO 문자열, tb_user 기준) */
  subscription_start_at?: string | null;
  /** 구독 만료일 (ISO 문자열, tb_user 기준). 이 날짜가 지나면 만료로 간주 */
  subscription_end_at?: string | null;
  /** 총판(level=1)일 때 관리하는 총판 ID (매장 생성 등에 사용) */
  managed_partner_id?: string | null;
  /** 매장(level=2)일 때 관리하는 매장 ID (해당 매장 내 유저 관리에 사용) */
  managed_store_id?: string | null;
  /** 가입일시 (auth/me 응답에 있으면 유저 목록 '본인' 행에 표시) */
  registerTime?: string | null;
  /** 마지막 로그인 (auth/me 응답에 있으면 유저 목록 '본인' 행에 표시) */
  lastLoginTime?: string | null;
}

/** 백엔드 SubscriptionService level 정의와 동기화
 *  0 = 본사/관리자, 1 = 총판, 2 = 매장, 10 = 일반 회원
 */
export const USER_LEVEL = {
  /** 본사/관리자 (LevelSuperAdmin) */
  SUPER_ADMIN: 0,
  /** 본사/관리자 (동일 0, 권한 체크용 별칭) */
  ADMIN: 0,
  /** 총판 (LevelPartner) */
  PARTNER: 1,
  /** 매장 (LevelStore) */
  STORE: 2,
  /** 일반 회원 (LevelMember, 가입 시 기본) */
  USER: 10,
  /** 일반 회원 별칭 */
  MEMBER: 10,
} as const;

export const USER_LEVEL_LABEL: Record<number, string> = {
  0: "본사/관리자",
  1: "총판",
  2: "매장",
  10: "회원",
};
