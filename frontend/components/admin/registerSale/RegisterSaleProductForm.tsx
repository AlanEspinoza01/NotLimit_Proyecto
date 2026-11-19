import React from 'react';
import {
  Tag,
  DollarSign,
  Percent,
  Sparkles,
  Scale,
  Calculator,
  CheckCircle2,
  Plus,
  Layers,
  Star,
  Boxes,
  Trash2,
  PackageCheck,
  Edit3,
  Image as ImageIcon,
  AlertCircle,
  UploadCloud,
  X
} from 'lucide-react';
import { PixelIcon } from '../../common/PixelIcon';
import {
  PRODUCT_TAXONOMY,
  SPECIAL_CATEGORIES as PRODUCT_SPECIAL_CATEGORIES,
  SHIPPING_TIERS
} from '../../../views/admin/ProductManagerView';
import { formatCLP } from './registerSaleTypes';

interface RegisterSaleProductFormProps {
  saleProductsListLength: number;
  productTitle: string;
  onChangeProductTitle: (val: string) => void;
  normalPriceInput: string;
  normalPriceRaw: number;
  onNormalPriceChange: (val: string) => void;
  discountPercent: number | '';
  onChangeDiscountPercent: (val: number | '') => void;
  calculatedOfferPrice: number;
  savingsAmount: number;
  weightGrams: number | '';
  onChangeWeightGrams: (val: number | '') => void;
  showCalculator: boolean;
  onToggleCalculator: () => void;
  calcKg: string;
  calcGrams: string;
  onCalcKgChange: (val: string) => void;
  onCalcGramsChange: (val: string) => void;
  onApplyCalcWeight: () => void;
  currentShippingTier: { id: number; label: string; maxGrams: number; factor: string; full: string };
  tagInput: string;
  onChangeTagInput: (val: string) => void;
  tags: string[];
  onSetTags: (tags: string[]) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
  section: string;
  onSectionChange: (sec: string) => void;
  category: string;
  onCategoryChange: (cat: string) => void;
  availableCategoriesForSection: Array<{ name: string; subcategories: string[] }>;
  subcategory: string;
  onChangeSubcategory: (sub: string) => void;
  availableSubcategoriesForCategory: string[];
  specialCategory: string;
  onChangeSpecialCategory: (spec: string) => void;
  categorySupportsSizes: boolean;
  currentProductTotalUnits: number;
  sizesList: Array<{ id: string; size: string; quantity: number }>;
  availableSizesOptions: string[];
  onAddSizeRow: () => void;
  onUpdateSizeRow: (id: string, field: 'size' | 'quantity', value: any) => void;
  onRemoveSizeRow: (id: string) => void;
  onSetDirectQuantity: (qty: number) => void;
  productDescription: string;
  onChangeProductDescription: (desc: string) => void;
  images: string[];
  activePreviewImageIndex: number;
  onSelectPreviewImage: (idx: number) => void;
  onAddImageFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (idx: number) => void;
  onAddProductToSale: () => void;
}

export const RegisterSaleProductForm: React.FC<RegisterSaleProductFormProps> = ({
  saleProductsListLength,
  productTitle,
  onChangeProductTitle,
  normalPriceInput,
  normalPriceRaw,
  onNormalPriceChange,
  discountPercent,
  onChangeDiscountPercent,
  calculatedOfferPrice,
  savingsAmount,
  weightGrams,
  onChangeWeightGrams,
  showCalculator,
  onToggleCalculator,
  calcKg,
  calcGrams,
  onCalcKgChange,
  onCalcGramsChange,
  onApplyCalcWeight,
  currentShippingTier,
  tagInput,
  onChangeTagInput,
  tags,
  onSetTags,
  onAddTag,
  onRemoveTag,
  section,
  onSectionChange,
  category,
  onCategoryChange,
  availableCategoriesForSection,
  subcategory,
  onChangeSubcategory,
  availableSubcategoriesForCategory,
  specialCategory,
  onChangeSpecialCategory,
  categorySupportsSizes,
  currentProductTotalUnits,
  sizesList,
  availableSizesOptions,
  onAddSizeRow,
  onUpdateSizeRow,
  onRemoveSizeRow,
  onSetDirectQuantity,
  productDescription,
  onChangeProductDescription,
  images,
  activePreviewImageIndex,
  onSelectPreviewImage,
  onAddImageFile,
  onRemoveImage,
  onAddProductToSale
}) => {
  return (
    <div className="rs-step1-col-left space-y-4">
      <div className="bg-white border-2 border-gray-400 p-4 space-y-4 shadow-xs">
        {/* Cabecera del formulario de producto */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-300 pb-2 bg-[#f4f7fa] -mx-4 -mt-4 px-4 py-2.5 mb-2">
          <div className="flex items-center gap-2">
            <PixelIcon name="paint" size={16} />
            <span className="font-extrabold text-xs text-[#003c74] uppercase">
              1. Información del Producto a Vender
            </span>
          </div>
          <span className="text-[11px] font-mono font-bold text-blue-900 bg-blue-100 px-2 py-0.5 border border-blue-300">
            {saleProductsListLength} prenda(s) en orden
          </span>
        </div>

        {/* 1. Nombre del Producto */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-blue-700" />
            <span>Nombre del Producto:</span>
            <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Ej: Gothic Cyber Parachute Cargo Pants V2"
            value={productTitle}
            onChange={(e) => onChangeProductTitle(e.target.value)}
            className="w-full winxp-input text-xs py-1.5 font-medium"
          />
        </div>

        {/* 2. Precios: Precio Normal, Descuento, Precio Oferta */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#fafafa] border border-gray-300 p-3">
          {/* Precio Normal */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-800 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-blue-700" />
                <span>Precio Normal:</span>
                <span className="text-red-600">*</span>
              </span>
            </label>
            <input
              type="text"
              required
              placeholder="45.990"
              value={normalPriceInput}
              onChange={(e) => onNormalPriceChange(e.target.value)}
              className="w-full winxp-input text-xs py-1.5 font-bold text-gray-900"
            />
            <span className="text-[10px] text-gray-500 block">
              Moneda Chilena: {formatCLP(normalPriceRaw)}
            </span>
          </div>

          {/* Descuento (Porcentaje opcional) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-800 flex items-center gap-1">
              <Percent className="w-3.5 h-3.5 text-rose-600" />
              <span>Descuento (%):</span>
              <span className="text-[10px] text-gray-500 font-normal">(Opcional)</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                placeholder="Ej: 20"
                value={discountPercent}
                onChange={(e) =>
                  onChangeDiscountPercent(
                    e.target.value === '' ? '' : Math.min(100, Math.max(0, Number(e.target.value)))
                  )
                }
                className="w-full winxp-input pr-6 text-xs py-1.5 font-bold text-rose-700"
              />
              <span className="absolute right-2 top-1.5 text-xs font-bold text-gray-500">%</span>
            </div>

            {/* Botones de presets rápidos de descuento */}
            <div className="flex flex-wrap gap-1 pt-0.5">
              {[0, 10, 15, 20, 30, 50].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => onChangeDiscountPercent(pct)}
                  style={discountPercent === pct ? { color: '#ffffff' } : undefined}
                  className={`text-[9px] px-1.5 py-0.5 border ${
                    discountPercent === pct
                      ? 'bg-rose-600 !text-white border-rose-800 font-bold'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  <span
                    style={discountPercent === pct ? { color: '#ffffff' } : undefined}
                    className={discountPercent === pct ? '!text-white font-bold' : ''}
                  >
                    {pct === 0 ? '0%' : `-${pct}%`}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Precio Oferta (Cálculo Dinámico) */}
          <div className="space-y-1 bg-white border border-rose-200 p-2 rounded-xs shadow-inner">
            <label className="text-xs font-black text-rose-800 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Precio Oferta:</span>
            </label>
            <div className="text-sm font-black text-rose-700">
              {formatCLP(calculatedOfferPrice)}
            </div>
            {typeof discountPercent === 'number' && discountPercent > 0 ? (
              <div className="text-[10px] text-emerald-800 font-semibold">
                Ahorro cliente: {formatCLP(savingsAmount)} ({discountPercent}%)
              </div>
            ) : (
              <div className="text-[10px] text-gray-500">
                Sin descuento aplicado
              </div>
            )}
          </div>
        </div>

        {/* 3. Peso (Gramos) + Mini Calculadora (kg ⇄ g) + Tramos oficiales de flete */}
        <div className="bg-[#f8fafc] border border-gray-300 p-3 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-indigo-700" />
              <span>Peso (Gramos):</span>
              <span className="text-[11px] text-gray-500 font-normal">
                (Ejemplo: <strong>1000 gramos son 1 kg</strong>)
              </span>
            </label>

            <button
              type="button"
              onClick={onToggleCalculator}
              className="winxp-button text-[11px] py-0.5 px-2 flex items-center gap-1 text-indigo-950 font-bold"
            >
              <Calculator className="w-3.5 h-3.5 text-indigo-700" />
              <span>{showCalculator ? 'Ocultar Calculadora' : '⚖️ Mini Calculadora (kg ⇄ g)'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-center">
            <div className="relative">
              <input
                type="number"
                min="1"
                placeholder="Ej: 850"
                value={weightGrams}
                onChange={(e) => onChangeWeightGrams(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full winxp-input pr-16 text-xs py-1.5 font-bold"
              />
              <span className="absolute right-2 top-1.5 text-xs font-semibold text-gray-500">
                gramos
              </span>
            </div>

            <div className="text-xs text-gray-700 font-medium bg-white border border-gray-200 px-2.5 py-1.5">
              Equivalente:{' '}
              <strong className="text-indigo-900">
                {typeof weightGrams === 'number' && weightGrams > 0
                  ? `${(weightGrams / 1000).toFixed(2)} kg`
                  : '0.00 kg'}
              </strong>
            </div>

            <div className="text-xs text-blue-900 font-bold bg-blue-50 border border-blue-200 px-2.5 py-1.5 flex items-center justify-between">
              <span>Tramo Envío:</span>
              <span className="font-extrabold text-blue-800">{currentShippingTier.full}</span>
            </div>
          </div>

          {/* Panel Mini Calculadora Desplegable */}
          {showCalculator && (
            <div className="p-3 bg-indigo-50/80 border border-indigo-300 space-y-2.5 animate-fadeIn">
              <div className="flex flex-wrap items-center justify-between gap-1 text-xs font-bold text-indigo-950 border-b border-indigo-200 pb-1">
                <span className="flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-indigo-700" />
                  <span>Mini Calculadora de Conversión de Peso (kg ⇄ g)</span>
                </span>
                <span className="text-[10px] text-indigo-700 font-mono">1,00 kg = 1.000 g</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1 bg-white p-2 border border-indigo-200">
                  <span className="font-bold text-gray-800 text-[11px] block">
                    De Kg a Gramos:
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.05"
                      placeholder="Kilogramos"
                      value={calcKg}
                      onChange={(e) => onCalcKgChange(e.target.value)}
                      className="w-full winxp-input text-xs py-1 font-bold"
                    />
                    <span className="font-mono text-gray-500 text-xs">kg</span>
                  </div>
                  <p className="text-[10px] text-gray-600">
                    = <strong className="text-indigo-900">{calcGrams || '0'} g</strong>
                  </p>
                </div>

                <div className="space-y-1 bg-white p-2 border border-indigo-200">
                  <span className="font-bold text-gray-800 text-[11px] block">
                    De Gramos a Kg:
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      placeholder="Gramos"
                      value={calcGrams}
                      onChange={(e) => onCalcGramsChange(e.target.value)}
                      className="w-full winxp-input text-xs py-1 font-bold"
                    />
                    <span className="font-mono text-gray-500 text-xs">g</span>
                  </div>
                  <p className="text-[10px] text-gray-600">
                    = <strong className="text-indigo-900">{calcKg || '0'} kg</strong>
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={onApplyCalcWeight}
                  className="winxp-button text-xs py-1 px-3 text-indigo-900 font-bold flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Aplicar {calcGrams} g al Campo de Peso</span>
                </button>
              </div>
            </div>
          )}

          {/* Tramos oficiales de flete (0 a 20 KG) */}
          <div className="space-y-1 pt-1 border-t border-gray-200">
            <span className="text-[11px] font-bold text-gray-700 block">
              Tramos oficiales de flete (0 a 20 KG):
            </span>
            <div className="rs-shipping-tiers-grid text-center">
              {SHIPPING_TIERS.map((tier) => {
                const isActive = currentShippingTier.id === tier.id;
                return (
                  <div
                    key={tier.id}
                    className={`p-1.5 border transition-all ${
                      isActive
                        ? 'bg-blue-600 border-blue-900 shadow-inner'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    {isActive ? (
                      <>
                        <span style={{ color: '#ffffff' }} className="!text-white font-extrabold text-[11px] block tracking-wide">
                          {tier.label}
                        </span>
                        <span style={{ color: '#fef08a' }} className="font-bold text-[10px] block">
                          {tier.factor}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-gray-800 font-bold text-[11px] block">
                          {tier.label}
                        </span>
                        <span className="text-gray-500 font-semibold text-[10px] block">
                          {tier.factor}
                        </span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4. Etiquetas: escribir, agregar y sugerencias */}
        <div className="space-y-1.5 bg-[#fafafa] border border-gray-300 p-3">
          <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-purple-700" />
            <span>Etiquetas del Producto:</span>
          </label>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Escribe una etiqueta (ej: Live Drop, Cyber, Goth)"
              value={tagInput}
              onChange={(e) => onChangeTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onAddTag();
                }
              }}
              className="flex-1 winxp-input text-xs py-1"
            />
            <button
              type="button"
              onClick={onAddTag}
              className="winxp-button text-xs py-1 px-3 font-bold text-blue-900 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5 text-blue-700" />
              <span>Agregar</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1 min-h-[28px]">
            {tags.length === 0 ? (
              <span className="text-[11px] text-gray-400 italic">No hay etiquetas agregadas</span>
            ) : (
              tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-900 border border-purple-300 text-[11px] font-semibold rounded-xs shadow-2xs"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => onRemoveTag(t)}
                    className="text-purple-600 hover:text-red-700 font-bold ml-0.5"
                    title="Eliminar etiqueta"
                  >
                    ×
                  </button>
                </span>
              ))
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1 pt-1 text-[10px] text-gray-600">
            <span className="font-semibold">Sugerencias:</span>
            {['Live Drop', 'Y2K Cyber', 'Vintage', 'Oversize', 'Edición Limitada', 'Drop Exclusivo'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  if (!tags.includes(s)) onSetTags([...tags, s]);
                }}
                className="text-[10px] text-blue-800 hover:underline bg-white px-1.5 py-0.5 border border-gray-200"
              >
                +{s}
              </button>
            ))}
          </div>
        </div>

        {/* 5. Selección de Sección, Categoría, Subcategoría y Categoría Especial */}
        <div className="space-y-3 bg-[#fdfdfd] border border-gray-300 p-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 items-end">
            {/* Sección */}
            <div className="flex flex-col justify-end">
              <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5 min-h-[32px] pb-1 leading-tight">
                <Layers className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                <span>Sección:</span>
                <span className="text-red-600">*</span>
              </label>
              <select
                value={section}
                onChange={(e) => onSectionChange(e.target.value)}
                style={{ border: '1px solid #000000', height: '32px' }}
                className="w-full winxp-select text-xs h-[32px] font-bold text-gray-900 border border-black"
              >
                {PRODUCT_TAXONOMY.map((sec) => (
                  <option key={sec.section} value={sec.section}>
                    {sec.section}
                  </option>
                ))}
              </select>
            </div>

            {/* Seleccionar una Categoría */}
            <div className="flex flex-col justify-end">
              <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5 min-h-[32px] pb-1 leading-tight">
                <Tag className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                <span>Seleccionar una Categoría:</span>
                <span className="text-red-600">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => onCategoryChange(e.target.value)}
                style={{ border: '1px solid #000000', height: '32px' }}
                className="w-full winxp-select text-xs h-[32px] font-semibold text-gray-900 border border-black"
              >
                {availableCategoriesForSection.map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Seleccionar Subcategoría */}
            <div className="flex flex-col justify-end">
              <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5 min-h-[32px] pb-1 leading-tight">
                <Tag className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                <span>Seleccionar Subcategoría:</span>
                <span className="text-red-600">*</span>
              </label>
              <select
                value={subcategory}
                onChange={(e) => onChangeSubcategory(e.target.value)}
                style={{ border: '1px solid #000000', height: '32px' }}
                className="w-full winxp-select text-xs h-[32px] font-semibold text-gray-900 border border-black"
              >
                {availableSubcategoriesForCategory.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            {/* Categoría Especial */}
            <div className="flex flex-col justify-end">
              <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5 min-h-[32px] pb-1 leading-tight">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />
                <span>Categoría Especial:</span>
              </label>
              <select
                value={specialCategory}
                onChange={(e) => onChangeSpecialCategory(e.target.value)}
                style={{ border: '1px solid #000000', height: '32px' }}
                className="w-full winxp-select text-xs h-[32px] font-bold text-amber-900 border border-black bg-amber-50/50"
              >
                {PRODUCT_SPECIAL_CATEGORIES.map((spec) => (
                  <option key={spec.value} value={spec.value}>
                    {spec.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Desglose de Tallas dinámicas o Unidades directas */}
          {categorySupportsSizes ? (
            <div className="space-y-2 bg-[#f8fafc] border border-gray-300 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-1.5">
                <div>
                  <span className="text-xs font-bold text-gray-800 flex items-center gap-1">
                    <Boxes className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Desglose de Tallas y Unidades:</span>
                  </span>
                  <span className="text-[10px] text-gray-500">
                    Asigna la cantidad de stock a cada talla disponible para esta venta.
                  </span>
                </div>
                <span className="text-xs font-black text-emerald-800 bg-emerald-100 border border-emerald-400 px-2 py-0.5">
                  Total: {currentProductTotalUnits} un.
                </span>
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {sizesList.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-white border border-gray-300 p-2 shadow-2xs"
                  >
                    <span className="text-[11px] font-mono text-gray-400 w-5">#{idx + 1}</span>

                    <div className="flex-1 min-w-[140px]">
                      <label className="text-[10px] font-bold text-gray-600 block">Talla:</label>
                      <select
                        value={item.size}
                        onChange={(e) => onUpdateSizeRow(item.id, 'size', e.target.value)}
                        className="w-full winxp-select text-xs py-1 font-bold text-blue-900"
                      >
                        {availableSizesOptions.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                        {!availableSizesOptions.includes(item.size) && item.size && (
                          <option value={item.size}>{item.size}</option>
                        )}
                      </select>
                    </div>

                    <div className="w-24 sm:w-28">
                      <label className="text-[10px] font-bold text-gray-600 block">Unidades:</label>
                      <input
                        type="number"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => onUpdateSizeRow(item.id, 'quantity', e.target.value)}
                        className="w-full winxp-input text-xs py-1 font-bold text-right pr-2"
                      />
                    </div>

                    <div className="pt-3.5">
                      <button
                        type="button"
                        onClick={() => onRemoveSizeRow(item.id)}
                        className="winxp-button text-xs p-1 text-red-700 hover:text-red-900"
                        title="Eliminar esta talla"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={onAddSizeRow}
                  className="winxp-button text-xs py-1 px-3 text-emerald-950 font-bold flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-700" />
                  <span>+ Agregar otra Talla</span>
                </button>
                <span className="text-[10px] text-gray-500">
                  {sizesList.length} tallas activas
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-300 text-xs text-amber-900 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  Categoría <strong>{category}</strong> ({category === 'Otros' ? 'Productos Sin Talla (Otros)' : 'Talla Única'} - unidades directas).
                </span>
              </div>
              <div className="flex items-center gap-2">
                <label className="font-bold">Unidades totales:</label>
                <input
                  type="number"
                  min="1"
                  value={sizesList[0]?.quantity || 1}
                  onChange={(e) => {
                    const q = Math.max(1, parseInt(e.target.value, 10) || 1);
                    onSetDirectQuantity(q);
                  }}
                  className="w-20 winxp-input text-xs py-0.5 text-center font-bold"
                />
              </div>
            </div>
          )}
        </div>

        {/* 6. Campo Descripción */}
        <div className="space-y-1 bg-[#fafafa] border border-gray-300 p-3">
          <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
            <Edit3 className="w-3.5 h-3.5 text-blue-700" />
            <span>Descripción:</span>
          </label>
          <textarea
            rows={2}
            placeholder="Describe el corte, materiales, detalles Y2K y ajuste de la prenda..."
            value={productDescription}
            onChange={(e) => onChangeProductDescription(e.target.value)}
            className="w-full winxp-input text-xs p-2 font-medium"
          />
        </div>

        {/* 7. Subir Imágenes del Producto (Límite 10 imágenes) */}
        <div className="space-y-3 bg-[#fafafa] border border-gray-300 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-1.5">
            <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-blue-700" />
              <span>Subir Imágenes del Producto:</span>
              <span className="text-red-600">*</span>
            </label>

            <div className="flex items-center gap-1 text-xs">
              <span className="font-semibold text-gray-600">Fotos:</span>
              <span
                className={`font-black px-2 py-0.5 border ${
                  images.length >= 10
                    ? 'bg-rose-100 text-rose-900 border-rose-400'
                    : 'bg-blue-100 text-blue-900 border-blue-400'
                }`}
              >
                {images.length} / 10 imágenes
              </span>
            </div>
          </div>

          {images.length >= 10 && (
            <div className="p-2 bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                Se ha alcanzado el <strong>límite máximo de 10 imágenes</strong> para este producto.
              </span>
            </div>
          )}

          <div>
            <label
              className={`winxp-button w-full flex items-center justify-center gap-2 py-2 px-4 font-bold cursor-pointer text-xs ${
                images.length >= 10 ? 'opacity-50 pointer-events-none' : 'text-blue-950'
              }`}
            >
              <UploadCloud className="w-4 h-4 text-blue-700" />
              <span>Examinar Fotos (Máximo 10)</span>
              <input
                type="file"
                multiple
                accept="image/*"
                disabled={images.length >= 10}
                onChange={onAddImageFile}
                className="hidden"
              />
            </label>
          </div>

          {/* Grilla de Miniaturas */}
          <div className="rs-thumbnails-grid pt-1">
            {images.map((img, idx) => (
              <div
                key={idx}
                className={`relative border-2 p-0.5 bg-white ${
                  activePreviewImageIndex === idx ? 'border-blue-600 ring-2 ring-blue-300' : 'border-gray-300'
                }`}
              >
                <img
                  src={img}
                  alt="Thumbnail"
                  onClick={() => onSelectPreviewImage(idx)}
                  className="w-full h-14 object-cover cursor-pointer hover:opacity-90"
                />
                <span
                  style={{ color: '#ffffff' }}
                  className="absolute top-0.5 left-0.5 bg-black/85 !text-white text-[9px] px-1.5 py-0.5 font-mono font-bold rounded-xs shadow-xs z-10 leading-none select-none"
                >
                  {idx + 1}/{images.length}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveImage(idx)}
                  style={{ color: '#ffffff' }}
                  className="absolute -top-1.5 -right-1.5 bg-red-600 !text-white p-0.5 rounded-full hover:bg-red-700 flex items-center justify-center shadow-xs"
                  title="Eliminar foto"
                >
                  <X className="w-3 h-3 !text-white" style={{ color: '#ffffff', stroke: '#ffffff' }} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Botón de Agregar este producto a la venta */}
        <div className="pt-2 border-t border-gray-300 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] text-gray-500">
            Subtotal actual: <strong className="text-gray-900">{formatCLP((calculatedOfferPrice || normalPriceRaw) * currentProductTotalUnits)} CLP</strong>
          </div>
          <button
            type="button"
            onClick={onAddProductToSale}
            className="winxp-button winxp-button-primary text-xs py-1.5 px-4 font-bold flex items-center gap-1.5 text-blue-950 shadow-xs"
          >
            <Plus className="w-4 h-4 text-blue-700" />
            <span>Agregar este Producto a la Venta</span>
          </button>
        </div>
      </div>
    </div>
  );
};
