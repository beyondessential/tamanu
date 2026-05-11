import styled from 'styled-components';

const GAP_BETWEEN_FORM_ITEMS = '1.2rem';

export const FormGrid = styled.div.withConfig({
  shouldForwardProp: prop => prop !== 'nested' && prop !== 'columns',
})`
  display: grid;

  ${p => !p.nested && 'margin-top: 0.3rem;'}
  grid-column-gap: 0.7rem;
  grid-row-gap: ${GAP_BETWEEN_FORM_ITEMS};
  grid-template-columns: repeat(${({ columns = 2 }) => columns}, 1fr);
  align-items: start;
`;

export const FormGridThatFits = styled.fieldset`
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(
    auto-fit,
    minmax(${({ $minColWidth = '16rem' }) => $minColWidth}, 1fr)
  );
`;

export const SmallGridSpacer = styled.div.attrs({ 'aria-hidden': true })`
  margin-bottom: ${GAP_BETWEEN_FORM_ITEMS};
`;
