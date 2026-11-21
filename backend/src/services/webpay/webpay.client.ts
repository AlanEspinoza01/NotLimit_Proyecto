/** Transbank Webpay Plus REST v1.2. Secrets stay on backend only. */
export interface WebpayTransaction {
  buy_order: string;
  session_id: string;
  amount: number;
  status: string;
  response_code: number;
  authorization_code?: string;
  transaction_date?: string;
}
const path = '/rswebpaytransaction/api/webpay/v1.2/transactions';
function configuration() {
  const environment = (process.env.WEBPAY_ENV || 'integration').trim();
  if (!['integration', 'production'].includes(environment)) throw new Error('WEBPAY_ENV inválido');
  const merchant = process.env.WEBPAY_COMMERCE_CODE?.trim();
  const secret = process.env.WEBPAY_API_KEY?.trim();
  const backend = process.env.WEBPAY_BACKEND_URL?.replace(/\/$/, '');
  const frontend = process.env.WEBPAY_FRONTEND_URL?.replace(/\/$/, '');
  if (!merchant || !secret || !backend || !frontend) throw new Error('Falta configurar Webpay en backend/src/middleware/.env');
  if (environment === 'production' && (![backend,frontend].every(s=>s.startsWith('https://')))) {
    throw new Error('HTTPS es obligatorio para la pasarela en producción');
  }
  return { merchant, secret, backend, frontend,
    base: environment === 'production' ? 'https://webpay3g.transbank.cl' : 'https://webpay3gint.transbank.cl' };
}
export function webpayReturnUrl() {return configuration().backend + '/api/payments/webpay/return';}
export function webpayFrontendUrl() {return configuration().frontend;}
async function request<T>(method: 'POST'|'PUT'|'GET', suffix='', data?: Record<string,unknown>): Promise<T> {
  const c=configuration();
  const response=await fetch(c.base+path+suffix, {
    method,
    signal: AbortSignal.timeout(15000),
    headers:{'Content-Type':'application/json','Tbk-Api-Key-Id':c.merchant,'Tbk-Api-Key-Secret':c.secret},
    ...(data ? {body: JSON.stringify(data)} : {})
  });
  if(!response.ok) throw new Error(`Webpay HTTP ${response.status}: revisar transacción (no reintentar a ciegas)`);
  return await response.json() as T;
}
export async function webpayCreate(order:string, session:string, amount:number) {
  const result=await request<{url:string;token:string}>('POST','',{
    buy_order:order,session_id:session,amount,return_url:webpayReturnUrl()
  });
  const target=new URL(result.url);
  if(!result.token || !['webpay3g.transbank.cl','webpay3gint.transbank.cl'].includes(target.hostname)){
    throw new Error('Transbank devolvió un destino desconocido');
  }
  return result;
}
export const webpayCommit=(token:string)=>request<WebpayTransaction>('PUT',`/${encodeURIComponent(token)}`);
export const webpayStatus=(token:string)=>request<WebpayTransaction>('GET',`/${encodeURIComponent(token)}`);
