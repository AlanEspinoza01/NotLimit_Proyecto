# Servicios Webpay
- `webpay.client.ts`: API REST oficial Transbank.
- `pricing.service.ts`: calcula montos del catálogo MongoDB y cotizaciones.
- `stock.service.ts`: reserva atómica de talla y liberación.
- `coupon.service.ts`: emisión/canje verificado y bloqueo de cupones.
- `paymentLifecycle.service.ts`: venta confirmada + ingreso + puntos **una sola vez**.
- `shippingQuotesEngine.ts`: misma matriz de tarifas que el frontend, copiada sin modificaciones.
Las órdenes Webpay nunca deben confirmarse por rutas administrativas.
