import { useQuery } from '@tanstack/react-query';
import { addHours, format, startOfToday, subDays } from 'date-fns';
import React, { type FC, type ReactElement, useState } from 'react';
import { Database } from '~/infra/db';
import type { Survey } from '~/models/Survey';
import { SurveyTypes } from '~/types';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { reportKeys, surveyKeys } from '~/ui/hooks/queries/queryKeys';
import type { BarChartData } from '~/ui/interfaces/BarChartProps';
import { RecentPatientSurveyReport } from './RecentPatientSurveyReport';
import { SummaryBoard, type SummaryInfo } from './SummaryBoard';
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

function buildReportOptions(surveys: Survey[]) {
  return surveys.map(survey => ({ label: survey.name, value: survey.id }));
}

function buildVisitReport(rows: SummaryInfo[]) {
  const today = addHours(startOfToday(), 3);
  const rowsByDate = new Map(rows.map(row => [row.encounterDate, row]));

  const data: BarChartData[] = Array.from({ length: 28 }, (_, index) => {
    const date = format(subDays(today, 28 - index - 1), 'yyyy-MM-dd');
    return { date, value: rowsByDate.get(date)?.totalEncounters ?? 0 };
  });

  return {
    visitData: {
      totalVisits: data.reduce((sum, day) => sum + day.value, 0),
      data,
    },
    todayData: rowsByDate.get(format(today, 'yyyy-MM-dd')),
  };
}

interface ReportChartProps {
  isReportWeekly: boolean;
  visitData?: {
    totalVisits: number;
    data: BarChartData[];
  };
  todayData?: SummaryInfo;
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

  const { data: reportOptions } = useQuery({
    queryKey: surveyKeys.list({ surveyType: SurveyTypes.Programs }),
    queryFn: () =>
      Database.models.Survey.find({
        where: { surveyType: SurveyTypes.Programs },
      }),
    select: buildReportOptions,
  });

  // Default to the first survey until the user picks one
  const selectedSurveyId = userSelectedSurveyId ?? reportOptions?.[0]?.value;

  const { data: report } = useQuery({
    queryKey: reportKeys.encounterSummary(selectedSurveyId),
    queryFn: () => Database.models.Encounter.getTotalEncountersAndResponses(selectedSurveyId),
    enabled: selectedSurveyId !== undefined,
    select: buildVisitReport,
  });

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
          {reportOptions && (
            <Dropdown
              options={reportOptions}
              handleSelect={setUserSelectedSurveyId}
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
          visitData={report?.visitData}
          todayData={report?.todayData}
          selectedSurveyId={selectedSurveyId}
        />
      ) : null}
    </FullView>
  );
};
