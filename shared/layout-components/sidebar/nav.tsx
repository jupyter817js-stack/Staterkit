import React from "react";

const DashboardIcon = <i className="bx bx-home side-menu__icon"></i>;

const ValueBetIcon = <i className="bx bx-trending-up side-menu__icon"></i>;
const UserManageIcon = <i className="bx bx-user side-menu__icon"></i>;
const PaymentIcon = <i className="bx bx-credit-card side-menu__icon"></i>;
const ApiIcon = <i className="bx bx-code side-menu__icon"></i>;
const SubscriptionIcon = <i className="bx bx-cart side-menu__icon"></i>;

const badge = (
  <span className="badge !bg-warning/10 !text-warning !py-[0.25rem] !px-[0.45rem] !text-[0.75em] ms-2">
    12
  </span>
);
const badge1 = (
  <span className="text-secondary text-[0.75em] rounded-sm !py-[0.25rem] !px-[0.45rem] badge !bg-secondary/10 ms-2">
    New
  </span>
);
const badge2 = (
  <span className="text-danger text-[0.75em] rounded-sm badge !py-[0.25rem] !px-[0.45rem] !bg-danger/10 ms-2">
    Hot
  </span>
);
const badge4 = (
  <span className="text-success text-[0.75em] badge !py-[0.25rem] !px-[0.45rem] rounded-sm bg-success/10 ms-2">
    3
  </span>
);

export const MenuItems: any = [
  {
    menutitleKey: "main",
  },

  {
    icon: DashboardIcon,
    titleKey: "dashboards",
    type: "sub",
    active: false,
    adminOnly: true,
    children: [
      {
        path: "/components/dashboards/crm",
        type: "link",
        active: false,
        selected: false,
        titleKey: "dashboard",
      },
    ],
  },
  {
    icon: ValueBetIcon,
    titleKey: "bets",
    type: "sub",
    active: false,
    children: [
      {
        path: "/valuebet",
        type: "link",
        active: false,
        selected: false,
        titleKey: "valueBets",
      },
      {
        path: "/surebet",
        type: "link",
        active: false,
        selected: false,
        titleKey: "sureBets",
      },
    ],
  },
  {
    icon: SubscriptionIcon,
    path: "/#pricing",
    type: "link",
    active: false,
    selected: false,
    titleKey: "subscription",
  },
  {
    icon: ApiIcon,
    path: "/api",
    type: "link",
    active: false,
    selected: false,
    titleKey: "api",
    adminOnly: true,
  },

  {
    menutitleKey: "admin",
    adminOrPartnerOrStoreOnly: true,
  },
  {
    icon: UserManageIcon,
    titleKey: "management",
    type: "sub",
    active: false,
    adminOrPartnerOrStoreOnly: true,
    children: [
      { path: "/users", type: "link", active: false, selected: false, titleKey: "userManagement", visibleForManagement: true },
      { path: "/payments", type: "link", active: false, selected: false, titleKey: "paymentManagement", adminOnly: true },
      { path: "/partners", type: "link", active: false, selected: false, titleKey: "partnerManagement", adminOnly: true },
      { path: "/stores", type: "link", active: false, selected: false, titleKey: "storeManagement", partnerOnly: true },
      { path: "/settlements", type: "link", active: false, selected: false, titleKey: "settlementManagement", partnerOnly: true },
    ],
  },
];
export default MenuItems;
