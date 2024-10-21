import React, { ReactElement } from 'react';
import { CenterView, RowView, StyledText, StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';

export const HealthIdentificationRow = ({ patientId }: { patientId: string }): ReactElement => (
  <RowView height={50}>
    <StyledView justifyContent="center" flex={2} background={theme.colors.MAIN_SUPER_DARK}>
      <StyledText
        marginLeft={20}
        fontSize={screenPercentageToDP(2, Orientation.Height)}
        fontWeight={500}
        color={theme.colors.WHITE}
      >
        <TranslatedText
          stringId="general.localisedField.displayId.label"
          fallback="National Health Number"
        />
      </StyledText>
    </StyledView>
    <CenterView background={theme.colors.SECONDARY_MAIN} justifyContent="center" flex={1}>
      <StyledText fontWeight={500} color={theme.colors.MAIN_SUPER_DARK}>
        {patientId}
      </StyledText>
    </CenterView>
  </RowView>
);
