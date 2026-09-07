import styled from 'styled-components';

/**
 * More elegant solution would be to use subgrid, or make the `<ConfirmRow>` span the full width and
 * give _it_ 32px padding. Preserving this for legacy components.
 */
export const ConfirmRowDivider = styled.hr`
  inline-size: calc(100% + 64px);
  margin-block: 30px;
  margin-inline: -32px;
`;
