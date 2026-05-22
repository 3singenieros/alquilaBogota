import { generateUniqueCode } from "@/lib/entity-codes";
import { newId } from "@/repositories/mock-store";

export function buildMockEntity<T extends { id: string; code: string }>(
  prefix: string,
  data: Omit<T, "id" | "code">,
  existing: T[]
): T {
  const codes = existing.map((e) => e.code);
  return {
    ...data,
    id: newId(prefix),
    code: generateUniqueCode(prefix, codes),
  } as T;
}
