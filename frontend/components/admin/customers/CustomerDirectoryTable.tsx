import React from 'react';
import {
  Star,
  ShieldAlert,
  Edit3,
  Eye,
  Phone,
  Mail,
  Tag
} from 'lucide-react';
import { CustomerRecord, formatCLP } from './customerManagerTypes';

export interface CustomerDirectoryTableProps {
  filteredCustomers: CustomerRecord[];
  onStartEditPoints: (cust: CustomerRecord) => void;
  handleOpenAddReport: (cust: CustomerRecord, preselectedType?: 'preferencial' | 'negra') => void;
  handleOpenViewReports: (cust: CustomerRecord) => void;
}

export const CustomerDirectoryTable: React.FC<CustomerDirectoryTableProps> = ({
  filteredCustomers,
  onStartEditPoints,
  handleOpenAddReport,
  handleOpenViewReports
}) => {
  return (
    <div className="nl-cust-table-container overflow-x-auto border-2 border-gray-400 bg-white shadow-xs">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-[#e4ebf2] border-b border-gray-400 text-gray-800 font-extrabold uppercase text-[11px]">
            <th className="p-2.5 border-r border-gray-300">Nombre</th>
            <th className="p-2.5 border-r border-gray-300">Apellido</th>
            <th className="p-2.5 border-r border-gray-300">RUT</th>
            <th className="p-2.5 border-r border-gray-300">Correo Electrónico</th>
            <th className="p-2.5 border-r border-gray-300">Teléfono Móvil</th>
            <th className="p-2.5 border-r border-gray-300 text-center">Compras</th>
            <th className="p-2.5 border-r border-gray-300 text-center">Puntos Club</th>
            <th className="p-2.5 border-r border-gray-300 text-right">Total Gastado</th>
            <th className="p-2.5 border-r border-gray-300 text-center">Etiquetas</th>
            <th className="p-2.5 text-center min-w-[260px]">Acciones / Registros</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {filteredCustomers.length === 0 ? (
            <tr>
              <td colSpan={10} className="p-8 text-center text-gray-500">
                No se encontraron clientes con las etiquetas o búsqueda seleccionada.
              </td>
            </tr>
          ) : (
            filteredCustomers.map((cust) => {
              const hasPref = cust.etiquetas.includes('Lista Preferencial');
              const hasBl = cust.etiquetas.includes('Lista Negra');
              const hasNormal = cust.etiquetas.includes('Normal') || (!hasPref && !hasBl);
              const totalReports =
                (cust.blacklistReports?.length || 0) + (cust.preferentialReports?.length || 0);

              return (
                <tr
                  key={cust.id}
                  className={`hover:bg-blue-50/50 transition-colors ${
                    hasBl && hasPref
                      ? 'bg-purple-50/40'
                      : hasBl
                      ? 'bg-rose-50/40'
                      : hasPref
                      ? 'bg-amber-50/40'
                      : ''
                  }`}
                >
                  {/* Nombre */}
                  <td className="p-2.5 border-r border-gray-200 font-bold text-gray-950">
                    {cust.nombre}
                  </td>

                  {/* Apellido */}
                  <td className="p-2.5 border-r border-gray-200 font-bold text-gray-950">
                    {cust.apellido}
                  </td>

                  {/* RUT */}
                  <td className="p-2.5 border-r border-gray-200 font-mono text-gray-700">
                    {cust.rut}
                  </td>

                  {/* Correo Electrónico */}
                  <td className="p-2.5 border-r border-gray-200 text-gray-700">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                      <span className="truncate max-w-[150px]">{cust.email}</span>
                    </div>
                  </td>

                  {/* Teléfono Móvil */}
                  <td className="p-2.5 border-r border-gray-200 font-mono text-gray-700">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                      <span>{cust.phone}</span>
                    </div>
                  </td>

                  {/* Compras */}
                  <td className="p-2.5 border-r border-gray-200 text-center font-bold text-gray-900">
                    {cust.compras} ord.
                  </td>

                  {/* PUNTOS CLUB (EDITABLE POR EL ADMIN) */}
                  <td className="p-2.5 border-r border-gray-200 text-center">
                    <div className="inline-flex items-center gap-1.5 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-xs">
                      <span className="font-mono font-black text-purple-900">
                        {cust.puntosClub} pts
                      </span>
                      <button
                        type="button"
                        onClick={() => onStartEditPoints(cust)}
                        className="text-purple-700 hover:text-purple-950 p-0.5"
                        title="Editar Puntos Club de este cliente"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>

                  {/* Total Gastado */}
                  <td className="p-2.5 border-r border-gray-200 text-right font-black text-gray-950">
                    {formatCLP(cust.totalGastado)}
                  </td>

                  {/* ETIQUETAS: Pueden coexistir múltiples etiquetas (ej: VIP pero grosero) */}
                  <td className="p-2.5 border-r border-gray-200 text-center">
                    <div className="flex flex-wrap items-center justify-center gap-1">
                      {hasPref && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-black bg-amber-100 text-amber-900 border border-amber-400 rounded-xs shadow-2xs">
                          <Star className="w-3 h-3 text-amber-600 fill-amber-500" />
                          <span>Lista Preferencial</span>
                        </span>
                      )}
                      {hasBl && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-black bg-rose-100 text-rose-900 border border-rose-400 rounded-xs shadow-2xs">
                          <ShieldAlert className="w-3 h-3 text-rose-600" />
                          <span>Lista Negra</span>
                        </span>
                      )}
                      {hasNormal && (
                        <span className="inline-block px-1.5 py-0.5 text-[9px] font-bold bg-gray-100 text-gray-800 border border-gray-300 rounded-xs">
                          Normal
                        </span>
                      )}
                    </div>
                  </td>

                  {/* ACCIONES / REGISTROS */}
                  <td className="p-2.5 text-center">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      {/* BOTÓN 1: "Agregar reporte" (Da a elegir si es a Lista Preferencial o Lista Negra) */}
                      <button
                        type="button"
                        onClick={() => handleOpenAddReport(cust)}
                        className="winxp-button text-[10px] py-1 px-2.5 text-blue-950 font-black flex items-center justify-center gap-1 shadow-xs border-blue-700 bg-blue-50 hover:bg-blue-100 w-full max-w-[125px]"
                        title="Añadir un reporte: da a elegir entre Lista Preferencial o Lista Negra"
                      >
                        <Tag className="w-3.5 h-3.5 text-blue-700" />
                        <span>Agregar reporte</span>
                      </button>

                      {/* BOTÓN 2: "Ver" (Disponible si el cliente tiene reportes en Lista Preferencial o Lista Negra, ubicado debajo) */}
                      {totalReports > 0 && (
                        <button
                          type="button"
                          onClick={() => handleOpenViewReports(cust)}
                          className="winxp-button winxp-button-primary text-[10px] py-1 px-2.5 text-gray-900 font-black flex items-center justify-center gap-1 shadow-xs bg-amber-100 border-amber-500 hover:bg-amber-200 w-full max-w-[125px]"
                          title="Ver y modificar los reportes acumulados de Lista Preferencial y Lista Negra"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-800" />
                          <span>Ver ({totalReports})</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
