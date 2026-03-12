import { useEffect, useState } from "react";
import { getBookmakers } from "@/shared/api/bookmakers";
import type { BookmakerSelectOption } from "@/shared/types/bookmakers";

/** API 부키 목록을 react-select options로 변환 */
function toSelectOptions(list: { id: number; bookmakersName: string }[]): BookmakerSelectOption[] {
  return list.map((b) => ({ value: b.id, label: b.bookmakersName }));
}

export function useBookmakerOptions(): BookmakerSelectOption[] {
  const [options, setOptions] = useState<BookmakerSelectOption[]>([]);

  useEffect(() => {
    getBookmakers().then((list) => setOptions(toSelectOptions(list)));
  }, []);

  return options;
}
