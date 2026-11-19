import React from 'react';
import { Image as ImageIcon, RotateCcw, Upload, Save } from 'lucide-react';
import { PixelIcon } from '../../common/PixelIcon';
import {
  CustomBackgroundConfig,
  STORAGE_BACKGROUND_KEY
} from './pageEditorTypes';

interface BackgroundEditorTabProps {
  backgroundConfig: CustomBackgroundConfig;
  setBackgroundConfig: (cfg: CustomBackgroundConfig) => void;
  draftBgUrl: string;
  draftBgFileName: string;
  draftBgFitMode: 'cover' | 'contain' | 'repeat';
  setDraftBgFitMode: (mode: 'cover' | 'contain' | 'repeat') => void;
  handleLocalBackgroundUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSaveCustomBackground: () => void;
  handleRestoreDefaultBackground: () => void;
}

export const BackgroundEditorTab: React.FC<BackgroundEditorTabProps> = ({
  backgroundConfig,
  setBackgroundConfig,
  draftBgUrl,
  draftBgFileName,
  draftBgFitMode,
  setDraftBgFitMode,
  handleLocalBackgroundUpload,
  handleSaveCustomBackground,
  handleRestoreDefaultBackground
}) => {
  return (
    <div className="bg-white border-2 border-gray-400 p-4 space-y-4 shadow-xs">
      {/* Cabecera del Módulo Editar Fondo */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <ImageIcon
              className="w-4 h-4 fill-sky-300 shrink-0"
              stroke="#000000"
              strokeWidth={1.5}
            />
            <span className="font-extrabold text-xs text-[#003c74] uppercase">
              Personalización del Fondo de Pantalla de la Página Web
            </span>
          </div>
          <p className="text-[11px] text-gray-600">
            Sube cualquier imagen desde tu equipo (JPG, PNG, WEBP o GIF) para cambiar el fondo general de la tienda cuando quieras, o restaura el fondo clásico de Windows XP con un clic.
          </p>
        </div>

        {backgroundConfig.imageUrl && (
          <button
            type="button"
            onClick={handleRestoreDefaultBackground}
            className="winxp-button text-xs py-1.5 px-3 font-bold text-rose-900 flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-700" />
            <span>Restaurar Fondo Original (Windows XP)</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Columna Izquierda: Subida de Imagen y Configuración */}
        <div className="lg:col-span-5 bg-[#f8fafc] border border-gray-300 p-3.5 space-y-3.5 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-gray-800 block">
              1. Subir Nueva Imagen de Fondo desde tu Equipo:
            </label>
            <div className="p-3 bg-white border-2 border-dashed border-[#0055ea] flex flex-col items-center justify-center gap-2 text-center">
              <ImageIcon className="w-8 h-8 text-[#0055ea]" />
              <div className="text-[11px] text-gray-700">
                Selecciona una imagen de alta resolución desde tu computador para usarla como tapiz de toda la tienda.
              </div>
              <label className="winxp-button winxp-button-primary text-xs py-1.5 px-4 font-bold text-blue-950 flex items-center gap-1.5 cursor-pointer mt-1">
                <Upload className="w-3.5 h-3.5 text-blue-700" />
                <span>Subir Imagen desde mi Equipo...</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLocalBackgroundUpload}
                  className="hidden"
                />
              </label>
              <div className="text-[10px] font-mono text-gray-500 truncate max-w-full">
                {draftBgFileName
                  ? `Archivo actual: ${draftBgFileName}`
                  : draftBgUrl
                  ? 'Imagen personalizada activa'
                  : 'Usando fondo por defecto (Windows XP Bliss)'}
              </div>
            </div>
          </div>

          {/* Modo de ajuste de la imagen */}
          <div className="space-y-1.5">
            <label className="font-bold text-gray-800 block">
              2. Modo de Ajuste en Pantalla:
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'cover', label: 'Expandir (Cubrir)' },
                { id: 'contain', label: 'Ajustar Completa' },
                { id: 'repeat', label: 'Mosaico (Repetir)' }
              ].map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => {
                    const nextMode = mode.id as 'cover' | 'contain' | 'repeat';
                    setDraftBgFitMode(nextMode);
                    if (draftBgUrl) {
                      const nextBg: CustomBackgroundConfig = {
                        imageUrl: draftBgUrl,
                        fileName: draftBgFileName || 'Fondo_Personalizado.png',
                        fitMode: nextMode,
                        updatedAt: new Date().toLocaleString('es-CL')
                      };
                      try {
                        localStorage.setItem(STORAGE_BACKGROUND_KEY, JSON.stringify(nextBg));
                        setBackgroundConfig(nextBg);
                        window.dispatchEvent(new Event('nl_background_updated'));
                      } catch (e) {}
                    }
                  }}
                  className={`winxp-button text-[11px] py-1.5 px-2 font-bold text-center ${
                    draftBgFitMode === mode.id
                      ? 'bg-blue-100 border-blue-700 text-blue-950 font-black'
                      : 'text-gray-700'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* Estado actual */}
          <div className="p-2.5 bg-blue-50 border border-blue-200 space-y-1 text-[11px] text-blue-950">
            <div className="font-bold flex flex-wrap items-center justify-between gap-1">
              <span>Estado del Tapiz Actual:</span>
              <span
                className={`px-1.5 py-0.5 text-[10px] font-black rounded-xs border ${
                  backgroundConfig.imageUrl
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                    : 'bg-sky-100 text-sky-900 border-sky-400'
                }`}
              >
                {backgroundConfig.imageUrl ? 'FONDO PERSONALIZADO ACTIVO' : 'FONDO ORIGINAL ACTIVO'}
              </span>
            </div>
            {backgroundConfig.updatedAt && (
              <div className="text-[10px] font-mono text-gray-600">
                Última actualización: {backgroundConfig.updatedAt}
              </div>
            )}
          </div>

          {/* Botones de Acción */}
          <div className="pt-2 border-t border-gray-300 flex flex-wrap items-center justify-end gap-2">
            {draftBgUrl && (
              <button
                type="button"
                onClick={handleRestoreDefaultBackground}
                className="winxp-button text-xs py-1.5 px-3 font-bold text-gray-700 flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5 text-gray-600" />
                <span>Volver al Fondo por Defecto</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleSaveCustomBackground}
              className="winxp-button winxp-button-primary text-xs py-1.5 px-4 font-black text-blue-950 flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5 text-blue-700" />
              <span>Guardar y Aplicar Fondo</span>
            </button>
          </div>
        </div>

        {/* Columna Derecha: Vista Previa en Tiempo Real */}
        <div className="lg:col-span-7 space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-1 text-xs font-bold text-[#003c74]">
            <span>Vista Previa en Vivo del Escritorio / Fondo de la Página:</span>
            <span className="text-[11px] font-mono text-gray-500">
              Sincronizado con toda la tienda
            </span>
          </div>

          <div
            className={`w-full h-72 sm:h-80 border-4 border-[#003c74] shadow-inner relative overflow-hidden flex items-center justify-center p-4 ${
              !draftBgUrl ? 'winxp-bliss-background' : 'bg-[#0a1224]'
            }`}
            style={
              draftBgUrl
                ? {
                    backgroundImage: `url("${draftBgUrl}")`,
                    backgroundSize:
                      draftBgFitMode === 'contain'
                        ? 'contain'
                        : draftBgFitMode === 'repeat'
                        ? 'auto'
                        : 'cover',
                    backgroundRepeat:
                      draftBgFitMode === 'repeat' ? 'repeat' : 'no-repeat',
                    backgroundPosition: 'center center'
                  }
                : undefined
            }
          >
            {/* Mini ventana simulada para ver el contraste con las ventanas de la tienda */}
            <div className="w-full max-w-sm bg-[#ece9d8] border-2 border-[#0055ea] shadow-xl">
              <div className="bg-gradient-to-r from-[#0055ea] to-[#003c74] px-2.5 py-1 text-white text-[11px] font-bold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <PixelIcon name="computer" size={12} />
                  <span>NoLimits_Store_Preview.exe</span>
                </span>
                <span className="w-4 h-4 bg-[#c75050] text-white flex items-center justify-center text-[10px]">
                  ✕
                </span>
              </div>
              <div className="p-3 bg-white m-1 border border-gray-400 text-xs space-y-1.5">
                <div className="font-extrabold text-[#003c74]">
                  Vista Previa del Fondo en la Tienda
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  Así se verá el contraste de las ventanas de la página sobre el fondo que acabas de seleccionar.
                </p>
                <div className="text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-1">
                  {draftBgUrl
                    ? `✓ Imagen activa: ${draftBgFileName || 'Fondo personalizado'}`
                    : '✓ Fondo original: Windows XP Bliss'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
