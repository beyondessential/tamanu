import React from 'react';
import {
  TooltipContent as DefaultTooltipContent,
  InwardArrowVectorTooltipContent,
} from './TooltipContent';

export const CustomTooltip = ({ payload, useInwardArrowVector }) => {
  if (payload && payload.length) {
    const { value, name, dotColor, description, config } = payload[0].payload;
    const TooltipContent = useInwardArrowVector
      ? InwardArrowVectorTooltipContent
      : DefaultTooltipContent;

    return (
      <TooltipContent
        label={name}
        value={value}
        dotColor={dotColor}
        description={description}
        config={config}
      />
    );
  }

  return null;
};
