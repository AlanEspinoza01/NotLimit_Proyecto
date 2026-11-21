import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types';
import { useAuth } from './AuthContext';
import api from '../api/axios';

interface WishlistContextType {
  wishlist: Product[];
  wishlistIds: string[];
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: Product) => { success: boolean; isAdded: boolean; requiresAuth: boolean };
  addToWishlist: (product: Product) => { success: boolean; requiresAuth: boolean };
  removeFromWishlist: (productId: string) => void;
  clearWishlist: () => void;
  wishlistCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const normalizeBackendProduct = (p: any): Product => ({
  ...p,
  id: String(p._id || p.id),
  title: p.title || p.name || 'Prenda NoLimits',
  images: Array.isArray(p.images) ? p.images : [],
  sizes: Array.isArray(p.sizes) ? p.sizes : [],
  colors: Array.isArray(p.colors) ? p.colors : [],
  price: Number(p.price) || 0,
  salePrice: p.salePrice !== undefined && p.salePrice !== null ? Number(p.salePrice) : undefined,
});

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAuthenticated, updateProfile } = useAuth();
  const [wishlist, setWishlist] = useState<Product[]>([]);

  // Sincronizar favoritos reales desde MongoDB al iniciar sesión o cambiar de usuario
  useEffect(() => {
    if (!currentUser || currentUser.role === 'guest') {
      setWishlist([]);
      return;
    }

    const mongoIds: string[] = Array.isArray((currentUser as any).wishlistProductIds)
      ? (currentUser as any).wishlistProductIds.map(String)
      : [];

    if (mongoIds.length === 0) {
      setWishlist([]);
      return;
    }

    let isMounted = true;

    const loadWishlistProducts = async () => {
      try {
        const res = await api.get('/products');
        const rawList = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
          ? res.data
          : [];

        if (!isMounted) return;

        const idSet = new Set(mongoIds);
        const matchedProducts: Product[] = rawList
          .map(normalizeBackendProduct)
          .filter((prod: Product) => idSet.has(prod.id));

        setWishlist(matchedProducts);
      } catch (error) {
        console.error('Error cargando productos de la Lista de Deseos desde MongoDB:', error);
      }
    };

    loadWishlistProducts();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.id, currentUser?.role]);

  // Helper para guardar el array de IDs en MongoDB y caché local
  const syncWishlistToMongo = (nextList: Product[]) => {
    if (!currentUser || currentUser.role === 'guest') return;
    const nextIds = nextList.map((p) => p.id);
    try {
      localStorage.setItem(`nolimits_wishlist_${currentUser.id}`, JSON.stringify(nextList));
    } catch {
      // ignore
    }
    updateProfile({ wishlistProductIds: nextIds } as any);
  };

  const isInWishlist = (productId: string): boolean => {
    return wishlist.some((item) => item.id === productId);
  };

  const addToWishlist = (product: Product): { success: boolean; requiresAuth: boolean } => {
    if (!isAuthenticated || !currentUser || currentUser.role === 'guest') {
      return { success: false, requiresAuth: true };
    }

    if (!isInWishlist(product.id)) {
      const nextList = [...wishlist, product];
      setWishlist(nextList);
      syncWishlistToMongo(nextList);
    }
    return { success: true, requiresAuth: false };
  };

  const removeFromWishlist = (productId: string) => {
    const nextList = wishlist.filter((item) => item.id !== productId);
    setWishlist(nextList);
    syncWishlistToMongo(nextList);
  };

  const toggleWishlist = (
    product: Product
  ): { success: boolean; isAdded: boolean; requiresAuth: boolean } => {
    if (!isAuthenticated || !currentUser || currentUser.role === 'guest') {
      return { success: false, isAdded: false, requiresAuth: true };
    }

    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
      return { success: true, isAdded: false, requiresAuth: false };
    } else {
      const nextList = [...wishlist, product];
      setWishlist(nextList);
      syncWishlistToMongo(nextList);
      return { success: true, isAdded: true, requiresAuth: false };
    }
  };

  const clearWishlist = () => {
    setWishlist([]);
    syncWishlistToMongo([]);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistIds: wishlist.map((p) => p.id),
        isInWishlist,
        toggleWishlist,
        addToWishlist,
        removeFromWishlist,
        clearWishlist,
        wishlistCount: wishlist.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};