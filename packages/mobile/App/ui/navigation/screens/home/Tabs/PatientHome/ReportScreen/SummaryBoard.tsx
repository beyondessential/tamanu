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
    {todayData && (
      <>
        <FullView justifyContent="center" alignItems="center">
          <StyledText
            fontSize={screenPercentageToDP(3.4, Orientation.Height)}
            fontWeight="bold"
          >
            {todayData.totalEncounters}
          </StyledText>
          <StyledText
            color={theme.colors.TEXT_MID}
            fontSize={screenPercentageToDP(1.7, Orientation.Height)}
          >
            People attended today
          </StyledText>
          {/* <StyledText
            marginTop={screenPercentageToDP(0.6, Orientation.Height)}
            fontSize={screenPercentageToDP(1.33, Orientation.Height)}
            color={theme.colors.SAFE}
          >
            +10% on last 4 weeks
          </StyledText> */}
        </FullView>
        <FullView justifyContent="center" alignItems="center">
          <StyledText
            fontSize={screenPercentageToDP(3.4, Orientation.Height)}
            fontWeight="bold"
          >
            {todayData.totalSurveys}
          </StyledText>
          <StyledText
            fontSize={screenPercentageToDP(1.7, Orientation.Height)}
          >
            Screenings completed today
          </StyledText>
          {/* <StyledText
            marginTop={screenPercentageToDP(0.6, Orientation.Height)}
            fontSize={screenPercentageToDP(1.33, Orientation.Height)}
            color={theme.colors.ALERT}
          >
            +5% on last 4 weeks
          </StyledText> */}
        </FullView>
      </>
    )}
  </RowView>
);
