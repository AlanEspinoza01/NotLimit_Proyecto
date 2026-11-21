# NoLimits | Documentación técnica del backend

**Corte de documentación:** 21 de noviembre de 2026  
**Fuente:** código exportado de `NotLimit_Proyecto` el 21-11-2026 y evidencias de desarrollo compartidas durante la integración.  
**Alcance:** integración Webpay Plus, cupones relacionados con el pago, pruebas y seguimiento de errores.  
**Estado:** integración probada manualmente en un recorrido exitoso; **no equivale a una auditoría de seguridad ni a una certificación de producción**.

## Índice

| Documento | Para qué sirve |
|---|---|
| [01 · Integración Webpay](01_INTEGRACION_WEBPAY.md) | Arquitectura, API, datos, estados, reglas de seguridad y conciliación. |
| [02 · Pruebas y resultados](02_PRUEBAS_Y_VALIDACION.md) | Evidencias disponibles, matriz de pruebas manuales, comandos y pruebas pendientes. |
| [03 · Registro de errores](03_REGISTRO_DE_ERRORES.md) | Problemas encontrados, síntomas, causas, correcciones y riesgos abiertos. |

## Cómo leer estos documentos

- **Implementado en código:** el comportamiento se observó en los archivos del TXT; no significa que se haya probado cada caso de ejecución.
- **Validado manualmente:** existe un reporte del flujo ejecutado y/o una captura aportada durante el desarrollo; no se adjuntan registros de pruebas automatizadas.
- **Pendiente de probar:** se definió el caso de prueba, pero no hay evidencia suficiente de su ejecución.
- **Riesgo abierto:** hay una condición que debe corregirse o auditarse antes de un despliegue productivo.

## Responsabilidades por módulo

```text
NotLimit_Proyecto/
├── backend/
│   ├── docs/                            # Este directorio
│   ├── src/
│   │   ├── controllers/webpay.controller.ts
│   │   ├── routes/webpay.routes.ts
│   │   ├── models/{Order,PaymentCoupon,WebpayAttempt}.model.ts
│   │   └── services/webpay/             # Lógica de integración y recibos
│   ├── scripts/ensureCouponIndexes.cjs
│   └── tests/health.test.ts             # Archivo base, todavía NO suite ejecutable
└── frontend/
    ├── views/CheckoutView.tsx
    ├── views/WebpayResultView.tsx
    ├── components/common/PurchaseReceipt.tsx
    └── components/profile/ProfileOrdersTab.tsx
```

**Gestión de secretos:** todas las credenciales de MongoDB, JWT, Webpay y demás servicios se mantienen fuera de Git, en `backend/src/middleware/.env`. El frontend realiza solicitudes mediante Axios y su configuración local de conexión. Nunca subir `.env`, tokens, cookies, datos de tarjetas, RUT o información personal de clientes junto a esta documentación.

## Control para compartir con el equipo

1. Revisar los [riesgos abiertos](03_REGISTRO_DE_ERRORES.md#riesgos-abiertos-detectados-en-la-versión-actual).
2. Ejecutar compilaciones y dejar constancia del resultado en [02 · Pruebas](02_PRUEBAS_Y_VALIDACION.md).
3. Comprobar que `.env`, `node_modules`, `dist`, identificadores reales y capturas con datos personales no estén incluidos en el commit.
4. Incorporar estos README en un commit independiente o claramente identificado dentro del mismo cambio funcional, y compartir el enlace del commit o pull request al colega.

> **Criterio de seguridad:** no usar la frase «sistema blindado» o «100 % seguro». Describir controles concretos, evidencia reproducible y pendientes.
