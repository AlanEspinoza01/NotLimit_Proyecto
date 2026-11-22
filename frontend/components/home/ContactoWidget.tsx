import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { WindowFrame } from '../layout/WindowFrame';
import { PixelIcon } from '../common/PixelIcon';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

interface ContactoWidgetProps {
  onClose?: () => void;
  className?: string;
}

export const ContactoWidget: React.FC<ContactoWidgetProps> = ({
  onClose,
  className = ''
}) => {
  const { currentUser, isAuthenticated } = useAuth();

  const [name, setName] = useState(
    isAuthenticated && currentUser?.role !== 'guest' ? currentUser?.name || '' : ''
  );
  const [email, setEmail] = useState(
    isAuthenticated && currentUser?.role !== 'guest' ? currentUser?.email || '' : ''
  );
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (isAuthenticated && currentUser && currentUser.role !== 'guest') {
      setName((prev) => prev || currentUser.name || '');
      setEmail((prev) => prev || currentUser.email || '');
    }
  }, [currentUser, isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMessage = message.replace(/[\r\n]+/g, ' ').trim();
    if (!name.trim() || !email.trim() || !cleanMessage || submitting) return;

    setSubmitError(null);
    setSubmitting(true);

    try {
      await api.post('/support', {
        customerName: name.trim(),
        customerEmail: email.trim(),
        customerPhone:
          isAuthenticated && currentUser?.role !== 'guest'
            ? currentUser?.phone || ''
            : '',
        subject: 'Consulta desde Contacto Directo',
        message: cleanMessage
      });

      setSent(true);
      setTimeout(() => {
        if (!isAuthenticated || currentUser?.role === 'guest') {
          setName('');
          setEmail('');
        }
        setMessage('');
        setSent(false);
      }, 4000);
    } catch (error: any) {
      console.error('Error enviando consulta de atención al cliente:', error);
      setSubmitError(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          'No se pudo enviar tu consulta. Intenta nuevamente.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    // Contenedor con ancho fijo para que .winxp-window no se extienda a toda la pantalla
    <div
      className={`w-full min-w-0 mx-auto my-auto ${className}`}
      style={{ width: '100%', maxWidth: 440 }}
    >
      <WindowFrame
        title="CONTACTO_DIRECTO.MSG - [Atención al Cliente]"
        icon={<PixelIcon name="whatsapp" size={16} />}
        showControls={true}
        onClose={onClose}
        statusBarText="CANAL DE ATENCIÓN AL CLIENTE // RESPUESTA PROMEDIO: 4 MINUTOS"
        className="w-full min-w-0"
      >
        <div className="space-y-3 font-sans text-xs text-gray-900">
          {/* Formulario de Mensaje */}
          <form onSubmit={handleSubmit} className="bg-[#f8fafc] border border-gray-300 p-3 space-y-2.5">
            <div className="font-bold text-xs text-[#003c74] flex items-center gap-1.5 pb-1 border-b border-gray-200">
              <MessageSquare className="w-3.5 h-3.5 text-blue-700" />
              <span>ENVIO A SERVICIO AL CLIENTE</span>
            </div>

            {sent ? (
              <div className="p-3 bg-green-100 border border-green-400 text-center space-y-1 text-green-900">
                <CheckCircle2 className="w-6 h-6 text-green-700 mx-auto" />
                <div className="font-bold text-xs">¡Mensaje Enviado con Éxito!</div>
                <p className="text-[11px] text-green-800">
                  Un asistente de NoLimits responderá a tu correo en breve.
                </p>
              </div>
            ) : (
              <>
                {submitError && (
                  <div className="flex items-center gap-1.5 text-[11px] text-red-900 bg-red-50 border border-red-400 px-2 py-1.5 rounded-xs">
                    <AlertCircle className="w-3.5 h-3.5 text-red-700 shrink-0" />
                    <span className="font-semibold">{submitError}</span>
                  </div>
                )}

                <div>
                  <input
                    type="text"
                    required
                    disabled={submitting}
                    placeholder="Tu Nombre o Apodo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full winxp-input text-xs py-1.5 px-2"
                  />
                </div>

                <div>
                  <input
                    type="email"
                    required
                    disabled={submitting}
                    placeholder="correo@ejemplo.cl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full winxp-input text-xs py-1.5 px-2"
                  />
                </div>

                <div>
                  <textarea
                    rows={4}
                    required
                    disabled={submitting}
                    placeholder="Escribe tu consulta sobre stock, reservas o despacho (sin saltos de línea)..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value.replace(/[\r\n]+/g, ' '))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.preventDefault();
                    }}
                    className="w-full winxp-input text-xs py-1.5 px-2 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="winxp-button winxp-button-primary text-xs py-1.5 w-full font-bold text-blue-900 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Send className="w-3 h-3 text-blue-700 inline mr-1" />
                  <span>{submitting ? 'Enviando consulta...' : 'Enviar Consulta'}</span>
                </button>
              </>
            )}
          </form>
        </div>
      </WindowFrame>
    </div>
  );
};