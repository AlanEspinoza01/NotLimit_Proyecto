import React, { useMemo } from 'react';

/**
 * Visualizador único de documentos legales del e-commerce.
 * El editor guarda texto plano; aquí se presentan títulos y párrafos sin HTML inyectado.
 */
interface LegalDocumentProps {
  title: string;
  content: string;
  footer?: string;
  kind: 'privacy' | 'terms';
}

// Los párrafos que empiezan en "1. ..." se muestran como secciones destacadas.
const SECTION_HEADING = /^(\d{1,2})\.\s+(.+)$/;
const BULLET_LINE = /^[-•✓]\s+(.+)$/;

export const LegalDocument: React.FC<LegalDocumentProps> = ({
  title,
  content,
  footer,
  kind
}) => {
  // Memorizar el análisis para no reprocesar el documento en cada renderizado.
  const blocks = useMemo(() =>
    String(content || '').trim().split(/\n\s*\n/g).map((block) => {
      const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
      const match = SECTION_HEADING.exec(lines[0] || '');
      return {
        heading: match ? match[2] : null,
        number: match ? match[1] : null,
        lines: match ? lines.slice(1) : lines
      };
    }).filter((block) => block.heading || block.lines.length),
    [content]
  );

  return (
    <article className="w-full min-w-0 text-gray-800" aria-label={title}>
      {/* Cabecera legible, distinta de la barra decorativa Windows XP. */}
      <header className="rounded-md border border-blue-200 bg-blue-50 px-4 py-4 mb-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-blue-700 mb-1">
          {kind === 'privacy' ? 'Cómo utilizamos tus datos' : 'Información para comprar en NoLimits'}
        </p>
        <h2 className="text-[18px] sm:text-[20px] leading-snug font-extrabold text-blue-950">
          {title}
        </h2>
        <p className="text-[12px] text-blue-800 mt-1">
          Lee el documento completo. Si tienes preguntas, contáctanos antes de continuar.
        </p>
      </header>

      {/* Secciones y párrafos; las líneas provienen de un campo editable, sin HTML. */}
      <div className="space-y-4" style={{overflowWrap: 'anywhere'}}>
        {blocks.map((block, index) => (
          <section key={`${block.number || 'intro'}-${index}`} className="rounded-md border border-gray-200 bg-white px-3.5 py-3">
            {block.heading && (
              <h3 className="text-[14px] sm:text-[15px] font-bold text-[#003c74] mb-2 flex items-start gap-2">
                <span className="shrink-0 inline-flex items-center justify-center h-6 min-w-6 rounded bg-blue-100 text-blue-900 text-[12px]">
                  {block.number}
                </span>
                <span>{block.heading}</span>
              </h3>
            )}
            {block.lines.length > 0 && (
              <div className="space-y-2 text-[13px] sm:text-[14px] leading-[1.65] text-gray-800">
                {block.lines.map((line, lineIndex) => {
                  const bullet = BULLET_LINE.exec(line);
                  return bullet ? (
                    <p key={lineIndex} className="pl-4 relative">
                      <span className="absolute left-0 top-0 text-blue-700" aria-hidden="true">•</span>
                      {bullet[1]}
                    </p>
                  ) : (
                    <p key={lineIndex}>{line}</p>
                  );
                })}
              </div>
            )}
          </section>
        ))}
      </div>

      {footer && (
        <footer className="mt-4 rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-[12px] leading-relaxed text-gray-600 whitespace-pre-line">
          {footer}
        </footer>
      )}
    </article>
  );
};
