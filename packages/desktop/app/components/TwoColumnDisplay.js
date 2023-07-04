import styled from 'styled-components';

export const TwoColumnDisplay = styled.div`
  display: grid;
  grid-template-columns: ${p => p.width || '20rem'} auto;
  height: 100%;
`;
