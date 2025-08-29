import React, { createContext, useContext, useState } from 'react';

const SideNavContext = createContext();

export const useSideNav = () => {
  const context = useContext(SideNavContext);
  if (!context) {
    throw new Error('useSideNav must be used within a SideNavProvider');
  }
  return context;
};

export const SideNavProvider = ({ children }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleMobileSideNav = () => {
    setIsMobileOpen(prev => !prev);
  };

  const closeMobileSideNav = () => {
    setIsMobileOpen(false);
  };

  return (
    <SideNavContext.Provider value={{
      isMobileOpen,
      toggleMobileSideNav,
      closeMobileSideNav
    }}>
      {children}
    </SideNavContext.Provider>
  );
};
