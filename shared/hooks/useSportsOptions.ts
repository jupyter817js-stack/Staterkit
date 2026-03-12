import { useEffect, useState } from "react";
import { getSports } from "@/shared/api/sports";

export interface SportSelectOption {
  value: number;
  label: string;
}

/** API 스포츠 목록을 react-select options로 변환 */
function toSelectOptions(
  list: { id: number; name: string }[],
): SportSelectOption[] {
  return list.map((s) => ({ value: s.id, label: s.name }));
}

export function useSportsOptions(): {
  options: SportSelectOption[];
  loading: boolean;
} {
  const [options, setOptions] = useState<SportSelectOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getSports()
      .then((list) => setOptions(toSelectOptions(list)))
      .finally(() => setLoading(false));
  }, []);

  return { options, loading };
}
