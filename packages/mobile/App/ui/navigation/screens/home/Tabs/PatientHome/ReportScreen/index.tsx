import React, { ReactElement, useState, useCallback, FC, useEffect } from 'react';
import { StyledText, FullView, RowView, StyledSafeAreaView, StyledView } from '/styled/common';
import { Button } from '/components/Button';
import { LogoV2Icon } from '/components/Icons';
import { VisitChart } from '/components/Chart/VisitChart';
import { theme } from '/styled/theme';
import { screenPercentageToDP, Orientation, setStatusBar } from '/helpers/screen';
import { Routes } from '/helpers/routes';
import { ReportScreenProps } from '/interfaces/Screens/HomeStack/ReportScreenProps';
import { addHours, format, startOfToday, subDays } from 'date-fns';
import { useIsFocused } from '@react-navigation/core';
import { useBackendEffect } from '~/ui/hooks';
import { SummaryBoard } from './SummaryBoard';
import { BarChartData } from '~/ui/interfaces/BarChartProps';
import { RecentPatientSurveyReport } from './RecentPatientSurveyReport';
import { Dropdown } from './components/Dropdown';

import { SurveyTypes } from '~/types';

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
        buttonText="Summary"
        bordered={false}
        onPress={onPress}
      />
      <Button
        fontSize={screenPercentageToDP(1.57, Orientation.Height)}
        height={screenPercentageToDP(3.76, Orientation.Height)}
        width={screenPercentageToDP(44.52, Orientation.Width)}
        buttonText="Data Table"
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
}) => (isReportWeekly ? (
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
));

export const ReportScreen = ({ navigation }: ReportScreenProps): ReactElement => {
  const [selectedSurveyId, setSelectedSurveyId] = useState('');
  const [isReportWeekly, setReportType] = useState<boolean>(true);
  const isFocused = useIsFocused();

  const [data] = useBackendEffect(
    ({ models }) => models.Encounter.getTotalEncountersAndResponses(selectedSurveyId),
    [selectedSurveyId, isFocused],
  );

  const [surveys] = useBackendEffect(({ models }) => models.Survey.find({
    where: {
      surveyType: SurveyTypes.Programs,
    },
  }));

  useEffect(() => {
    // automatically select the first survey as soon as surveys are loaded
    if (!selectedSurveyId && surveys && surveys.length > 0) {
      setSelectedSurveyId(surveys[0].id);
    }
  }, [surveys, selectedSurveyId]);

  const reportList = surveys?.map((s) => ({ label: s.name, value: s.id }));

  const today = addHours(startOfToday(), 3);
  const todayString = format(today, 'yyyy-MM-dd');
  const todayData = data?.find((item) => item.encounterDate === todayString);

  const visitData = new Array(28).fill('').reduce(
    (accum, _, index) => {
      const currentDate = format(subDays(today, 28 - index - 1), 'yyyy-MM-dd');
      const receivedValueForDay = data?.find(
        (item) => item.encounterDate === currentDate,
      )?.totalEncounters || 0;

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

  const onChangeReportType = useCallback(() => {
    if (isReportWeekly) {
      setReportType(false);
    } else {
      setReportType(true);
    }
  }, [isReportWeekly]);

  const navigateToExportData = useCallback(() => {
    navigation.navigate(Routes.HomeStack.ExportDataScreen);
  }, []);

  setStatusBar('light-content', theme.colors.PRIMARY_MAIN);

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
          <LogoV2Icon height={23} width={95} fill={theme.colors.WHITE} />
          <Button
            height={screenPercentageToDP(4.25, Orientation.Height)}
            width={screenPercentageToDP(25.54, Orientation.Width)}
            outline
            borderColor={theme.colors.WHITE}
            fontSize={screenPercentageToDP(1.57, Orientation.Height)}
            buttonText="Export Data"
            onPress={navigateToExportData}
          />
        </RowView>
        <StyledView flexDirection="row" justifyContent="flex-start" alignItems="center" flex={1}>
          <StyledText
            marginTop={screenPercentageToDP(2.43, Orientation.Height)}
            fontWeight="bold"
            color={theme.colors.WHITE}
            fontSize={screenPercentageToDP(3.4, Orientation.Height)}
          >
            Reports
          </StyledText>
          {reportList && (
            <Dropdown
              options={reportList}
              handleSelect={(value): void => {
                setSelectedSurveyId(value);
              }}
              selectedItem={selectedSurveyId}
            />
          )}
        </StyledView>
      </StyledSafeAreaView>
      <ReportTypeButtons onPress={onChangeReportType} isReportWeekly={isReportWeekly} />
      {selectedSurveyId ? (
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
