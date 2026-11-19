import React from 'react';
import { Sliders, Clock, Plus, Info, Edit3, Trash2 } from 'lucide-react';
import { SliderItem } from './pageEditorTypes';

interface SliderEditorTabProps {
  slides: SliderItem[];
  sliderSpeed: number;
  handleChangeSliderSpeed: (newSpeed: number) => void;
  handleOpenNewSlide: () => void;
  handleOpenEditSlide: (slide: SliderItem) => void;
  handleDeleteSlide: (slideId: string) => void;
}

export const SliderEditorTab: React.FC<SliderEditorTabProps> = ({
  slides,
  sliderSpeed,
  handleChangeSliderSpeed,
  handleOpenNewSlide,
  handleOpenEditSlide,
  handleDeleteSlide
}) => {
  return (
    <div className="bg-white border-2 border-gray-400 p-4 space-y-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-2">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-700 shrink-0" />
          <span className="font-extrabold text-xs text-[#003c74] uppercase">
            Slider de la Página de Inicio (Máximo 8 Diapositivas)
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de Velocidad del Slider */}
          <div className="flex items-center gap-1.5 bg-[#f0f4fa] border border-[#9bb8e5] px-2 py-0.5">
            <Clock className="w-3.5 h-3.5 text-blue-800 shrink-0" />
            <label
              htmlFor="slider-speed-select"
              className="text-xs font-bold text-[#003c74] whitespace-nowrap"
            >
              Velocidad:
            </label>
            <select
              id="slider-speed-select"
              value={sliderSpeed}
              onChange={(e) => handleChangeSliderSpeed(Number(e.target.value))}
              className="winxp-select text-xs py-0.5 px-2 font-bold text-blue-900 !border !border-black bg-white"
              title="Seleccionar a qué velocidad se moverá el Slider de inicio"
            >
              <option value={2000}>2s (Muy Rápida)</option>
              <option value={3000}>3s (Rápida)</option>
              <option value={4500}>4.5s (Normal)</option>
              <option value={6000}>6s (Pausada)</option>
              <option value={8000}>8s (Lenta)</option>
              <option value={10000}>10s (Muy Lenta)</option>
            </select>
          </div>

          <span
            className={`text-xs font-black px-2 py-0.5 border ${
              slides.length >= 8
                ? 'bg-amber-100 text-amber-900 border-amber-400'
                : 'bg-blue-100 text-blue-900 border-blue-400'
            }`}
          >
            {slides.length} / 8 imágenes utilizadas
          </span>
          <button
            type="button"
            disabled={slides.length >= 8}
            onClick={handleOpenNewSlide}
            className={`winxp-button text-xs py-1 px-3 font-bold flex items-center gap-1 text-emerald-950 ${
              slides.length >= 8 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-emerald-700" />
            <span>+ Agregar Slide al Slider</span>
          </button>
        </div>
      </div>

      {slides.length >= 8 && (
        <div className="p-2 bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2 font-semibold">
          <Info className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            Se ha alcanzado el límite de 8 imágenes permitidas en el Slider. Para agregar una nueva, edita o elimina una existente.
          </span>
        </div>
      )}

      {/* Grilla de Slides con proporción exacta 1765x705 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            className="bg-[#f8fafc] border-2 border-gray-300 p-2.5 flex flex-col justify-between shadow-2xs hover:border-blue-500 transition-colors"
          >
            <div className="space-y-2">
              <div className="relative aspect-[1765/705] w-full bg-[#060a12] overflow-hidden border border-gray-300 flex items-center justify-center">
                <img
                  src={slide.imageUrl}
                  alt={slide.title}
                  className="w-full h-full object-fill"
                />
                <span
                  data-force-white="true"
                  className="absolute top-1 left-1 z-[2] bg-black/80 text-white text-[9px] px-1.5 py-0.5 font-mono font-bold"
                >
                  Slide #{idx + 1} · 1765×705
                </span>
                {slide.tag && (
                  <span
                    data-force-white="true"
                    className="absolute bottom-1 right-1 z-[2] bg-red-600 text-white text-[9px] px-1.5 py-0.5 font-black"
                  >
                    {slide.tag}
                  </span>
                )}
              </div>

              <div>
                <div className="font-extrabold text-xs text-gray-950 uppercase line-clamp-2">
                  {slide.title}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200 mt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleOpenEditSlide(slide)}
                className="winxp-button text-xs py-1 px-2.5 font-bold text-blue-900 flex items-center gap-1 flex-1 justify-center"
              >
                <Edit3 className="w-3 h-3 text-blue-700" />
                <span>Editar</span>
              </button>

              <button
                type="button"
                onClick={() => handleDeleteSlide(slide.id)}
                className="winxp-button text-xs py-1 px-2 text-red-700 hover:text-red-900 font-bold"
                title="Eliminar diapositiva"
              >
                <Trash2 className="w-3 h-3 text-red-600" />
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
