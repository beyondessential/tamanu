import React, { ReactElement } from 'react';
import { parseISO } from 'date-fns';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '/styled/theme';
import { DateFormats } from '/helpers/constants';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { TableHeader } from '../Table';
import { useDateFormatter } from '~/ui/hooks/useDateFormatter';

const VitalsHeaderCell = ({ date }: { date: string }): ReactElement => {
  const { formatDate } = useDateFormatter();
  return (
    <View style={styles.container}>
      <Text style={styles.dateText}>{formatDate(parseISO(date), DateFormats.DDMMYY)}</Text>
      <Text style={styles.timeText}>{formatDate(parseISO(date), DateFormats.TIME)}</Text>
    </View>
  );
};

export const vitalsTableHeader: TableHeader = {
  key: 'date',
  accessor: (date) => <VitalsHeaderCell date={date} />,
};

const styles = StyleSheet.create({
  container: {
    width: screenPercentageToDP(23.68, Orientation.Width),
    height: screenPercentageToDP(6.86, Orientation.Height),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.WHITE,
    borderColor: theme.colors.BOX_OUTLINE,
    borderBottomWidth: 1,
  },
  dateText: {
    fontSize: screenPercentageToDP(1.45, Orientation.Height),
    fontWeight: '500',
    color: '#326699',
  },
  timeText: {
    fontSize: screenPercentageToDP(1.2, Orientation.Height),
    fontWeight: '500',
    color: '#326699',
  },
});
