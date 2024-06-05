import React, { createContext, useCallback, useContext, useState } from 'react';
import { INVOICE_ACTIVE_VIEW } from '../constants';

const InvoiceModalContext = createContext({
  activeModal: null,
  activeView: null,
  handleActiveModal: () => {},
  handleActiveView: () => {},
});

export const useInvoiceModal = () => {
  const { activeModal, activeView, handleActiveModal, handleActiveView } = useContext(InvoiceModalContext);
  return { activeModal, activeView, handleActiveModal, handleActiveView };
};

export const InvoiceModalProvider = ({ children }) => {
  const [activeModal, setActiveModal] = useState('');
  const [activeView, setActiveView] = useState(INVOICE_ACTIVE_VIEW.DISCOUNT_TYPE);

  const handleActiveModal = modal => {
    console.log('modal',modal);
    setActiveModal(modal);
  };

  const handleActiveView = (nextActiveView) => {
    setActiveView(nextActiveView);
  };
  
  return (
    <InvoiceModalContext.Provider
      value={{
        activeModal,
        activeView,
        handleActiveModal,
        handleActiveView
      }}
    >
      {children}
    </InvoiceModalContext.Provider>
  );
};
