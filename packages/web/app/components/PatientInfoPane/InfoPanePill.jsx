import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { FormFieldTag, ThemedTooltip } from '@tamanu/ui-components';
import { Colors } from '../../constants';

export const InfoPanePill = styled(FormFieldTag)`
  box-sizing: border-box;
  flex-shrink: 0;
  height: 28px;
  max-width: 100%;
  padding: 5px 12px;
  border-radius: 999px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const OutlinedPill = styled(InfoPanePill)`
  padding: 4px 11px;
  border: 1px solid ${Colors.softText};
`;

export const ResolvedPill = props => (
  <OutlinedPill $background={Colors.white} $color={Colors.darkestText} {...props} />
);

export const GreyPill = props => (
  <InfoPanePill $background={Colors.softOutline} $color={Colors.darkestText} {...props} />
);

export const TruncatedPill = ({ children, ...props }) => {
  const pillRef = useRef(null);
  const [isTooltipOpen, setTooltipOpen] = useState(false);

  const openIfTruncated = () => {
    const { scrollWidth, clientWidth } = pillRef.current;
    setTooltipOpen(scrollWidth > clientWidth);
  };

  return (
    <ThemedTooltip
      title={children}
      open={isTooltipOpen}
      onOpen={openIfTruncated}
      onClose={() => setTooltipOpen(false)}
    >
      <InfoPanePill ref={pillRef} {...props}>
        {children}
      </InfoPanePill>
    </ThemedTooltip>
  );
};
