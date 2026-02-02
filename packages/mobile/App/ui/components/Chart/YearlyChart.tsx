import React, { memo, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { BarChart, XAxis, YAxis } from 'react-native-svg-charts';
import { RowView, StyledText, StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import { getYear } from 'date-fns';
import { BarChartData } from '../../interfaces/BarChartProps';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { useDateTimeFormat } from '~/ui/contexts/DateTimeContext';

const styles = StyleSheet.create({
  barChartStyles: {
    flex: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: theme.colors.TEXT_DARK,
  },
  yAxis: { marginBottom: 30, marginRight: 10 },
  xAxisContent: {
    left: screenPercentageToDP(1.6, Orientation.Height),
    right: screenPercentageToDP(2.0, Orientation.Height),
  },
  xAxis: { height: 30 },
});

const svgBarStyle = {
  fill: theme.colors.BRIGHT_BLUE,
};

interface BarChartProps {
  data: BarChartData[];
}
const axesSvg = {
  fontSize: screenPercentageToDP(1.35, Orientation.Height),
  fill: theme.colors.TEXT_DARK,
};
const verticalContentInset = { top: 10, bottom: 10, right: 0 };

export const YearlyChart = memo(
  ({ data }: BarChartProps): JSX.Element => {
    const { formatDayMonth } = useDateTimeFormat();
    const totalVisits = useMemo(() => data.reduce<number>((acc, cur) => acc + cur.value, 0), [data]);

    const yearRange = `${getYear(data[0].date)} - ${getYear(
      data[data.length - 1].date,
    )}`;

    return (
      <StyledView>
        <RowView
          marginTop={35}
          paddingLeft={20}
          paddingRight={20}
          justifyContent="space-between"
          alignItems="center"
          marginBottom={15}
        >
          <StyledView>
            <StyledText color={theme.colors.TEXT_MID} fontSize={12}>
              TOTAL
            </StyledText>

            <StyledText
              fontWeight="bold"
              color={theme.colors.TEXT_DARK}
              fontSize={28}
            >
              {totalVisits}
              <StyledText fontSize={16} color={theme.colors.TEXT_MID}>
                {' '}
                Visits
              </StyledText>
            </StyledText>
          </StyledView>
          <StyledText
            fontSize={14}
            color={theme.colors.PRIMARY_MAIN}
            fontWeight={500}
          >
            {yearRange}
          </StyledText>
        </RowView>
        <RowView
          height={screenPercentageToDP(29.5, Orientation.Height)}
          marginLeft={20}
          overflow="visible"
        >
          <StyledView flex={1} marginRight={10}>
            <StyledView
              flex={1}
              borderRightWidth={StyleSheet.hairlineWidth}
              borderLeftWidth={StyleSheet.hairlineWidth}
            >
              <BarChart
                yAccessor={({ item }: { item: BarChartData }): number => item.value}
                style={styles.barChartStyles}
                data={data}
                contentInset={verticalContentInset}
                svg={svgBarStyle}
              />
            </StyledView>
            <XAxis
              style={styles.xAxis}
              formatLabel={
                (_, index: number): string => formatDayMonth(data[index].date) || ''
              }
              data={data}
              contentInset={styles.xAxisContent}
              svg={axesSvg}
            />
          </StyledView>
          <YAxis
            yAccessor={({ item }: { item: BarChartData }): number => item.value}
            data={data}
            style={styles.yAxis}
            contentInset={verticalContentInset}
            svg={axesSvg}
          />
        </RowView>
      </StyledView>
    );
  },
);
