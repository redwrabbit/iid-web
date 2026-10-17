import { CATEGORY_LIST, SUBCATEGORY_LIST } from "@/lib/search";

export const RESOURCE_CATEGORIES = CATEGORY_LIST.filter((c) => c !== "전체");

// 분류 값이 목록 안에 있는지 확인 (없으면 기본값)
export function cleanCategory(category: string | null | undefined) {
  return category && RESOURCE_CATEGORIES.includes(category) ? category : "기타";
}
export function cleanSubcategory(category: string, sub: string | null | undefined) {
  const list = SUBCATEGORY_LIST[category] || [];
  return sub && list.includes(sub) ? sub : "";
}
