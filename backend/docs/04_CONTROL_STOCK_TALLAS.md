# 04 · Stock por talla y confirmación de talla al comprar

Fecha: 21-11-2026 · Módulos: detalle, catálogo, selección rápida y carrito.

## Objetivo

- Talla agotada = botón no seleccionable, con etiqueta «Agotada».
- Producto con cero unidades = «Agotado»; no se puede añadir al carrito.
- Si la compra tiene una talla, mostrarla en el carrito y en el resumen de compra, **incluida la pantalla Checkout (Paso 3)**.
- Antes de navegar al checkout, consultar `/api/products` y contrastar las cantidades por talla actuales contra lo pedido; ante un fallo de red se bloquea el avance.
- El backend Webpay sigue siendo la autoridad final: `stock.service.ts` realiza reserva condicional por talla bajo transacción MongoDB. **No se modifica** la confirmación del cobro ni el circuito de cupones.

## Archivos

- `frontend/services/productStock.ts`: funciones de talla y stock reutilizables.
- `frontend/views/ProductDetailView.tsx`: carga de inventario, selector de tallas, bloqueo y aviso.
- `frontend/components/common/QuickAddSizeModal.tsx`: mismo criterio en selector rápido.
- `frontend/components/home/ProductCard/ProductCard.tsx`: tarjeta «Agotado».
- `frontend/views/HomeView.tsx` y `frontend/views/CatalogView.tsx`: bloquean suma al carrito cuando faltan unidades.
- `frontend/context/CartContext.tsx`: limita cantidad usando inventario conocido.
- `frontend/components/cart/CartItemsList.tsx` y `cartTypes.ts`: identifican y muestran la talla elegida sin depender del texto de la categoría.
- `frontend/components/cart/CartOrderSummary.tsx`: confirma talla, producto y cantidad antes del pago.
- `frontend/views/CartView.tsx`: revisa el stock real desde el backend antes de pasar a Checkout.
- `frontend/views/CheckoutView.tsx`: muestra talla y cantidad antes de pagar y bloquea el envío de una prenda sin selección válida.

### CheckoutView — archivo completo actualizado con tu versión enviada

La versión original de `CheckoutView.tsx` se recibió **después** del primer ZIP. Se comprobó que el parche anterior no coincidía con esta versión: el parche asumía una importación de `productPricing` inexistente en el archivo real.

Por tanto, **este ZIP sustituye completamente al ZIP anterior** e incluye `frontend/views/CheckoutView.tsx` completo. **No ejecutes** `git apply` ni uses `CAMBIO_CHECKOUT_APLICAR.patch`.

Se actualizaron únicamente estos aspectos del checkout:

- La talla se muestra por `isRealSize(item.selectedSize)`, independientemente de una categoría genérica como «Ropa Superior».
- Un carrito antiguo con una prenda que exige talla y que no tenga selección válida no puede iniciar Webpay.
- El precio visual usa `getProductPricing()` (el mismo servicio utilizado en catálogo y carrito): evita `$0` cuando `salePrice` está guardado como cero en productos sin descuento.
- El cuerpo enviado a `POST /payments/webpay/start` no se modifica: conserva `productId`, `size`, `quantity`, `couponUsed`, envío y datos del comprador.
- No se cambian confirmación del cobro, emisión de cupones ni la reserva transaccional del backend.

## Casos para comprobar en una base de desarrollo

1. Camisa: S=0; M=20; L=20; XL=20. S deshabilitada; M/L/XL seleccionables.
2. Camisa: todas las tallas=0. Producto «Agotado», botón del carrito deshabilitado.
3. Carrito con talla M y cantidad 1. Mostrar exactamente la etiqueta «Talla: M (...)» junto a la prenda y en resumen.
4. Carrito con talla agotada por cambios de inventario: al continuar, mostrar aviso; no navegar al pago.
5. Disminuir stock por otro comprador mientras el carro está abierto: debe bloquear la continuación al superar las unidades disponibles.
6. Producto sin tallas y con stock: opción «Única» válida.
7. El backend sigue rechazando intentos de reservar tallas sin existencias incluso si se alteran solicitudes en el navegador.
8. Al confirmar un pago, la reserva Webpay no debe descontar el stock otra vez.

## Comprobaciones técnicas del paquete

- Las funciones puras `getStockForSize` / `getProductSizesWithStock` / `isProductOutOfStock` pasaron ocho comprobaciones con un inventario de ejemplo, mediante Node.js.
- Los 12 archivos TS/TSX revisados no tienen errores de **sintaxis** según el parser TypeScript.
- No se ejecutó el `npm run lint` ni un flujo de compra real en esta sesión (sin dependencias completas ni acceso a MongoDB local del equipo). Es necesario ejecutar y confirmar ambos en el proyecto original.

## Limitaciones

Las comprobaciones de frontend reducen confusiones pero **no sustituyen** la validación transaccional del servidor. Nunca descontar stock ni sumar ingresos por el simple hecho de que el usuario pulse «Pagar». El cobro debe confirmarse con Transbank y el inventario reservarse de manera atómica.
