export type SupportedWalletNetwork = "TRON" | "POLYGON";

export interface WalletNetworkOption {
  value: SupportedWalletNetwork;
  label: string;
}

export interface SubscriptionPaymentOption {
  value: "USDT_TRON" | "USDT_POLYGON";
  label: string;
  currency: "USDT";
  network: SupportedWalletNetwork;
}

export const WALLET_NETWORK_OPTIONS: WalletNetworkOption[] = [
  { value: "TRON", label: "TRON (TRC20)" },
  { value: "POLYGON", label: "POLYGON (USDT)" },
];

export const SUBSCRIPTION_PAYMENT_OPTIONS: SubscriptionPaymentOption[] = [
  {
    value: "USDT_TRON",
    label: "USDT / TRON (TRC20)",
    currency: "USDT",
    network: "TRON",
  },
  {
    value: "USDT_POLYGON",
    label: "USDT / POLYGON",
    currency: "USDT",
    network: "POLYGON",
  },
];

export function toSupportedWalletNetwork(
  network: string | null | undefined,
): SupportedWalletNetwork | null {
  const normalized = network?.trim().toUpperCase();

  if (!normalized) return null;
  if (normalized === "TRON" || normalized === "TRC20" || normalized === "USDT_TRON") {
    return "TRON";
  }
  if (normalized === "POLYGON" || normalized === "MATIC" || normalized === "USDT_POLYGON") {
    return "POLYGON";
  }

  return null;
}

export function normalizeWalletNetwork(
  network: string | null | undefined,
  fallback: SupportedWalletNetwork = "TRON",
): SupportedWalletNetwork {
  return toSupportedWalletNetwork(network) ?? fallback;
}

export function getWalletNetworkLabel(network: string | null | undefined): string {
  const supportedNetwork = toSupportedWalletNetwork(network);

  if (!supportedNetwork) return network?.trim() || "-";

  return (
    WALLET_NETWORK_OPTIONS.find((option) => option.value === supportedNetwork)?.label ??
    supportedNetwork
  );
}
