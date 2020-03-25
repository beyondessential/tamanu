import React, { ReactElement } from 'react';
import { StyledView, RowView } from '/styled/common';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { PatientMenuButton } from '/components/PatientMenuButton';


interface VisitTypeButtonsProps {
    list: any[]
}

export const VisitTypeButtonList = ({ list }:VisitTypeButtonsProps): ReactElement => (
  <StyledView
    width="100%"
    marginTop={20}
  >
    <RowView
      width="100%"
      paddingLeft={screenPercentageToDP(3.64, Orientation.Width)}
      paddingRight={screenPercentageToDP(3.64, Orientation.Width)}
      justifyContent="space-between"
    >
      {
        list.slice(0, list.length / 2).map(buttonProps => (
          <PatientMenuButton
            {...buttonProps}
          />
        ))
      }
    </RowView>
    <RowView
      width="100%"
      marginTop={screenPercentageToDP(2.64, Orientation.Width)}
      paddingLeft={screenPercentageToDP(3.64, Orientation.Width)}
      paddingRight={screenPercentageToDP(3.64, Orientation.Width)}
      justifyContent="space-between"
    >
      {
        list.slice(list.length / 2, list.length).map(buttonProps => (
          <PatientMenuButton
            {...buttonProps}
          />
        ))
      }
    </RowView>
  </StyledView>
);
