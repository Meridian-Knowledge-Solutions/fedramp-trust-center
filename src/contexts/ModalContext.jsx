import React, { createContext, useContext, useState } from 'react';

const ModalContext = createContext(null);

export const ModalProvider = ({ children }) => {
  const [modals, setModals] = useState({
    cli: { isOpen: false, data: null },
    why: { isOpen: false, data: null },
    poam: { isOpen: false, data: null },
    enhancement: { isOpen: false, data: null },
    registration: { isOpen: false, data: null },
    accessRequired: { isOpen: false, data: null },
    markdown: { isOpen: false, data: null },
  });

  const openModal = (modalName, data = null) => {
    setModals(prev => ({
      ...prev,
      [modalName]: { isOpen: true, data }
    }));
    document.body.style.overflow = 'hidden';
  };

  const closeModal = (modalName) => {
    setModals(prev => ({
      ...prev,
      [modalName]: { isOpen: false, data: null }
    }));
    document.body.style.overflow = 'unset';
  };

  const closeAllModals = () => {
    setModals({
      cli: { isOpen: false, data: null },
      why: { isOpen: false, data: null },
      poam: { isOpen: false, data: null },
      enhancement: { isOpen: false, data: null },
      registration: { isOpen: false, data: null },
      accessRequired: { isOpen: false, data: null },
      markdown: { isOpen: false, data: null },
    });
    document.body.style.overflow = 'unset';
  };

  return (
    <ModalContext.Provider value={{ modals, openModal, closeModal, closeAllModals }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};