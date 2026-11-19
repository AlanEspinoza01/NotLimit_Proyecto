import React from 'react';
import {
  Layers,
  CheckCircle2,
  Eye,
  EyeOff,
  Tag,
  Check
} from 'lucide-react';
import { PixelIcon } from '../../common/PixelIcon';
import {
  PRODUCT_TAXONOMY,
  CategoriesVisibilityConfig,
  isSectionActive,
  isCategoryActive,
  isSubcategoryActive
} from '../../../views/admin/ProductManagerView';
import { Product } from '../../../types';

interface CategoriesEditorTabProps {
  categoriesVisibility: CategoriesVisibilityConfig;
  selectedSectionFilter: string;
  setSelectedSectionFilter: (filter: string) => void;
  allCatalogProducts: Product[];
  handleEnableAllCategories: () => void;
  handleToggleSectionVisibility: (sectionName: string) => void;
  handleToggleCategoryVisibility: (sectionName: string, categoryName: string) => void;
  handleToggleSubcategoryVisibility: (
    sectionName: string,
    categoryName: string,
    subcategoryName: string
  ) => void;
}

export const CategoriesEditorTab: React.FC<CategoriesEditorTabProps> = ({
  categoriesVisibility,
  selectedSectionFilter,
  setSelectedSectionFilter,
  allCatalogProducts,
  handleEnableAllCategories,
  handleToggleSectionVisibility,
  handleToggleCategoryVisibility,
  handleToggleSubcategoryVisibility
}) => {
  const totalCategoriesCount = PRODUCT_TAXONOMY.reduce(
    (acc, sec) => acc + sec.categories.length,
    0
  );
  const activeCategoriesCount = PRODUCT_TAXONOMY.reduce(
    (acc, sec) =>
      acc +
      sec.categories.filter((cat) =>
        isCategoryActive(sec.section, cat.name, categoriesVisibility)
      ).length,
    0
  );
  const hiddenCategoriesCount = totalCategoriesCount - activeCategoriesCount;

  const totalSubcategoriesCount = PRODUCT_TAXONOMY.reduce(
    (acc, sec) =>
      acc +
      sec.categories.reduce((cAcc, cat) => cAcc + cat.subcategories.length, 0),
    0
  );
  const activeSubcategoriesCount = PRODUCT_TAXONOMY.reduce(
    (acc, sec) =>
      acc +
      sec.categories.reduce(
        (cAcc, cat) =>
          cAcc +
          cat.subcategories.filter((sub) =>
            isSubcategoryActive(sec.section, cat.name, sub, categoriesVisibility)
          ).length,
        0
      ),
    0
  );

  const filteredSections =
    selectedSectionFilter === 'all'
      ? PRODUCT_TAXONOMY
      : PRODUCT_TAXONOMY.filter((s) => s.section === selectedSectionFilter);

  return (
    <div className="bg-white border-2 border-gray-400 p-4 space-y-4 shadow-xs">
      {/* Cabecera del Módulo Editar Categorías */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Layers
              className="w-4 h-4 fill-indigo-300 shrink-0"
              stroke="#000000"
              strokeWidth={1.5}
            />
            <span className="font-extrabold text-xs text-[#003c74] uppercase">
              Control de Visibilidad de Categorías y Subcategorías de Productos
            </span>
          </div>
          <p className="text-[11px] text-gray-600">
            Activa o desactiva cualquier sección, categoría o subcategoría cuando quieras.{' '}
            <strong>No se eliminan los datos ni los productos</strong>: las categorías desactivadas simplemente desaparecen de las vistas públicas y filtros hasta que vuelvas a activarlas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(categoriesVisibility.disabledSections.length > 0 ||
            categoriesVisibility.disabledCategories.length > 0 ||
            categoriesVisibility.disabledSubcategories.length > 0) && (
            <button
              type="button"
              onClick={handleEnableAllCategories}
              className="winxp-button winxp-button-primary text-xs py-1 px-3 font-bold flex items-center gap-1.5 text-emerald-950 bg-emerald-50 border-emerald-600"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Activar Todas las Categorías</span>
            </button>
          )}
        </div>
      </div>

      {/* Resumen de Estado de Categorías */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-[#f4f7fb] border border-[#a0c0e0] p-3 text-xs">
        <div className="bg-white border border-emerald-300 p-2.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-emerald-800 block">
              Categorías Activas (Visibles)
            </span>
            <span className="text-lg font-black text-emerald-700">
              {activeCategoriesCount}{' '}
              <span className="text-xs font-normal text-gray-500">
                de {totalCategoriesCount}
              </span>
            </span>
          </div>
          <Eye className="w-5 h-5 text-emerald-600 shrink-0" />
        </div>

        <div className="bg-white border border-amber-300 p-2.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-amber-900 block">
              Categorías Ocultas Temporalmente
            </span>
            <span className="text-lg font-black text-amber-700">
              {hiddenCategoriesCount}{' '}
              <span className="text-xs font-normal text-gray-500">ocultas</span>
            </span>
          </div>
          <EyeOff className="w-5 h-5 text-amber-600 shrink-0" />
        </div>

        <div className="bg-white border border-indigo-300 p-2.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-indigo-900 block">
              Subcategorías Activas
            </span>
            <span className="text-lg font-black text-indigo-700">
              {activeSubcategoriesCount}{' '}
              <span className="text-xs font-normal text-gray-500">
                de {totalSubcategoriesCount}
              </span>
            </span>
          </div>
          <Tag className="w-5 h-5 text-indigo-600 shrink-0" />
        </div>
      </div>

      {/* Filtro rápido por Sección Principal */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#ece9d8] border border-gray-400 p-2.5 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-bold text-gray-800 mr-1">Filtrar por Sección:</span>
          <button
            type="button"
            onClick={() => setSelectedSectionFilter('all')}
            className={`winxp-button text-[11px] py-1 px-2.5 font-bold ${
              selectedSectionFilter === 'all'
                ? 'bg-blue-100 border-blue-700 text-blue-950'
                : 'bg-white text-gray-800'
            }`}
          >
            Todas las Secciones ({PRODUCT_TAXONOMY.length})
          </button>
          {PRODUCT_TAXONOMY.map((sec) => {
            const secActive = isSectionActive(sec.section, categoriesVisibility);
            return (
              <button
                key={sec.section}
                type="button"
                onClick={() => setSelectedSectionFilter(sec.section)}
                className={`winxp-button text-[11px] py-1 px-2.5 font-bold flex items-center gap-1.5 ${
                  selectedSectionFilter === sec.section
                    ? 'bg-blue-100 border-blue-700 text-blue-950'
                    : 'bg-white text-gray-800'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    secActive ? 'bg-emerald-500' : 'bg-gray-400'
                  }`}
                />
                <span>{sec.section}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Listado de Secciones, Categorías y Subcategorías */}
      <div className="space-y-4">
        {filteredSections.map((secObj) => {
          const secIsActive = isSectionActive(secObj.section, categoriesVisibility);
          const sectionProductsCount = allCatalogProducts.filter(
            (p) => !p.isHidden && (p.section || 'Otros') === secObj.section
          ).length;

          return (
            <div
              key={secObj.section}
              className={`border-2 transition-all ${
                secIsActive
                  ? 'border-[#003c74] bg-white'
                  : 'border-gray-300 bg-gray-50/80 opacity-85'
              }`}
            >
              {/* Barra de la Sección Principal */}
              <div
                className={`p-3 flex flex-wrap items-center justify-between gap-2 border-b ${
                  secIsActive
                    ? 'bg-gradient-to-r from-[#eef4fb] to-[#dce8f7] border-blue-200'
                    : 'bg-gray-200 border-gray-300'
                }`}
              >
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    data-force-white="true"
                    style={{ color: '#ffffff' }}
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-xs ${
                      secIsActive ? 'bg-[#003c74] text-white' : 'bg-gray-600 text-white'
                    }`}
                  >
                    SECCIÓN
                  </span>
                  <h3 className="font-extrabold text-sm text-gray-950 uppercase">
                    {secObj.section}
                  </h3>
                  <span className="text-[11px] text-gray-600 font-mono">
                    ({secObj.categories.length} categorías · {sectionProductsCount} productos)
                  </span>
                  {secIsActive ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-400 text-[10px] font-black rounded-xs">
                      <Eye className="w-3 h-3 text-emerald-700" />
                      <span>VISIBLE EN VISTAS</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-900 border border-rose-400 text-[10px] font-black rounded-xs">
                      <EyeOff className="w-3 h-3 text-rose-700" />
                      <span>OCULTA EN VISTAS</span>
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleSectionVisibility(secObj.section)}
                  className={`winxp-button text-xs py-1 px-3 font-bold flex items-center gap-1.5 ${
                    secIsActive
                      ? 'text-emerald-900 bg-emerald-50 border-emerald-500'
                      : 'text-gray-700 bg-white'
                  }`}
                >
                  {secIsActive ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Sección Activa (Clic para Desactivar)</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-gray-500" />
                      <span>Sección Desactivada (Clic para Activar)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Tabla de Categorías y Subcategorías de esta Sección */}
              <div className="nl-page-editor-table-scroll">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#f0f4f8] border-b border-gray-300 text-gray-700 font-extrabold uppercase text-[11px]">
                      <th className="p-2.5 border-r border-gray-200 w-56">Categoría</th>
                      <th className="p-2.5 border-r border-gray-200 text-center w-36">
                        Estado Categoría
                      </th>
                      <th className="p-2.5 border-r border-gray-200">
                        Subcategorías (Clic para activar / desactivar individualmente)
                      </th>
                      <th className="p-2.5 text-center w-44">Acción Categoría</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {secObj.categories.map((catObj) => {
                      const catIsActive = isCategoryActive(
                        secObj.section,
                        catObj.name,
                        categoriesVisibility
                      );
                      const catProductsCount = allCatalogProducts.filter(
                        (p) =>
                          !p.isHidden &&
                          (p.section || 'Otros') === secObj.section &&
                          (p.category || 'Otros') === catObj.name
                      ).length;

                      return (
                        <tr
                          key={`${secObj.section}-${catObj.name}`}
                          className={`transition-colors ${
                            catIsActive ? 'hover:bg-blue-50/40' : 'bg-gray-100/80 opacity-75'
                          }`}
                        >
                          {/* Nombre de la Categoría */}
                          <td className="p-2.5 border-r border-gray-200 align-middle">
                            <div className="font-bold text-gray-950 flex items-center gap-1.5">
                              <PixelIcon name="folder" size={14} />
                              <span>{catObj.name}</span>
                            </div>
                            <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                              {catProductsCount} productos asociados
                            </div>
                          </td>

                          {/* Estado Actual */}
                          <td className="p-2.5 border-r border-gray-200 text-center align-middle">
                            {catIsActive ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-400 font-bold text-[10px] rounded-xs">
                                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                <span>ACTIVA</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-200 text-gray-700 border border-gray-400 font-bold text-[10px] rounded-xs">
                                <EyeOff className="w-3 h-3 text-gray-600" />
                                <span>DESACTIVADA</span>
                              </span>
                            )}
                          </td>

                          {/* Subcategorías interactivas */}
                          <td className="p-2.5 border-r border-gray-200 align-middle">
                            <div className="flex flex-wrap gap-1.5">
                              {catObj.subcategories.map((subName) => {
                                const subActive = isSubcategoryActive(
                                  secObj.section,
                                  catObj.name,
                                  subName,
                                  categoriesVisibility
                                );
                                return (
                                  <button
                                    key={subName}
                                    type="button"
                                    onClick={() =>
                                      handleToggleSubcategoryVisibility(
                                        secObj.section,
                                        catObj.name,
                                        subName
                                      )
                                    }
                                    className={`winxp-button text-[11px] py-0.5 px-2 font-bold flex items-center gap-1 ${
                                      subActive
                                        ? 'bg-emerald-50 text-emerald-950 border-emerald-400'
                                        : 'bg-gray-200 text-gray-500 border-gray-400 line-through'
                                    }`}
                                    title={
                                      subActive
                                        ? `Subcategoría "${subName}" activa en las vistas (Clic para ocultar)`
                                        : `Subcategoría "${subName}" oculta en las vistas (Clic para mostrar)`
                                    }
                                  >
                                    {subActive ? (
                                      <Check className="w-3 h-3 text-emerald-700 shrink-0" />
                                    ) : (
                                      <EyeOff className="w-3 h-3 text-gray-500 shrink-0" />
                                    )}
                                    <span>{subName}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </td>

                          {/* Botón Activar / Desactivar Categoría */}
                          <td className="p-2.5 text-center align-middle">
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleCategoryVisibility(secObj.section, catObj.name)
                              }
                              className={`winxp-button text-[11px] py-1 px-2.5 font-bold inline-flex items-center gap-1.5 ${
                                catIsActive ? 'text-emerald-800' : 'text-gray-700'
                              }`}
                            >
                              {catIsActive ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>Activa (Desactivar)</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                                  <span>Desactivada (Activar)</span>
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
