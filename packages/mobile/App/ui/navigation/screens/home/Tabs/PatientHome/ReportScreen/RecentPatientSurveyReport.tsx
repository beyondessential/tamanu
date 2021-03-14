import { differenceInYears, format, parseISO } from 'date-fns';
import React, { FC } from 'react';
import { screenPercentageToDP, Orientation } from '~/ui/helpers/screen';
import { useBackendEffect } from '~/ui/hooks';
import { StyledView, RowView, StyledText } from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';
import { Table, Row, ColumnCategory, Cell, BorderRow, HeaderRow, DataCell, DataText } from './RecentPatientSurveyReportStyled';
import { DateFormats } from '/helpers/constants';

export const RecentPatientSurveyReport: FC = () => {
  const [recentVisitorsData] = useBackendEffect(
    ({ models }) => models.Patient.getRecentVisitors('program-cvd-fiji/survey-cvd-risk-fiji'),
    [],
  );
  const [genderData, ageData, visitorsData] = recentVisitorsData || [null, null, null];

  const todayFormatted = format(new Date(), DateFormats.DAY_MONTH_YEAR_SHORT);

  const [referralsData] = useBackendEffect(
    ({ models }) => models.Patient.getReferralList(),
    [],
  );

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
            TOTAL
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
              Visits
            </StyledText>
          </StyledText>
        </StyledView>
        <DataText>
          {todayFormatted}
        </DataText>
      </RowView>
      <StyledView
        width="100%"
        padding={20}
        overflow="visible"
        alignItems="center"
      >
        <Table>
          <BorderRow>
            <Cell />
            <Cell />
            <DataCell type="strong">Number attended</DataCell>
            <DataCell type="strong">Number screened</DataCell>
          </BorderRow>
          {
            genderData
            && (
              <BorderRow>
                <ColumnCategory>
                  <StyledText
                    fontSize={screenPercentageToDP(1.7, Orientation.Height)}
                    color={theme.colors.TEXT_DARK}
                    fontWeight={700}
                  >Gender
                  </StyledText>
                </ColumnCategory>
                <Cell>
                  <BorderRow>
                    <DataCell>Male</DataCell>
                    <DataCell>{maleData?.totalVisitors || '0'}</DataCell>
                    <DataCell>{maleData?.totalSurveys || '0'}</DataCell>
                  </BorderRow>
                  <Row>
                    <DataCell>Female</DataCell>
                    <DataCell>{femaleData?.totalVisitors || '0'}</DataCell>
                    <DataCell>{femaleData?.totalSurveys || '0'}</DataCell>
                  </Row>
                </Cell>
              </BorderRow>
            )
          }
          {
            ageData
            && (
              <BorderRow>
                <ColumnCategory>
                  <DataText>Age</DataText>
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
            )
          }
          {
            visitorsData
            && (
              <Row>
                <ColumnCategory>
                  <DataText type="strong">Total</DataText>
                </ColumnCategory>
                <Cell>
                  <Row>
                    <Cell />
                    <DataCell type="strong">{visitorsData.totalVisitors ?? '0'}</DataCell>
                    <DataCell type="strong">{visitorsData.totalSurveys ?? '0'}</DataCell>
                  </Row>
                </Cell>
              </Row>
            )
          }
        </Table>
      </StyledView>
      <StyledView
        width="100%"
        padding={20}
        overflow="visible"
        alignItems="center"
      >
        <DataText
          type="strong"
          textAlign="center"
          paddingBottom={20}
        >Patient List
        </DataText>
        <Table>
          <HeaderRow>
            <DataCell type="strong">Name</DataCell>
            <DataCell type="strong">Gender</DataCell>
            <DataCell type="strong">Age</DataCell>
            <DataCell type="strong">Referred to</DataCell>
          </HeaderRow>
          { referralsData
              && referralsData.map(patient => (
                <Row key={patient.id}>
                  <DataCell>{`${patient.firstName} ${patient.lastName}`}</DataCell>
                  <DataCell>{patient.sex}</DataCell>
                  <DataCell>
                    {differenceInYears(new Date(), parseISO(patient.dateOfBirth))}
                  </DataCell>
                  <DataCell>{patient.referredTo}</DataCell>
                </Row>
              ))}
        </Table>
      </StyledView>
    </StyledView>
  );
};
