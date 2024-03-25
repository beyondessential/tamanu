import React, { ReactElement } from 'react';
import { RowView, StyledView } from '/styled/common';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { PatientMenuButton } from '/components/PatientMenuButton';
import { MenuOptionButtonProps } from '~/types/MenuOptionButtonProps';

interface VisitTypeButtonsProps {
  list: MenuOptionButtonProps[];
}

export const VisitTypeButtonList = ({ list }: VisitTypeButtonsProps): ReactElement => (
  <StyledView
    width="100%"
    marginTop={screenPercentageToDP(3, Orientation.Height)}
    marginBottom={screenPercentageToDP(3, Orientation.Height)}
  >
    <RowView
      width="100%"
      paddingLeft={screenPercentageToDP(3.64, Orientation.Width)}
      paddingRight={screenPercentageToDP(3.64, Orientation.Width)}
      justifyContent="space-between"
    >
      {list.slice(0, list.length / 2).map(buttonProps => (
        <PatientMenuButton key={buttonProps.title} {...buttonProps} />
      ))}
    </RowView>
    <RowView
      width="100%"
      marginTop={screenPercentageToDP(2.64, Orientation.Width)}
      paddingLeft={screenPercentageToDP(3.64, Orientation.Width)}
      paddingRight={screenPercentageToDP(3.64, Orientation.Width)}
      justifyContent="space-between"
    >
      {list.slice(list.length / 2, list.length).map(buttonProps => (
        <PatientMenuButton key={buttonProps.title} {...buttonProps} />
      ))}
    </RowView>
  </StyledView>
);
