import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Send, CheckCircle2, Upload, X, Lock, UserCheck, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { WindowFrame } from '../layout/WindowFrame';
import { useAuth } from '../../context/AuthContext';

interface CustomProductWidgetProps {
  onClose?: () => void;
  className?: string;
}

interface UploadedPhoto {
  id: string;
  name: string;
  url: string;
}

const MAX_PHOTOS = 10;

export const CustomProductWidget: React.FC<CustomProductWidgetProps> = ({
  onClose,
  className = ''
}) => {
  const { currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (currentUser && isAuthenticated) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
    }
  }, [currentUser, isAuthenticated]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setPhotoError(null);
    const selectedFiles: File[] = Array.from(fileList).filter((file: File) =>
      file.type.startsWith('image/')
    );

    const remainingSlots = MAX_PHOTOS - photos.length;
    if (remainingSlots <= 0) {
      setPhotoError(`Ya alcanzaste el límite máximo de ${MAX_PHOTOS} fotos.`);
      e.target.value = '';
      return;
    }

    let filesToProcess = selectedFiles;
    if (selectedFiles.length > remainingSlots) {
      filesToProcess = selectedFiles.slice(0, remainingSlots);
      setPhotoError(`Solo se permiten hasta ${MAX_PHOTOS} fotos máximo. Se agregaron las primeras ${remainingSlots}.`);
    }

    filesToProcess.forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPhotos((prev) => {
            if (prev.length >= MAX_PHOTOS) return prev;
            return [
              ...prev,
              {
                id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                name: file.name,
                url: reader.result as string
              }
            ];
          });
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    setPhotoError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    setSent(true);
    setTimeout(() => {
      setDescription('');
      setPhotos([]);
      setPhotoError(null);
      setSent(false);
    }, 4000);
  };

  return (
    // El ancho se limita en un contenedor propio para que el CSS global
    // de .winxp-window no extienda este modal hasta ocupar la pantalla.
    <div
      className={`w-full min-w-0 mx-auto my-auto ${className}`}
      style={{ width: '100%', maxWidth: 660 }}
    >
    {/* Altura acotada al viewport; el contenido usa scroll interno. */}
    <WindowFrame
      title="PEDIDO_PERSONALIZADO.EXE - [Pedir Producto Personalizado]"
      icon={<Sparkles className="w-4 h-4 text-amber-300" />}
      showControls={true}
      onClose={onClose}
      statusBarText={
        isAuthenticated
          ? `CLIENTE REGISTRADO VERIFICADO // FOTOS ADJUNTAS: ${photos.length}/${MAX_PHOTOS}`
          : 'REQUIERE CUENTA REGISTRADA PARA SOLICITAR PRODUCTOS PERSONALIZADOS'
      }
      className="w-full min-w-0 max-h-[calc(100dvh-3rem)] flex flex-col"
      bodyClassName="min-h-0 overflow-y-auto overscroll-contain"
    >
      <div className="min-w-0 space-y-3 font-sans text-xs text-gray-900">
        {!isAuthenticated ? (
          <div className="bg-[#f8fafc] border border-gray-300 p-3 sm:p-5 space-y-4 text-center">
            <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-400 flex items-center justify-center mx-auto">
              <Lock className="w-5 h-5 text-amber-700" />
            </div>
            <div className="space-y-1">
              <div className="font-bold text-sm text-[#003c74]">
                Acceso Exclusivo para Clientes Registrados
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Para poder acceder al formulario de <strong>Pedir Producto Personalizado</strong>, debes iniciar sesión o registrarte con tu cuenta de cliente. Así tu nombre y correo se completarán automáticamente.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (onClose) onClose();
                  navigate('/auth');
                }}
                className="winxp-button winxp-button-primary text-xs py-1.5 px-4 font-bold text-blue-900 cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-blue-700" />
                <span>Iniciar Sesión / Registrarse</span>
              </button>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="winxp-button text-xs py-1.5 px-3 font-medium text-gray-700 cursor-pointer"
                >
                  Cerrar
                </button>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="min-w-0 bg-[#f8fafc] border border-gray-300 p-3 sm:p-4 space-y-3 sm:space-y-4">
            <div className="font-bold text-xs text-[#003c74] flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-200">
              <span className="flex min-w-0 items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>SOLICITUD DE PRODUCTO PERSONALIZADO</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-300 px-1.5 py-0.5">
                Cuenta Verificada
              </span>
            </div>

            {sent ? (
              <div className="p-4 bg-green-100 border border-green-400 text-center space-y-1.5 text-green-900">
                <CheckCircle2 className="w-7 h-7 text-green-700 mx-auto" />
                <div className="font-bold text-xs">¡Solicitud de Producto Personalizado Enviada!</div>
                <p className="text-[11px] text-green-800">
                  Hemos recibido tu descripción y referencias. Te contactaremos a <strong>{email}</strong> con la cotización.
                </p>
              </div>
            ) : (
              <>
                {/* Una columna en móvil, dos en tablet/escritorio. */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-0.5">
                      Nombre del Cliente:
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={name}
                      className="block w-full min-w-0 winxp-input text-sm py-2 px-2 bg-gray-100 text-gray-700 font-semibold cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-0.5">
                      Correo Electrónico:
                    </label>
                    <input
                      type="email"
                      readOnly
                      value={email}
                      className="block w-full min-w-0 winxp-input text-sm py-2 px-2 bg-gray-100 text-gray-700 font-semibold cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-0.5">
                    Descripción detallada de lo que quieres:
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe la prenda o producto que deseas personalizar (talla, colores, estampado, medidas o detalles especiales)..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="block w-full min-w-0 winxp-input text-sm leading-relaxed px-2 py-2 resize-y"
                  />
                </div>

                {/* Carga de hasta 10 fotos */}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <label className="block text-[11px] font-bold text-gray-700">
                      Fotos de referencia de lo que quieres (Máx. {MAX_PHOTOS} fotos):
                    </label>
                    <span className="font-mono text-[11px] font-bold text-blue-900">
                      {photos.length} / {MAX_PHOTOS} fotos
                    </span>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <button
                    type="button"
                    disabled={photos.length >= MAX_PHOTOS}
                    onClick={() => fileInputRef.current?.click()}
                    className={`winxp-button text-xs sm:text-sm py-2 px-3 w-full min-h-[38px] font-semibold flex items-center justify-center gap-1.5 ${
                      photos.length >= MAX_PHOTOS
                        ? 'opacity-50 cursor-not-allowed text-gray-500'
                        : 'text-blue-900 cursor-pointer hover:bg-blue-50/80'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5 text-blue-700" />
                    <span>
                      {photos.length >= MAX_PHOTOS
                        ? 'Límite de 10 fotos alcanzado'
                        : 'Seleccionar Fotos de Referencia (Hasta 10)'}
                    </span>
                  </button>

                  {photoError && (
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-900 bg-amber-50 border border-amber-300 px-2 py-1">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>{photoError}</span>
                    </div>
                  )}

                  {photos.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 pt-1 bg-white p-2 border border-gray-300">
                      {photos.map((photo, index) => (
                        <div
                          key={photo.id}
                          className="relative group aspect-square border border-gray-300 bg-gray-100 overflow-hidden"
                          title={photo.name}
                        >
                          <img
                            src={photo.url}
                            alt={`Referencia ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-0 left-0 bg-black/70 text-white text-[9px] font-mono px-1">
                            #{index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(photo.id)}
                            className="absolute top-0.5 right-0.5 bg-red-600 hover:bg-red-700 text-white w-4 h-4 flex items-center justify-center rounded-xs shadow cursor-pointer"
                            title="Quitar foto"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs leading-relaxed text-gray-600 bg-white border border-dashed border-gray-300 p-3 text-center flex flex-wrap items-center justify-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-gray-400" />
                      <span>Aún no has subido fotos de referencia (puedes adjuntar de 1 a 10 imágenes).</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="winxp-button winxp-button-primary text-xs sm:text-sm py-2 min-h-[40px] w-full font-bold text-blue-900 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-blue-700 inline mr-1" />
                  <span>Enviar Pedido Personalizado</span>
                </button>
              </>
            )}
          </form>
        )}
      </div>
    </WindowFrame>
    </div>
  );
};
