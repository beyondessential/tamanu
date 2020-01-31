import React, { memo, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { BarChart } from 'react-native-svg-charts';
import { G, Line } from 'react-native-svg';
import { DateFormats } from '../../helpers/constants';
import { StyledView, StyledText, RowView } from '../../styled/common';
import { formatDate } from '../../helpers/date';
import { theme } from '../../styled/theme';
import { BarChartData } from '../../interfaces/BarChartProps';
import { Orientation, screenPercentageToDP } from '../../helpers/screen';

interface CustomGridProps {
  x?: (value: number) => number;
  y?: (value: number) => number;
  data?: any[];
  ticks?: any[];
}

const CustomGrid = memo(
  ({ x, data }: CustomGridProps): JSX.Element => (
    <G>
      {data
        && data.map(
          (_, index: number) => index % 7 === 0 && (
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
  ),
);
const SideLabelsPercentage = [1, 0.8324, 0.6649, 0.5, 0.3329, 0];

interface SideLabelsProps {
  data: BarChartData [];
}

const SideLabels = memo(
  ({ data }: SideLabelsProps): JSX.Element => {
    const maxValue = Math.max(...data.map(d => d.value));
    const markers = SideLabelsPercentage.map(percentValue => Math.round(percentValue * maxValue));

    return (
      <StyledView
        paddingTop={screenPercentageToDP('4.03', Orientation.Height)}
        paddingBottom={screenPercentageToDP('4.03', Orientation.Height)}
        alignItems="center"
        justifyContent="space-between"
        paddingLeft={15}
        paddingRight={15}
      >
        {
      markers.map(label => (
        <StyledText key={label} fontSize={screenPercentageToDP('1.6', Orientation.Height)}>
          {label}
        </StyledText>
      ))
    }
      </StyledView>
    );
  },
);

const DateRangeIndexes = [
  {
    startDate: 0,
    endDate: 6,
  },
  {
    startDate: 7,
    endDate: 13,
  },
  {
    startDate: 14,
    endDate: 20,
  },
  {
    startDate: 21,
    endDate: 27,
  },
];

interface DateRangeLabelsProps {
  data: BarChartData[];
}

const DateRangeLabels = memo(({ data }: DateRangeLabelsProps) => {
  const dateIntervalArray = useMemo(
    () => DateRangeIndexes.map((dateRange, index) => ({
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
      bottom="0%"
    >
      {dateIntervalArray.map(dateInterval => (
        <StyledText
          key={dateInterval.key}
          width="100%"
          height={screenPercentageToDP('3.03', Orientation.Height)}
          textAlign="center"
          fontSize={screenPercentageToDP('2.5', Orientation.Width)}
        >
          {`${formatDate(
            dateInterval.start,
            DateFormats.DAY_MONTH,
          )} - \n ${formatDate(
            dateInterval.end,
            DateFormats.DAY_MONTH_YEAR_SHORT,
          )}`}
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
});

const barStyle = {
  fill: theme.colors.BRIGHT_BLUE,
};

const barChartContentStyle = {
  top: screenPercentageToDP(5, Orientation.Height),
  bottom: screenPercentageToDP(5, Orientation.Height),
};

interface BarChartProps {
  data: BarChartData[];
}

export const VisitChart = memo(
  ({ data }: BarChartProps): JSX.Element => (
    <StyledView
      height={screenPercentageToDP('29.79%', Orientation.Height)}
      width="100%"
      overflow="visible"
    >
      <RowView flex={1} paddingLeft={20}>
        <StyledView flex={1}>
          <BarChart
            style={styles.barChartStyles}
            yAccessor={({ item }: { item: BarChartData }): number => item.value
              }
            animate
            data={data}
            svg={barStyle}
            spacingInner={0.2}
            contentInset={barChartContentStyle}
            gridMin={0}
          >
            <CustomGrid />
          </BarChart>
          <DateRangeLabels data={data} />
        </StyledView>
        <SideLabels data={data} />
      </RowView>
    </StyledView>
  ),
);
