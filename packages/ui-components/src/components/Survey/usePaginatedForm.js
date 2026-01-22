import { useState } from 'react';

export const usePaginatedForm = () => {
    const [screenIndex, setScreenIndex] = useState(0);
  
    const onStepBack = () => {
      setScreenIndex(screenIndex - 1);
    };
  
    const onStepForward = () => {
      setScreenIndex(screenIndex + 1);
    };
  
    const handleStep = (step) => () => {
      setScreenIndex(step);
    };
  
    return {
      onStepBack,
      onStepForward,
      handleStep,
      screenIndex,
      setScreenIndex,
    };
  };