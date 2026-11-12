"use client";
import React from 'react';
import StoreShell from '@/components/StoreShell';
import { StoreFAQ } from '@/components/StoreSections';

export default function FaqPage() {
  return (
    <StoreShell>
      {({ isMobile }) => <StoreFAQ isMobile={isMobile} />}
    </StoreShell>
  );
}
