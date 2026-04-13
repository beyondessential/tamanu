import { TAMANU_COLORS } from '@tamanu/ui-components';
import styled from 'styled-components';
import { ContentContainer } from '../../components/AdminViewContainer';

export const Article = styled.article`
  border-block-start: 1px solid ${TAMANU_COLORS.outline};
  overflow: auto;
  padding-block: 26px;
  padding-inline: 30px;
  ${ContentContainer}:has(&) {
    background-color: #f7f9fb;
  }
`;

export function ManageProgramsAdminView() {
  return <Article>ManageProgramsAdminView</Article>;
}
