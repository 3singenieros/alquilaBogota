# Conexión a Supabase — guía rápida

## Prerrequisitos

- Schema aplicado en Supabase: `docs/database/supabase-schema.sql`
- (Opcional) Seed demo: `docs/database/supabase-seed.sql`

## Pasos

1. Entra a [Supabase Dashboard](https://supabase.com/dashboard) y abre tu proyecto.
2. Ve a **Project Settings** (engranaje).
3. Abre la sección **API**.
4. Copia **Project URL** (ej. `https://abcdefgh.supabase.co`).
5. Copia **anon public** key (clave pública, no la service role).
6. Abre `.env.local` en la raíz del proyecto y pega los valores:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

7. Activa persistencia real:

```env
NEXT_PUBLIC_APP_MODE=SUPABASE
NEXT_PUBLIC_USE_MOCK_DATA=false
```

8. Reinicia el servidor de desarrollo:

```bash
npm run dev
```

9. Verifica en consola:

```
[APP MODE] SUPABASE
```

10. Ejecuta el chequeo de conexión:

```bash
npm run check:supabase
```

Debe mostrar **Conexión correcta** si URL, key y schema están bien.

## Volver a mock

```env
NEXT_PUBLIC_APP_MODE=MOCK
NEXT_PUBLIC_USE_MOCK_DATA=true
```

Reinicia `npm run dev`. Deberías ver `[APP MODE] MOCK`.

## Errores frecuentes

| Mensaje | Causa probable |
|---------|----------------|
| Faltan `NEXT_PUBLIC_SUPABASE_URL` o `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Variables vacías o placeholders sin reemplazar |
| Tabla `usuarios` no encontrada | No se ejecutó `supabase-schema.sql` |
| Error 42501 / RLS en `profiles` | Ejecutar `docs/database/supabase-rls-demo.sql` en SQL Editor |
| Error 23503 al crear inmueble | El perfil existía en `profiles` pero no en `usuarios`; recarga la página (sincroniza al iniciar sesión) |
| Error 23503 al crear contrato | Invitación por email sin arrendatario registrado: debe guardarse `null`, no `""` en `arrendatario_id` (ya corregido en código) |
| `APP_MODE=MOCK` en check | El script prueba conexión igual; confirma que pegaste URL y key reales |

## Referencias

- Arquitectura híbrida: `docs/database/persistence-architecture.md`
- Modelo relacional: `docs/database/database-model.md`
