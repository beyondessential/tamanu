import React, { ReactElement, useState, useCallback } from 'react';
import {
  StyledText,
  FullView,
  RowView,
  StyledSafeAreaView,
  StyledView,
} from '/styled/common';
import { Button } from '/components/Button';
import { LogoV2CLR } from '/components/Icons';
import { VisitChart } from '/components/Chart/VisitChart';
import { visitData, yearlyData } from '/components/Chart/fixture';
import { theme } from '/styled/theme';
import { YearlyChart } from '/components/Chart/YearlyChart';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { Routes } from '/helpers/routes';
import { ReportScreenProps } from '/interfaces/screens/HomeStack/ReportScreenProps';

const BirthDeathBoard = (): ReactElement => (
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
        15
      </StyledText>
      <StyledText color={theme.colors.TEXT_MID} fontSize={14}>
        Total Births
      </StyledText>
      <StyledText
        marginTop={screenPercentageToDP(0.6, Orientation.Height)}
        color={theme.colors.SAFE}
      >
        +10% on last 4 weeks
      </StyledText>
    </FullView>
    <FullView justifyContent="center" alignItems="center">
      <StyledText
        fontSize={screenPercentageToDP(3.4, Orientation.Height)}
        fontWeight="bold"
      >
        3
      </StyledText>
      <StyledText fontSize={screenPercentageToDP(1.7, Orientation.Height)}>
        Total Births
      </StyledText>
      <StyledText
        marginTop={screenPercentageToDP(0.6, Orientation.Height)}
        color={theme.colors.ALERT}
      >
        +5% on last 4 weeks
      </StyledText>
    </FullView>
  </RowView>
);

interface ReportTypeButtons {
  isReportWeekly: boolean;
  onPress: () => void;
}

const ReportTypeButtons = ({
  isReportWeekly,
  onPress,
}: ReportTypeButtons): ReactElement => {
  return (
    <RowView
      position="absolute"
      justifyContent="center"
      top="20.5%"
      width="100%"
      zIndex={2}
    >
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
          backgroundColor={
            isReportWeekly ? theme.colors.WHITE : theme.colors.BOX_OUTLINE
          }
          textColor={
            isReportWeekly ? theme.colors.PRIMARY_MAIN : theme.colors.TEXT_MID
          }
          buttonText="LAST 4 WEEKS"
          bordered={false}
          onPress={onPress}
        />
        <Button
          fontSize={screenPercentageToDP(1.57, Orientation.Height)}
          height={screenPercentageToDP(3.76, Orientation.Height)}
          width={screenPercentageToDP(44.52, Orientation.Width)}
          buttonText="LAST 12 MONTHS"
          backgroundColor={
            !isReportWeekly ? theme.colors.WHITE : theme.colors.BOX_OUTLINE
          }
          textColor={
            !isReportWeekly ? theme.colors.PRIMARY_MAIN : theme.colors.TEXT_MID
          }
          onPress={onPress}
        />
      </RowView>
    </RowView>
  );
};

interface ReportChartProps {
  isReportWeekly: boolean;
}

const ReportChart = ({ isReportWeekly }: ReportChartProps): ReactElement => {
  return isReportWeekly ? (
    <StyledView marginBottom={screenPercentageToDP(7.53, Orientation.Height)}>
      <VisitChart data={visitData} />
    </StyledView>
  ) : (
    <StyledView marginBottom={screenPercentageToDP(2.43, Orientation.Height)}>
      <YearlyChart data={yearlyData} />
    </StyledView>
  );
};

export const ReportScreen = ({
  navigation,
}: ReportScreenProps): ReactElement => {
  const [isReportWeekly, setReportType] = useState<boolean>(true);

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
          <LogoV2CLR fill={theme.colors.WHITE} />
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
        <StyledView flex={1} justifyContent="flex-end">
          <StyledText
            marginTop={screenPercentageToDP(2.43, Orientation.Height)}
            fontWeight="bold"
            color={theme.colors.WHITE}
            fontSize={screenPercentageToDP(3.4, Orientation.Height)}
            marginBottom={screenPercentageToDP(3.64, Orientation.Height)}
          >
            Reports
          </StyledText>
        </StyledView>
      </StyledSafeAreaView>
      <ReportTypeButtons
        onPress={onChangeReportType}
        isReportWeekly={isReportWeekly}
      />
      <ReportChart isReportWeekly={isReportWeekly} />
      <StyledView flex={1}>
        <BirthDeathBoard />
      </StyledView>
    </FullView>
  );
};
