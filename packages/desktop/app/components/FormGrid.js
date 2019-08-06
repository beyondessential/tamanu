import styled from 'styled-components';

const equalSplitColumns = ({ columns = 2 }) =>
  new Array(columns)
    .fill(0)
    .map(() => '1fr')
    .join(' ');

export const FormGrid = styled.div`
  display: grid;

  grid-column-gap: 0.7rem;
  grid-row-gap: 1.2rem;

  grid-template-columns: ${equalSplitColumns};
`;
