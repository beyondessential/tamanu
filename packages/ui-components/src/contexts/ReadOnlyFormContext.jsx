import React, { createContext, useContext } from 'react';

const ReadOnlyFormContext = createContext(false);

export const useIsReadOnlyForm = () => useContext(ReadOnlyFormContext);

/**
 * Renders every `Field` beneath it disabled, so a form can be shown without threading `disabled`
 * through each layout it is built from. A field that sets its own `disabled` keeps it either way.
 */
export const ReadOnlyFormProvider = ({ readOnly = true, children }) => (
  <ReadOnlyFormContext.Provider value={readOnly}>{children}</ReadOnlyFormContext.Provider>
);
