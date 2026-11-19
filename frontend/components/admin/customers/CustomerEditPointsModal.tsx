import React from 'react';
import { Edit3 } from 'lucide-react';
import { CustomerRecord } from './customerManagerTypes';

export interface CustomerEditPointsModalProps {
  editingPointsCustomer: CustomerRecord | null;
  setEditingPointsCustomer: (cust: CustomerRecord | null) => void;
  newPointsValue: number;
  setNewPointsValue: React.Dispatch<React.SetStateAction<number>>;
  pointsReason: string;
  setPointsReason: (val: string) => void;
  handleSavePoints: (e: React.FormEvent) => void;
}

export const CustomerEditPointsModal: React.FC<CustomerEditPointsModalProps> = ({
  editingPointsCustomer,
  setEditingPointsCustomer,
  newPointsValue,
  setNewPointsValue,
  pointsReason,
  setPointsReason,
  handleSavePoints
}) => {
  if (!editingPointsCustomer) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="nl-cust-modal-window w-full max-w-md bg-white border-4 border-[#003c74] shadow-2xl animate-fadeIn">
        <div className="bg-gradient-to-r from-[#0055ea] to-[#003c74] p-2 px-3 flex items-center justify-between text-white text-xs font-bold">
          <span className="flex items-center gap-1.5">
            <Edit3 className="w-3.5 h-3.5 text-purple-200 shrink-0" />
            <span>EDITAR PUNTOS CLUB // {editingPointsCustomer.nombre} {editingPointsCustomer.apellido}</span>
          </span>
          <button
            type="button"
            onClick={() => setEditingPointsCustomer(null)}
            className="w-5 h-5 bg-[#c75050] text-white flex items-center justify-center font-bold shrink-0"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSavePoints} className="p-4 space-y-3 text-xs">
          <div className="bg-[#f0f4f8] p-2.5 border border-gray-300">
            <div className="text-gray-600">Cliente Seleccionado:</div>
            <div className="font-extrabold text-gray-950 text-sm">
              {editingPointsCustomer.nombre} {editingPointsCustomer.apellido}
            </div>
            <div className="font-mono text-[11px] text-gray-500">
              RUT: {editingPointsCustomer.rut} // Puntos Actuales: <strong>{editingPointsCustomer.puntosClub} pts</strong>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-gray-800 block">
              Nuevo Saldo de Puntos Club:
            </label>
            <input
              type="number"
              min="0"
              required
              value={newPointsValue}
              onChange={(e) => setNewPointsValue(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-full winxp-input text-sm py-1.5 font-black text-purple-900"
            />
          </div>

          {/* Botones de ajuste rápido */}
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            <span className="text-gray-500 font-semibold self-center">Ajuste rápido:</span>
            {[+50, +100, +250, +500, -50, -100].map((adj) => (
              <button
                key={adj}
                type="button"
                onClick={() => setNewPointsValue((prev) => Math.max(0, prev + adj))}
                className="winxp-button text-[10px] py-0.5 px-2 font-bold"
              >
                {adj > 0 ? `+${adj}` : adj}
              </button>
            ))}
          </div>

          <div className="space-y-1">
            <label className="font-bold text-gray-800 block">
              Motivo / Observación del Ajuste: <span className="text-gray-400 font-normal">(Opcional)</span>
            </label>
            <input
              type="text"
              placeholder="Ej: Bonificación por compra Live Stream, ajuste por canje, etc."
              value={pointsReason}
              onChange={(e) => setPointsReason(e.target.value)}
              className="w-full winxp-input text-xs py-1"
            />
          </div>

          <div className="pt-2 border-t border-gray-300 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditingPointsCustomer(null)}
              className="winxp-button text-xs py-1 px-3 font-semibold text-gray-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="winxp-button winxp-button-primary text-xs py-1 px-4 font-bold text-white bg-purple-700"
            >
              Guardar Puntos
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
