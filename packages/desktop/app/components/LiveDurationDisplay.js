import React from 'react';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

export const LiveDurationDisplay = React.memo(({ startTime }) => {
  const [_, updateState] = React.useState({});

  // recalculate every 30 seconds
  React.useEffect(() => {
    const interval = setInterval(() => updateState({}), MINUTE * 0.5);

    return () => clearInterval(interval);
  }, []);

  const time = new Date() - new Date(startTime);
  const hours = Math.floor(time / HOUR);
  const minutes = Math.floor((time - (hours * HOUR)) / MINUTE);
  if(hours === 0) {
    return <span>{`${minutes}m`}</span>;
  }
  return <span>{`${hours}h : ${minutes}m`}</span>;
});
