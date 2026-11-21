import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  MessageSquare,
  ThumbsUp,
  Camera,
  Maximize2,
  RotateCcw
} from 'lucide-react';
import { Review, Product } from '../../types';
import { PixelIcon } from '../common/PixelIcon';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

interface ProductReviewsSectionProps {
  product: Product;
  initialReviews?: Review[];
}

type RatingFilter = 'all' | '5' | '4' | '3' | '2' | '1';
type ContentTypeFilter = 'all' | 'with_images' | 'comments_only';

const sanitizeCommentText = (text: string) =>
  (text || '').replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim().slice(0, 600);

const mapMongoReview = (doc: any, fallbackProductId: string): Review => ({
  id: String(doc._id || doc.id || `rev_${Date.now()}`),
  productId: String(doc.productId?._id || doc.productId || fallbackProductId),
  userId: String(doc.userId?._id || doc.userId || 'user'),
  userName: doc.userName || 'Cliente NoLimits',
  rating: Number(doc.rating) || 5,
  title: doc.title || 'Valoración de Prenda',
  comment: sanitizeCommentText(doc.comment || ''),
  date: doc.createdAt
    ? new Date(doc.createdAt).toISOString().split('T')[0]
    : doc.date || new Date().toISOString().split('T')[0],
  verifiedPurchase: true,
  photos: Array.isArray(doc.photos) ? doc.photos : [],
  likes: Number(doc.likes) || 0,
  branchPurchased: doc.branchPurchased || 'Viña del Mar',
});

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({
  product,
}) => {
  const { currentUser } = useAuth();

  // Clave de almacenamiento local solo para recordar qué reseñas marcó como "Útil" este usuario
  const userId = currentUser?.id || 'guest';
  const userLikedStorageKey = `nolimits_liked_reviews_${userId}`;

  const [userLikedReviewIds, setUserLikedReviewIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(userLikedStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const isInitialLikesMount = useRef(true);
  useEffect(() => {
    if (isInitialLikesMount.current) {
      isInitialLikesMount.current = false;
      return;
    }
    try {
      localStorage.setItem(userLikedStorageKey, JSON.stringify(userLikedReviewIds));
    } catch {
      // ignore
    }
  }, [userLikedReviewIds, userLikedStorageKey]);

  const prevUserLikedKeyRef = useRef(userLikedStorageKey);
  useEffect(() => {
    if (prevUserLikedKeyRef.current === userLikedStorageKey) return;
    prevUserLikedKeyRef.current = userLikedStorageKey;
    try {
      const saved = localStorage.getItem(userLikedStorageKey);
      setUserLikedReviewIds(saved ? JSON.parse(saved) : []);
    } catch {
      setUserLikedReviewIds([]);
    }
  }, [userLikedStorageKey]);

  // Estado de reseñas verificadas cargadas desde MongoDB
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchReviews = async () => {
      setIsLoadingReviews(true);
      try {
        const res = await api.get(`/reviews/product/${product.id}`);
        if (res.data?.success && Array.isArray(res.data.data) && isMounted) {
          setReviews(res.data.data.map((doc: any) => mapMongoReview(doc, product.id)));
        }
      } catch (err) {
        console.error('Error cargando reseñas desde MongoDB:', err);
      } finally {
        if (isMounted) setIsLoadingReviews(false);
      }
    };

    if (product?.id) {
      fetchReviews();
    }
    return () => {
      isMounted = false;
    };
  }, [product.id]);

  // Estados de Filtros
  const [selectedRating, setSelectedRating] = useState<RatingFilter>('all');
  const [contentTypeFilter, setContentTypeFilter] = useState<ContentTypeFilter>('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Estado para Visor / Lightbox
  interface LightboxState {
    photos: string[];
    currentIndex: number;
    userName: string;
  }
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);

  const openLightbox = (review: Review, startIndex: number) => {
    if (!review.photos || review.photos.length === 0) return;
    setLightbox({
      photos: review.photos,
      currentIndex: startIndex,
      userName: review.userName,
    });
  };

  const handlePrevPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!lightbox || lightbox.photos.length <= 1) return;
    setLightbox((prev) => {
      if (!prev) return null;
      const nextIndex =
        prev.currentIndex > 0 ? prev.currentIndex - 1 : prev.photos.length - 1;
      return { ...prev, currentIndex: nextIndex };
    });
  };

  const handleNextPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!lightbox || lightbox.photos.length <= 1) return;
    setLightbox((prev) => {
      if (!prev) return null;
      const nextIndex =
        prev.currentIndex < prev.photos.length - 1 ? prev.currentIndex + 1 : 0;
      return { ...prev, currentIndex: nextIndex };
    });
  };

  useEffect(() => {
    if (!lightbox) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrevPhoto();
      if (e.key === 'ArrowRight') handleNextPhoto();
      if (e.key === 'Escape') setLightbox(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightbox]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Conteos dinámicos
  const countWithImages = reviews.filter((r) => r.photos && r.photos.length > 0).length;
  const countCommentsOnly = reviews.filter(
    (r) => (!r.photos || r.photos.length === 0) && r.comment?.trim().length > 0
  ).length;

  const filteredReviews = reviews.filter((rev) => {
    if (selectedRating !== 'all') {
      const targetStar = parseInt(selectedRating, 10);
      if (rev.rating !== targetStar) return false;
    }
    if (contentTypeFilter === 'with_images') {
      if (!rev.photos || rev.photos.length === 0) return false;
    } else if (contentTypeFilter === 'comments_only') {
      if (rev.photos && rev.photos.length > 0) return false;
      if (!rev.comment || rev.comment.trim().length === 0) return false;
    }
    return true;
  });

  // Voto de "Útil" sincronizado con POST /api/reviews/:id/like
  const handleToggleLikeReview = async (revId: string) => {
    const isAlreadyLiked = userLikedReviewIds.includes(revId);

    if (isAlreadyLiked) {
      setUserLikedReviewIds((prev) => prev.filter((id) => id !== revId));
      setReviews((prev) =>
        prev.map((r) => (r.id === revId ? { ...r, likes: Math.max(0, r.likes - 1) } : r))
      );
      return;
    }

    setUserLikedReviewIds((prev) => [...prev, revId]);
    setReviews((prev) =>
      prev.map((r) => (r.id === revId ? { ...r, likes: r.likes + 1 } : r))
    );

    try {
      await api.post(`/reviews/${revId}/like`);
    } catch (err) {
      console.error('Error registrando like en MongoDB:', err);
    }
  };

  const ratingLabels: Record<RatingFilter, string> = {
    all: 'Todas las valoraciones',
    '5': '5 estrella',
    '4': '4 estrella',
    '3': '3 estrella',
    '2': '2 estrella',
    '1': '1 estrella',
  };

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : '5.0';

  return (
    <div className="mt-8 pt-6 border-t-2 border-gray-300 space-y-4 font-sans">
      {/* Encabezado General */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-blue-900 flex items-center gap-2">
              <PixelIcon name="notepad" size={16} />
              <span>Comentarios y Valoraciones de Clientes</span>
            </h3>
            <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full border border-blue-300">
              {reviews.length} opiniones
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
            <div className="flex text-amber-500 text-sm">
              {'★'.repeat(Math.round(Number(averageRating)))}
              <span className="text-gray-300">
                {'★'.repeat(5 - Math.round(Number(averageRating)))}
              </span>
            </div>
            <span className="font-bold text-gray-800">{averageRating} de 5.0</span>
            <span className="text-gray-400">|</span>
            <span>{countWithImages} fotos reales de clientes</span>
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="flex flex-wrap items-center gap-2 pt-1 pb-2">
        <div className="relative inline-block text-left" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xs border transition-colors shadow-xs ${
              selectedRating !== 'all'
                ? 'bg-blue-50 text-blue-700 border-blue-500 ring-1 ring-blue-300'
                : 'bg-white text-blue-700 hover:bg-blue-50/70 border-gray-300'
            }`}
            aria-haspopup="true"
            aria-expanded={isDropdownOpen}
          >
            <span>{ratingLabels[selectedRating]}</span>
            <ChevronDown className="w-3.5 h-3.5 text-blue-600 transition-transform duration-150" />
          </button>

          {isDropdownOpen && (
            <div className="absolute left-0 mt-1 w-44 rounded-xs bg-white shadow-lg border border-gray-300 py-1 z-30 animate-fadeIn">
              {(['all', '5', '4', '3', '2', '1'] as RatingFilter[]).map((filterKey) => {
                const isCurrent = selectedRating === filterKey;
                return (
                  <button
                    key={filterKey}
                    type="button"
                    onClick={() => {
                      setSelectedRating(filterKey);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between ${
                      isCurrent
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-gray-800 hover:bg-blue-50/50 hover:text-blue-900'
                    }`}
                  >
                    <span>
                      {filterKey === 'all' ? 'Todas las valoraciones' : `${filterKey} estrella`}
                    </span>
                    {filterKey !== 'all' && (
                      <span className="text-[10px] text-gray-400">
                        ({reviews.filter((r) => r.rating === parseInt(filterKey, 10)).length})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() =>
            setContentTypeFilter((prev) =>
              prev === 'with_images' ? 'all' : 'with_images'
            )
          }
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-xs transition-colors shadow-xs ${
            contentTypeFilter === 'with_images'
              ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold ring-1 ring-blue-400'
              : 'bg-white border-gray-300 text-gray-800 hover:bg-gray-50'
          }`}
          title="Ver solo reseñas con fotografías de clientes"
        >
          <ImageIcon className="w-4 h-4 text-gray-700" />
          <span>({countWithImages})</span>
        </button>

        <button
          type="button"
          onClick={() =>
            setContentTypeFilter((prev) =>
              prev === 'comments_only' ? 'all' : 'comments_only'
            )
          }
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-xs transition-colors shadow-xs ${
            contentTypeFilter === 'comments_only'
              ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold ring-1 ring-blue-400'
              : 'bg-white border-gray-300 text-gray-800 hover:bg-gray-50'
          }`}
          title="Ver solo reseñas con comentarios sin fotos"
        >
          <MessageSquare className="w-4 h-4 text-gray-700" />
          <span>({countCommentsOnly})</span>
        </button>

        {(selectedRating !== 'all' || contentTypeFilter !== 'all') && (
          <button
            type="button"
            onClick={() => {
              setSelectedRating('all');
              setContentTypeFilter('all');
            }}
            className="winxp-button text-xs py-1 px-2.5 flex items-center gap-1.5 text-gray-700 hover:text-blue-900 font-semibold transition-all shadow-xs"
            title="Restablecer todos los filtros de valoraciones"
          >
            <RotateCcw className="w-3.5 h-3.5 text-blue-700" />
            <span>Limpiar filtros</span>
          </button>
        )}
      </div>

      {/* GRILLA DE RESEÑAS */}
      {isLoadingReviews ? (
        <div className="bg-white p-6 border border-gray-300 winxp-bevel-in text-center">
          <span className="text-xs font-bold text-blue-900 animate-pulse">
            Cargando reseñas reales desde MongoDB...
          </span>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="bg-white p-6 border border-gray-300 winxp-bevel-in text-center space-y-2">
          <div className="text-gray-400 flex justify-center">
            <PixelIcon name="info" size={24} />
          </div>
          <h4 className="font-bold text-gray-800 text-xs">
            {reviews.length === 0
              ? 'Aún no hay reseñas para esta prenda'
              : 'No se encontraron reseñas con los filtros seleccionados'}
          </h4>
          <p className="text-[11px] text-gray-600">
            {reviews.length === 0
              ? 'Cuando un cliente reciba o retire esta prenda y la califique desde su perfil, su opinión aparecerá aquí.'
              : 'Prueba seleccionando "Todas las valoraciones".'}
          </p>
          {reviews.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSelectedRating('all');
                setContentTypeFilter('all');
              }}
              className="winxp-button text-xs py-1 px-3 mt-1 text-blue-900 font-bold"
            >
              Ver todas las reseñas
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-w-0">
          {filteredReviews.map((rev) => (
            <ReviewCardItem
              key={rev.id}
              rev={rev}
              isLiked={userLikedReviewIds.includes(rev.id)}
              onOpenLightbox={openLightbox}
              onLikeReview={handleToggleLikeReview}
            />
          ))}
        </div>
      )}

      {/* LIGHTBOX */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 pt-14 pb-12 animate-fadeIn select-none overflow-hidden"
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative max-w-3xl w-full max-h-[calc(100vh-7rem)] bg-white p-2 border-2 border-gray-400 winxp-bevel-out shadow-2xl flex flex-col rounded-xs overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="winxp-titlebar flex items-center justify-between p-1.5 mb-1.5 select-none shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-white font-bold truncate">
                <PixelIcon name="paint" size={14} />
                <span className="truncate">
                  Visor_Fotografia_Cliente.exe - [{lightbox.userName}]
                  {lightbox.photos.length > 1 &&
                    ` (Foto ${lightbox.currentIndex + 1} de ${lightbox.photos.length})`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setLightbox(null)}
                className="winxp-control-btn close text-white shrink-0 ml-2"
                aria-label="Cerrar"
                title="Cerrar Visor (Esc)"
              >
                ✕
              </button>
            </div>

            <div className="relative flex-1 min-h-0 overflow-hidden flex items-center justify-center bg-black/15 border border-gray-300 winxp-bevel-in select-none p-1">
              <img
                src={lightbox.photos[lightbox.currentIndex]}
                alt={`Fotografía ${lightbox.currentIndex + 1} de ${lightbox.userName}`}
                className="w-auto h-auto max-w-full max-h-[46vh] sm:max-h-[50vh] object-contain block mx-auto select-none transition-all duration-150"
              />

              {lightbox.photos.length > 1 && (
                <>
                  <button
                    type="button"
                    data-force-white="true"
                    onClick={handlePrevPhoto}
                    className="review-img-arrow absolute left-2.5 top-1/2 -translate-y-1/2 bg-black/45 hover:bg-black/80 !text-white text-white p-2 sm:p-2.5 rounded-full backdrop-blur-xs border border-white/35 shadow-lg transition-all z-20 cursor-pointer active:scale-90"
                    style={{ color: '#ffffff', stroke: '#ffffff' }}
                    aria-label="Ver imagen anterior"
                    title="Ver imagen anterior (←)"
                  >
                    <ChevronLeft
                      className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5] !text-white !stroke-white text-white"
                      style={{ color: '#ffffff', stroke: '#ffffff' }}
                    />
                  </button>

                  <button
                    type="button"
                    data-force-white="true"
                    onClick={handleNextPhoto}
                    className="review-img-arrow absolute right-2.5 top-1/2 -translate-y-1/2 bg-black/45 hover:bg-black/80 !text-white text-white p-2 sm:p-2.5 rounded-full backdrop-blur-xs border border-white/35 shadow-lg transition-all z-20 cursor-pointer active:scale-90"
                    style={{ color: '#ffffff', stroke: '#ffffff' }}
                    aria-label="Ver siguiente imagen"
                    title="Ver siguiente imagen (→)"
                  >
                    <ChevronRight
                      className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5] !text-white !stroke-white text-white"
                      style={{ color: '#ffffff', stroke: '#ffffff' }}
                    />
                  </button>

                  <div
                    data-force-white="true"
                    className="review-img-counter absolute top-2 right-2 bg-black/60 !text-white text-white text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-white/25 backdrop-blur-xs z-20 shadow-sm"
                    style={{ color: '#ffffff' }}
                  >
                    {lightbox.currentIndex + 1} / {lightbox.photos.length}
                  </div>
                </>
              )}
            </div>

            {lightbox.photos.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 pt-1.5 pb-1 overflow-x-auto shrink-0">
                {lightbox.photos.map((thumbUrl, thumbIdx) => (
                  <button
                    key={thumbIdx}
                    type="button"
                    onClick={() =>
                      setLightbox((prev) =>
                        prev ? { ...prev, currentIndex: thumbIdx } : null
                      )
                    }
                    className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-xs overflow-hidden border transition-all shrink-0 ${
                      lightbox.currentIndex === thumbIdx
                        ? 'border-blue-600 ring-2 ring-blue-400 scale-105'
                        : 'border-gray-400 opacity-60 hover:opacity-100'
                    }`}
                    title={`Ir a imagen ${thumbIdx + 1}`}
                  >
                    <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="pt-1.5 flex items-center justify-between text-xs text-gray-700 shrink-0 border-t border-gray-200 mt-1">
              <span className="italic text-[10px] sm:text-[11px] text-gray-600 truncate mr-2">
                {lightbox.photos.length > 1
                  ? 'Navega con flechas en pantalla o teclas ← →'
                  : 'Fotografía real del cliente ajustada a pantalla'}
              </span>
              <button
                type="button"
                onClick={() => setLightbox(null)}
                className="winxp-button text-xs py-1 px-3 font-semibold text-gray-800 shrink-0"
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface ReviewCardItemProps {
  rev: Review;
  isLiked: boolean;
  onOpenLightbox: (review: Review, startIndex: number) => void;
  onLikeReview: (id: string) => void;
}

const ReviewCardItem: React.FC<ReviewCardItemProps> = ({
  rev,
  isLiked,
  onOpenLightbox,
  onLikeReview,
}) => {
  const totalPhotos = rev.photos?.length || 0;

  return (
    <div className="p-3 bg-gray-50 border border-gray-300 text-xs space-y-2 winxp-bevel-out flex flex-col justify-between overflow-hidden min-w-0">
      <div className="space-y-1.5 min-w-0 overflow-hidden">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span className="font-bold text-gray-900 truncate min-w-0">{rev.userName}</span>
          <span className="text-[10px] text-gray-500 shrink-0">{rev.date}</span>
        </div>

        <div className="flex items-center gap-2 min-w-0">
          <div className="flex text-amber-500 text-xs shrink-0">
            {'★'.repeat(rev.rating)}
            <span className="text-gray-300">{'★'.repeat(5 - rev.rating)}</span>
          </div>
          {rev.title && (
            <span className="font-bold text-gray-800 text-xs truncate min-w-0">
              {rev.title}
            </span>
          )}
        </div>

        <p className="text-gray-700 leading-relaxed text-[11px] break-words [overflow-wrap:anywhere] [word-break:break-word] whitespace-normal">
          {rev.comment.replace(/[\r\n]+/g, ' ').slice(0, 600)}
        </p>

        {totalPhotos > 0 && (
          <div className="pt-1 space-y-1">
            <div className="text-[10px] font-bold text-gray-600 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Camera className="w-3 h-3 text-blue-700" />
                <span>Fotos reales del cliente ({totalPhotos}):</span>
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {rev.photos!.map((photoUrl, photoIdx) => (
                <button
                  key={photoIdx}
                  type="button"
                  onClick={() => onOpenLightbox(rev, photoIdx)}
                  className="relative w-16 h-16 border border-gray-400 rounded-xs overflow-hidden group bg-black/5 hover:ring-2 hover:ring-blue-500 transition-all cursor-zoom-in"
                  title={`Click para ampliar fotografía ${photoIdx + 1} de ${totalPhotos}`}
                >
                  <img
                    src={photoUrl}
                    alt={`Foto real de ${rev.userName}`}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Maximize2
                      className="w-3.5 h-3.5 drop-shadow text-white stroke-white"
                      style={{ color: '#ffffff', stroke: '#ffffff' }}
                    />
                  </div>
                  {totalPhotos > 1 && (
                    <span
                      data-force-white="true"
                      className="review-img-counter absolute bottom-0.5 right-0.5 bg-black/75 !text-white text-white text-[9px] px-1 font-mono font-bold rounded-xs shadow-xs"
                      style={{ color: '#ffffff' }}
                    >
                      {photoIdx + 1}/{totalPhotos}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end pt-2 border-t border-gray-200 text-[10px] text-gray-500 mt-2">
        <button
          type="button"
          onClick={() => onLikeReview(rev.id)}
          className={`flex items-center gap-1.5 font-semibold px-2 py-0.5 rounded cursor-pointer transition-all active:scale-95 border ${
            isLiked
              ? 'bg-blue-100 text-blue-900 border-blue-400 font-bold shadow-xs'
              : 'text-gray-600 hover:text-blue-800 hover:bg-blue-50/80 border-transparent'
          }`}
          title={isLiked ? 'Quitar mi voto de útil' : 'Marcar reseña como útil'}
          aria-pressed={isLiked}
        >
          <ThumbsUp
            className={`w-3.5 h-3.5 transition-transform ${
              isLiked ? 'text-blue-700 fill-blue-600 scale-110' : 'text-blue-600'
            }`}
          />
          <span>¿Útil? ({rev.likes})</span>
        </button>
      </div>
    </div>
  );
};