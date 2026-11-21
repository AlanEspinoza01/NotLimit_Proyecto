import React from 'react';
import {
  Edit3,
  Truck,
  Save,
  MessageCircle,
  FileText,
  ExternalLink,
  ShieldCheck,
  Store,
  RotateCcw,
  CreditCard,
  ShoppingBag
} from 'lucide-react';
import { WindowFrame } from '../../layout/WindowFrame';
import { PixelIcon } from '../../common/PixelIcon';
import { LegalDocument } from '../../legal/LegalDocument';
import {
  InformativeConfig,
  InformativeSectionKey,
  DEFAULT_INFORMATIVE_CONFIG,
  formatChileanWhatsApp
} from './pageEditorTypes';

interface InformativePagesTabProps {
  informativeConfig: InformativeConfig;
  setInformativeConfig: React.Dispatch<React.SetStateAction<InformativeConfig>>;
  activeInfoSection: InformativeSectionKey;
  setActiveInfoSection: (sec: InformativeSectionKey) => void;
  handleSaveInformative: (e: React.FormEvent) => void;
}

export const InformativePagesTab: React.FC<InformativePagesTabProps> = ({
  informativeConfig,
  setInformativeConfig,
  activeInfoSection,
  setActiveInfoSection,
  handleSaveInformative
}) => {
  const legalTab = activeInfoSection === 'politicasPrivacidad' || activeInfoSection === 'terminosCondiciones';

  // Evita sobreescribir contenido previamente editado o guardado en MongoDB sin permiso.
  const loadProposedLegalCopy = (kind: 'privacy' | 'terms') => {
    if (!window.confirm('¿Reemplazar el texto actual por la propuesta de NoLimits? Guarda los cambios al finalizar.')) return;
    setInformativeConfig((previous) => kind === 'privacy' ? ({
      ...previous,
      politicasPrivacidadTitle: DEFAULT_INFORMATIVE_CONFIG.politicasPrivacidadTitle,
      politicasPrivacidad: DEFAULT_INFORMATIVE_CONFIG.politicasPrivacidad,
      politicasPrivacidadFooter: DEFAULT_INFORMATIVE_CONFIG.politicasPrivacidadFooter
    }) : ({
      ...previous,
      terminosCondicionesTitle: DEFAULT_INFORMATIVE_CONFIG.terminosCondicionesTitle,
      terminosCondiciones: DEFAULT_INFORMATIVE_CONFIG.terminosCondiciones
    }));
  };

  return (
    <div className="bg-white border-2 border-gray-400 p-4 space-y-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-700 shrink-0" />
          <span className="font-extrabold text-xs text-[#003c74] uppercase">
            Configuración de Componentes Informativos & Redes Sociales
          </span>
        </div>
        <span className="text-[11px] text-gray-500 font-mono">
          Edición Visual en Vivo sobre el Cuadro Informativo
        </span>
      </div>

      {/* Redes Oficiales (TikTok e Instagram) y WhatsApp Oficial */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#f8fafc] border border-gray-300 p-3 text-xs">
        {/* Contacto / WhatsApp Número (Inicia con +56 9, numérico y auto separado) */}
        <div className="space-y-1">
          <label className="font-bold text-gray-800 flex items-center gap-1">
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>WhatsApp Oficial:</span>
          </label>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={15}
            value={
              informativeConfig.whatsappNumber.startsWith('+56 9')
                ? informativeConfig.whatsappNumber
                : formatChileanWhatsApp(informativeConfig.whatsappNumber)
            }
            onChange={(e) =>
              setInformativeConfig({
                ...informativeConfig,
                whatsappNumber: formatChileanWhatsApp(e.target.value)
              })
            }
            onFocus={(e) => {
              if (!e.target.value.startsWith('+56 9')) {
                setInformativeConfig({
                  ...informativeConfig,
                  whatsappNumber: formatChileanWhatsApp(e.target.value)
                });
              }
            }}
            className="w-full winxp-input text-xs py-1 font-mono font-bold"
            placeholder="+56 9 8451 9283"
          />
        </div>

        {/* Instagram Oficial */}
        <div className="space-y-1">
          <label className="font-bold text-gray-800 flex items-center gap-1">
            <ExternalLink className="w-3.5 h-3.5 text-rose-600" />
            <span>Instagram Oficial (Enlace):</span>
          </label>
          <input
            type="text"
            value={informativeConfig.instagramUrl}
            onChange={(e) =>
              setInformativeConfig({ ...informativeConfig, instagramUrl: e.target.value })
            }
            className="w-full winxp-input text-xs py-1 font-mono"
            placeholder="https://instagram.com/nolimits.chile"
          />
        </div>

        {/* TikTok Oficial */}
        <div className="space-y-1">
          <label className="font-bold text-gray-800 flex items-center gap-1">
            <ExternalLink className="w-3.5 h-3.5 text-purple-700" />
            <span>TikTok Oficial (Enlace):</span>
          </label>
          <input
            type="text"
            value={informativeConfig.tiktokUrl}
            onChange={(e) =>
              setInformativeConfig({ ...informativeConfig, tiktokUrl: e.target.value })
            }
            className="w-full winxp-input text-xs py-1 font-mono"
            placeholder="https://tiktok.com/@nolimits.cyber"
          />
        </div>
      </div>

      {/* Selector de las 8 Secciones Informativas */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-800 block">
          Seleccionar Sección Informativa para Modificar Texto:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5 text-xs">
          {[
            { key: 'quienesSomos', label: 'Quienes Somos' },
            { key: 'comoPagar', label: 'Cómo Pagar' },
            { key: 'mediosDePago', label: 'Medios De Pago' },
            { key: 'politicasPrivacidad', label: 'Políticas de Privacidad' },
            { key: 'terminosCondiciones', label: 'Términos y Condiciones' },
            { key: 'metodosEnvio', label: 'Métodos de Envío' },
            { key: 'retiroSucursal', label: 'Retiro en Sucursal' },
            { key: 'cambiosDevoluciones', label: 'Cambios y Devoluciones' }
          ].map((sec) => (
            <button
              key={sec.key}
              type="button"
              onClick={() => setActiveInfoSection(sec.key as InformativeSectionKey)}
              className={`winxp-button text-[11px] py-1.5 px-2 font-bold text-center ${
                activeInfoSection === sec.key
                  ? 'bg-blue-100 border-blue-600 text-blue-950 font-black'
                  : 'text-gray-700'
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>
      </div>

      {/* EDITOR VISUAL DIRECTO EN EL MISMO CUADRO DE LA PÁGINA INFORMATIVA */}
      <div className="bg-[#dce6f4] border-2 border-[#7f9db9] p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-b border-[#9bb8e5] pb-2">
          <div className="flex items-center gap-1.5 text-[#003c74] font-bold">
            <Edit3 className="w-3.5 h-3.5 text-blue-700 shrink-0" />
            <span>
              Vista Previa Interactiva — Haz clic directamente dentro del cuadro informativo para editar cómo quedará visualmente:
            </span>
          </div>
          <span className="text-[10px] font-mono text-blue-900 bg-white/80 px-2 py-0.5 border border-blue-300">
            Edición directa sobre la ventana informativa
          </span>
        </div>

        {/* Cuadro idéntico al modal informativo de la página pública */}
        <div className="w-full mx-auto" style={{ maxWidth: legalTab ? 720 : 512 }}>
          {activeInfoSection === 'quienesSomos' && (
            <WindowFrame
              title="Quienes_Somos.txt - Bloc de Notas"
              icon={<PixelIcon name="info" size={16} />}
              showControls={true}
              statusBarText="NOSOTROS // HISTORIA Y VISIÓN"
              className="w-full shadow-xl"
            >
              <div className="p-2.5 space-y-3 text-xs leading-relaxed text-gray-800">
                <div className="p-2 bg-blue-50 border border-blue-300 winxp-bevel-in">
                  <input
                    type="text"
                    value={informativeConfig.quienesSomosBanner}
                    onChange={(e) =>
                      setInformativeConfig({
                        ...informativeConfig,
                        quienesSomosBanner: e.target.value
                      })
                    }
                    className="w-full bg-transparent font-bold text-blue-900 text-xs focus:outline-1 focus:outline-blue-600 px-1"
                    placeholder="Encabezado destacado..."
                  />
                </div>

                <div>
                  <textarea
                    rows={6}
                    value={informativeConfig.quienesSomos}
                    onChange={(e) =>
                      setInformativeConfig({
                        ...informativeConfig,
                        quienesSomos: e.target.value
                      })
                    }
                    className="w-full bg-white border border-dashed border-blue-300 focus:border-blue-600 p-2 text-xs leading-relaxed text-gray-800 resize-y"
                    placeholder="Escribe la historia y visión de NoLimits..."
                  />
                </div>

                <div className="border-t border-gray-300 pt-2">
                  <textarea
                    rows={2}
                    value={informativeConfig.quienesSomosFooter}
                    onChange={(e) =>
                      setInformativeConfig({
                        ...informativeConfig,
                        quienesSomosFooter: e.target.value
                      })
                    }
                    className="w-full bg-gray-50/70 border border-dashed border-gray-300 focus:border-blue-600 p-1.5 text-[11px] text-gray-600 resize-y"
                    placeholder="Nota inferior de sucursales..."
                  />
                </div>

                <div className="flex justify-end pt-2 border-t border-gray-300">
                  <span className="winxp-button winxp-button-primary text-xs py-1 px-5 font-bold text-blue-900 opacity-90 select-none">
                    Aceptar
                  </span>
                </div>
              </div>
            </WindowFrame>
          )}

          {activeInfoSection === 'comoPagar' && (
            <WindowFrame
              title="Guia_de_Compra.chm - Ayuda de Windows"
              icon={<PixelIcon name="info" size={16} />}
              showControls={true}
              statusBarText="NOSOTROS // PASO A PASO"
              className="w-full shadow-xl"
            >
              <div className="p-2.5 space-y-2.5 text-xs text-gray-800">
                <div className="pb-1 border-b border-gray-300 flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-blue-700 shrink-0" />
                  <input
                    type="text"
                    value={informativeConfig.comoPagarTitle}
                    onChange={(e) =>
                      setInformativeConfig({
                        ...informativeConfig,
                        comoPagarTitle: e.target.value
                      })
                    }
                    className="w-full bg-transparent font-bold text-blue-900 text-xs focus:outline-1 focus:outline-blue-600 px-1"
                  />
                </div>

                <textarea
                  rows={8}
                  value={informativeConfig.comoPagar}
                  onChange={(e) =>
                    setInformativeConfig({
                      ...informativeConfig,
                      comoPagar: e.target.value
                    })
                  }
                  className="w-full bg-white border border-dashed border-blue-300 focus:border-blue-600 p-2 text-xs leading-relaxed text-gray-800 resize-y"
                  placeholder="Pasos para comprar y pagar..."
                />

                <div className="flex justify-end pt-2 border-t border-gray-300">
                  <span className="winxp-button winxp-button-primary text-xs py-1 px-5 font-bold text-blue-900 opacity-90 select-none">
                    Aceptar
                  </span>
                </div>
              </div>
            </WindowFrame>
          )}

          {activeInfoSection === 'mediosDePago' && (
            <WindowFrame
              title="Medios_de_Pago.cpl - Transbank Webpay"
              icon={<PixelIcon name="info" size={16} />}
              showControls={true}
              statusBarText="NOSOTROS // PAGOS DIGITALES"
              className="w-full shadow-xl"
            >
              <div className="p-2.5 space-y-2.5 text-xs text-gray-800">
                <div className="p-2 bg-green-50 border border-green-300 winxp-bevel-in flex items-center gap-2 text-green-900 font-bold">
                  <CreditCard className="w-4 h-4 text-green-700 shrink-0" />
                  <input
                    type="text"
                    value={informativeConfig.mediosDePagoBanner}
                    onChange={(e) =>
                      setInformativeConfig({
                        ...informativeConfig,
                        mediosDePagoBanner: e.target.value
                      })
                    }
                    className="w-full bg-transparent font-bold text-green-900 text-xs focus:outline-1 focus:outline-green-700 px-1"
                  />
                </div>

                <input
                  type="text"
                  value={informativeConfig.mediosDePagoIntro}
                  onChange={(e) =>
                    setInformativeConfig({
                      ...informativeConfig,
                      mediosDePagoIntro: e.target.value
                    })
                  }
                  className="w-full bg-white border border-dashed border-gray-300 focus:border-blue-600 p-1.5 text-xs text-gray-800"
                />

                <textarea
                  rows={5}
                  value={informativeConfig.mediosDePago}
                  onChange={(e) =>
                    setInformativeConfig({
                      ...informativeConfig,
                      mediosDePago: e.target.value
                    })
                  }
                  className="w-full bg-white border border-dashed border-blue-300 focus:border-blue-600 p-2 text-xs leading-relaxed text-gray-700 resize-y"
                />

                <div className="pt-1 border-t border-gray-200">
                  <input
                    type="text"
                    value={informativeConfig.mediosDePagoFooter}
                    onChange={(e) =>
                      setInformativeConfig({
                        ...informativeConfig,
                        mediosDePagoFooter: e.target.value
                      })
                    }
                    className="w-full bg-gray-50 border border-dashed border-gray-300 focus:border-blue-600 p-1 text-[10px] text-gray-500"
                  />
                </div>

                <div className="flex justify-end pt-2 border-t border-gray-300">
                  <span className="winxp-button winxp-button-primary text-xs py-1 px-5 font-bold text-blue-900 opacity-90 select-none">
                    Aceptar
                  </span>
                </div>
              </div>
            </WindowFrame>
          )}

          {activeInfoSection === 'politicasPrivacidad' && (
            <WindowFrame
              title="Politicas_Privacidad.doc - Documento Oficial"
              icon={<PixelIcon name="info" size={16} />}
              showControls={false}
              statusBarText="SERVICIO AL CLIENTE // SEGURIDAD"
              className="w-full shadow-xl"
            >
              <div className="p-3 sm:p-4 space-y-3 bg-white text-gray-800">
                {/* Cambiar el título conserva el modelo de datos original. */}
                <label className="block text-[12px] font-bold text-gray-800">
                  Título del documento
                  <input
                    type="text"
                    value={informativeConfig.politicasPrivacidadTitle}
                    onChange={(e) => setInformativeConfig({ ...informativeConfig, politicasPrivacidadTitle: e.target.value })}
                    className="block w-full mt-1 winxp-input text-[13px] p-2"
                  />
                </label>
                <label className="block text-[12px] font-bold text-gray-800">
                  Texto de la política (editable)
                  <textarea
                    rows={12}
                    value={informativeConfig.politicasPrivacidad}
                    onChange={(e) => setInformativeConfig({ ...informativeConfig, politicasPrivacidad: e.target.value })}
                    className="block w-full mt-1 bg-white border border-blue-300 focus:border-blue-600 p-3 text-[13px] leading-relaxed text-gray-800 resize-y"
                    style={{ maxHeight: 420 }}
                  />
                </label>
                <label className="block text-[12px] font-bold text-gray-800">
                  Nota final
                  <input
                    type="text"
                    value={informativeConfig.politicasPrivacidadFooter}
                    onChange={(e) => setInformativeConfig({ ...informativeConfig, politicasPrivacidadFooter: e.target.value })}
                    className="block w-full mt-1 winxp-input text-[12px] p-2"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => loadProposedLegalCopy('privacy')}
                  className="winxp-button text-[12px] px-3 py-1.5 font-bold text-[#003c74]"
                >
                  Cargar propuesta de Política de Privacidad
                </button>
                <p className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded p-2">
                  Antes de publicar, completa los datos del responsable, el contacto y los procedimientos reales de la tienda.
                </p>
                <div className="border-t border-gray-300 pt-3">
                  <p className="font-bold text-[12px] text-blue-900 mb-3">Vista previa para los clientes</p>
                  {/* Evita que la vista previa ocupe toda la página del editor. */}
                  <div className="max-h-[420px] overflow-y-auto rounded-md border border-gray-300 p-2 sm:p-3 bg-gray-50">
                    <LegalDocument
                      title={informativeConfig.politicasPrivacidadTitle}
                      content={informativeConfig.politicasPrivacidad}
                      footer={informativeConfig.politicasPrivacidadFooter}
                      kind="privacy"
                    />
                  </div>
                </div>
              </div>
            </WindowFrame>
          )}

          {activeInfoSection === 'terminosCondiciones' && (
            <WindowFrame
              title="Terminos_y_Condiciones.txt - Términos del Servicio"
              icon={<PixelIcon name="info" size={16} />}
              showControls={false}
              statusBarText="SERVICIO AL CLIENTE // CONDICIONES"
              className="w-full shadow-xl"
            >
              <div className="p-3 sm:p-4 space-y-3 bg-white text-gray-800">
                <label className="block text-[12px] font-bold text-gray-800">
                  Título del documento
                  <input
                    type="text"
                    value={informativeConfig.terminosCondicionesTitle}
                    onChange={(e) => setInformativeConfig({ ...informativeConfig, terminosCondicionesTitle: e.target.value })}
                    className="block w-full mt-1 winxp-input text-[13px] p-2"
                  />
                </label>
                <label className="block text-[12px] font-bold text-gray-800">
                  Términos y condiciones (editable)
                  <textarea
                    rows={12}
                    value={informativeConfig.terminosCondiciones}
                    onChange={(e) => setInformativeConfig({ ...informativeConfig, terminosCondiciones: e.target.value })}
                    className="block w-full mt-1 bg-white border border-blue-300 focus:border-blue-600 p-3 text-[13px] leading-relaxed text-gray-800 resize-y"
                    style={{ maxHeight: 420 }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => loadProposedLegalCopy('terms')}
                  className="winxp-button text-[12px] px-3 py-1.5 font-bold text-[#003c74]"
                >
                  Cargar propuesta de Términos y Condiciones
                </button>
                <p className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded p-2">
                  Verifica las condiciones reales de pago, despachos, cambios y datos legales del vendedor antes de publicar.
                </p>
                <div className="border-t border-gray-300 pt-3">
                  <p className="font-bold text-[12px] text-blue-900 mb-3">Vista previa para los clientes</p>
                  {/* Vista previa con desplazamiento propio. */}
                  <div className="max-h-[420px] overflow-y-auto rounded-md border border-gray-300 p-2 sm:p-3 bg-gray-50">
                    <LegalDocument
                      title={informativeConfig.terminosCondicionesTitle}
                      content={informativeConfig.terminosCondiciones}
                      kind="terms"
                    />
                  </div>
                </div>
              </div>
            </WindowFrame>
          )}

          {activeInfoSection === 'metodosEnvio' && (
            <WindowFrame
              title="Metodos_de_Envio.exe - Logística Nacional"
              icon={<PixelIcon name="info" size={16} />}
              showControls={true}
              statusBarText="SERVICIO AL CLIENTE // DESPACHOS"
              className="w-full shadow-xl"
            >
              <div className="p-2.5 space-y-2.5 text-xs text-gray-800">
                <div className="font-bold text-blue-900 pb-1 border-b border-gray-300 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-blue-700 shrink-0" />
                  <input
                    type="text"
                    value={informativeConfig.metodosEnvioTitle}
                    onChange={(e) =>
                      setInformativeConfig({
                        ...informativeConfig,
                        metodosEnvioTitle: e.target.value
                      })
                    }
                    className="w-full bg-transparent font-bold text-blue-900 text-xs focus:outline-1 focus:outline-blue-600 px-1"
                  />
                </div>

                <div className="space-y-2">
                  <div className="p-2 bg-gray-50 border border-gray-300">
                    <textarea
                      rows={2}
                      value={informativeConfig.metodosEnvioStarken}
                      onChange={(e) =>
                        setInformativeConfig({
                          ...informativeConfig,
                          metodosEnvioStarken: e.target.value
                        })
                      }
                      className="w-full bg-white border border-dashed border-blue-300 p-1.5 text-xs text-gray-800 resize-y"
                    />
                  </div>
                  <div className="p-2 bg-gray-50 border border-gray-300">
                    <textarea
                      rows={2}
                      value={informativeConfig.metodosEnvioBlue}
                      onChange={(e) =>
                        setInformativeConfig({
                          ...informativeConfig,
                          metodosEnvioBlue: e.target.value
                        })
                      }
                      className="w-full bg-white border border-dashed border-blue-300 p-1.5 text-xs text-gray-800 resize-y"
                    />
                  </div>
                  <div className="p-2 bg-gray-50 border border-gray-300">
                    <textarea
                      rows={2}
                      value={informativeConfig.metodosEnvioPaket}
                      onChange={(e) =>
                        setInformativeConfig({
                          ...informativeConfig,
                          metodosEnvioPaket: e.target.value
                        })
                      }
                      className="w-full bg-white border border-dashed border-blue-300 p-1.5 text-xs text-gray-800 resize-y"
                    />
                  </div>
                </div>

                <input
                  type="text"
                  value={informativeConfig.metodosEnvioFooter}
                  onChange={(e) =>
                    setInformativeConfig({
                      ...informativeConfig,
                      metodosEnvioFooter: e.target.value
                    })
                  }
                  className="w-full bg-gray-50 border border-dashed border-gray-300 p-1.5 text-[11px] text-gray-600"
                />

                <div className="flex justify-end pt-2 border-t border-gray-300">
                  <span className="winxp-button winxp-button-primary text-xs py-1 px-5 font-bold text-blue-900 opacity-90 select-none">
                    Aceptar
                  </span>
                </div>
              </div>
            </WindowFrame>
          )}

          {activeInfoSection === 'retiroSucursal' && (
            <WindowFrame
              title="Retiro_en_Sucursal.cpl - Puntos Físicos"
              icon={<PixelIcon name="info" size={16} />}
              showControls={true}
              statusBarText="SERVICIO AL CLIENTE // TIENDAS FÍSICAS"
              className="w-full shadow-xl"
            >
              <div className="p-2.5 space-y-2 text-xs text-gray-800">
                <div className="font-bold text-blue-900 pb-1 border-b border-gray-300 flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-blue-700 shrink-0" />
                  <input
                    type="text"
                    value={informativeConfig.retiroSucursalTitle}
                    onChange={(e) =>
                      setInformativeConfig({
                        ...informativeConfig,
                        retiroSucursalTitle: e.target.value
                      })
                    }
                    className="w-full bg-transparent font-bold text-blue-900 text-xs focus:outline-1 focus:outline-blue-600 px-1"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="p-2 bg-gray-50 border border-gray-300">
                    <textarea
                      rows={2}
                      value={informativeConfig.retiroSucursalVina}
                      onChange={(e) =>
                        setInformativeConfig({
                          ...informativeConfig,
                          retiroSucursalVina: e.target.value
                        })
                      }
                      className="w-full bg-white border border-dashed border-blue-300 p-1.5 text-xs text-gray-800 resize-y"
                    />
                  </div>
                  <div className="p-2 bg-gray-50 border border-gray-300">
                    <textarea
                      rows={2}
                      value={informativeConfig.retiroSucursalValpo}
                      onChange={(e) =>
                        setInformativeConfig({
                          ...informativeConfig,
                          retiroSucursalValpo: e.target.value
                        })
                      }
                      className="w-full bg-white border border-dashed border-blue-300 p-1.5 text-xs text-gray-800 resize-y"
                    />
                  </div>
                  <div className="p-2 bg-gray-50 border border-gray-300">
                    <textarea
                      rows={2}
                      value={informativeConfig.retiroSucursalQuilpue}
                      onChange={(e) =>
                        setInformativeConfig({
                          ...informativeConfig,
                          retiroSucursalQuilpue: e.target.value
                        })
                      }
                      className="w-full bg-white border border-dashed border-blue-300 p-1.5 text-xs text-gray-800 resize-y"
                    />
                  </div>
                </div>

                <input
                  type="text"
                  value={informativeConfig.retiroSucursalFooter}
                  onChange={(e) =>
                    setInformativeConfig({
                      ...informativeConfig,
                      retiroSucursalFooter: e.target.value
                    })
                  }
                  className="w-full bg-green-50/60 border border-dashed border-green-400 p-1.5 text-[11px] text-green-800 font-semibold"
                />

                <div className="flex justify-end pt-2 border-t border-gray-300">
                  <span className="winxp-button winxp-button-primary text-xs py-1 px-5 font-bold text-blue-900 opacity-90 select-none">
                    Aceptar
                  </span>
                </div>
              </div>
            </WindowFrame>
          )}

          {activeInfoSection === 'cambiosDevoluciones' && (
            <WindowFrame
              title="Cambios_y_Devoluciones.doc - Políticas de Post-Venta"
              icon={<PixelIcon name="info" size={16} />}
              showControls={true}
              statusBarText="SERVICIO AL CLIENTE // GARANTÍA"
              className="w-full shadow-xl"
            >
              <div className="p-2.5 space-y-2 text-xs text-gray-800">
                <div className="font-bold text-blue-900 pb-1 border-b border-gray-300 flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-blue-700 shrink-0" />
                  <input
                    type="text"
                    value={informativeConfig.cambiosDevolucionesTitle}
                    onChange={(e) =>
                      setInformativeConfig({
                        ...informativeConfig,
                        cambiosDevolucionesTitle: e.target.value
                      })
                    }
                    className="w-full bg-transparent font-bold text-blue-900 text-xs focus:outline-1 focus:outline-blue-600 px-1"
                  />
                </div>

                <textarea
                  rows={6}
                  value={informativeConfig.cambiosDevoluciones}
                  onChange={(e) =>
                    setInformativeConfig({
                      ...informativeConfig,
                      cambiosDevoluciones: e.target.value
                    })
                  }
                  className="w-full bg-white border border-dashed border-blue-300 focus:border-blue-600 p-2 text-xs leading-relaxed text-gray-800 resize-y"
                />

                <div className="flex justify-end pt-2 border-t border-gray-300">
                  <span className="winxp-button winxp-button-primary text-xs py-1 px-5 font-bold text-blue-900 opacity-90 select-none">
                    Aceptar
                  </span>
                </div>
              </div>
            </WindowFrame>
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-[#9bb8e5]">
          <button
            type="button"
            onClick={handleSaveInformative}
            className="winxp-button winxp-button-primary text-xs py-1.5 px-5 font-bold flex items-center gap-1.5 text-white bg-blue-700"
          >
            <Save
              className="w-3.5 h-3.5 fill-emerald-300"
              stroke="#000000"
              strokeWidth={1.5}
            />
            <span>Guardar Todos los Cambios Informativos</span>
          </button>
        </div>
      </div>
    </div>
  );
};


