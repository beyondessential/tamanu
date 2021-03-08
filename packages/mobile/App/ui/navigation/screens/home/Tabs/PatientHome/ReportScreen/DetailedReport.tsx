import { differenceInYears, format, parseISO } from 'date-fns';
import React, { FC } from 'react';
import { Text } from 'react-native';
import { screenPercentageToDP, Orientation } from '~/ui/helpers/screen';
import { useBackendEffect } from '~/ui/hooks';
import { StyledView, RowView, StyledText } from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';
import { Table, Row, ColumnCategory, Cell } from './DetailedReportStyledComponents';
import { DateFormats } from '/helpers/constants';

export const DetailedReport: FC = () => {
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
        <StyledText
          fontSize={screenPercentageToDP(1.7, Orientation.Height)}
          color={theme.colors.PRIMARY_MAIN}
          fontWeight={500}
        >
          {todayFormatted}
        </StyledText>
      </RowView>
      <StyledView
        width="100%"
        padding={20}
        overflow="visible"
        alignItems="center"
      >
        <Table>
          <Row>
            <Cell />
            <Cell />
            <Cell>
              <Text>Number attended</Text>
            </Cell>
            <Cell>
              <Text>Number screened</Text>
            </Cell>
          </Row>
          {
            genderData
            && (
              <Row>
                <ColumnCategory>
                  <Text>Gender</Text>
                </ColumnCategory>
                <Cell>
                  <Row>
                    <Cell><Text>Male</Text></Cell>
                    <Cell><Text>{maleData?.totalVisitors || '0'}</Text></Cell>
                    <Cell><Text>{maleData?.totalSurveys || '0'}</Text></Cell>
                  </Row>
                  <Row>
                    <Cell><Text>Female</Text></Cell>
                    <Cell><Text>{femaleData?.totalVisitors || '0'}</Text></Cell>
                    <Cell><Text>{femaleData?.totalSurveys || '0'}</Text></Cell>
                  </Row>
                </Cell>
              </Row>
            )
          }
          {
            ageData
            && (
              <Row>
                <ColumnCategory>
                  <Text>Age</Text>
                </ColumnCategory>
                <Cell>
                  <Row>
                    <Cell><Text>&lt;30</Text></Cell>
                    <Cell><Text>{youngData?.totalVisitors || '0'}</Text></Cell>
                    <Cell><Text>{youngData?.totalSurveys || '0'}</Text></Cell>
                  </Row>
                  <Row>
                    <Cell><Text>30+</Text></Cell>
                    <Cell><Text>{oldData?.totalVisitors || '0'}</Text></Cell>
                    <Cell><Text>{oldData?.totalSurveys || '0'}</Text></Cell>
                  </Row>
                </Cell>
              </Row>
            )
          }
          {
            visitorsData
            && (
              <Row>
                <ColumnCategory>
                  <Text>Total</Text>
                </ColumnCategory>
                <Cell>
                  <Row>
                    <Cell />
                    <Cell><Text>{visitorsData.totalVisitors ?? '0'}</Text></Cell>
                    <Cell><Text>{visitorsData.totalSurveys ?? '0'}</Text></Cell>
                  </Row>
                </Cell>
              </Row>
            )
          }
        </Table>
      </StyledView>
      <StyledView>
        <Text>Patient List</Text>
        <Table>
          <Row>
            <Cell>
              <Text>Name</Text>
            </Cell>
            <Cell>
              <Text>Gender</Text>
            </Cell>
            <Cell>
              <Text>Age</Text>
            </Cell>
            <Cell>
              <Text>Referred to</Text>
            </Cell>
          </Row>
          { referralsData &&
          referralsData.map(patient => (
            <Row key={patient.id}>
              <Cell>
                <Text>{`${patient.firstName} ${patient.lastName}`}</Text>
              </Cell>
              <Cell>
                <Text>{patient.sex}</Text>
              </Cell>
              <Cell>
                <Text>{differenceInYears(new Date(), parseISO(patient.dateOfBirth))}</Text>
              </Cell>
              <Cell>
                <Text>{patient.referredTo}</Text>
              </Cell>
            </Row>
          ))}
        </Table>
      </StyledView>
    </StyledView>
  );
};
