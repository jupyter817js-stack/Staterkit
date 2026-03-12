/**
 * 수익률 표시: 소수점 2자리, 반올림 (화면 표시만, 내부 계산은 기존 정밀도 유지)
 * 예: 1.567 → "1.57%"
 */
export function formatProfitPercent(value: number): string {
  const rounded = Math.round(Number(value) * 100) / 100;
  return `${rounded.toFixed(2)}%`;
}
