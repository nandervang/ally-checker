/**
 * Icon Library Context
 * Provides the current icon library setting to all components
 */

import React, { createContext, useContext, ReactNode } from 'react';
import type { IconLibrary } from '@/lib/icons';

interface IconLibraryContextType {
  iconLibrary: IconLibrary;
}

const IconLibraryContext = createContext<IconLibraryContextType>({
  iconLibrary: 'lucide',
});

export function useIconLibrary() {
  return useContext(IconLibraryContext);
}

interface IconLibraryProviderProps {
  iconLibrary: IconLibrary;
  children: ReactNode;
}

export function IconLibraryProvider({ iconLibrary, children }: IconLibraryProviderProps) {
  return (
    <IconLibraryContext.Provider value={{ iconLibrary }}>
      {children}
    </IconLibraryContext.Provider>
  );
}
