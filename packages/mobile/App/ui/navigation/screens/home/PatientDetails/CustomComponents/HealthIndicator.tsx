import React, { ReactElement } from 'react';
import { RowView, StyledView, StyledText, CenterView } from '/styled/common';
import { theme } from '/styled/theme';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { LocalisedText } from '~/ui/components/LocalisedText';

export const HealthIdentificationRow = ({
  patientId,
}: {
  patientId: string;
}): ReactElement => (
  <RowView height={45}>
    <StyledView
      justifyContent="center"
      flex={3}
      background={theme.colors.MAIN_SUPER_DARK}
    >
      <StyledText
        marginLeft={20}
        fontSize={screenPercentageToDP(1.45, Orientation.Height)}
        fontWeight="bold"
        color={theme.colors.SECONDARY_MAIN}
      >
        <LocalisedText path="fields.displayId.longLabel" />
      </StyledText>
    </StyledView>
    <CenterView
      background={theme.colors.SECONDARY_MAIN}
      justifyContent="center"
      flex={1}
    >
      <StyledText fontWeight="bold" color={theme.colors.MAIN_SUPER_DARK}>
        {patientId}
      </StyledText>
    </CenterView>
  </RowView>
);
