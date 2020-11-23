import React from 'react';
import { format } from 'date-fns';
import { SectionList, StyleSheet, Text, View } from 'react-native';
import { StyledView, RowView, StyledText, ColumnView, FullView } from '/styled/common';
import { theme } from '/styled/theme';
import { Separator } from '../Separator';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 22,
  },
  section: {
    display: 'flex',
    paddingTop: 36,
  },
  item: {
    margin: 2,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

const VaccinationDetailsList = ({ status, date, reason, scheduledVaccine }): JSX.Element => (
  <RowView>
    <View style={styles.section}>
      <Text style={styles.item}>
        {`Schedule: ${scheduledVaccine.schedule}`}
      </Text>
      <Text style={styles.item}>
        {`Status: ${status.toLowerCase()}`}
      </Text>
      <Text style={styles.item}>
        {`Date: ${format(date, 'dd-MM-yyyy hh:mm')}`}
      </Text>
      <Text style={styles.item}>
        {`Reason: ${reason || 'n/A'}`}
      </Text>
    </View>
    <Separator />
  </RowView>
);

export const Content = (
  section: any,
  index: number,
  isActive: boolean,
): JSX.Element => (
  <StyledView height={200}>
    <RowView
      width="100%"
      background={
        theme.colors.BACKGROUND_GREY
      }
      height={60}
      alignItems="center"
      paddingLeft={20}
      paddingRight={20}
    >
      {section.data.map(d => <VaccinationDetailsList {...d} />)}
    </RowView>
  </StyledView>
);
