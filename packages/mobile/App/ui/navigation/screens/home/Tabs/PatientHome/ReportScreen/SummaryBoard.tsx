import React, { FC } from 'react';
import { screenPercentageToDP, Orientation } from '~/ui/helpers/screen';
import { RowView, FullView, StyledText } from '~/ui/styled/common';
import { theme } from '/styled/theme';

export type SummaryInfo = {
  encounterDate: string;
  totalEncounters: number;
  totalSurveys: number;
};

type Props = {
  todayData: SummaryInfo;
};
export const SummaryBoard: FC<Props> = ({ todayData }) => (
  <RowView
    width={screenPercentageToDP(90.02, Orientation.Width)}
    background={theme.colors.WHITE}
    height={screenPercentageToDP(13.36, Orientation.Height)}
    alignSelf="center"
  >
    <FullView justifyContent="center" alignItems="center">
      <StyledText
        fontSize={screenPercentageToDP(3.4, Orientation.Height)}
        fontWeight="bold"
      >
        {todayData?.totalEncounters || '0'}
      </StyledText>
      <StyledText
        color={theme.colors.TEXT_MID}
        fontSize={screenPercentageToDP(1.7, Orientation.Height)}
      >
        People attended today
      </StyledText>
    </FullView>
    <FullView justifyContent="center" alignItems="center">
      <StyledText
        fontSize={screenPercentageToDP(3.4, Orientation.Height)}
        fontWeight="bold"
      >
        {todayData?.totalSurveys || 0}
      </StyledText>
      <StyledText
        fontSize={screenPercentageToDP(1.7, Orientation.Height)}
      >
        Screenings completed today
      </StyledText>
    </FullView>
  </RowView>
);
