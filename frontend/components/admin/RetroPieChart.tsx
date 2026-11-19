import React, { useState } from 'react';
import { WindowFrame } from '../layout/WindowFrame';
import { PixelIcon } from '../common/PixelIcon';

export interface PieChartItem {
  id: string;
  label: string;
  value: number;
  subLabel?: string;
  secondaryText?: string;
  color?: string;
  sku?: string;
  image?: string;
  category?: string;
  email?: string;
  rut?: string;
  totalSpent?: number;
  ordersCount?: number;
  loyaltyPoints?: number;
  price?: number;
  units?: number;
  revenue?: number;
}

interface RetroPieChartProps {
  title: string;
  subtitle?: string;
  data: PieChartItem[];
  valuePrefix?: string;
  valueSuffix?: string;
  height?: number;
  donut?: boolean;
  headerAction?: React.ReactNode;
  onItemClick?: (item: PieChartItem & { index: number; percentage: string }) => void;
}

const DEFAULT_PALETTE = [
  '#0055ea', // Azul Windows XP
  '#10b981', // Verde esmeralda
  '#f59e0b', // Ámbar dorado
  '#ec4899', // Rosa Cyber
  '#8b5cf6', // Violeta neón
  '#06b6d4', // Cian cielo
  '#f97316', // Naranja eléctrico
  '#6366f1', // Índigo profundo
  '#14b8a6', // Teal digital
  '#ef4444', // Rojo rubí
];

export const RetroPieChart: React.FC<RetroPieChartProps> = ({
  title,
  subtitle,
  data,
  valuePrefix = '',
  valueSuffix = '',
  height = 280,
  donut = false,
  headerAction,
  onItemClick,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<(PieChartItem & { index: number; percentage: string }) | null>(null);

  const sortedData = [...data].sort((a, b) => b.value - a.value);
  const total = sortedData.reduce((acc, item) => acc + item.value, 0);

  // Dimensiones del canvas SVG
  const size = 260;
  const center = size / 2;
  const radius = donut ? 105 : 110;
  const innerRadius = donut ? 50 : 0;

  // Cálculo de los sectores del pastel
  let cumulativeAngle = -90; // Empezamos en las 12:00 (-90 grados)

  const slices = sortedData.map((item, index) => {
    const fraction = total > 0 ? item.value / total : 0;
    const sliceAngle = fraction * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + sliceAngle;
    const midAngle = startAngle + sliceAngle / 2;
    cumulativeAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const midRad = (midAngle * Math.PI) / 180;

    const color = DEFAULT_PALETTE[index % DEFAULT_PALETTE.length] || item.color;

    // Desplazamiento sutil al pasar el mouse por encima
    const isHovered = hoveredIndex === index;
    const offset = isHovered ? 8 : 0;
    const offsetX = offset * Math.cos(midRad);
    const offsetY = offset * Math.sin(midRad);

    const x1 = center + radius * Math.cos(startRad) + offsetX;
    const y1 = center + radius * Math.sin(startRad) + offsetY;
    const x2 = center + radius * Math.cos(endRad) + offsetX;
    const y2 = center + radius * Math.sin(endRad) + offsetY;

    const largeArcFlag = sliceAngle > 180 ? 1 : 0;

    let pathData = '';
    if (innerRadius > 0) {
      const ix1 = center + innerRadius * Math.cos(startRad) + offsetX;
      const iy1 = center + innerRadius * Math.sin(startRad) + offsetY;
      const ix2 = center + innerRadius * Math.cos(endRad) + offsetX;
      const iy2 = center + innerRadius * Math.sin(endRad) + offsetY;
      pathData = `M ${ix1} ${iy1} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${ix1} ${iy1} Z`;
    } else {
      const cx = center + offsetX;
      const cy = center + offsetY;
      pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
    }

    return {
      ...item,
      index,
      color,
      pathData,
      fraction,
      percentage: (fraction * 100).toFixed(1),
      isHovered,
    };
  });

  const activeItem = hoveredIndex !== null ? slices[hoveredIndex] : null;

  const handleItemClick = (slice: typeof slices[0]) => {
    if (onItemClick) {
      onItemClick(slice);
    } else {
      setSelectedDetail(slice);
    }
  };

  return (
    <div className="bg-white border border-[#7f9db9] p-3.5 shadow-xs h-full flex flex-col justify-between">
      {/* Cabecera del Gráfico: Título y subtítulo arriba completos sin truncar, y controles/Total Muestra abajo */}
      <div className="border-b border-gray-200 pb-2.5 mb-3 space-y-1.5">
        <div>
          <h4 className="font-extrabold text-xs text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#0055ea] inline-block shadow-xs shrink-0" />
            <span>{title}</span>
          </h4>
          {subtitle && (
            <p className="text-[11px] text-gray-600 mt-0.5 leading-normal">
              {subtitle}
            </p>
          )}
        </div>

        {/* Fila inferior (abajo del subtítulo): Controles y Total Muestra */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-100 min-h-[30px]">
          <div>
            {headerAction}
          </div>
          <div className="text-[11px] font-bold text-gray-700 bg-blue-50 px-2.5 py-0.5 border border-blue-200 whitespace-nowrap shadow-xs ml-auto">
            Total Muestra:{' '}
            <span className="text-blue-900 font-black">
              {valuePrefix}{total.toLocaleString('es-CL')}{valueSuffix}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center flex-1">
        {/* Visualización del Gráfico de Pastel (SVG) */}
        <div className="md:col-span-6 flex flex-col items-center justify-center relative select-none">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="filter drop-shadow-sm overflow-visible"
          >
            {/* Sombra base del gráfico de pastel */}
            <circle cx={center + 2} cy={center + 4} r={radius} fill="#000000" opacity="0.08" />

            {/* Sectores de pastel */}
            {slices.map((slice) => (
              <path
                key={slice.id}
                d={slice.pathData}
                fill={slice.color}
                stroke="#ffffff"
                strokeWidth={slice.isHovered ? 2.5 : 1.5}
                className="transition-all duration-150 cursor-pointer hover:brightness-110"
                onMouseEnter={() => setHoveredIndex(slice.index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => handleItemClick(slice)}
              />
            ))}

            {/* Agujero central si es dona */}
            {donut && (
              <circle
                cx={center}
                cy={center}
                r={innerRadius - 2}
                fill="#ffffff"
                stroke="#e2e8f0"
                strokeWidth="1"
              />
            )}
          </svg>

          {/* Información emergente al pasar el cursor con texto blanco forzado */}
          <div className="h-10 mt-2 flex items-center justify-center text-center">
            {activeItem ? (
              <div
                onClick={() => handleItemClick(activeItem)}
                style={{ color: '#ffffff', backgroundColor: '#1e3a8a' }}
                className="!text-white px-2.5 py-1 rounded-xs text-[11px] shadow-md border border-blue-400 animate-in fade-in zoom-in-95 duration-100 max-w-[320px] truncate cursor-pointer hover:scale-105 transition-transform"
                title="Haga clic para ver todos los detalles en una mini ventana"
              >
                <span className="font-bold text-amber-300 mr-1.5">#{activeItem.index + 1}</span>
                <span style={{ color: '#ffffff' }} className="font-semibold !text-white">
                  {activeItem.label}:
                </span>{' '}
                <span style={{ color: '#ffffff' }} className="font-bold !text-white ml-1">
                  {valuePrefix}{activeItem.value.toLocaleString('es-CL')}{valueSuffix} ({activeItem.percentage}%)
                </span>
              </div>
            ) : (
              <span className="text-[11px] text-gray-500 italic">
                Pase el cursor sobre un segmento o haga clic para ver detalles
              </span>
            )}
          </div>
        </div>

        {/* Leyenda y Ranking Top 10 Detallado */}
        <div className="md:col-span-6 space-y-1 max-h-[300px] overflow-y-auto pr-1 text-xs">
          {slices.map((item) => (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              onMouseEnter={() => setHoveredIndex(item.index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`flex items-center justify-between p-1.5 rounded-xs border transition-colors cursor-pointer select-none ${
                item.isHovered
                  ? 'bg-blue-100/80 border-blue-400 text-blue-950 font-semibold shadow-xs'
                  : 'bg-[#f8fafc] border-gray-200 text-gray-800 hover:bg-gray-100'
              }`}
              title="Haga clic para ver todos los detalles en una mini ventana"
            >
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <span
                  className="w-4 h-4 rounded-xs shrink-0 flex items-center justify-center text-[10px] font-black !text-white shadow-xs hover:scale-125 transition-transform"
                  style={{
                    backgroundColor: item.color || '#0055ea',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.6)'
                  }}
                  title={`Posición #${item.index + 1} - Clic para ver detalles`}
                >
                  <span
                    style={{ color: '#ffffff', textShadow: '0 0 2px rgba(255, 255, 255, 0.8)' }}
                    className="!text-white font-black text-[10px]"
                  >
                    {item.index + 1}
                  </span>
                </span>

                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.label}
                    className="w-6 h-6 object-cover border border-gray-300 rounded-xs shrink-0 bg-white"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-xs bg-[#e0e7ff] text-[#3730a3] border border-indigo-200 flex items-center justify-center text-[10px] font-bold shrink-0">
                    {item.label.substring(0, 2).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0">
                  <div className="text-[11px] font-bold truncate leading-tight" title={item.label}>
                    {item.label}
                  </div>
                  {item.subLabel && (
                    <div className="text-[10px] text-gray-500 truncate leading-none mt-0.5">
                      {item.subLabel}
                    </div>
                  )}
                  {item.sku && !item.subLabel && (
                    <div className="text-[10px] text-gray-500 font-mono leading-none mt-0.5">
                      SKU: {item.sku}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="font-mono text-[11px] font-bold text-blue-900">
                  {valuePrefix}{item.value.toLocaleString('es-CL')}{valueSuffix}
                </div>
                {item.secondaryText && (
                  <div className="text-[10px] text-gray-600 font-mono font-medium">
                    {item.secondaryText}
                  </div>
                )}
                <div className="text-[10px] text-gray-500 font-semibold">
                  {item.percentage}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mini Ventana de Detalles del Ranking al hacer Clic en una tarjetita / número */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <WindowFrame
              title={`DETALLE_RANKING.SYS - [Posición #${selectedDetail.index + 1}: ${selectedDetail.label}]`}
              icon={<PixelIcon name="computer" size={16} />}
              statusBarText={`AUDITORÍA TOP 10 NO LIMITS // REGISTRO OFICIAL // ID: ${selectedDetail.id}`}
            >
              <div className="space-y-4 text-xs font-sans">
                {/* Cabecera del ítem */}
                <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xs">
                  <div
                    className="w-10 h-10 rounded-xs flex items-center justify-center text-sm font-black !text-white shrink-0 shadow-sm"
                    style={{
                      backgroundColor: selectedDetail.color || '#0055ea',
                      color: '#ffffff',
                      border: '1.5px solid #ffffff'
                    }}
                  >
                    <span style={{ color: '#ffffff' }} className="!text-white font-black text-sm">
                      #{selectedDetail.index + 1}
                    </span>
                  </div>

                  {selectedDetail.image ? (
                    <img
                      src={selectedDetail.image}
                      alt={selectedDetail.label}
                      className="w-12 h-12 object-cover border border-gray-400 rounded-xs shrink-0 bg-white shadow-xs"
                    />
                  ) : null}

                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block">
                      Lugar #{selectedDetail.index + 1} en el Ranking
                    </span>
                    <h5 className="font-extrabold text-sm text-gray-900 leading-tight">
                      {selectedDetail.label}
                    </h5>
                    {selectedDetail.subLabel && (
                      <p className="text-[11px] text-gray-600 mt-0.5">{selectedDetail.subLabel}</p>
                    )}
                  </div>
                </div>

                {/* Métricas destacadas */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#f0f4f9] border border-[#a2b5cc] p-2.5 rounded-xs">
                    <span className="text-[10px] text-gray-600 font-bold block uppercase">
                      Total Registrado
                    </span>
                    <span className="text-base font-black text-blue-900 font-mono">
                      {valuePrefix}{selectedDetail.value.toLocaleString('es-CL')}{valueSuffix}
                    </span>
                  </div>

                  <div className="bg-[#f0f4f9] border border-[#a2b5cc] p-2.5 rounded-xs">
                    <span className="text-[10px] text-gray-600 font-bold block uppercase">
                      Participación
                    </span>
                    <span className="text-base font-black text-purple-900 font-mono">
                      {selectedDetail.percentage}% del total
                    </span>
                  </div>
                </div>

                {/* Desglose de información adicional */}
                <div className="bg-white border border-gray-300 p-2.5 rounded-xs space-y-1.5 text-[11px]">
                  {selectedDetail.sku && (
                    <div className="flex justify-between border-b border-gray-100 pb-1">
                      <span className="text-gray-500 font-bold">Código SKU:</span>
                      <span className="font-mono font-bold text-gray-800">{selectedDetail.sku}</span>
                    </div>
                  )}

                  {selectedDetail.email && (
                    <div className="flex justify-between border-b border-gray-100 pb-1">
                      <span className="text-gray-500 font-bold">Correo Electrónico:</span>
                      <span className="font-mono text-gray-800">{selectedDetail.email}</span>
                    </div>
                  )}

                  {selectedDetail.rut && (
                    <div className="flex justify-between border-b border-gray-100 pb-1">
                      <span className="text-gray-500 font-bold">RUT Registrado:</span>
                      <span className="font-mono font-bold text-gray-800">{selectedDetail.rut}</span>
                    </div>
                  )}

                  {selectedDetail.secondaryText && (
                    <div className="flex justify-between border-b border-gray-100 pb-1">
                      <span className="text-gray-500 font-bold">Información Adicional:</span>
                      <span className="font-bold text-blue-900">{selectedDetail.secondaryText}</span>
                    </div>
                  )}

                  {selectedDetail.price && (
                    <div className="flex justify-between border-b border-gray-100 pb-1">
                      <span className="text-gray-500 font-bold">Precio Estimado:</span>
                      <span className="font-mono font-bold text-green-700">${selectedDetail.price.toLocaleString('es-CL')} CLP</span>
                    </div>
                  )}

                  <div className="flex justify-between pt-0.5">
                    <span className="text-gray-500 font-bold">Estado en Sistema:</span>
                    <span className="font-bold text-green-700 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      ACTIVO EN TIEMPO REAL
                    </span>
                  </div>
                </div>

                {/* Botón de cierre */}
                <div className="flex justify-end pt-2 border-t border-gray-300">
                  <button
                    type="button"
                    onClick={() => setSelectedDetail(null)}
                    className="winxp-button winxp-button-primary text-xs py-1.5 px-5 font-bold text-blue-950"
                  >
                    Aceptar / Cerrar
                  </button>
                </div>
              </div>
            </WindowFrame>
          </div>
        </div>
      )}
    </div>
  );
};
