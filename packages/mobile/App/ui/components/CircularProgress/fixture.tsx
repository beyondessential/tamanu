import React, { useState, useEffect } from 'react';
import { CircularProgress } from './index';

export const BaseStory = (): Element => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (progress >= 100) setProgress(0);
  }, [progress]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + 5, 100));
    }, 600);
    return (): void => clearInterval(interval);
  }, []);

  return <CircularProgress progress={progress} />;
};
