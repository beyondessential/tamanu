import { useQuery } from '@tanstack/react-query';
import { addHours, format, startOfToday, subDays } from 'date-fns';
import React, { type FC, type ReactElement, useState } from 'react';
import { Database } from '~/infra/db';
import { SurveyTypes } from '~/types';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { reportKeys, surveyKeys } from '~/ui/hooks/queries/queryKeys';
import type { BarChartData } from '~/ui/interfaces/BarChartProps';
import { RecentPatientSurveyReport } from './RecentPatientSurveyReport';
import { SummaryBoard } from './SummaryBoard';
import { Dropdown } from './components/Dropdown';
import { Button } from '/components/Button';
import { VisitChart } from '/components/Chart/VisitChart';
import { TamanuComboMark } from '/components/Icons';
import { Orientation, screenPercentageToDP, useStatusBarStyle } from '/helpers/screen';
import { FullView, RowView, StyledSafeAreaView, StyledText, StyledView } from '/styled/common';
import { theme } from '/styled/theme';

interface IReportTypeButtons {
  isReportWeekly: boolean;
  onPress: () => void;
}

const ReportTypeButtons = ({ isReportWeekly, onPress }: IReportTypeButtons): ReactElement => (
  <RowView position="absolute" justifyContent="center" top="20.5%" width="100%" zIndex={2}>
    <RowView
      height={screenPercentageToDP(4.25, Orientation.Height)}
      borderRadius={5}
      width={screenPercentageToDP(90.02, Orientation.Width)}
      background={theme.colors.BOX_OUTLINE}
      justifyContent="center"
      alignItems="center"
    >
      <Button
        fontSize={screenPercentageToDP(1.57, Orientation.Height)}
        height={screenPercentageToDP(3.76, Orientation.Height)}
        width={screenPercentageToDP(44.52, Orientation.Width)}
        backgroundColor={isReportWeekly ? theme.colors.WHITE : theme.colors.BOX_OUTLINE}
        textColor={isReportWeekly ? theme.colors.PRIMARY_MAIN : theme.colors.TEXT_MID}
        buttonText={<TranslatedText stringId="report.heading.summary" fallback="Summary" />}
        bordered={false}
        onPress={onPress}
      />
      <Button
        fontSize={screenPercentageToDP(1.57, Orientation.Height)}
        height={screenPercentageToDP(3.76, Orientation.Height)}
        width={screenPercentageToDP(44.52, Orientation.Width)}
        buttonText={<TranslatedText stringId="report.heading.dataTable" fallback="Data Table" />}
        backgroundColor={!isReportWeekly ? theme.colors.WHITE : theme.colors.BOX_OUTLINE}
        textColor={!isReportWeekly ? theme.colors.PRIMARY_MAIN : theme.colors.TEXT_MID}
        onPress={onPress}
      />
    </RowView>
  </RowView>
);

interface ReportChartProps {
  isReportWeekly: boolean;
  visitData?: {
    totalVisits: number;
    data: BarChartData[];
  };
  todayData: {
    totalEncounters: number;
    totalSurveys: number;
    encounterDate: string;
  };
  selectedSurveyId: string;
}

const ReportChart: FC<ReportChartProps> = ({
  isReportWeekly,
  visitData,
  todayData,
  selectedSurveyId,
}) =>
  isReportWeekly ? (
    <>
      <StyledView marginBottom={screenPercentageToDP(7.53, Orientation.Height)}>
        <VisitChart visitData={visitData} />
      </StyledView>
      <StyledView flex={1}>
        <SummaryBoard todayData={todayData} />
      </StyledView>
    </>
  ) : (
    <StyledView marginBottom={screenPercentageToDP(2.43, Orientation.Height)}>
      <RecentPatientSurveyReport selectedSurveyId={selectedSurveyId} />
    </StyledView>
  );

export const ReportScreen = (): ReactElement => {
  const [userSelectedSurveyId, setUserSelectedSurveyId] = useState<string>();
  const [isReportWeekly, setReportType] = useState<boolean>(true);

  const { data: surveys } = useQuery({
    queryKey: surveyKeys.list({ surveyType: SurveyTypes.Programs }),
    queryFn: () =>
      Database.models.Survey.find({
        where: { surveyType: SurveyTypes.Programs },
      }),
  });

  // Default to the first survey until the user picks one
  const selectedSurveyId = userSelectedSurveyId ?? surveys?.[0]?.id;

  const { data } = useQuery({
    queryKey: reportKeys.encounterSummary(selectedSurveyId),
    queryFn: () => Database.models.Encounter.getTotalEncountersAndResponses(selectedSurveyId),
    enabled: selectedSurveyId !== undefined,
  });

  const reportList = surveys?.map(s => ({ label: s.name, value: s.id }));

  const today = addHours(startOfToday(), 3);
  const todayString = format(today, 'yyyy-MM-dd');
  const todayData = data?.find(item => item.encounterDate === todayString);

  const visitData = new Array(28).fill('').reduce(
    (accum, _, index) => {
      const currentDate = format(subDays(today, 28 - index - 1), 'yyyy-MM-dd');
      const receivedValueForDay =
        data?.find(item => item.encounterDate === currentDate)?.totalEncounters || 0;

      return {
        totalVisits: accum.totalVisits + receivedValueForDay,
        data: [
          ...accum.data,
          {
            date: currentDate,
            value: receivedValueForDay,
          },
        ],
      };
    },
    {
      totalVisits: 0,
      data: [],
    },
  );

  useStatusBarStyle('light-content', theme.colors.PRIMARY_MAIN);

  return (
    <FullView>
      <StyledSafeAreaView
        height={screenPercentageToDP(20.65, Orientation.Height)}
        background={theme.colors.PRIMARY_MAIN}
        paddingLeft={screenPercentageToDP(4.86, Orientation.Width)}
        paddingRight={screenPercentageToDP(4.86, Orientation.Width)}
      >
        <RowView
          marginTop={15}
          height={screenPercentageToDP(4.25, Orientation.Height)}
          alignItems="center"
          justifyContent="space-between"
        >
          <TamanuComboMark height={23} width={95} />
        </RowView>
        <StyledView flexDirection="row" justifyContent="flex-start" alignItems="center" flex={1}>
          <StyledText
            marginTop={screenPercentageToDP(2.43, Orientation.Height)}
            fontWeight="bold"
            color={theme.colors.WHITE}
            fontSize={screenPercentageToDP(3.4, Orientation.Height)}
          >
            <TranslatedText stringId="report.title" fallback="Reports" />
          </StyledText>
          {reportList && (
            <Dropdown
              options={reportList}
              handleSelect={(value): void => {
                setUserSelectedSurveyId(value);
              }}
              selectedItem={selectedSurveyId}
            />
          )}
        </StyledView>
      </StyledSafeAreaView>
      <ReportTypeButtons
        onPress={() => setReportType(prev => !prev)}
        isReportWeekly={isReportWeekly}
      />
      {selectedSurveyId !== undefined ? (
        <ReportChart
          isReportWeekly={isReportWeekly}
          visitData={visitData}
          todayData={todayData}
          selectedSurveyId={selectedSurveyId}
        />
      ) : null}
    </FullView>
  );
};
