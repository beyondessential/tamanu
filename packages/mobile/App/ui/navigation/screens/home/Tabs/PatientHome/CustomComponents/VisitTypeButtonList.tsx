import React, { ReactElement } from 'react';
import { StyledView } from '/styled/common';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { PatientMenuButton } from '/components/PatientMenuButton';
import { MenuOptionButtonProps } from '~/types/MenuOptionButtonProps';
import styled from 'styled-components/native';

interface VisitTypeButtonsProps {
  list: MenuOptionButtonProps[];
}

const StyledRowView = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  width: 100%;
`;

const MenuButtonContainer = styled.View`
  width: 33%;
  justify-content: center;
  align-items: center;
  margin-bottom: ${screenPercentageToDP(2.64, Orientation.Width)}px;
`;

export const VisitTypeButtonList = ({ list }: VisitTypeButtonsProps): ReactElement => {
  return (
    <StyledView
      width="100%"
      marginTop={screenPercentageToDP(3, Orientation.Height)}
      marginBottom={screenPercentageToDP(3, Orientation.Height)}
    >
      {
        <StyledRowView>
          {list.map(({ key, ...buttonProps }) => (
            <MenuButtonContainer key={key}>
              <PatientMenuButton {...buttonProps} />
            </MenuButtonContainer>
          ))}
        </StyledRowView>
      }
    </StyledView>
  );
};
