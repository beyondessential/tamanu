import React, { useState, useEffect } from 'react';
import { CircularProgress } from './index';

export const BaseStory = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (progress >= 100) setProgress(0);
  }, [progress]);

  useEffect(() => {
    setInterval(() => {
      setProgress(p => p + 5);
    }, 600);
  }, []);

  return <CircularProgress progress={progress} />;
};
