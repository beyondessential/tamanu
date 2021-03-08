import styled from 'styled-components/native';

export const Table = styled.View`
  display: flex;
`;

export const Row = styled.View`
  max-width: 100%;
  display: flex;
  flex-flow: row;
  flex-wrap: wrap;
  border: 1px solid lightgray;
`;

export const ColumnCategory = styled.View`
  display: flex;
  width: 25%;
  flex-flow: row;
`;
export const Cell = styled.View`
  display: flex;
  width: 25%;
  flex-grow: 1;
  flex-flow: column;
  border: 1px solid lightgray;
`;
