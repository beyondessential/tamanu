import React, { createContext, useContext } from 'react';

const ReadOnlyFormContext = createContext(false);

export const useIsReadOnlyForm = () => useContext(ReadOnlyFormContext);

/**
 * Renders every `Field` beneath it disabled, so a form can be shown read-only without threading
 * `disabled` through each layout it is built from. A field that sets its own `disabled` keeps it
 * either way.
 *
 * `readOnly` is off by default, so wrapping a form in this does nothing until a caller asks for it:
 * the other way round, a provider added without one would quietly freeze a working form.
 */
export const ReadOnlyFormProvider = ({ readOnly = false, children }) => (
  <ReadOnlyFormContext.Provider value={readOnly}>{children}</ReadOnlyFormContext.Provider>
);
