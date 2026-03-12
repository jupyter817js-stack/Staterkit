import type { User } from "@/shared/types/users";

export interface UserTreeNode {
  user: User;
  children: UserTreeNode[];
}

/** parentId가 0 또는 null인 항목을 루트로, 나머지는 부모 아래로 묶어 트리 구성 */
export function buildUserTree(users: User[]): UserTreeNode[] {
  const byId = new Map<number, User>();
  users.forEach((u) => byId.set(u.id, u));

  const roots: UserTreeNode[] = [];
  const nodeByUserId = new Map<number, UserTreeNode>();

  users.forEach((u) => {
    nodeByUserId.set(u.id, { user: u, children: [] });
  });

  users.forEach((u) => {
    const node = nodeByUserId.get(u.id)!;
    const parentId = u.parentId;
    const isRoot =
      parentId === null ||
      parentId === undefined ||
      parentId === 0 ||
      !byId.has(parentId);
    if (isRoot) {
      roots.push(node);
    } else {
      const parent = nodeByUserId.get(parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }
  });

  /** 루트 정렬: id 오름차순, 그 다음 자식도 재귀 정렬 */
  const sortNodes = (nodes: UserTreeNode[]) => {
    nodes.sort((a, b) => a.user.id - b.user.id);
    nodes.forEach((n) => sortNodes(n.children));
  };
  sortNodes(roots);

  return roots;
}

/** 트리 전체 노드 개수 */
export function countTreeNodes(nodes: UserTreeNode[]): number {
  return nodes.reduce(
    (acc, n) => acc + 1 + countTreeNodes(n.children),
    0
  );
}
