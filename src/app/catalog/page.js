"use client";
import React, { Suspense } from 'react';
import StoreShell from '@/components/StoreShell';
import Storefront from '@/components/Storefront';

export default function CatalogPage() {
  return (
    <StoreShell>
      {({ cart, addToCart, searchQuery, setSelectedProduct }) => (
        <Suspense fallback={null}>
          <Storefront
            addToCart={addToCart}
            searchQuery={searchQuery}
            onProductClick={setSelectedProduct}
            cart={cart}
            hideBestsellers
          />
        </Suspense>
      )}
    </StoreShell>
  );
}
