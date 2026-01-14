import React, { createContext, useContext, useMemo, useState } from 'react';

interface TourContextType {
  isTourOpen: boolean;
  startTour: () => void;
  stopTour: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isTourOpen, setIsTourOpen] = useState(false);

  const value = useMemo(() => {
    return {
      isTourOpen,
      startTour: () => setIsTourOpen(true),
      stopTour: () => setIsTourOpen(false),
    };
  }, [isTourOpen]);

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
};

export const useTour = (): TourContextType => {
  const ctx = useContext(TourContext);
  if (!ctx) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return ctx;
};
