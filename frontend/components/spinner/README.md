# Spinner global de NoLimits (estética Windows XP)

## Archivos

- `GlobalSpinner.tsx`: componente animado y controlador de la carga de sesión, cambios de página y solicitudes HTTP.
- `GlobalSpinner.css`: estilos **aislados**, sin alterar `html`, `body`, el scroll ni el escritorio.
- `loadingStore.ts`: contador de tareas simultáneas; cada tarea devuelve una función que solo puede finalizar una vez.

## Integración

- `frontend/App.tsx` monta `GlobalSpinnerController` dentro de `HashRouter` y `AuthProvider`.
- `frontend/api/axios.ts` indica cuándo comienza y termina cada solicitud de la instancia central Axios.
- `frontend/services/api.ts` hace lo mismo para el cliente heredado basado en `fetch`.
- No se modifica Webpay, stock, cupones, autenticación, API ni variables de entorno.
- El texto del diseño se reemplazó por un enlace real a `https://nolimitsbrand.cl/`.

## Comportamiento

1. Durante la validación inicial de sesión (`AuthContext.isLoading`), el spinner se muestra inmediatamente.
2. Al cambiar de ruta se muestra brevemente y permanece si aún existen solicitudes rastreadas.
3. Si una solicitud termina correctamente **o con error**, se decrementa el contador.
4. Se retrasa ligeramente su aparición en solicitudes rápidas para evitar parpadeos.
5. No utiliza el `setTimeout` fijo de 4500 ms del CodePen ni introduce su login/escritorio.

Para cargar archivos o realizar operaciones con `fetch()` **fuera** del cliente `services/api.ts`,
se puede indicar manualmente el trabajo asíncrono:

```tsx
import { beginGlobalLoading } from '../components/spinner/loadingStore';

const finish = beginGlobalLoading();
try {
  await realizarOperacion();
} finally {
  finish();
}
```

**Nota:** no es una barra de porcentaje real: el movimiento representa actividad en curso.
El componente no debe utilizarse como confirmación de un pago; ese estado lo verifica el backend.

## Comprobaciones locales

Desde `frontend/`:

```powershell
npm run lint
npm run build
npm run dev
```

Verificar inicio de sesión, navegación entre Inicio / Catálogo / Carrito / Super Admin,
peticiones fallidas y tamaños 320 px / 768 px / 1366 px. La conexión a MongoDB no forma
parte de esta interfaz de carga.
