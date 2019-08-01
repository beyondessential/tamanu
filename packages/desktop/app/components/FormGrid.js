import styled from 'styled-components';

const equalSplitColumns = ({ columns = 2 }) => (new Array(columns))
  .fill(0)
  .map(x => '1fr')
  .join(' ');

export const FormGrid = styled.div`
  display: grid;

  margin: 0rem 3rem;
  grid-column-gap: 0.7rem;
  grid-row-gap: 1.5rem;

  grid-template-columns: ${equalSplitColumns};
`;
