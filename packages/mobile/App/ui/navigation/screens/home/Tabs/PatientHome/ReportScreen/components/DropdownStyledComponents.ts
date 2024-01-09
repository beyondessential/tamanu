import styled from 'styled-components/native';
import { screenPercentageToDP, Orientation } from '~/ui/helpers/screen';

export const ReportSelectorContainer = styled.View`
  background-color: yellow;
  border: 1px solid #fffff0;
  padding: 6px 18px;
  display: flex;
  flex-flow: row;
  align-items: center;
  justify-content: space-between;
  min-width: 120px;
  border-radius: 12px;
  height: 32px;
  margin: 0 15px;
  margin-top: ${screenPercentageToDP(2.43, Orientation.Height)};
`;

export const DropdownContainer = styled.View`
  width: 100%;
  height: 100%;
  background-color: transparent;
  display: flex;
  align-items: center;
  position: absolute;
`;

export const OptionsContainer = styled.View`
  width: 70%;
  background-color: white;
  max-height: 50%;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  elevation: 2;
`;

export const OptionItem = styled.View`
  height: 44px;
  padding: 0 16px;
  display: flex;
  justify-content: center;
`;

export const OptionItemText = styled.Text`
  line-height: 22px;
  font-size: 12px;
  margin-right: 6px;
`;

export const PlaceholderContainer = styled.View`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;
