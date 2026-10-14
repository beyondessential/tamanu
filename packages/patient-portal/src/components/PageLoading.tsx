import React from 'react';
import styled, { keyframes } from 'styled-components';
import { CircularProgress } from '@mui/material';

const appear = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

/**
 * Shown while a page loads. It stays invisible for a moment, so a page that loads quickly opens
 * without a spinner flashing up first, then appears centred in the space below the header.
 */
const Frame = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50dvh;
  opacity: 0;
  animation: ${appear} 200ms ease-out 400ms forwards;
`;

export const PageLoading = () => (
  <Frame role="status">
    <CircularProgress size={28} aria-label="Loading" />
  </Frame>
);
