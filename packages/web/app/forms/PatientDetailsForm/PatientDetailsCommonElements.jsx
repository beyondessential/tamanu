import styled from 'styled-components';
import { Colors } from '../../constants';
import { FormGrid } from '../../components';

export const PatientDetailsHeading = styled.div`
  font-weight: 500;
  font-size: 16px;
  color: ${Colors.darkText};
  margin-bottom: 30px;
`;

export const SecondaryDetailsGroup = styled.div`
  margin-top: 20px;
`;

export const SecondaryDetailsFormGrid = styled(FormGrid)`
  margin-bottom: 70px;
`;
