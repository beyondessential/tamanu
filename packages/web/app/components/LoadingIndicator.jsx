import React from 'react';
import styled from 'styled-components';
import CircularProgress from '@material-ui/core/CircularProgress';

const LoadingIconContainer = styled.div`
  backdrop-filter: saturate(50%);
  background-color: oklch(from light-dark(white, black) l c h / 42.5%);
  display: grid;
  /* Typographers’ trick for optically vertical centring: smidge more space below than above */
  grid-template-areas: '.' '--progress' '.';
  grid-template-rows: 3fr auto 4fr;
  height: 100dvh;
  overflow: hidden;
  place-items: center;
  transition: ${({ theme: { transitions } }) =>
    transitions.create(['backdrop-filter', 'background-color'], {
      easing: transitions.easing.easeOut,
      duration: transitions.duration.shortest,
    })};
  width: 100%;
  z-index: 1200; // high but below a modal's z-index of 1300
`;

/**
 * @param {Pick<React.CSSProperties, 'backgroundColor' | 'height' | 'width' > &
 *   Pick<import('@material-ui/core').CircularProgressProps, 'size'> &
 *   React.ComponentPropsWithRef<typeof LoadingIconContainer>
 * }
 */
export const LoadingIndicator = ({
  backgroundColor,
  height,
  size = '5rem',
  style,
  width,
  ...props
}) => (
  <LoadingIconContainer
    {...props}
    data-testid="loadingiconcontainer-v3bb"
    style={{ backgroundColor, height, width, ...style }}
  >
    <CircularProgress
      size={size}
      data-testid="circularprogress-gchq"
      style={{ gridArea: '--progress' }}
    />
  </LoadingIconContainer>
);
