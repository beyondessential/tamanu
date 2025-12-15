import React, { ReactElement } from 'react';
import { RowView, StyledView } from '/styled/common';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { PatientMenuButton } from '/components/PatientMenuButton';
import { MenuOptionButtonProps } from '~/types/MenuOptionButtonProps';
import styled from 'styled-components';

interface VisitTypeButtonsProps {
  list: MenuOptionButtonProps[];
}

const StyledRowView = styled(RowView)`
  width: 100%;
  flex-wrap: wrap;
`;

const MenuButtonContainer = styled(StyledView)`
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
          {list.map(buttonProps => {
            const { key, ...props } = buttonProps;
            return (
              <MenuButtonContainer key={key}>
                <PatientMenuButton key={key} {...props} />
              </MenuButtonContainer>
            );
          })}
        </StyledRowView>
      }
    </StyledView>
  );
};
