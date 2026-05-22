export const USE_MOCK_DATA =
  process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "false" &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL;

export const STORAGE_BUCKETS = {
  comprobantes: "comprobantes",
  contratos: "contratos",
  mantenimiento: "mantenimiento",
  documentos: "documentos",
} as const;
