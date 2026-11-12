"use client";
import React, { Suspense } from 'react';
import StoreShell from '@/components/StoreShell';
import Storefront from '@/components/Storefront';
import StoreBannerCarousel from '@/components/StoreBannerCarousel';

export default function Home() {
  return (
    <StoreShell>
      {({ cart, addToCart, searchQuery, setSelectedProduct, isMobile, storeProducts, setStoreProducts }) => (
        <>
          <StoreBannerCarousel
            isMobile={isMobile}
            products={storeProducts}
            onProductClick={setSelectedProduct}
          />

          <Suspense fallback={null}>
            <Storefront
              addToCart={addToCart}
              searchQuery={searchQuery}
              onProductClick={setSelectedProduct}
              cart={cart}
              onProductsLoaded={setStoreProducts}
              homeMode
            />
          </Suspense>
        </>
      )}
    </StoreShell>
  );
}
