import React, { createContext, useContext, useState } from 'react';

const FormSubmissionContext = createContext({
  hasFormSubmission: false,
  setHasFormSubmission: () => {},
  isClosable: true,
  setIsClosable: () => {},
});

export const useFormSubmission = () => {
  const { isClosable, setIsClosable, hasFormSubmission, setHasFormSubmission } =
    useContext(FormSubmissionContext);
  return { isClosable, setIsClosable, hasFormSubmission, setHasFormSubmission };
};

export const FormSubmissionProvider = ({ children }) => {
  const [isClosable, setIsClosable] = useState(true);
  const [hasFormSubmission, setHasFormSubmission] = useState(false);

  return (
    <FormSubmissionContext.Provider
      value={{
        isClosable,
        setIsClosable,
        hasFormSubmission,
        setHasFormSubmission,
      }}
    >
      {children}
    </FormSubmissionContext.Provider>
  );
};
