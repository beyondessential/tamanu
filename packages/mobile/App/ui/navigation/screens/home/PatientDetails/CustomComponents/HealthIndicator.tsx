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
  <RowView height={50}>
    <StyledView
      justifyContent="center"
      flex={2}
      background={theme.colors.MAIN_SUPER_DARK}
    >
      <StyledText
        marginLeft={20}
        fontSize={screenPercentageToDP(2, Orientation.Height)}
        fontWeight={500}
        color={theme.colors.WHITE}
      >
        <LocalisedText path="fields.displayId.longLabel" />
      </StyledText>
    </StyledView>
    <CenterView
      background={theme.colors.SECONDARY_MAIN}
      justifyContent="center"
      flex={1}
    >
      <StyledText fontWeight={500} color={theme.colors.MAIN_SUPER_DARK}>
        {patientId}
      </StyledText>
    </CenterView>
  </RowView>
);
