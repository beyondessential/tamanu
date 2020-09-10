import React, { memo, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { BarChart, YAxis } from 'react-native-svg-charts';
import { G, Line } from 'react-native-svg';
import { DateFormats } from '/helpers/constants';
import { StyledView, StyledText, RowView } from '/styled/common';
import { formatDate } from '/helpers/date';
import { theme } from '/styled/theme';
import { BarChartData } from '../../interfaces/BarChartProps';
import { Orientation, screenPercentageToDP } from '/helpers/screen';

interface CustomGridProps {
  x: (value: number) => number;
  data: any[];
}

const CustomGrid = memo(
  ({ x, data }: CustomGridProps): Element => (
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
      bottom="-15%"
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
  yAxis: { marginRight: 10, marginLeft: 10, marginBottom: 10 },
});

const barStyle = {
  fill: theme.colors.BRIGHT_BLUE,
};

interface BarChartProps {
  data: BarChartData[];
}

const verticalContentInset = { top: 10, right: 0, bottom: 0 };
const axesSvg = { fontSize: 12, fill: theme.colors.TEXT_DARK };

export const VisitChart = memo(
  ({ data }: BarChartProps): Element => (
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
            TOTAL
          </StyledText>

          <StyledText
            fontWeight="bold"
            color={theme.colors.TEXT_DARK}
            fontSize={screenPercentageToDP(3.4, Orientation.Height)}
          >
            {data.length}
            <StyledText
              fontSize={screenPercentageToDP(1.94, Orientation.Height)}
              color={theme.colors.TEXT_MID}
            >
              {' '}
              Visits
            </StyledText>
          </StyledText>
        </StyledView>
        <StyledText
          fontSize={screenPercentageToDP(1.7, Orientation.Height)}
          color={theme.colors.PRIMARY_MAIN}
          fontWeight={500}
        >
          18 Aug - 16 Sep 2020
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
              yAccessor={({ item }: { item: BarChartData }): number => item.value
              }
              animate
              data={data}
              svg={barStyle}
              spacingInner={0.2}
            >
              <CustomGrid x={(): number => 0} data={[]} />
            </BarChart>
            <DateRangeLabels data={data} />
          </StyledView>
          <YAxis
            style={styles.yAxis}
            yAccessor={({ item }: { item: BarChartData }): number => item.value}
            data={data}
            contentInset={verticalContentInset}
            svg={axesSvg}
          />
        </RowView>
      </StyledView>
    </StyledView>
  ),
);
