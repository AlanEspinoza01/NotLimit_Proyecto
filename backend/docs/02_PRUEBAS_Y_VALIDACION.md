# 02 · Plan de pruebas y evidencia de validación

**Corte:** 21-11-2026 · **Módulos:** Webpay Plus, inventario, cupones, órdenes, comprobantes e historial.  
**Fuente de evidencia:** resultados y capturas compartidos durante el desarrollo; revisión de la versión exportada en TXT. No se incluye acceso a la base de datos real ni a la cuenta Transbank.

## 1. Qué se ha probado y qué no

Se informó y mostró un **recorrido manual exitoso**: canje de un cupón en el perfil, registro del código en `payment_coupons`, descuento de puntos en `users`, uso del cupón en carrito, confirmación del pago mediante Webpay, cupón `USED`, aparición de la orden y actualización de puntos. También se compartieron salidas de compilación `tsc` y `vite`, filtros y pantallas de seguimiento en iteraciones anteriores.

**Limitación:** no existe un reporte de ejecución automática ni evidencia reproducible para todos los casos de error, concurrencia, expiración o reembolso. Las capturas no prueban por sí mismas las propiedades de seguridad.

**Estado del repositorio exportado:** `backend/tests/health.test.ts` contiene únicamente una constante identificadora de suite; `backend/package.json` declara `dev`, `build`, `start`, pero **no** un script `test`. No presentar `npm test` como prueba pasada hasta implementar una suite real.

## 2. Matriz de pruebas funcionales

**Leyenda:** `Reportada manualmente` = el flujo fue mostrado o descrito con evidencia conversacional; `Pendiente` = falta ensayo/evidencia repetible; `Inspección de código` = se identificó el control en código, sin ejecutar el caso de extremo a extremo.

| ID | Escenario | Resultado esperado | Evidencia disponible | Estado |
|---|---|---|---|---|
| T-01 | Canjear cupón con saldo suficiente | `users.loyaltyPoints` disminuye y aparece documento `AVAILABLE` en `payment_coupons`. | Capturas de perfil y MongoDB tras un canje. | **Reportada manualmente** |
| T-02 | Aplicar cupón propio a una compra | Backend comprueba propiedad, vigencia, mínimo y calcula descuento. | Capturas de carrito con cupón aplicado y total ajustado. | **Reportada manualmente** |
| T-03 | Webpay autoriza una compra con cupón | `orders.paymentStatus=CONFIRMED`, intento confirmado y cupón `USED`; comprobante disponible. | Capturas del resultado de Webpay, historial y cupón utilizado. | **Reportada manualmente** |
| T-04 | Puntos tras compra autorizada | Se acreditan los puntos una vez; no se usan como medio de pago directo. | Capturas del saldo antes y después de compra. | **Reportada manualmente** |
| T-05 | Generación y visualización del comprobante | Datos de orden persistida; impresión y descarga disponibles. | Capturas de diseño y enlaces del flujo de comprobante. | **Reportada manualmente**; validar PDF exportado |
| T-06 | Cambio logístico de orden Webpay confirmada | Administrador avanza a preparación/entrega sin alterar `paymentStatus`. | Se reportó un 403 y su corrección; captura de tabla actualizada. | **Validación parcial**; repetir flujo completo |
| T-07 | Filtro administrativo por Webpay y por pago | Aparecen órdenes correspondientes; no confundir entrega con cobro. | Capturas de vista filtrada y estado de pago. | **Validación visual parcial** |
| T-08 | Historial del cliente solo con compras confirmadas | Excluye `PENDING`, `REJECTED`, `REFUNDED`; ordena por `createdAt`. | Código de `getMyOrders` y capturas de historial. | **Inspección de código**; ampliar evidencia |
| T-09 | Doble clic en pagar con mismo `requestId` | Solo un intento/reserva, siguiente solicitud informa conflicto. | Índice único en `webpay_attempts`, validación en controlador. | **Pendiente** |
| T-10 | Dos clientes compran la última talla | Solo uno puede reservar; no aparece stock negativo. | Incrementos condicionales en `stock.service.ts`. | **Pendiente** (prueba paralela) |
| T-11 | Webpay rechaza de forma definitiva | Orden `REJECTED`, ingreso `0`, stock restaurado, cupón liberado. | Lógica implementada en `paymentLifecycle.service.ts`. | **Pendiente** |
| T-12 | Cliente abandona o pierde conexión tras pagar | No acreditar ni liberar stock hasta reconciliar estado oficial. | `REVIEW_REQUIRED` y función de conciliación implementadas. | **Pendiente** |
| T-13 | Repetir retorno de Transbank | No duplicar venta, puntos, consumo de cupón ni descuento de stock. | Guardas condicionales de estado en el backend. | **Pendiente** |
| T-14 | Modificar subtotal/descuento en DevTools | El servidor recalcula total y rechaza discrepancia. | `quoteCheckout` + `TOTAL_MISMATCH`. | **Pendiente** |
| T-15 | Aplicar cupón de otro usuario o vencido | Bloqueo sin descontar ni reservar. | Consultas por `code`, `userId`, `status` y `expiresAt`. | **Pendiente** |
| T-16 | Cliente intenta aprobar pago desde panel/API | No puede cambiar transacción de pasarela a `CONFIRMED`. | Comprobación de rol y de medio de pago en rutas administrativas. | **Pendiente** |
| T-17 | Cupón canjeado con solicitud duplicada | Un solo descuento de puntos y una sola emisión. | `clientRequestId` único y transacción MongoDB. | **Pendiente** |
| T-18 | Orden histórica con precio/descuento | Historial usa valores guardados de la orden, no precio actual. | Código de recibo y mejoras del historial. | **Pendiente** (comparar con documento) |
| T-19 | Ventana estrecha o pantalla móvil | Tarjetas y filtros accesibles sin recorte del contenedor. | Pruebas visuales reportadas para distintos anchos. | **Validación de diseño**, no prueba funcional completa |

## 3. Comandos para comprobar compilación (PowerShell)

**Backend** — ejecutar desde `NotLimit_Proyecto/backend`:

```powershell
npm ci
npm run build
npm run dev
```

**Frontend** — ejecutar desde `NotLimit_Proyecto/frontend`, en otra terminal:

```powershell
npm ci --include=optional
npm run lint
npm run build
npm run dev
```

En las iteraciones de desarrollo anteriores el usuario compartió ejecuciones satisfactorias de `backend: npm run build` y `frontend: npm run lint` + `npm run build`. **Estas salidas no certifican la compilación de todos los archivos exactamente en el momento de este corte; se deben repetir tras integrar los cambios.**

### Comprobación de índices — opcional y controlada

Desde `backend/`:

```powershell
node --env-file=src/middleware/.env scripts/ensureCouponIndexes.cjs
```

Este comando **crea/verifica índices reales** en MongoDB. Ejecutarlo solo en la base de pruebas aprobada y con respaldo; no forma parte de un test de solo lectura.

## 4. Procedimiento de prueba de extremo a extremo

1. Utilizar **únicamente el entorno de integración de Transbank** y una base MongoDB de pruebas aislada. Verificar `WEBPAY_ENV=integration`; no utilizar tarjetas reales.
2. Registrar estado inicial de una talla (`products.sizeBreakdown.quantity`, `stock`, `totalStock`), saldo de puntos de usuario de prueba y catálogo de cupones.
3. Canjear un cupón mediante **Mi perfil**, verificar que aparezca `AVAILABLE` en `payment_coupons` y que los puntos se descuenten exactamente una vez.
4. Preparar carrito con una o dos unidades, aplicar el código y registrar subtotal, descuento, envío y total calculado.
5. Iniciar Webpay; antes de completarlo revisar la orden: `PENDING`, `confirmedRevenue=0`, intento `READY` y unidades reservadas. **No registrar datos de tarjeta** en evidencia.
6. Autorizar el pago con un medio de prueba válido según las instrucciones actuales del ambiente de integración; comprobar `CONFIRMED` en orden e intento, ingreso exacto y cupón `USED`.
7. Comprobar que el inventario **no se descontó dos veces**, que la orden se ve en el panel y en historial del comprador, que el comprobante contiene el total correcto y que no hay segunda acreditación de puntos al recargar la vista.
8. Repetir en escenario de rechazo y de interrupción; anotar si el sistema concilia o entra en revisión, y comprobar la restitución del stock **solo ante rechazo verificado**.
9. En administración, avanzar preparación/envío/retiro y confirmar que `paymentStatus` permanece inmutable; verificar historial/auditoría.
10. Probar ventanas de 320, 430, 768, 1024 y 1366 px; asegurar que todos los botones sigan operativos y no se oculten datos críticos.

## 5. Formato para registrar cada nueva ejecución

Copiar esta ficha en una incidencia, PR o bitácora de QA; **no** almacenar RUT, correos reales, tokens, comprobantes con datos personales ni URLs privadas:

```text
Caso ID:
Fecha y hora:
Entorno: local / staging (nunca publicar secretos)
Commit SHA:
Revisor:
Datos de prueba: IDs anonimizados
Pasos ejecutados:
Resultado esperado:
Resultado observado:
Estado: PASA / FALLA / BLOQUEADO
Evidencia: enlace interno o captura anonimizada
Incidencia relacionada:
```

## 6. Pruebas automatizadas que faltan

Antes de presentar este módulo como validado de forma integral, incorporar una suite de integración con MongoDB aislado y simulaciones de Transbank para:

- Doble confirmación, doble canje, idempotencia y fallos entre transacciones.
- Reserva concurrente del último producto y reversión total por rechazo.
- Estado `REVIEW_REQUIRED` con y sin token, conciliación repetida y errores de red.
- Seguridad de roles, origen, cupones de terceros y alteración de importes.
- Comprobante confirmado vs. pendiente, historial de solo pagadas y exportación de PDF.

**No se agrega ninguna suite ficticia en este paquete**: estos README documentan las evidencias actuales y la planificación de pruebas restantes.
