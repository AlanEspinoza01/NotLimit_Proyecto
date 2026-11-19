import React from 'react';
import { Film, Upload, Save, Trash2 } from 'lucide-react';
import {
  WindowsMediaPlayerWidget,
  HomeMediaConfig
} from '../../home/WindowsMediaPlayerWidget/WindowsMediaPlayerWidget';

interface HomeMediaTabProps {
  homeMediaConfig: HomeMediaConfig;
  setHomeMediaConfig: React.Dispatch<React.SetStateAction<HomeMediaConfig>>;
  handleHomeMediaFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSaveHomeMedia: (e: React.FormEvent) => void;
  handleClearHomeMedia: () => void;
}

export const HomeMediaTab: React.FC<HomeMediaTabProps> = ({
  homeMediaConfig,
  setHomeMediaConfig,
  handleHomeMediaFileUpload,
  handleSaveHomeMedia,
  handleClearHomeMedia
}) => {
  return (
    <div className="bg-white border-2 border-gray-400 p-4 space-y-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-2">
        <div className="flex items-center gap-2">
          <Film
            className="w-4 h-4 fill-cyan-300 shrink-0"
            stroke="#000000"
            strokeWidth={1.5}
          />
          <span className="font-extrabold text-xs text-[#003c74] uppercase">
            Reproductor Multimedia del Home (Video o Animación GIF)
          </span>
        </div>
        <span className="text-[11px] text-gray-500 font-mono">
          Windows Media Player 9 Series // Pantalla Principal
        </span>
      </div>

      <form onSubmit={handleSaveHomeMedia} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#f8fafc] border border-gray-300 p-3.5">
          {/* Título de la ventana del reproductor */}
          <div className="space-y-1">
            <label className="font-bold text-gray-800 block">
              Título de la Ventana del Reproductor:
            </label>
            <input
              type="text"
              value={homeMediaConfig.title}
              onChange={(e) =>
                setHomeMediaConfig({ ...homeMediaConfig, title: e.target.value })
              }
              className="w-full winxp-input text-xs py-1.5 font-mono font-bold"
              placeholder="Clip_Promocional.wmv"
            />
          </div>

          {/* Tipo de formato con delgado borde negro */}
          <div className="space-y-1">
            <label className="font-bold text-gray-800 block">Formato Multimedia Activo:</label>
            <select
              value={homeMediaConfig.mediaType}
              onChange={(e) =>
                setHomeMediaConfig({
                  ...homeMediaConfig,
                  mediaType: e.target.value as 'video' | 'gif'
                })
              }
              className="w-full winxp-select text-xs py-1.5 font-bold text-blue-900 !border !border-black"
            >
              <option value="gif">Animación GIF (.gif)</option>
              <option value="video">Video Digital (.mp4 / .webm)</option>
            </select>
          </div>

          {/* Subir archivo desde el equipo local */}
          <div className="space-y-1">
            <label className="font-bold text-gray-800 block">
              Subir Video o GIF desde tu Equipo Local:
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <label className="winxp-button text-xs py-1.5 px-3 font-bold text-blue-900 flex items-center gap-1.5 cursor-pointer shrink-0">
                <Upload className="w-3.5 h-3.5 text-blue-700" />
                <span>Seleccionar Video o GIF...</span>
                <input
                  type="file"
                  accept="video/mp4,video/webm,image/gif"
                  onChange={handleHomeMediaFileUpload}
                  className="hidden"
                />
              </label>
              <span className="text-[11px] text-gray-600 font-mono truncate max-w-full">
                {homeMediaConfig.fileName
                  ? homeMediaConfig.fileName
                  : homeMediaConfig.src
                  ? 'Archivo cargado en memoria'
                  : 'Sin archivo cargado'}
              </span>
            </div>
          </div>
        </div>

        {/* Vista previa en vivo del Reproductor de Windows Media del Home */}
        <div className="bg-[#dce6f4] border-2 border-[#7f9db9] p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-b border-[#9bb8e5] pb-2">
            <span className="font-bold text-[#003c74]">
              Vista Previa en Vivo (Así se verá en el Home de la tienda):
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                className="winxp-button winxp-button-primary text-[11px] py-1 px-3 font-bold flex items-center gap-1.5 text-white bg-blue-700"
              >
                <Save
                  className="w-3.5 h-3.5 fill-emerald-300"
                  stroke="#000000"
                  strokeWidth={1.5}
                />
                <span>Guardar Video / GIF del Home</span>
              </button>

              <button
                type="button"
                onClick={handleClearHomeMedia}
                disabled={!homeMediaConfig.src}
                className={`winxp-button text-[11px] py-1 px-2.5 text-red-700 font-bold flex items-center gap-1 ${
                  !homeMediaConfig.src ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Trash2 className="w-3 h-3 text-red-600" />
                <span>Quitar Multimedia Actual</span>
              </button>
            </div>
          </div>

          <WindowsMediaPlayerWidget
            title={homeMediaConfig.title || 'Clip_Promocional.wmv'}
            videoSrc={
              homeMediaConfig.mediaType === 'video' && homeMediaConfig.src
                ? homeMediaConfig.src
                : ''
            }
            gifSrc={
              homeMediaConfig.mediaType === 'gif' && homeMediaConfig.src
                ? homeMediaConfig.src
                : ''
            }
          />
        </div>
      </form>
    </div>
  );
};
