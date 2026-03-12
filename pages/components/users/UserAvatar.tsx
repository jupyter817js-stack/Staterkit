"use client";

import React, { useState } from "react";

const basePath = process.env.NODE_ENV === "production" ? "" : "";

function getAvatarSrc(userId: number | string | null | undefined): string {
  const id = Number(userId);
  if (isNaN(id) || id < 1) return `${basePath}/assets/images/faces/1.jpg`;
  const idx = ((id - 1) % 20) + 1;
  return `${basePath}/assets/images/faces/${idx}.jpg`;
}

function getInitials(firstName: string, lastName: string): string {
  const f = (firstName ?? "").trim().charAt(0).toUpperCase();
  const l = (lastName ?? "").trim().charAt(0).toUpperCase();
  return f && l ? `${f}${l}` : f || l || "?";
}

export default function UserAvatar({
  userId,
  firstName,
  lastName,
}: {
  userId: number;
  firstName: string;
  lastName: string;
}) {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(firstName, lastName);

  if (imgError) {
    return (
      <span className="!w-10 !h-10 !min-w-[2.5rem] !min-h-[2.5rem] !rounded-full flex items-center justify-center bg-primary/10 text-primary !text-sm !font-semibold shrink-0">
        {initials}
      </span>
    );
  }

  return (
    <img
      src={getAvatarSrc(userId)}
      alt=""
      className="!w-10 !h-10 !min-w-[2.5rem] !min-h-[2.5rem] !rounded-full object-cover border-2 border-defaultborder dark:border-white/10 shrink-0"
      onError={() => setImgError(true)}
    />
  );
}
