import styled from 'styled-components';

export const FormGrid = styled.div`
  display: grid;

  grid-column-gap: 0.7rem;
  grid-row-gap: 1.2rem;

  grid-template-columns: repeat(${({ columns = 2 }) => columns}, 1fr);
`;
