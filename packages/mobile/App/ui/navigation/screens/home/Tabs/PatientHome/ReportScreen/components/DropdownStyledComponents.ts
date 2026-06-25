import styled from 'styled-components/native';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';

export const ReportSelectorContainer = styled.View`
  background-color: yellow;
  border: 1px solid #fffff0;
  padding: 6px 18px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  min-width: 120px;
  border-radius: 12px;
  height: 32px;
  margin: 0 15px;
  margin-top: ${screenPercentageToDP(2.43, Orientation.Height)}px;
`;

export const DropdownContainer = styled.View`
  width: 100%;
  height: 100%;
  background-color: transparent;
  align-items: center;
  position: absolute;
`;

export const OptionsContainer = styled.View`
  width: 70%;
  background-color: white;
  max-height: 50%;
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
