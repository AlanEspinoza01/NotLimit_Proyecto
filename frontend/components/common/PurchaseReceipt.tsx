import React from 'react';
import { AlertCircle, CheckCircle2, Download, Printer } from 'lucide-react';
import {
  downloadReceiptPdf,
  getReceiptStatus,
  printReceipt,
  receiptDate,
  receiptMoney,
  type PurchaseReceiptData,
} from '../../services/receiptExport';

/** Comprobante compartido entre la confirmación de Webpay y las órdenes del administrador. */
export const PurchaseReceipt: React.FC<{ receipt: PurchaseReceiptData }> = ({ receipt }) => {
  // La confirmación del pago debe venir del backend, nunca del carrito o del navegador.
  const confirmed = receipt.verified;
  const status = getReceiptStatus(receipt);
  const addr = receipt.delivery.address;
  const address = addr
    ? [addr.street, addr.number, addr.apartment, addr.comuna, addr.region].filter(Boolean).join(', ')
    : '';

  return (
    <section className="bg-white text-gray-900 text-xs border border-[#adb7c8] p-3 sm:p-5 space-y-4 max-w-3xl mx-auto" aria-label={confirmed ? 'Comprobante de pago' : 'Detalle de la orden'}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-[#1c4e99] pb-3">
        <div>
          <h2 className="font-black text-lg text-[#17428b]">NO LIMITS</h2>
          <p className="font-semibold text-gray-700">{confirmed ? 'Comprobante de pago' : 'Detalle de la orden'}</p>
        </div>
        <div className="bg-[#eef4ff] border border-[#9ab2dd] px-3 py-2 text-right">
          <div className="text-[10px] text-gray-600">Número de orden</div>
          <div className="font-bold font-mono text-[#17428b] break-all">{receipt.orderNumber}</div>
        </div>
      </header>

      <div className={`p-3 border flex items-start gap-2 ${confirmed
        ? 'bg-green-50 border-green-400 text-green-900'
        : receipt.paymentStatus === 'REJECTED' || receipt.paymentStatus === 'REFUNDED'
          ? 'bg-red-50 border-red-400 text-red-900'
          : 'bg-amber-50 border-amber-400 text-amber-900'}`} role="status">
        {confirmed ? <CheckCircle2 className="w-4 h-4 shrink-0"/> : <AlertCircle className="w-4 h-4 shrink-0"/>}
        <div>
          <strong>{status.title}</strong>
          <p className="text-[11px] leading-relaxed">{status.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="border border-gray-300 bg-[#f7f9fc] p-3 space-y-1 min-w-0">
          <h3 className="font-black text-blue-900 border-b border-gray-300 pb-1">Datos del comprador</h3>
          <p><strong>Nombre:</strong> {receipt.customer.name}</p>
          <p className="break-all"><strong>Correo:</strong> {receipt.customer.email || 'No informado'}</p>
          <p><strong>RUT:</strong> {receipt.customer.rut || 'No informado'}</p>
          <p><strong>Teléfono:</strong> {receipt.customer.phone || 'No informado'}</p>
        </div>
        <div className="border border-gray-300 bg-[#f7f9fc] p-3 space-y-1 min-w-0">
          <h3 className="font-black text-blue-900 border-b border-gray-300 pb-1">Pago y retiro o entrega</h3>
          <p><strong>Forma de pago:</strong> {receipt.paymentMethod || 'No informada'}</p>
          <p><strong>Fecha:</strong> {receiptDate(receipt.transactionDate || receipt.purchaseDate)}</p>
          {confirmed && receipt.authorizationCode && <p className="break-all"><strong>Código de autorización:</strong> {receipt.authorizationCode}</p>}
          <p><strong>Entrega:</strong> {receipt.delivery.type === 'retiro' ? 'Retiro en sucursal' : 'Despacho a domicilio'}</p>
          {receipt.delivery.branch && <p><strong>Sucursal:</strong> {receipt.delivery.branch}</p>}
          {receipt.delivery.courier && <p><strong>Transporte:</strong> {receipt.delivery.courier}</p>}
          {address && <p><strong>Dirección:</strong> {address}</p>}
        </div>
      </div>

      <div className="border border-gray-300 overflow-x-auto">
        <table className="w-full text-xs text-left min-w-[440px]">
          <thead className="bg-[#e8edf5] text-blue-950"><tr>
            <th className="p-2">Producto y talla</th>
            <th className="p-2 text-center">Cantidad</th>
            <th className="p-2 text-right">Precio unitario</th>
            <th className="p-2 text-right">Subtotal</th>
          </tr></thead>
          <tbody>{receipt.items.map((item, index) => <tr className="border-t border-gray-200" key={`${item.sku}-${index}`}>
            <td className="p-2 font-semibold">{item.name}<div className="font-normal text-gray-500">{item.size} · {item.sku}</div></td>
            <td className="p-2 text-center">{item.quantity}</td>
            <td className="p-2 text-right whitespace-nowrap">{receiptMoney(item.unitPrice)}</td>
            <td className="p-2 text-right whitespace-nowrap font-semibold">{receiptMoney(item.lineTotal)}</td>
          </tr>)}</tbody>
        </table>
      </div>

      <div className="max-w-sm ml-auto border border-gray-300 p-3 space-y-2">
        <div className="flex justify-between gap-3"><span>Subtotal de productos</span><strong>{receiptMoney(receipt.subtotal)}</strong></div>
        {receipt.couponCode && <p className="text-[11px] text-purple-800 break-all"><strong>Cupón utilizado:</strong> {receipt.couponCode}</p>}
        {receipt.discountAmount > 0 && <div className="flex justify-between gap-3 text-green-800"><span>Descuentos aplicados</span><strong>-{receiptMoney(receipt.discountAmount)}</strong></div>}
        <div className="flex justify-between gap-3"><span>Envío</span><strong>{receiptMoney(receipt.shippingCost)}</strong></div>
        <div className="flex justify-between gap-3 border-t-2 border-[#17428b] pt-2 text-base text-[#17428b] font-black"><span>{confirmed ? 'Total pagado' : 'Total de la orden'}</span><span>{receiptMoney(receipt.total)}</span></div>
      </div>

      {/* Las órdenes pendientes también pueden imprimirse, pero NO se etiquetan como pagos aprobados. */}
      <div className="flex flex-wrap justify-end gap-2 border-t border-gray-300 pt-3">
        <button type="button" className="winxp-button px-3 py-1.5 flex items-center gap-1.5 font-bold" onClick={() => printReceipt(receipt)}>
          <Printer className="w-4 h-4"/> {confirmed ? 'Imprimir comprobante' : 'Imprimir detalle'}
        </button>
        <button type="button" className="winxp-button px-3 py-1.5 flex items-center gap-1.5 font-bold text-blue-900" onClick={() => downloadReceiptPdf(receipt)}>
          <Download className="w-4 h-4"/> {confirmed ? 'Descargar comprobante PDF' : 'Descargar detalle PDF'}
        </button>
      </div>
    </section>
  );
};
