'use client';

import { SWRConfig } from 'swr';
import { ReactNode } from 'react';

interface SWRProviderProps {
  children: ReactNode;
}

/**
 * SWR Provider for client-side caching
 * Configures global SWR settings for the application
 */
export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        // Global configuration
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: 5000,
        focusThrottleInterval: 10000,
        errorRetryCount: 3,
        errorRetryInterval: 5000,
        
        // Keep data in cache for 5 minutes
        provider: () => new Map(),
        
        // Global error handler
        onError: (error, key) => {
          console.error('SWR Error:', key, error);
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}
