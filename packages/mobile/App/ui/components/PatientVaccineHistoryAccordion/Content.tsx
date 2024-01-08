import React, { ReactElement } from 'react';
import { formatStringDate } from '/helpers/date';
import { StyleSheet, Text, View } from 'react-native';
import { StyledView, RowView, ColumnView } from '/styled/common';
import { theme } from '/styled/theme';

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

const VaccinationDetailsList = ({ status, date, scheduledVaccine }): ReactElement => (
  <RowView width="100%">
    <View style={styles.section}>
      <View style={styles.row}>
        <Text style={styles.item}>Schedule:</Text>
        <Text style={styles.item}>{scheduledVaccine.schedule}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.item}>
          Status:
        </Text>
        <Text style={styles.item}>
          {status.toLowerCase()}
        </Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.item}>
          Date:
        </Text>
        <Text style={styles.item}>
          {formatStringDate(date, 'do MMM yyyy h:mmaa')}
        </Text>
      </View>
    </View>
  </RowView>
);

export const Content = (
  section: any,
): ReactElement => (
  <StyledView>
    <ColumnView
      width="100%"
      background={
        theme.colors.BACKGROUND_GREY
      }
      paddingLeft={20}
      paddingRight={20}
    >
      {section.data.map((d) => <VaccinationDetailsList key={d.id} {...d} />)}
    </ColumnView>
  </StyledView>
);
