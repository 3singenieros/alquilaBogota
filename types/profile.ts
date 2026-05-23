import type { Rol } from "@/types";

export interface UserProfile {
  id: string;
  firebaseUid: string;
  nombre: string;
  email: string;
  roles: Rol[];
  rolActivo: Rol;
  telefono?: string;
  perfilCompletado: boolean;
  creadoEn: string;
  actualizadoEn?: string;
}

export type CreateProfileInput = Omit<UserProfile, "id" | "creadoEn" | "actualizadoEn"> &
  Partial<Pick<UserProfile, "id" | "creadoEn">>;

export type UpdateProfileInput = Partial<
  Omit<UserProfile, "id" | "creadoEn">
>;
