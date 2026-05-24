# Ubicación de inmuebles (alcance Bogotá)

El modelo conserva el campo `ciudad` para permitir futura expansión multi-ciudad, aunque el alcance actual del prototipo se limita a **Bogotá D.C.**

- Constantes y helpers: `lib/inmueble-ubicacion.ts`
- `localidad`: una de las 20 localidades de Bogotá
- `barrio` y `estrato`: opcionales, orientados al contexto local
- En formularios la ciudad se muestra fija/preseleccionada como Bogotá D.C.
