/**
 * Impresión y exportación local de órdenes verificadas en el servidor.
 * No utiliza servicios externos, no almacena datos personales en el navegador
 * y no modifica órdenes, cupones, inventario ni pagos.
 */
export interface PurchaseReceiptData {
  orderNumber: string;
  paymentStatus: string;
  verified: boolean;
  paymentMethod: string;
  purchaseDate: string;
  transactionDate?: string | null;
  authorizationCode?: string | null;
  customer: { name: string; rut?: string; email?: string; phone?: string };
  delivery: {
    type: string;
    branch: string;
    courier?: string;
    address?: {
      region?: string; comuna?: string; street?: string; number?: string; apartment?: string;
    } | null;
  };
  items: Array<{
    sku: string; name: string; size: string; quantity: number;
    unitPrice: number; lineTotal: number;
  }>;
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  couponCode?: string;
  total: number;
  fulfillmentStatus?: string;
}

/** Convertimos los estados internos en mensajes entendibles para cualquier comprador. */
export function getReceiptStatus(r: PurchaseReceiptData): { title: string; description: string } {
  if (r.verified) {
    return { title: 'Pago aprobado', description: 'Tu compra fue registrada correctamente.' };
  }
  if (r.paymentStatus === 'REJECTED') {
    return { title: 'Pago rechazado', description: 'Esta orden no tiene un pago aprobado.' };
  }
  if (r.paymentStatus === 'REFUNDED') {
    return { title: 'Pago devuelto', description: 'El pago de esta compra fue devuelto.' };
  }
  if (r.paymentStatus === 'CONFIRMED') {
    return {
      title: 'Pago pendiente de verificación',
      description: 'El sistema registra un pago, pero todavía debe comprobarse su confirmación.',
    };
  }
  return { title: 'Pago pendiente', description: 'Esta orden todavía no tiene un pago confirmado.' };
}

export const receiptMoney = (amount: number): string =>
  `$${Number(amount || 0).toLocaleString('es-CL')} CLP`;

export const receiptDate = (value?: string | null): string => {
  if (!value) return 'No informada';
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? date.toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' })
    : value;
};

const receiptAddress = (r: PurchaseReceiptData): string => {
  const address = r.delivery.address;
  return address
    ? [address.street, address.number, address.apartment, address.comuna, address.region]
        .filter(Boolean).join(', ')
    : '';
};

/** Escapa cualquier texto procedente de MongoDB antes de insertarlo en el HTML imprimible. */
const escapeHtml = (text: unknown): string => String(text ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char] || char));

/** En PDF con fuentes estándar usamos WinAnsi y escapamos delimitadores del formato PDF. */
function pdfText(text: unknown): string {
  return String(text ?? '')
    .replace(/[\r\n\t]/g, ' ')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[^\x20-\xff]/g, '?')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

const pdfBytes = (raw: string): Uint8Array =>
  Uint8Array.from(Array.from(raw, (char) => char.charCodeAt(0) & 255));

function wrap(text: string, maxLength: number): string[] {
  const words = String(text || '').replace(/\s+/g, ' ').trim().split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    if ((line ? `${line} ${word}` : word).length <= maxLength) {
      line = line ? `${line} ${word}` : word;
    } else {
      if (line) lines.push(line);
      if (word.length > maxLength) {
        for (let i = 0; i < word.length; i += maxLength) {
          const part = word.slice(i, i + maxLength);
          if (part.length === maxLength) lines.push(part);
          else line = part;
        }
      } else {
        line = word;
      }
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

/** Genera un PDF A4 con secciones claras, tabla de productos y paginación. */
function makeReceiptPdf(r: PurchaseReceiptData): Uint8Array {
  const confirmed = r.verified;
  const status = getReceiptStatus(r);
  const title = confirmed ? 'COMPROBANTE DE PAGO' : 'DETALLE DE LA ORDEN';
  const pages: string[][] = [];
  let page: string[] = [];
  let y = 715;

  const fill = (x: number, bottom: number, width: number, height: number, color: string): void => {
    page.push(`${color} rg`, `${x} ${bottom} ${width} ${height} re f`);
  };
  const line = (x1: number, yy1: number, x2: number, yy2: number): void => {
    page.push('0.73 0.79 0.88 RG', '0.6 w', `${x1} ${yy1} m ${x2} ${yy2} l S`);
  };
  const text = (value: string, x: number, yy: number, options: {
    size?: number; bold?: boolean; color?: string;
  } = {}): void => {
    const font = options.bold ? '/F2' : '/F1';
    const size = options.size ?? 9;
    page.push(`${options.color ?? '0.12 0.18 0.28'} rg`,
      `BT ${font} ${size} Tf 1 0 0 1 ${x} ${yy} Tm (${pdfText(value)}) Tj ET`);
  };
  const right = (value: string, rightEdge: number, yy: number, size = 9, bold = false): void => {
    // Aproximación conservadora al ancho de Helvetica para alinear montos.
    const width = Array.from(value).reduce((sum, c) => sum + (/[MW@]/.test(c) ? 0.72 : /[il1., :]/.test(c) ? 0.26 : 0.52), 0) * size;
    text(value, rightEdge - width, yy, { size, bold });
  };
  const newPage = (): void => {
    page = [];
    pages.push(page);
    fill(36, 742, 523, 65, '0.91 0.95 1');
    text('NO LIMITS', 48, 782, { size: 18, bold: true, color: '0.08 0.23 0.53' });
    text(title, 48, 763, { size: 10, bold: true, color: '0.08 0.23 0.53' });
    text(`Orden: ${r.orderNumber}`, 330, 766, { size: 9, bold: true });
    line(36, 736, 559, 736);
    y = 715;
  };
  const ensure = (height: number): void => {
    if (y - height < 65) newPage();
  };
  const box = (heading: string, items: string[], x: number, top: number, width: number, height: number): void => {
    fill(x, top - height, width, height, '0.965 0.975 0.99');
    line(x, top, x + width, top);
    text(heading, x + 10, top - 18, { size: 10, bold: true, color: '0.08 0.23 0.53' });
    let yy = top - 34;
    for (const value of items) {
      for (const part of wrap(value, 40)) {
        text(part, x + 10, yy, { size: 8.5 });
        yy -= 13;
      }
    }
  };

  newPage();
  fill(36, y - 38, 523, 38, confirmed ? '0.90 0.98 0.92' : '1 0.96 0.88');
  text(status.title, 48, y - 15, { size: 11, bold: true, color: confirmed ? '0.08 0.37 0.19' : '0.45 0.29 0.08' });
  text(status.description, 48, y - 29, { size: 8.5 });
  y -= 54;

  const buyer = [
    `Nombre: ${r.customer.name || 'No informado'}`,
    `Correo: ${r.customer.email || 'No informado'}`,
    `RUT: ${r.customer.rut || 'No informado'}`,
    `Teléfono: ${r.customer.phone || 'No informado'}`,
  ];
  const shipping = [
    `Forma de pago: ${r.paymentMethod || 'No informada'}`,
    `Fecha: ${receiptDate(r.transactionDate || r.purchaseDate)}`,
    ...(confirmed && r.authorizationCode ? [`Autorización: ${r.authorizationCode}`] : []),
    `Entrega: ${r.delivery.type === 'retiro' ? 'Retiro en sucursal' : 'Despacho a domicilio'}`,
    ...(r.delivery.branch ? [`Sucursal: ${r.delivery.branch}`] : []),
    ...(r.delivery.courier ? [`Transporte: ${r.delivery.courier}`] : []),
    ...(receiptAddress(r) ? [`Dirección: ${receiptAddress(r)}`] : []),
  ];
  const linesNeeded = (entries: string[]): number => entries.reduce((total, entry) => total + wrap(entry, 40).length, 0);
  const cardHeight = Math.max(linesNeeded(buyer), linesNeeded(shipping)) * 13 + 48;
  ensure(cardHeight + 36);
  box('DATOS DEL COMPRADOR', buyer, 36, y, 254, cardHeight);
  box('PAGO Y ENTREGA', shipping, 303, y, 256, cardHeight);
  y -= cardHeight + 25;

  const tableHeader = (): void => {
    text('PRODUCTOS DE LA ORDEN', 36, y, { size: 11, bold: true, color: '0.08 0.23 0.53' });
    y -= 25;
    fill(36, y - 23, 523, 23, '0.90 0.93 0.97');
    text('Producto y talla', 44, y - 15, { bold: true, size: 9 });
    text('Cant.', 333, y - 15, { bold: true, size: 9 });
    text('Precio', 393, y - 15, { bold: true, size: 9 });
    text('Subtotal', 485, y - 15, { bold: true, size: 9 });
    y -= 23;
  };
  ensure(55);
  tableHeader();
  for (const [index, item] of r.items.entries()) {
    const itemLines = wrap(`${item.name || 'Producto'} / ${item.size || 'Única'}`, 43);
    const skuLines = item.sku ? wrap(`Código: ${item.sku}`, 43) : [];
    const height = Math.max(33, (itemLines.length + skuLines.length) * 12 + 10);
    if (y - height < 160) { newPage(); tableHeader(); }
    if (index % 2 === 0) fill(36, y - height, 523, height, '0.978 0.985 0.995');
    let yy = y - 13;
    for (const value of itemLines) { text(value, 44, yy, { size: 8.5 }); yy -= 12; }
    for (const value of skuLines) { text(value, 44, yy, { size: 7.7, color: '0.39 0.45 0.54' }); yy -= 12; }
    text(String(item.quantity), 343, y - 18, { size: 8.5 });
    right(receiptMoney(item.unitPrice), 461, y - 18, 8);
    right(receiptMoney(item.lineTotal), 551, y - 18, 8, true);
    y -= height;
    line(36, y, 559, y);
  }
  const subtotalRows: Array<[string, string]> = [
    ['Subtotal de productos', receiptMoney(r.subtotal)],
    ...(r.couponCode ? [['Cupón utilizado', r.couponCode] as [string, string]] : []),
    ...(r.discountAmount > 0 ? [['Descuentos aplicados', `-${receiptMoney(r.discountAmount)}`] as [string, string]] : []),
    ['Envío', receiptMoney(r.shippingCost)],
  ];
  // Un código de cupón extenso ocupa varias líneas, sin superposiciones.
  const rowHeight = (label: string, value: string): number =>
    label === 'Cupón utilizado' ? 25 + wrap(value, 36).length * 11 : 25;
  const summaryHeight = subtotalRows.reduce((sum, [label, value]) => sum + rowHeight(label, value), 0) + 42;
  ensure(summaryHeight + 20);
  y -= 13;
  fill(296, y - summaryHeight, 263, summaryHeight, '0.965 0.975 0.99');
  for (const [label, value] of subtotalRows) {
    text(label, 307, y - 16, { size: 8.5 });
    if (label === 'Cupón utilizado') {
      let codeY = y - 30;
      for (const part of wrap(value, 36)) {
        text(part, 307, codeY, { size: 7.5 });
        codeY -= 11;
      }
    } else {
      right(value, 549, y - 16, 8.5, true);
    }
    y -= rowHeight(label, value);
  }
  line(307, y + 4, 548, y + 4);
  text(confirmed ? 'TOTAL PAGADO' : 'TOTAL DE LA ORDEN', 306, y - 18,
    { size: 11, bold: true, color: '0.08 0.23 0.53' });
  right(receiptMoney(r.total), 549, y - 18, 11, true);

  // Pie de página discreto, sin mensajes legales innecesarios.
  pages.forEach((p, i) => {
    p.push('0.70 0.77 0.87 RG', '0.5 w', '36 47 m 559 47 l S');
    p.push('0.36 0.42 0.51 rg', `BT /F1 8 Tf 1 0 0 1 475 34 Tm (Página ${i + 1} de ${pages.length}) Tj ET`);
  });

  // PDF 1.4 autocontenido, con flujos de contenido en WinAnsi.
  const objects: string[] = [];
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = `<< /Type /Pages /Kids [${pages.map((_, i) => `${6 + i * 2} 0 R`).join(' ')}] /Count ${pages.length} >>`;
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
  objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
  objects[5] = '<< /Creator (NoLimits) /Producer (NoLimits) >>';
  pages.forEach((commands, i) => {
    const pageId = 6 + i * 2;
    const contentId = pageId + 1;
    const contents = commands.join('\n') + '\n';
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId] = `<< /Length ${pdfBytes(contents).length} >>\nstream\n${contents}endstream`;
  });
  const objectCount = objects.length - 1;
  let output = '%PDF-1.4\n%PDF!\n';
  const offsets: number[] = [0];
  for (let i = 1; i <= objectCount; i++) {
    offsets[i] = pdfBytes(output).length;
    output += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xref = pdfBytes(output).length;
  output += `xref\n0 ${objectCount + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objectCount; i++) {
    output += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  output += `trailer\n<< /Size ${objectCount + 1} /Root 1 0 R /Info 5 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return pdfBytes(output);
}

/** Descarga comprobante solo cuando el pago fue verificado; de lo contrario, descarga detalle. */
export function downloadReceiptPdf(r: PurchaseReceiptData): void {
  const bytes = makeReceiptPdf(r);
  const file = new Blob([bytes.slice().buffer as ArrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = `NoLimits_${r.verified ? 'Comprobante' : 'Detalle_Orden'}_${r.orderNumber.replace(/[^A-Za-z0-9_-]/g, '')}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/** Abre una hoja de impresión limpia, sin menús ni decoración de la tienda. */
export function printReceipt(r: PurchaseReceiptData): void {
  const popup = window.open('', '_blank');
  if (!popup) {
    window.alert('Permite las ventanas emergentes para imprimir el documento.');
    return;
  }
  popup.opener = null;
  const status = getReceiptStatus(r);
  const rows = r.items.map((item) => `<tr><td>${escapeHtml(item.name)}<small>${escapeHtml(item.size)} · ${escapeHtml(item.sku)}</small></td><td>${escapeHtml(item.quantity)}</td><td>${escapeHtml(receiptMoney(item.unitPrice))}</td><td>${escapeHtml(receiptMoney(item.lineTotal))}</td></tr>`).join('');
  const address = receiptAddress(r);
  const html = `<!doctype html><html lang="es"><head><meta charset="UTF-8"/><title>${r.verified ? 'Comprobante de pago' : 'Detalle de orden'} ${escapeHtml(r.orderNumber)}</title>
<style>body{font:13px Arial,sans-serif;color:#1b2940;max-width:790px;margin:35px auto;padding:20px}h1{color:#164490;margin:0;font-size:22px}.subtitle{font-weight:bold;margin:4px 0 0}header{border-bottom:3px solid #164490;padding-bottom:14px}.status{background:#f1f6fc;padding:14px;margin:16px 0;border:1px solid #bdc9d9}.status p{margin:5px 0 0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:20px 0}.box{border:1px solid #bac7d9;padding:14px;overflow-wrap:anywhere}.box p{line-height:1.65}table{width:100%;border-collapse:collapse;margin:22px 0}th,td{padding:9px;border-bottom:1px solid #cdd5df;text-align:left}th{background:#edf2fb}td small{display:block;color:#556}.summary{width:320px;max-width:100%;margin-left:auto;border:1px solid #bac7d9;padding:15px}.summary p{display:flex;justify-content:space-between;gap:8px}.total{border-top:2px solid #164490;padding-top:12px;font-size:17px;font-weight:700;color:#164490}@media(max-width:580px){.grid{grid-template-columns:1fr}}@media print{body{margin:0;max-width:none}@page{size:A4;margin:15mm}}</style></head><body>
<header><h1>NO LIMITS</h1><p class="subtitle">${r.verified ? 'Comprobante de pago' : 'Detalle de la orden'}</p><p>Número de orden: <strong>${escapeHtml(r.orderNumber)}</strong></p></header>
<div class="status"><strong>${escapeHtml(status.title)}</strong><p>${escapeHtml(status.description)}</p></div>
<div class="grid"><section class="box"><strong>Datos del comprador</strong><p>Nombre: ${escapeHtml(r.customer.name || 'No informado')}<br/>Correo: ${escapeHtml(r.customer.email || 'No informado')}<br/>RUT: ${escapeHtml(r.customer.rut || 'No informado')}<br/>Teléfono: ${escapeHtml(r.customer.phone || 'No informado')}</p></section><section class="box"><strong>Pago y retiro o entrega</strong><p>Forma de pago: ${escapeHtml(r.paymentMethod || 'No informada')}<br/>Fecha: ${escapeHtml(receiptDate(r.transactionDate || r.purchaseDate))}<br/>Entrega: ${r.delivery.type === 'retiro' ? 'Retiro en sucursal' : 'Despacho a domicilio'}${r.delivery.branch ? `<br/>Sucursal: ${escapeHtml(r.delivery.branch)}` : ''}${r.delivery.courier ? `<br/>Transporte: ${escapeHtml(r.delivery.courier)}` : ''}${address ? `<br/>Dirección: ${escapeHtml(address)}` : ''}${r.verified && r.authorizationCode ? `<br/>Autorización: ${escapeHtml(r.authorizationCode)}` : ''}</p></section></div>
<table><thead><tr><th>Producto y talla</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th></tr></thead><tbody>${rows}</tbody></table>
<section class="summary"><p><span>Subtotal de productos</span><strong>${escapeHtml(receiptMoney(r.subtotal))}</strong></p>${r.couponCode ? `<p><span>Cupón utilizado</span><strong>${escapeHtml(r.couponCode)}</strong></p>` : ''}${r.discountAmount > 0 ? `<p><span>Descuentos aplicados</span><strong>-${escapeHtml(receiptMoney(r.discountAmount))}</strong></p>` : ''}<p><span>Envío</span><strong>${escapeHtml(receiptMoney(r.shippingCost))}</strong></p><p class="total"><span>${r.verified ? 'Total pagado' : 'Total de la orden'}</span><strong>${escapeHtml(receiptMoney(r.total))}</strong></p></section>
<script>window.addEventListener('load',()=>{setTimeout(()=>window.print(),200)})<\/script></body></html>`;
  popup.document.open();
  popup.document.write(html);
  popup.document.close();
}
