import styled from 'styled-components';

import { FormGrid, TAMANU_COLORS } from '@tamanu/ui-components';

export const PatientDetailsHeading = styled.div`
  font-weight: 500;
  font-size: 16px;
  color: ${TAMANU_COLORS.darkText};
  margin-bottom: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const SecondaryDetailsGroup = styled.div`
  margin-top: 20px;
`;

export const SecondaryDetailsFormGrid = styled(FormGrid)`
  margin-bottom: 70px;
`;
