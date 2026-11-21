# 03 · Registro de incidencias y correcciones

**Corte:** 21-11-2026  
**Método:** reconstrucción a partir del código exportado y los errores/capturas comunicados durante el desarrollo.  
**Alcance:** integración de pagos, cupones, inventario, comprobantes, órdenes, historial y diseño responsivo.

## Convenciones

- **Corregido / reportado:** existe una modificación identificable y/o prueba manual comunicada. No implica auditoría completa.
- **Parcial / por verificar:** la solución está presente, pero quedan escenarios sin ejecutar o discrepancias históricas.
- **Abierto:** el código actual conserva una condición que requiere revisión.

## Incidencias atendidas

| ID | Problema observado | Causa o diagnóstico | Acción aplicada / referencia | Estado |
|---|---|---|---|---|
| E-01 | Vite no iniciaba: `Cannot find native binding` de Rolldown y advertencias `EBADENGINE`. | Versión Node incompatible y dependencia nativa opcional sin resolver. | Actualización de Node y reinstalación; posteriormente `npm run dev` mostró Vite en puerto 3000. | **Corregido / reportado** |
| E-02 | `MODULE_NOT_FOUND` después de trasladar `webpay.client.ts` a `services/webpay/`. | Referencias a ruta anterior; luego export faltante (`assertWebpayIntegrationConfigured`). | Reorganización y corrección de imports. Archivo actual: `services/webpay/webpay.client.ts`. | **Corregido / reportado** |
| E-03 | Error inicial Webpay: faltaban `WEBPAY_COMMERCE_CODE` y `WEBPAY_API_KEY`. | Credenciales de integración no encontradas por la configuración. | Variables gestionadas exclusivamente en `backend/src/middleware/.env`, cliente valida configuración. | **Corregido / reportado** |
| E-04 | Reserva de stock: `Cannot pass an array to query updates unless the updatePipeline option is set`. | Actualización Mongoose con pipeline no admitido en esa llamada. | Servicio de reserva con `$inc` y filtros condicionales por talla/stock: `stock.service.ts`. | **Corregido en código** |
| E-05 | Webpay rechazaba el total cuando existía un descuento de producto. | Diferencia entre precio mostrado en navegador y precio recalculado en backend. | `pricing.service.ts` calcula precio vigente y valida total; si cambia, devuelve `TOTAL_MISMATCH`. | **Corregido / reportado** |
| E-06 | Cupón local visible no servía en pago: «Cupón no emitido, vencido, usado o reservado». | Código en `localStorage` sin una emisión verificable en MongoDB. | Catálogo en `store_settings.coupons`, emisiones en `payment_coupons`; canje transaccional en backend. La migración antigua, si procede, exige revisión manual. | **Corregido / reportado** |
| E-07 | Los puntos podían alterarse desde el navegador al usarse para descuentos. | Lógica y persistencia local no autorizadas como registro financiero. | `redeemServerCoupon` descuenta puntos en MongoDB; el checkout solo permite códigos emitidos y no pagos directos con puntos. | **Corregido en código**, faltan pruebas adversariales |
| E-08 | Pago confirmado sin comprobante detallado o sin descargar/imprimir. | Vista de resultado demasiado básica y sin datos completos del registro. | `receipt.service.ts`, `receipt.controller.ts`, `PurchaseReceipt.tsx` y exportación desde el frontend. | **Corregido / reportado** |
| E-09 | Al cambiar un pedido Webpay a preparación aparecía `403 Forbidden`. | Se bloqueaba indistintamente el cambio de pago y el cambio logístico. | `updateOrderStatus` permite transiciones logísticas solo con pago `CONFIRMED` y mantiene el pago protegido. | **Corregido en código**; repetir pruebas de roles |
| E-10 | Filtro «Webpay» no encontraba órdenes existentes y «Pago confirmado» ignoraba órdenes en preparación/entrega. | Inconsistencias de texto del método y confusión entre `status` y `paymentStatus`. | Separación de filtro económico de estado logístico; normalización de medio de pago en interfaz. | **Corregido / validación visual parcial** |
| E-11 | Historial del comprador mezclaba órdenes pendientes y precios actuales con compras pasadas. | Se consultaban/mostraban estados no financieros o información del catálogo actual. | `getMyOrders` filtra `paymentStatus: CONFIRMED`, ordena por `createdAt`; recibo utiliza datos guardados en `orders`. | **Corregido en código**; revisar compras antiguas |
| E-12 | Tabla de órdenes se recortaba al reducir el ancho del navegador. | Layout ancho y columnas rígidas en una ventana con barra lateral. | Contenedores responsivos y alternativa en fichas para pantallas pequeñas. | **Mejora visual reportada**; probar cada módulo aparte |

## Qué se corrigió a nivel de diseño técnico

- Se separó **confirmación del dinero** de **preparación y envío**.
- El stock se **reserva** antes de dirigir al cliente a Transbank y se confirma como vendido tras la autorización; no se duplica el descuento al confirmar.
- El cupón se **reserva** para una única orden y pasa a **utilizado** tras pago confirmado, o vuelve a **disponible** si se acredita un rechazo definitivo.
- El comprobante se genera con los datos de la orden, no con un total editable en el navegador.
- El panel administrativo y el historial filtran por el campo económico cuando la consulta trata sobre pagos.

## Riesgos abiertos detectados en la versión actual

Estos puntos son **hallazgos del TXT actual**, no errores declarados como resueltos. Deben incorporarse al backlog y evaluarse antes de operar con dinero real.

| ID | Prioridad | Evidencia de código y riesgo | Acción sugerida |
|---|---|---|---|
| R-01 | **Alta** | En `admin.controller.ts` → `updateSystemAlert`, si se rechaza una solicitud de devolución se asigna `paymentStatus='REJECTED'` y `confirmedRevenue=0` a la orden original. **Rechazar una devolución no invalida el cobro ya aprobado**. | Separar el estado de devolución del pago; impedir que una devolución rechazada cambie `paymentStatus` o ingresos. Añadir test de regresión. |
| R-02 | **Alta** | En `webpay.controller.ts` → `reconcileWebpay`, un intento vencido **sin token** termina como `MANUAL_REVIEW_NO_TOKEN`; el código no libera el stock en ese caso ni muestra scheduler activo que invoque la conciliación. Una reserva podría persistir. | Diseñar recuperación documentada de intentos sin token, reconciliación periódica autenticada y alarmas; no liberar sin descartar una autorización. |
| R-03 | **Media-alta** | `app.ts` usa CORS con `origin: true, credentials: true`, reflejando el origen. Las operaciones sensibles sí usan comprobación adicional de origen, pero no todos los endpoints necesariamente comparten esa política. | Configurar allowlist estricta de CORS por ambiente y revisar rutas autenticadas con cookie. |
| R-04 | **Media-alta** | Existe la función heredada `createPublicOrder` en `admin.controller.ts`: acepta precios/estado del cliente y descuenta inventario. **Actualmente no está enlazada en `routes/index.ts`**, lo cual evita que forme parte del checkout público. | Mantener deshabilitada, eliminarla de forma controlada o refactorizarla antes de reutilizarla. Añadir comprobación de rutas en CI. |
| R-05 | **Media** | `getCustomers` calcula algunos totales desde órdenes cuyo `status` no está cancelado, sin exigir `paymentStatus='CONFIRMED'`, a diferencia del panel principal. | Alinear estadísticas económicas con pagos confirmados y evitar doble conteo por correo/ID. |
| R-06 | **Media** | `tests/health.test.ts` es un marcador y el backend no ofrece `npm test`. No existen pruebas automatizadas de integración Webpay compartidas. | Incorporar test runner, mocks de Transbank, base aislada y CI antes de proclamar pruebas exhaustivas. |
| R-07 | **Media** | En `webpay.controller.ts`, un fallo después de reservar stock y antes de completar la creación del token marca el intento `REVIEW_REQUIRED`. Es prudente ante estados externos ambiguos, pero necesita estrategia de resolución/alerta. | Añadir monitoreo y protocolo de recuperación para `INITIATING`/`REVIEW_REQUIRED`. |

### Sobre la indicación «Pago pendiente de verificación»

Este texto **no significa necesariamente que el cliente no haya pagado**. Indica que faltan datos suficientes para comprobar el pago contra el backend. Para Webpay, una prueba de pago requiere `orders.paymentStatus=CONFIRMED` **y** `webpay_attempts.state=CONFIRMED`. Una orden antigua sin intento verificable puede mostrar el detalle sin acreditación del pago. La revisión debe hacerse en el backend, nunca marcando manualmente la transacción como aprobada.

## Registro para próximas correcciones

Mantener para cada incidencia:

```text
ID:
Fecha:
Módulo:
Versión/commit:
Descripción y pasos de reproducción:
Comportamiento esperado:
Comportamiento observado:
Causa raíz verificada:
Archivos modificados:
Pruebas ejecutadas y evidencia (anonimizada):
Estado: Abierto / En curso / Corregido / Validado
Revisor:
```

**No adjuntar a GitHub datos reales de clientes, secretos, tokens de pago, cookies ni capturas sin anonimizar.**
