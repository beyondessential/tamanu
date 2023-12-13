import React from 'react';
import {
  InwardArrowVectorTooltipContent,
  TooltipContent as DefaultTooltipContent,
} from './TooltipContent';

export const CustomTooltip = ({ payload, useInwardArrowVector }) => {
  if (payload && payload.length) {
    const { payload: measureConfigs } = payload[0];
    const TooltipContent = useInwardArrowVector
      ? InwardArrowVectorTooltipContent
      : DefaultTooltipContent;

    return <TooltipContent {...measureConfigs} />;
  }

  return null;
};
