"use client";

import React, { createContext, useCallback, useContext, useState } from "react";

interface BetsCountContextValue {
  valuebetCount: number;
  surebetCount: number;
  setValuebetCount: (n: number) => void;
  setSurebetCount: (n: number) => void;
}

const BetsCountContext = createContext<BetsCountContextValue | null>(null);

export function BetsCountProvider({ children }: { children: React.ReactNode }) {
  const [valuebetCount, setValuebetCount] = useState(0);
  const [surebetCount, setSurebetCount] = useState(0);
  const setV = useCallback((n: number) => setValuebetCount(n), []);
  const setS = useCallback((n: number) => setSurebetCount(n), []);
  const value: BetsCountContextValue = {
    valuebetCount,
    surebetCount,
    setValuebetCount: setV,
    setSurebetCount: setS,
  };
  return (
    <BetsCountContext.Provider value={value}>
      {children}
    </BetsCountContext.Provider>
  );
}

export function useBetsCount(): BetsCountContextValue {
  const ctx = useContext(BetsCountContext);
  if (!ctx) {
    return {
      valuebetCount: 0,
      surebetCount: 0,
      setValuebetCount: () => {},
      setSurebetCount: () => {},
    };
  }
  return ctx;
}
