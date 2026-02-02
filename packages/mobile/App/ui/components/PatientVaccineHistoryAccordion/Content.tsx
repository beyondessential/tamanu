import React, { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ColumnView, RowView, StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import { TranslatedText } from '../Translations/TranslatedText';
import { useDateTimeFormat } from '~/ui/contexts/DateTimeContext';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 22,
  },
  section: {
    display: 'flex',
    width: '100%',
    paddingTop: 36,
  },
  item: {
    margin: 2,
    fontWeight: 'bold',
    fontSize: 16,
    color: theme.colors.TEXT_DARK,
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    flexDirection: 'row',
    width: '100%',
  },
});

const VaccinationDetailsList = ({
  status,
  date,
  scheduledVaccine,
  formatShortDateTime,
}): ReactElement => (
  <RowView width="100%">
    <View style={styles.section}>
      <View style={styles.row}>
        <Text style={styles.item}>
          <TranslatedText stringId="general.schedule.label" fallback="Schedule" />:
        </Text>
        <Text style={styles.item}>{scheduledVaccine.doseLabel}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.item}>
          <TranslatedText stringId="general.status.label" fallback="Status" />:
        </Text>
        <Text style={styles.item}>{status.toLowerCase()}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.item}>
          <TranslatedText stringId="general.date.label" fallback="Date" />:
        </Text>
        <Text style={styles.item}>{formatShortDateTime(date)}</Text>
      </View>
    </View>
  </RowView>
);

export const Content = (section: any): ReactElement => {
  const { formatShortDateTime } = useDateTimeFormat();

  return (
    <StyledView>
      <ColumnView
        width="100%"
        background={theme.colors.BACKGROUND_GREY}
        paddingLeft={20}
        paddingRight={20}
      >
        {section.data.map(d => (
          <VaccinationDetailsList key={d.id} {...d} formatShortDateTime={formatShortDateTime} />
        ))}
      </ColumnView>
    </StyledView>
  );
};
