import styled from 'styled-components/native';
import { theme } from '../../styled/theme';

export const StyledCardContainer = styled.View`
  background: ${theme.colors.WHITE};
  height: 175px;
  width: 130px;
  border-radius: 3px;
  padding: 20px 10px 10px 15px;
`;

export const StyledDate = styled.Text`
  font-size: 9px;
  font-weight: 500;
  color: ${theme.colors.TEXT_MID};
`;

export const StyledPatientInitials = styled.Text`
  font-size: 14px;
  font-weight: 900;
  color: ${theme.colors.WHITE};
  width: 100%;
  text-align: center;
`;

export const StyledPatientName = styled.Text`
  font-size: 15px;
  font-weight: 500;
  color: ${theme.colors.TEXT_DARK};
`;

export const StyledPatientData = styled.Text`
  font-size: 12px;
  font-weight: 500;
  color: ${theme.colors.TEXT_MID};
`;
