import { differenceInYears, format, parseISO } from 'date-fns';
import React, { FC } from 'react';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { useBackendEffect } from '~/ui/hooks';
import { RowView, StyledText, StyledView } from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';
import {
  BorderRow,
  Cell,
  ColumnCategory,
  DataCell,
  DataText,
  HeaderRow,
  Row,
  Table,
} from './RecentPatientSurveyReportStyled';
import { DateFormats } from '/helpers/constants';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';

interface IOwnProps {
  selectedSurveyId: string;
}

export const RecentPatientSurveyReport: FC<IOwnProps> = ({ selectedSurveyId }) => {
  const [recentVisitorsData] = useBackendEffect(
    ({ models }) => models.Patient.getRecentVisitors(selectedSurveyId),
    [selectedSurveyId],
  );
  const [genderData, ageData, visitorsData] = recentVisitorsData || [null, null, null];

  const todayFormatted = format(new Date(), DateFormats.DAY_MONTH_YEAR_SHORT);

  const [referralsData] = useBackendEffect(({ models }) => models.Patient.getReferralList(), []);

  const maleData = genderData?.find(item => item.gender === 'male');
  const femaleData = genderData?.find(item => item.gender === 'female');
  const youngData = ageData?.find(item => item.ageGroup === 'lessThanThirty');
  const oldData = ageData?.find(item => item.ageGroup === 'moreThanThirty');
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
            <TranslatedText stringId="report.subHeading.total" fallback="TOTAL" casing="upper" />
          </StyledText>

          <StyledText
            fontWeight="bold"
            color={theme.colors.TEXT_DARK}
            fontSize={screenPercentageToDP(3.4, Orientation.Height)}
          >
            {visitorsData?.totalVisitors || '0'}
            <StyledText
              fontSize={screenPercentageToDP(1.94, Orientation.Height)}
              color={theme.colors.TEXT_MID}
            >
              {' '}
              <TranslatedText stringId="report.totalVisits.text" fallback="Visits" />
            </StyledText>
          </StyledText>
        </StyledView>
        <DataText>{todayFormatted}</DataText>
      </RowView>
      <StyledView width="100%" padding={20} overflow="visible" alignItems="center">
        <Table>
          <BorderRow>
            <Cell />
            <Cell />
            <DataCell type="strong">
              <TranslatedText
                stringId="referral.table.column.numberAttended"
                fallback="Number attended"
              />
            </DataCell>
            <DataCell type="strong">
              <TranslatedText
                stringId="referral.table.column.numberScreened"
                fallback="Number screened"
              />
            </DataCell>
          </BorderRow>
          {genderData && (
            <BorderRow>
              <ColumnCategory>
                <StyledText
                  fontSize={screenPercentageToDP(1.7, Orientation.Height)}
                  color={theme.colors.TEXT_DARK}
                  fontWeight={700}
                >
                  <TranslatedText stringId="general.table.column.gender" fallback="Gender" />
                </StyledText>
              </ColumnCategory>
              <Cell>
                <BorderRow>
                  <DataCell>
                    <TranslatedText stringId="patient.property.sex.male" fallback="Male" />
                  </DataCell>
                  <DataCell>{maleData?.totalVisitors || '0'}</DataCell>
                  <DataCell>{maleData?.totalSurveys || '0'}</DataCell>
                </BorderRow>
                <Row>
                  <DataCell>
                    <TranslatedText stringId="patient.property.sex.female" fallback="Female" />
                  </DataCell>
                  <DataCell>{femaleData?.totalVisitors || '0'}</DataCell>
                  <DataCell>{femaleData?.totalSurveys || '0'}</DataCell>
                </Row>
              </Cell>
            </BorderRow>
          )}
          {ageData && (
            <BorderRow>
              <ColumnCategory>
                <DataText>
                  <TranslatedText stringId="general.table.column.age" fallback="Age" />
                </DataText>
              </ColumnCategory>
              <Cell>
                <BorderRow>
                  <DataCell>&lt;30</DataCell>
                  <DataCell>{youngData?.totalVisitors || '0'}</DataCell>
                  <DataCell>{youngData?.totalSurveys || '0'}</DataCell>
                </BorderRow>
                <Row>
                  <DataCell>30+</DataCell>
                  <DataCell>{oldData?.totalVisitors || '0'}</DataCell>
                  <DataCell>{oldData?.totalSurveys || '0'}</DataCell>
                </Row>
              </Cell>
            </BorderRow>
          )}
          {visitorsData && (
            <Row>
              <ColumnCategory>
                <DataText type="strong">
                  <TranslatedText stringId="general.table.column.total" fallback="Total" />
                </DataText>
              </ColumnCategory>
              <Cell>
                <Row>
                  <Cell />
                  <DataCell type="strong">{visitorsData.totalVisitors ?? '0'}</DataCell>
                  <DataCell type="strong">{visitorsData.totalSurveys ?? '0'}</DataCell>
                </Row>
              </Cell>
            </Row>
          )}
        </Table>
      </StyledView>
      <StyledView width="100%" padding={20} overflow="visible" alignItems="center">
        <DataText type="strong" textAlign="center" paddingBottom={20}>
          <TranslatedText stringId="report.table.patientList.title" fallback="Patient List" />
        </DataText>
        <Table>
          <HeaderRow>
            <DataCell type="strong">
              <TranslatedText stringId="general.table.column.name" fallback="Name" />
            </DataCell>
            <DataCell type="strong">
              <TranslatedText stringId="general.table.column.gender" fallback="Gender" />
            </DataCell>
            <DataCell type="strong">
              <TranslatedText stringId="general.table.column.age" fallback="Age" />
            </DataCell>
            <DataCell type="strong">
              <TranslatedText stringId="report.table.column.referredTo" fallback="Referred to" />
            </DataCell>
          </HeaderRow>
          {referralsData &&
            referralsData.map(patient => (
              <Row key={patient.id}>
                <DataCell>{`${patient.firstName} ${patient.lastName}`}</DataCell>
                <DataCell>{patient.sex}</DataCell>
                <DataCell>{differenceInYears(new Date(), parseISO(patient.dateOfBirth))}</DataCell>
                <DataCell>{patient.referredTo}</DataCell>
              </Row>
            ))}
        </Table>
      </StyledView>
    </StyledView>
  );
};
