"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "react-qr-code";
import {
  createSubscriptionInvoice,
  getInvoiceId,
  getPlans,
} from "@/shared/api/crypto-payment";
import {
  CRYPTO_INVOICE_ID_KEY,
  SUBSCRIPTION_PAYMENT_PENDING_KEY,
} from "@/shared/constants/subscription-payment";
import {
  getWalletNetworkLabel,
  SUBSCRIPTION_PAYMENT_OPTIONS,
} from "@/shared/constants/crypto-networks";
import { usePaymentSignalRContext } from "@/shared/contexts/PaymentSignalRContext";
import type {
  CreateSubscriptionResponse,
  SubscriptionPlan,
} from "@/shared/types/crypto-payment";
import { useLanguage } from "@/shared/i18n/LanguageContext";
import type {
  PaymentRealtimePayload,
  SignalRConnectionState,
} from "@/shared/hooks/usePaymentSignalR";
import type { PaymentSignalREvent } from "@/shared/contexts/PaymentSignalRContext";

const FALLBACK_PLANS: SubscriptionPlan[] = [
  {
    id: 2,
    name: "STANDARD",
    planType: "STANDARD",
    priceAmount: 29,
    priceUsd: 29,
    durationDays: 30,
  },
  {
    id: 3,
    name: "PRO",
    planType: "PRO",
    priceAmount: 89,
    priceUsd: 89,
    durationDays: 30,
  },
];

interface CryptoSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedPlanId?: number;
  preselectedPlanType?: "STANDARD" | "PRO";
  onSuccess?: () => void;
}

type InvoiceFlowStatus = "idle" | "pending" | "detected" | "confirmed" | "expired";

function filterPaidPlans(plans: SubscriptionPlan[]): SubscriptionPlan[] {
  return plans
    .filter((plan) => {
      const price = plan.priceUsd ?? plan.priceAmount ?? 0;
      return plan.id === 2 || plan.id === 3 || price > 0;
    })
    .sort((a, b) => a.id - b.id);
}

function formatMoney(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount)) return "-";
  return amount.toFixed(2).replace(/\.00$/, "");
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function formatCountdown(target: string | null | undefined, now: number): string {
  if (!target) return "-";
  const targetTime = new Date(target).getTime();
  if (Number.isNaN(targetTime)) return "-";
  const diff = targetTime - now;
  if (diff <= 0) return "00:00";

  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function matchesInvoiceEvent(
  event: PaymentSignalREvent | null,
  invoiceId: number | null | undefined,
  invoiceStartedAt: number | null,
): boolean {
  if (!event || invoiceStartedAt == null) return false;
  if (event.receivedAt + 1000 < invoiceStartedAt) return false;

  const payloadInvoiceId = event.payload.invoiceId;
  if (payloadInvoiceId != null) {
    return invoiceId != null && payloadInvoiceId === invoiceId;
  }

  return invoiceId != null;
}

function getConnectionMeta(t: (key: string) => string, connectionState: SignalRConnectionState) {
  switch (connectionState) {
    case "Connected":
      return {
        label: t("paymentRealtimeConnected"),
        className:
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        icon: "ri-radar-line",
      };
    case "Connecting":
      return {
        label: t("paymentRealtimeConnecting"),
        className:
          "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
        icon: "ri-loader-4-line animate-spin",
      };
    case "Reconnecting":
      return {
        label: t("paymentRealtimeReconnecting"),
        className:
          "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
        icon: "ri-loader-4-line animate-spin",
      };
    default:
      return {
        label: t("paymentRealtimeDisconnected"),
        className:
          "border-slate-400/20 bg-slate-500/10 text-slate-700 dark:text-slate-300",
        icon: "ri-wifi-off-line",
      };
  }
}

export default function CryptoSubscriptionModal({
  isOpen,
  onClose,
  preselectedPlanId,
  preselectedPlanType,
  onSuccess,
}: CryptoSubscriptionModalProps) {
  const { t } = useLanguage();
  const paymentSignalR = usePaymentSignalRContext();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(preselectedPlanId ?? null);
  const [paymentOptionValue, setPaymentOptionValue] = useState(SUBSCRIPTION_PAYMENT_OPTIONS[0].value);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<CreateSubscriptionResponse | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [invoiceFlowStatus, setInvoiceFlowStatus] = useState<InvoiceFlowStatus>("idle");
  const [invoiceStartedAt, setInvoiceStartedAt] = useState<number | null>(null);
  const [statusPayload, setStatusPayload] = useState<PaymentRealtimePayload | null>(null);

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId) ?? null,
    [plans, selectedPlanId],
  );
  const selectedPaymentOption = useMemo(
    () =>
      SUBSCRIPTION_PAYMENT_OPTIONS.find((option) => option.value === paymentOptionValue) ??
      SUBSCRIPTION_PAYMENT_OPTIONS[0],
    [paymentOptionValue],
  );
  const qrValue = invoice?.address ?? "";
  const expiresIn = formatCountdown(invoice?.expireAt, now);
  const isExpired = Boolean(invoice) && expiresIn === "00:00";
  const latestSignalREvent = paymentSignalR?.latestEvent ?? null;
  const connectionMeta = useMemo(
    () => getConnectionMeta(t, paymentSignalR?.connectionState ?? "Disconnected"),
    [paymentSignalR?.connectionState, t],
  );
  const invoiceStatus = useMemo<InvoiceFlowStatus>(() => {
    if (!invoice) return "idle";
    if (invoiceFlowStatus === "confirmed") return "confirmed";
    if (invoiceFlowStatus === "detected") return "detected";
    if (invoiceFlowStatus === "expired" || isExpired) return "expired";
    return "pending";
  }, [invoice, invoiceFlowStatus, isExpired]);
  const hasActiveInvoice = Boolean(invoice) && invoiceStatus !== "expired" && invoiceStatus !== "confirmed";
  const inputsLocked = Boolean(invoice) && invoiceStatus !== "expired";
  const canCreateInvoice =
    !submitting && !loadingPlans && Boolean(selectedPlanId) && (!invoice || invoiceStatus === "expired");
  const hasDetectedDeposit = invoiceFlowStatus === "detected" || invoiceFlowStatus === "confirmed";
  const hasConfirmedPayment = invoiceFlowStatus === "confirmed";
  const statusMeta = useMemo(() => {
    switch (invoiceStatus) {
      case "detected":
        return {
          badge: t("paymentStatusDetected"),
          title: t("paymentDetectedTitle"),
          description: t("paymentDetectedDesc"),
          wrapperClass:
            "border-sky-500/20 bg-gradient-to-br from-sky-500/[0.14] via-cyan-500/[0.08] to-white/70 dark:from-sky-500/20 dark:via-cyan-500/10 dark:to-black/10",
          badgeClass:
            "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-200",
          iconWrapClass:
            "bg-sky-500/15 text-sky-700 ring-1 ring-sky-500/20 dark:text-sky-200",
          icon: "ri-radar-line",
          detailCardClass:
            "rounded-xl border border-sky-500/15 bg-white/75 p-3 dark:border-sky-400/20 dark:bg-black/10",
        };
      case "confirmed":
        return {
          badge: t("paymentStatusPaid"),
          title: t("paymentConfirmedTitle"),
          description: t("paymentConfirmedDesc"),
          wrapperClass:
            "border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.16] via-teal-500/[0.08] to-white/70 dark:from-emerald-500/20 dark:via-teal-500/10 dark:to-black/10",
          badgeClass:
            "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
          iconWrapClass:
            "bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-200",
          icon: "ri-checkbox-circle-fill",
          detailCardClass:
            "rounded-xl border border-emerald-500/15 bg-white/80 p-3 dark:border-emerald-400/20 dark:bg-black/10",
        };
      case "expired":
        return {
          badge: t("paymentStatusExpired"),
          title: t("paymentExpiredTitle"),
          description: t("paymentExpiredDesc"),
          wrapperClass:
            "border-rose-500/20 bg-gradient-to-br from-rose-500/[0.14] via-orange-500/[0.08] to-white/70 dark:from-rose-500/20 dark:via-orange-500/10 dark:to-black/10",
          badgeClass:
            "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-200",
          iconWrapClass:
            "bg-rose-500/15 text-rose-700 ring-1 ring-rose-500/20 dark:text-rose-200",
          icon: "ri-time-line",
          detailCardClass:
            "rounded-xl border border-rose-500/15 bg-white/75 p-3 dark:border-rose-400/20 dark:bg-black/10",
        };
      default:
        return {
          badge: t("paymentStatusPending"),
          title: t("paymentAwaitingTitle"),
          description: t("paymentAwaitingDesc"),
          wrapperClass:
            "border-primary/20 bg-gradient-to-br from-primary/[0.08] via-amber-500/[0.05] to-white/70 dark:from-primary/10 dark:via-amber-500/10 dark:to-black/10",
          badgeClass:
            "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-200",
          iconWrapClass:
            "bg-primary/15 text-primary ring-1 ring-primary/15",
          icon: "ri-timer-flash-line",
          detailCardClass:
            "rounded-xl border border-white/50 bg-white/70 p-3 dark:border-white/10 dark:bg-black/10",
        };
    }
  }, [invoiceStatus, t]);
  const progressSteps = useMemo(
    () => [
      {
        key: "invoice",
        label: t("paymentProgressInvoice"),
        done: Boolean(invoice),
        active: invoiceStatus === "pending",
      },
      {
        key: "detected",
        label: t("paymentProgressDetected"),
        done: hasDetectedDeposit,
        active: invoiceStatus === "detected",
      },
      {
        key: "confirmed",
        label: t("paymentProgressConfirmed"),
        done: hasConfirmedPayment,
        active: invoiceStatus === "confirmed",
      },
    ],
    [hasConfirmedPayment, hasDetectedDeposit, invoice, invoiceStatus, t],
  );
  const activatedPlanName =
    statusPayload?.plan ?? selectedPlan?.planType ?? selectedPlan?.name ?? null;

  useEffect(() => {
    if (!invoice?.expireAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [invoice?.expireAt]);

  useEffect(() => {
    if (!copiedField) return;
    const timer = window.setTimeout(() => setCopiedField(null), 1800);
    return () => window.clearTimeout(timer);
  }, [copiedField]);

  const loadPlans = useCallback(async () => {
    setLoadingPlans(true);
    setError(null);

    try {
      const list = filterPaidPlans(await getPlans());
      const plansToUse = list.length > 0 ? list : FALLBACK_PLANS;
      setPlans(plansToUse);
      setSelectedPlanId((prev) => {
        if (preselectedPlanId) return preselectedPlanId;
        if (prev && plansToUse.some((plan) => plan.id === prev)) return prev;
        if (preselectedPlanType) {
          const match = plansToUse.find(
            (plan) => (plan.planType ?? plan.name ?? "").toUpperCase() === preselectedPlanType,
          );
          if (match) return match.id;
        }
        return plansToUse[0]?.id ?? null;
      });
    } catch {
      setPlans(FALLBACK_PLANS);
      setSelectedPlanId((prev) => {
        if (preselectedPlanId) return preselectedPlanId;
        if (prev && FALLBACK_PLANS.some((plan) => plan.id === prev)) return prev;
        if (preselectedPlanType) {
          const match = FALLBACK_PLANS.find(
            (plan) => (plan.planType ?? plan.name ?? "").toUpperCase() === preselectedPlanType,
          );
          if (match) return match.id;
        }
        return FALLBACK_PLANS[0].id;
      });
    } finally {
      setLoadingPlans(false);
    }
  }, [preselectedPlanId, preselectedPlanType]);

  useEffect(() => {
    if (!isOpen) return;

    void loadPlans();
    setInvoice(null);
    setError(null);
    setCopiedField(null);
    setNow(Date.now());
    setPaymentOptionValue(SUBSCRIPTION_PAYMENT_OPTIONS[0].value);
    setInvoiceFlowStatus("idle");
    setInvoiceStartedAt(null);
    setStatusPayload(null);
  }, [isOpen, loadPlans]);

  useEffect(() => {
    if (!isOpen || !invoice) {
      setInvoiceFlowStatus("idle");
      setInvoiceStartedAt(null);
      setStatusPayload(null);
      return;
    }

    setInvoiceFlowStatus("pending");
    setStatusPayload(null);
  }, [invoice?.invoiceId, isOpen]);

  useEffect(() => {
    if (!invoice || !isExpired) return;
    setInvoiceFlowStatus((prev) => (prev === "confirmed" ? prev : "expired"));
  }, [invoice, isExpired]);

  useEffect(() => {
    if (!isOpen || !invoice || !matchesInvoiceEvent(latestSignalREvent, invoice.invoiceId, invoiceStartedAt)) {
      return;
    }

    if (latestSignalREvent?.type === "payment-detected") {
      setInvoiceFlowStatus((prev) => (prev === "confirmed" ? prev : "detected"));
      setStatusPayload(latestSignalREvent.payload);
      return;
    }

    if (latestSignalREvent?.type === "payment-confirmed") {
      setInvoiceFlowStatus("confirmed");
      setStatusPayload(latestSignalREvent.payload);
      return;
    }

    if (latestSignalREvent?.type === "invoice-expired") {
      setInvoiceFlowStatus((prev) => (prev === "confirmed" ? prev : "expired"));
      setStatusPayload(latestSignalREvent.payload);
    }
  }, [invoice, invoiceStartedAt, isOpen, latestSignalREvent]);

  const handleCopy = useCallback(async (value: string | number | null | undefined, field: string) => {
    if (value == null) return;
    try {
      await navigator.clipboard.writeText(String(value));
      setCopiedField(field);
    } catch {
      setError("Failed to copy value.");
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedPlanId) {
      setError("Please select a plan.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const createdAt = Date.now();
      const created = await createSubscriptionInvoice({
        planId: selectedPlanId,
        currency: selectedPaymentOption.currency,
        network: selectedPaymentOption.network,
      });

      const nextInvoiceId = getInvoiceId(created);
      const nextInvoice: CreateSubscriptionResponse = {
        ...created,
        currency: created.currency ?? selectedPaymentOption.currency,
        network: created.network ?? selectedPaymentOption.network,
      };

      setInvoice(nextInvoice);
      setInvoiceStartedAt(createdAt);
      setInvoiceFlowStatus("pending");
      setStatusPayload(null);
      sessionStorage.setItem(SUBSCRIPTION_PAYMENT_PENDING_KEY, Date.now().toString());
      if (nextInvoiceId != null) {
        sessionStorage.setItem(CRYPTO_INVOICE_ID_KEY, String(nextInvoiceId));
      } else {
        sessionStorage.removeItem(CRYPTO_INVOICE_ID_KEY);
      }
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create subscription invoice.");
    } finally {
      setSubmitting(false);
    }
  }, [onSuccess, selectedPaymentOption.currency, selectedPaymentOption.network, selectedPlanId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 p-4">
      <div className="box w-full max-w-[44rem] overflow-hidden shadow-2xl">
        <div className="box-header flex items-center justify-between border-b border-defaultborder px-4 py-3 dark:border-white/10">
          <div>
            <h5 className="mb-0 font-semibold">{t("startSubscription")}</h5>
            <p className="mt-1 text-[0.8rem] text-defaulttextcolor/70 dark:text-white/55">
              {invoice ? t("paymentInstructionTitle") : t("subscriptionPlans")}
            </p>
          </div>
          <button
            type="button"
            className="ti-btn ti-btn-ghost ti-btn-sm"
            onClick={onClose}
            aria-label={t("close")}
          >
            <i className="ri-close-line text-[1.25rem]" />
          </button>
        </div>

        <div className="box-body space-y-4 p-4 sm:p-5">
          {error ? (
            <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3.5 py-3 text-[0.875rem] text-rose-200">
              {error}
            </div>
          ) : null}

          {loadingPlans ? (
            <div className="flex items-center justify-center py-10">
              <span className="ti-spinner !h-8 !w-8 !border-2 inline-block" />
              <span className="ml-2 text-[0.95rem]">{t("loading")}</span>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="form-label text-[0.8125rem]">{t("selectPlan")}</label>
                  <select
                    className="ti-form-control form-control-sm"
                    value={selectedPlanId ?? ""}
                    onChange={(e) => setSelectedPlanId(Number(e.target.value) || null)}
                    disabled={submitting || inputsLocked}
                  >
                    <option value="">{t("selectPlan")}</option>
                    {plans.map((plan) => {
                      const price = formatMoney(plan.priceUsd ?? plan.priceAmount ?? null);
                      return (
                        <option key={plan.id} value={plan.id}>
                          {(plan.name ?? plan.planType ?? `Plan ${plan.id}`).toUpperCase()}
                          {price !== "-" ? ` - $${price}` : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="form-label text-[0.8125rem]">{t("selectPaymentNetwork")}</label>
                  <select
                    className="ti-form-control form-control-sm"
                    value={paymentOptionValue}
                    onChange={(e) => setPaymentOptionValue(e.target.value)}
                    disabled={submitting || inputsLocked}
                  >
                    {SUBSCRIPTION_PAYMENT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedPlan ? (
                <div className="rounded-2xl border border-defaultborder/80 bg-gray-50/80 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="mb-1 text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-primary">
                        {selectedPlan.planType ?? selectedPlan.name}
                      </p>
                      <h6 className="mb-1 text-[1.15rem] font-bold text-defaulttextcolor dark:text-white/90">
                        ${formatMoney(selectedPlan.priceUsd ?? selectedPlan.priceAmount ?? null)}
                      </h6>
                      <p className="mb-0 text-[0.8rem] text-defaulttextcolor/65 dark:text-white/55">
                        {selectedPlan.durationDays ? `${selectedPlan.durationDays} days` : "30 days"}
                      </p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-[0.74rem] font-semibold text-primary dark:bg-primary/15">
                      {selectedPaymentOption.label}
                    </span>
                  </div>
                </div>
              ) : null}

              {invoice ? (
                <div
                  role="status"
                  aria-live="polite"
                  className={`space-y-4 rounded-[1.5rem] border p-4 transition-all duration-500 ${statusMeta.wrapperClass}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex items-start gap-3">
                        <div className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${statusMeta.iconWrapClass}`}>
                          {invoiceStatus === "confirmed" ? (
                            <span className="absolute inset-0 rounded-2xl bg-emerald-500/15 animate-pulse" />
                          ) : null}
                          <i className={`${statusMeta.icon} relative z-[1] text-[1.4rem]`} />
                        </div>
                        <div className="min-w-0">
                          <p className="mb-1 text-[0.76rem] font-semibold uppercase tracking-[0.08em] text-primary">
                            {t("paymentInstructionTitle")}
                          </p>
                          <h6 className="mb-1 text-[1.05rem] font-semibold text-defaulttextcolor dark:text-white">
                            {statusMeta.title}
                          </h6>
                          <p className="mb-0 text-[0.84rem] leading-relaxed text-defaulttextcolor/75 dark:text-white/65">
                            {statusMeta.description}
                          </p>
                        </div>
                      </div>

                      {invoiceStatus === "confirmed" && (activatedPlanName || statusPayload?.expireDate) ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-xl border border-emerald-500/15 bg-white/70 px-3 py-2.5 dark:border-emerald-400/20 dark:bg-black/10">
                            <p className="mb-1 text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-defaulttextcolor/55 dark:text-white/45">
                              {t("paymentActivatedPlan")}
                            </p>
                            <p className="mb-0 text-[0.95rem] font-semibold text-defaulttextcolor dark:text-white">
                              {activatedPlanName ?? "-"}
                            </p>
                          </div>
                          <div className="rounded-xl border border-emerald-500/15 bg-white/70 px-3 py-2.5 dark:border-emerald-400/20 dark:bg-black/10">
                            <p className="mb-1 text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-defaulttextcolor/55 dark:text-white/45">
                              {t("paymentActivatedUntil")}
                            </p>
                            <p className="mb-0 text-[0.95rem] font-semibold text-defaulttextcolor dark:text-white">
                              {statusPayload?.expireDate ? formatDateTime(statusPayload.expireDate) : "-"}
                            </p>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span className={`rounded-full border px-3 py-1 text-[0.74rem] font-semibold ${statusMeta.badgeClass}`}>
                        {statusMeta.badge}
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[0.72rem] font-medium ${connectionMeta.className}`}>
                        <i className={`${connectionMeta.icon} text-[0.9rem]`} />
                        {connectionMeta.label}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3">
                    {progressSteps.map((step, index) => {
                      const numberClass = step.done
                        ? "bg-primary text-white dark:bg-primary"
                        : step.active
                          ? "bg-white text-primary ring-2 ring-primary/30 dark:bg-primary/15 dark:text-primary"
                          : "bg-black/[0.06] text-defaulttextcolor/60 dark:bg-white/10 dark:text-white/50";
                      const stepClass = step.done
                        ? "border-primary/15 bg-white/80 dark:border-primary/20 dark:bg-white/[0.06]"
                        : step.active
                          ? "border-primary/25 bg-white/85 shadow-sm dark:border-primary/25 dark:bg-white/[0.08]"
                          : "border-defaultborder/60 bg-transparent dark:border-white/10";

                      return (
                        <div
                          key={step.key}
                          className={`rounded-2xl border px-3 py-3 transition-all duration-300 ${stepClass}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`flex h-8 w-8 items-center justify-center rounded-full text-[0.82rem] font-semibold ${numberClass}`}>
                              {step.done ? <i className="ri-check-line text-[1rem]" /> : index + 1}
                            </span>
                            <p className="mb-0 text-[0.8rem] font-semibold text-defaulttextcolor dark:text-white">
                              {step.label}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className={statusMeta.detailCardClass}>
                      <p className="mb-1 text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-defaulttextcolor/55 dark:text-white/45">
                        {t("paymentAmountColumn")}
                      </p>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[1.2rem] font-black text-defaulttextcolor dark:text-white">
                          {formatMoney(invoice.amount)} {invoice.currency ?? selectedPaymentOption.currency}
                        </span>
                        <button
                          type="button"
                          className="ti-btn ti-btn-sm ti-btn-light !px-2.5"
                          onClick={() =>
                            handleCopy(
                              `${formatMoney(invoice.amount)} ${invoice.currency ?? selectedPaymentOption.currency}`,
                              "amount",
                            )
                          }
                        >
                          {copiedField === "amount" ? t("copied") : t("copy")}
                        </button>
                      </div>
                    </div>

                    <div className={statusMeta.detailCardClass}>
                      <p className="mb-1 text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-defaulttextcolor/55 dark:text-white/45">
                        {t("walletNetwork")}
                      </p>
                      <p className="mb-0 text-[1.05rem] font-bold text-defaulttextcolor dark:text-white">
                        {getWalletNetworkLabel(invoice.network ?? selectedPaymentOption.network)}
                      </p>
                    </div>

                    <div className={statusMeta.detailCardClass}>
                      <p className="mb-1 text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-defaulttextcolor/55 dark:text-white/45">
                        {t("invoiceIdLabel")}
                      </p>
                      <p className="mb-0 text-[1.05rem] font-bold text-defaulttextcolor dark:text-white">
                        {invoice.invoiceId ?? "-"}
                      </p>
                    </div>

                    <div className={statusMeta.detailCardClass}>
                      <p className="mb-1 text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-defaulttextcolor/55 dark:text-white/45">
                        {t("expiresAtLabel")}
                      </p>
                      <p className="mb-0 text-[0.95rem] font-semibold text-defaulttextcolor dark:text-white">
                        {formatDateTime(invoice.expireAt)}
                      </p>
                      <p className="mb-0 mt-1 text-[0.78rem] text-defaulttextcolor/60 dark:text-white/45">
                        {expiresIn}
                      </p>
                    </div>
                  </div>

                  <div className={`grid gap-3 ${statusMeta.detailCardClass} sm:grid-cols-[10rem_minmax(0,1fr)]`}>
                    <div className="flex flex-col items-center justify-center rounded-xl bg-white/85 px-3 py-3 dark:bg-black/20">
                      <p className="mb-2 text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-defaulttextcolor/55 dark:text-white/45">
                        {t("paymentQrLabel")}
                      </p>
                      <div className="rounded-lg bg-white p-2">
                        {qrValue ? (
                          <QRCode value={qrValue} size={120} bgColor="transparent" fgColor="#24143f" />
                        ) : (
                          <div className="flex h-[120px] w-[120px] items-center justify-center rounded-md bg-black/[0.04] text-[0.75rem] text-defaulttextcolor/45 dark:bg-black/20 dark:text-white/45">
                            -
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="mb-0 text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-defaulttextcolor/55 dark:text-white/45">
                          {t("walletAddress")}
                        </p>
                        <button
                          type="button"
                          className="ti-btn ti-btn-sm ti-btn-light !px-2.5"
                          onClick={() => handleCopy(invoice.address, "address")}
                          disabled={!invoice.address}
                        >
                          {copiedField === "address" ? t("copied") : t("copy")}
                        </button>
                      </div>
                      <div className="rounded-lg bg-black/[0.04] px-3 py-2.5 font-mono text-[0.86rem] break-all text-defaulttextcolor dark:bg-black/20 dark:text-white/90">
                        {invoice.address ?? "-"}
                      </div>
                    </div>
                  </div>

                </div>
              ) : null}
            </>
          )}
        </div>

        <div className="box-footer flex justify-end gap-2 border-t border-defaultborder px-4 py-3 dark:border-white/10">
          <button type="button" className="ti-btn ti-btn-outline-secondary" onClick={onClose}>
            {t("close")}
          </button>
          <button
            type="button"
            className={invoiceStatus === "confirmed" ? "ti-btn ti-btn-success" : "ti-btn ti-btn-primary"}
            disabled={!canCreateInvoice}
            onClick={handleSubmit}
          >
            {submitting ? (
              <>
                <span className="ti-spinner !h-4 !w-4 !border-2 inline-block" />
                <span className="ml-2">{t("loading")}</span>
              </>
            ) : invoiceStatus === "confirmed" ? (
              t("paymentStatusPaid")
            ) : invoiceStatus === "detected" ? (
              t("paymentStatusDetected")
            ) : invoice && isExpired ? (
              t("recreateInvoice")
            ) : hasActiveInvoice ? (
              t("paymentStatusPending")
            ) : (
              t("createInvoice")
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
