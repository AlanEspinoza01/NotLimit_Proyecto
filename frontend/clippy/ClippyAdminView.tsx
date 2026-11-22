import React, { useEffect, useState } from 'react';
import { AlertTriangle, MessageCircle, Plus, Save, Shield, Trash2, RefreshCw } from 'lucide-react';
import { WindowFrame } from '../components/layout/WindowFrame';
import { PixelIcon } from '../components/common/PixelIcon';
import { getClippyAdminConfig, getClippyUsage, saveClippyAdminConfig } from './clippy.api';
import { ClippyAdminConfig } from './clippy.types';

const idForNewFaq = () => `faq_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

export const ClippyAdminView: React.FC = () => {
  const [config, setConfig] = useState<ClippyAdminConfig | null>(null);
  const [requests, setRequests] = useState(0);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');

  const load = async () => {
    setBusy(true);
    try {
      const [settings, daily] = await Promise.all([getClippyAdminConfig(), getClippyUsage()]);
      setConfig(settings);
      setRequests(daily);
      setFeedback('Configuración actual leída desde MongoDB Atlas.');
    } catch { setFeedback('No fue posible cargar la configuración. Revisa tu sesión de Super Admin.'); }
    finally { setBusy(false); }
  };
  useEffect(() => { void load(); }, []);
  const patch = (partial: Partial<ClippyAdminConfig>) => setConfig((current) => current ? { ...current, ...partial } : current);
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!config || busy) return;
    setBusy(true);
    try {
      const latest = await saveClippyAdminConfig(config);
      setConfig(latest);
      setFeedback('✓ Clippy actualizado en MongoDB. Las nuevas preguntas y reglas están publicadas.');
    } catch (error: any) {
      setFeedback(error.response?.data?.message || 'No se pudo guardar Clippy.');
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-3 pb-14 text-gray-900">
      <WindowFrame title="CLIPPY_CONTROL.EXE - [Asistente y Seguridad · Super Admin]" icon={<PixelIcon name="computer" size={16}/>} statusBarText="SOLO SUPER ADMIN // PREGUNTAS GUIADAS // GEMINI PROTEGIDO EN EL BACKEND">
        {!config ? <div className="p-5 text-xs">{busy ? 'Conectando con MongoDB…' : feedback}</div> : (
          <form onSubmit={save} className="space-y-4 p-1 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-300 pb-2">
              <h2 className="font-black text-blue-900 text-lg flex items-center gap-2"><MessageCircle size={20}/> Mi amigo Clippy 📎</h2>
              <button type="button" onClick={() => { void load(); }} disabled={busy} className="winxp-button inline-flex items-center gap-1 px-3 py-1"><RefreshCw size={14}/> Recargar</button>
            </div>
            {feedback && <p role="status" className="bg-blue-50 border border-blue-200 p-2 text-blue-900">{feedback}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="p-3 bg-white border border-blue-200 flex items-start gap-2"><input type="checkbox" checked={config.enabled} onChange={e => patch({ enabled: e.target.checked })}/><span><b>Mostrar Clippy en la tienda</b><small className="block text-gray-600">Al desactivar, desaparece para todos los visitantes.</small></span></label>
              <label className="p-3 bg-white border border-blue-200 flex items-start gap-2"><input type="checkbox" checked={config.aiEnabled} disabled={!config.geminiConfigured} onChange={e => patch({ aiEnabled: e.target.checked })}/><span><b>Activar asesoría con Gemini</b><small className="block text-gray-600">{config.geminiConfigured ? 'API de Gemini configurada en el backend.' : 'Primero configura GEMINI_API_KEY en backend y Vercel.'}</small></span></label>
            </div>
            <label className="block font-bold text-blue-900">Saludo inicial<textarea className="winxp-input block w-full mt-1 min-h-16 bg-white p-2" maxLength={240} value={config.welcomeMessage} onChange={e => patch({ welcomeMessage: e.target.value })}/></label>
            <label className="block font-bold text-blue-900">Tono del asesor (no modifica las restricciones de seguridad)<textarea className="winxp-input block w-full mt-1 min-h-16 bg-white p-2" maxLength={300} value={config.personality} onChange={e => patch({ personality: e.target.value })}/></label>
            <label className="block font-bold text-blue-900">WhatsApp de contacto público (ej: 56912345678)<input className="winxp-input block w-full mt-1 bg-white p-2" maxLength={28} value={config.whatsappNumber} onChange={e => patch({ whatsappNumber: e.target.value })}/><small className="font-normal text-gray-600">Opcional. Si no está configurado, Clippy sugerirá consultar la tienda sin enlazar un teléfono inventado.</small></label>

            <section className="bg-white border border-blue-200 p-3 space-y-3">
              <h3 className="font-black text-blue-900 flex items-center gap-2"><Shield size={16}/> Límites y consumo de IA</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label>Consultas por minuto / visitante (1–10)<input type="number" min={1} max={10} className="winxp-input w-full block mt-1" value={config.maxPerMinute} onChange={e => patch({ maxPerMinute: Number(e.target.value) })}/></label>
                <label>Consultas por día / visitante (5–100)<input type="number" min={5} max={100} className="winxp-input w-full block mt-1" value={config.maxPerDay} onChange={e => patch({ maxPerDay: Number(e.target.value) })}/></label>
                <label>Tope global Gemini por día (10–1000)<input type="number" min={10} max={1000} className="winxp-input w-full block mt-1" value={config.maxGlobalAiPerDay} onChange={e => patch({ maxGlobalAiPerDay: Number(e.target.value) })}/></label>
              </div>
              <p className="text-gray-700">Intentos Gemini reservados hoy: <b>{requests}</b> / {config.maxGlobalAiPerDay}. Los mensajes y conversaciones no se guardan.</p>
              <p className="flex gap-2 bg-amber-50 border border-amber-200 p-2 text-amber-900"><AlertTriangle size={17}/> La limitación de peticiones reduce abusos, pero no sustituye protección contra bots mediante Vercel Firewall, CAPTCHA y supervisión del consumo en Google AI Studio.</p>
            </section>

            <section className="bg-white border border-blue-200 p-3 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-black text-blue-900">Preguntas y respuestas guiadas ({config.faqs.length}/20)</h3>
                <button type="button" className="winxp-button inline-flex items-center gap-1 px-3 py-1" disabled={config.faqs.length >= 20}
                  onClick={() => patch({ faqs: [...config.faqs, { id: idForNewFaq(), category: 'General', question: '', answer: '' }] })}><Plus size={14}/> Añadir pregunta</button>
              </div>
              {config.faqs.map((faq, index) => <div key={faq.id} className="border border-gray-200 p-2.5 bg-slate-50 space-y-2">
                <div className="flex justify-between items-center"><b>Pregunta #{index + 1}</b><button type="button" onClick={() => patch({ faqs: config.faqs.filter(x => x.id !== faq.id) })} className="text-red-700 inline-flex gap-1 items-center"><Trash2 size={13}/> Eliminar</button></div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label>Categoría<input className="winxp-input block w-full mt-1 bg-white" maxLength={45} value={faq.category} onChange={e => patch({ faqs: config.faqs.map(x => x.id === faq.id ? { ...x, category: e.target.value } : x) })}/></label>
                  <label className="sm:col-span-2">Pregunta<input className="winxp-input block w-full mt-1 bg-white" maxLength={140} value={faq.question} onChange={e => patch({ faqs: config.faqs.map(x => x.id === faq.id ? { ...x, question: e.target.value } : x) })}/></label>
                </div>
                <label className="block">Respuesta<textarea className="winxp-input block w-full mt-1 bg-white min-h-17 p-2" maxLength={700} value={faq.answer} onChange={e => patch({ faqs: config.faqs.map(x => x.id === faq.id ? { ...x, answer: e.target.value } : x) })}/></label>
              </div>)}
            </section>
            <div className="flex justify-end"><button disabled={busy} type="submit" className="winxp-button winxp-button-primary px-4 py-2 font-bold text-blue-950 flex gap-2 items-center"><Save size={16}/>{busy ? 'Guardando…' : 'Guardar configuración de Clippy'}</button></div>
          </form>
        )}
      </WindowFrame>
    </div>
  );
};
