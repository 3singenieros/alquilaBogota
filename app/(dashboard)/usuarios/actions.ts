"use server";

import {
  actualizarUsuario,
  crearUsuario,
  eliminarUsuario,
} from "@/services/usuarios.service";
import type { CreateInput, UpdateInput, Usuario } from "@/types";
import { revalidatePath } from "next/cache";

export async function crearUsuarioAction(data: CreateInput<Usuario>) {
  await crearUsuario(data);
  revalidatePath("/usuarios");
}

export async function actualizarUsuarioAction(id: string, data: UpdateInput<Usuario>) {
  await actualizarUsuario(id, data);
  revalidatePath("/usuarios");
}

export async function eliminarUsuarioAction(id: string) {
  await eliminarUsuario(id);
  revalidatePath("/usuarios");
}
