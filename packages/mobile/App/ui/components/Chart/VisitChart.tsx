import { parseISO } from 'date-fns';
import React, { memo, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { G, Line } from 'react-native-svg';
import { BarChart, YAxis } from 'react-native-svg-charts';
import { useDateFormatter } from '~/ui/hooks/useDateFormatter';
import { DateFormats } from '../../helpers/constants';
import { Orientation, screenPercentageToDP } from '../../helpers/screen';
import type { BarChartData } from '../../interfaces/BarChartProps';
import { RowView, StyledText, StyledView } from '../../styled/common';
import { theme } from '../../styled/theme';
import { TranslatedText } from '../Translations/TranslatedText';

interface CustomGridProps {
  x: (value: number) => number;
  data: any[];
}

const CustomGrid = ({ x, data }: CustomGridProps) => (
  <G>
    {data?.map(
      (_, index: number) =>
        index % 7 === 0 && (
          <Line
            strokeDasharray="4, 4"
            key={data[index].date.toString()}
            y1="0%"
            y2="100%"
            x1={x && x(index) - 2}
            x2={x && x(index) - 2}
            stroke={theme.colors.TEXT_DARK}
          />
        ),
    )}
  </G>
);

const DateRangeIndexes = [
  { startDate: 0, endDate: 6 },
  { startDate: 7, endDate: 13 },
  { startDate: 14, endDate: 20 },
  { startDate: 21, endDate: 27 },
] as const;

interface DateRangeLabelsProps {
  data: BarChartData[];
}

const DateRangeLabels = memo(({ data }: DateRangeLabelsProps) => {
  const { formatStringDate } = useDateFormatter();
  const dateIntervalArray = useMemo(
    () =>
      DateRangeIndexes.map((dateRange, index) => ({
        start: data[dateRange.startDate].date,
        end: data[dateRange.endDate].date,
        key: index,
      })),
    [data],
  );

  return (
    <RowView
      height="15%"
      width="100%"
      position="absolute"
      background="transparent"
      alignItems="center"
      justifyContent="space-around"
      bottom="-15%"
    >
      {dateIntervalArray.map(dateInterval => (
        <StyledText
          color={theme.colors.TEXT_DARK}
          key={dateInterval.key}
          width="100%"
          height={screenPercentageToDP('3.03', Orientation.Height)}
          textAlign="center"
          fontSize={screenPercentageToDP('2.5', Orientation.Width)}
        >
          {formatStringDate(dateInterval.start, DateFormats.DAY_MONTH)}
          &thinsp;&ndash;&thinsp;
          {formatStringDate(dateInterval.end, DateFormats.DAY_MONTH_YEAR_SHORT)}
        </StyledText>
      ))}
    </RowView>
  );
});

const styles = StyleSheet.create({
  barChartStyles: {
    flex: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: theme.colors.TEXT_DARK,
  },
  yAxis: { marginRight: 10, marginLeft: 10, marginBottom: 10 },
});

const barStyle = {
  fill: theme.colors.BRIGHT_BLUE,
};

interface BarChartProps {
  visitData?: {
    totalVisits: number;
    data: BarChartData[];
  };
}

const verticalContentInset = { top: 10, right: 0, bottom: 5 };
const axesSvg = { fontSize: 12, fill: theme.colors.TEXT_DARK };

export const VisitChart = ({ visitData }: BarChartProps) => {
  const { formatStringDate } = useDateFormatter();

  if (visitData === undefined) return null;

  const firstData = visitData.data.at(0);
  const lastData = visitData.data.at(-1);
  const oneMonthAgoFormatted =
    parseISO(lastData.date).getFullYear() === parseISO(firstData.date).getFullYear()
      ? formatStringDate(firstData.date, DateFormats.DAY_MONTH)
      : formatStringDate(firstData.date, DateFormats.DAY_MONTH_YEAR_SHORT);
  const todayFormatted = formatStringDate(lastData.date, DateFormats.DAY_MONTH_YEAR_SHORT);

  const numberOfTicks = Math.max(0, ...visitData.data.map(item => item.value));

  return (
    <StyledView>
      <RowView
        marginTop={screenPercentageToDP(4.25, Orientation.Height)}
        paddingLeft={20}
        paddingRight={20}
        justifyContent="space-between"
        alignItems="center"
        marginBottom={15}
      >
        <StyledView>
          <StyledText
            color={theme.colors.TEXT_MID}
            fontSize={screenPercentageToDP(1.45, Orientation.Height)}
          >
            <TranslatedText stringId="report.subHeading.total" fallback="Total" casing="upper" />
          </StyledText>
          <StyledText
            fontWeight="bold"
            color={theme.colors.TEXT_DARK}
            fontSize={screenPercentageToDP(3.4, Orientation.Height)}
          >
            {visitData.totalVisits}
            <StyledText
              fontSize={screenPercentageToDP(1.94, Orientation.Height)}
              color={theme.colors.TEXT_MID}
            >
              {' '}
              <TranslatedText stringId="report.totalVisits.text" fallback="Visits" />
            </StyledText>
          </StyledText>
        </StyledView>
        <StyledText
          fontSize={screenPercentageToDP(1.7, Orientation.Height)}
          color={theme.colors.PRIMARY_MAIN}
          fontWeight={500}
        >
          {oneMonthAgoFormatted}&thinsp;&ndash;&thinsp;{todayFormatted}
        </StyledText>
      </RowView>
      <StyledView
        height={screenPercentageToDP('24.79%', Orientation.Height)}
        width="100%"
        overflow="visible"
      >
        <RowView flex={1} paddingLeft={20}>
          <StyledView flex={1}>
            <BarChart
              style={styles.barChartStyles}
              yAccessor={({ item }: { item: BarChartData }): number => item.value}
              animate
              data={visitData.data}
              svg={barStyle}
              spacingInner={0.2}
              contentInset={verticalContentInset}
            >
              <CustomGrid x={(): number => 0} data={[]} />
            </BarChart>
            <DateRangeLabels data={visitData.data} />
          </StyledView>
          <YAxis
            style={styles.yAxis}
            yAccessor={({ item }: { item: BarChartData }): number => item.value}
            data={visitData.data}
            contentInset={verticalContentInset}
            svg={axesSvg}
            numberOfTicks={numberOfTicks}
          />
        </RowView>
      </StyledView>
    </StyledView>
  );
};
