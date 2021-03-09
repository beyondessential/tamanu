import { differenceInYears, format, parseISO } from 'date-fns';
import React, { FC } from 'react';
import { Text } from 'react-native';
import { screenPercentageToDP, Orientation } from '~/ui/helpers/screen';
import { useBackendEffect } from '~/ui/hooks';
import { StyledView, RowView, StyledText } from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';
import { Table, Row, ColumnCategory, Cell, BorderRow, HeaderRow } from './DetailedReportStyledComponents';
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
          <BorderRow>
            <Cell />
            <Cell />
            <Cell>
              <StyledText
                fontSize={screenPercentageToDP(1.8, Orientation.Height)}
                color={theme.colors.TEXT_SUPER_DARK}
                fontWeight={700}
                textAlign="center"
              >Number attended
              </StyledText>
            </Cell>
            <Cell>
              <StyledText
                fontSize={screenPercentageToDP(1.8, Orientation.Height)}
                color={theme.colors.TEXT_SUPER_DARK}
                fontWeight={700}
                textAlign="center"
              >Number screened
              </StyledText>
            </Cell>
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
                    <Cell>
                      <StyledText
                        fontSize={screenPercentageToDP(1.7, Orientation.Height)}
                        color={theme.colors.TEXT_DARK}
                        fontWeight={500}
                      >Male
                      </StyledText>
                    </Cell>
                    <Cell>
                      <StyledText
                        fontSize={screenPercentageToDP(1.7, Orientation.Height)}
                        color={theme.colors.TEXT_DARK}
                        fontWeight={500}
                      >{maleData?.totalVisitors || '0'}
                      </StyledText>
                    </Cell>
                    <Cell>
                      <StyledText
                        fontSize={screenPercentageToDP(1.7, Orientation.Height)}
                        color={theme.colors.TEXT_DARK}
                        fontWeight={500}
                      >{maleData?.totalSurveys || '0'}
                      </StyledText>
                    </Cell>
                  </BorderRow>
                  <Row>
                    <Cell>
                      <StyledText
                        fontSize={screenPercentageToDP(1.7, Orientation.Height)}
                        color={theme.colors.TEXT_DARK}
                        fontWeight={500}
                      >Female
                      </StyledText>
                    </Cell>
                    <Cell>
                      <StyledText
                        fontSize={screenPercentageToDP(1.7, Orientation.Height)}
                        color={theme.colors.TEXT_DARK}
                        fontWeight={500}
                      >{femaleData?.totalVisitors || '0'}
                      </StyledText>
                    </Cell>
                    <Cell>
                      <StyledText
                        fontSize={screenPercentageToDP(1.7, Orientation.Height)}
                        color={theme.colors.TEXT_DARK}
                        fontWeight={500}
                      >{femaleData?.totalSurveys || '0'}
                      </StyledText>
                    </Cell>
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
                  <StyledText
                    fontSize={screenPercentageToDP(1.7, Orientation.Height)}
                    color={theme.colors.TEXT_DARK}
                    fontWeight={700}
                  >Age
                  </StyledText>
                </ColumnCategory>
                <Cell>
                  <BorderRow>
                    <Cell>
                      <StyledText
                        fontSize={screenPercentageToDP(1.7, Orientation.Height)}
                        color={theme.colors.TEXT_DARK}
                        fontWeight={500}
                      >&lt;30
                      </StyledText>
                    </Cell>
                    <Cell>
                      <StyledText
                        fontSize={screenPercentageToDP(1.7, Orientation.Height)}
                        color={theme.colors.TEXT_DARK}
                        fontWeight={500}
                      >{youngData?.totalVisitors || '0'}
                      </StyledText>
                    </Cell>
                    <Cell>
                      <StyledText
                        fontSize={screenPercentageToDP(1.7, Orientation.Height)}
                        color={theme.colors.TEXT_DARK}
                        fontWeight={500}
                      >{youngData?.totalSurveys || '0'}
                      </StyledText>
                    </Cell>
                  </BorderRow>
                  <Row>
                    <Cell>
                      <StyledText
                        fontSize={screenPercentageToDP(1.7, Orientation.Height)}
                        color={theme.colors.TEXT_DARK}
                        fontWeight={500}
                      >30+
                      </StyledText>
                    </Cell>
                    <Cell>
                      <StyledText
                        fontSize={screenPercentageToDP(1.7, Orientation.Height)}
                        color={theme.colors.TEXT_DARK}
                        fontWeight={500}
                      >{oldData?.totalVisitors || '0'}
                      </StyledText>
                    </Cell>
                    <Cell>
                      <StyledText
                        fontSize={screenPercentageToDP(1.7, Orientation.Height)}
                        color={theme.colors.TEXT_DARK}
                        fontWeight={500}
                      >{oldData?.totalSurveys || '0'}
                      </StyledText>
                    </Cell>
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
                  <StyledText
                    fontSize={screenPercentageToDP(1.7, Orientation.Height)}
                    color={theme.colors.TEXT_SUPER_DARK}
                    fontWeight={700}
                  >Total
                  </StyledText>
                </ColumnCategory>
                <Cell>
                  <Row>
                    <Cell />
                    <Cell>
                      <StyledText
                        fontSize={screenPercentageToDP(1.7, Orientation.Height)}
                        color={theme.colors.TEXT_SUPER_DARK}
                        fontWeight={700}
                      >{visitorsData.totalVisitors ?? '0'}
                      </StyledText>
                    </Cell>
                    <Cell>
                      <StyledText
                        fontSize={screenPercentageToDP(1.7, Orientation.Height)}
                        color={theme.colors.TEXT_SUPER_DARK}
                        fontWeight={700}
                      >{visitorsData.totalSurveys ?? '0'}
                      </StyledText>
                    </Cell>
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
        <StyledText
          fontSize={screenPercentageToDP(1.9, Orientation.Height)}
          color={theme.colors.TEXT_SUPER_DARK}
          fontWeight={700}
          textAlign="center"
          paddingBottom={20}
        >Patient List
        </StyledText>
        <Table>
          <HeaderRow>
            <Cell>
              <StyledText
                fontSize={screenPercentageToDP(1.7, Orientation.Height)}
                color={theme.colors.TEXT_DARK}
                fontWeight={700}
              >Name
              </StyledText>
            </Cell>
            <Cell>
              <StyledText
                fontSize={screenPercentageToDP(1.7, Orientation.Height)}
                color={theme.colors.TEXT_DARK}
                fontWeight={700}
              >Gender
              </StyledText>
            </Cell>
            <Cell>
              <StyledText
                fontSize={screenPercentageToDP(1.7, Orientation.Height)}
                color={theme.colors.TEXT_DARK}
                fontWeight={700}
              >Age
              </StyledText>
            </Cell>
            <Cell>
              <StyledText
                fontSize={screenPercentageToDP(1.7, Orientation.Height)}
                color={theme.colors.TEXT_DARK}
                fontWeight={700}
              >Referred to
              </StyledText>
            </Cell>
          </HeaderRow>
          { referralsData &&
          referralsData.map(patient => (
            <Row key={patient.id}>
              <Cell>
                <StyledText
                  fontSize={screenPercentageToDP(1.7, Orientation.Height)}
                  color={theme.colors.TEXT_DARK}
                  fontWeight={700}
                >{`${patient.firstName} ${patient.lastName}`}
                </StyledText>
              </Cell>
              <Cell>
                <StyledText
                  fontSize={screenPercentageToDP(1.7, Orientation.Height)}
                  color={theme.colors.TEXT_DARK}
                  fontWeight={700}
                >{patient.sex}
                </StyledText>
              </Cell>
              <Cell>
                <StyledText
                  fontSize={screenPercentageToDP(1.7, Orientation.Height)}
                  color={theme.colors.TEXT_DARK}
                  fontWeight={700}
                >{differenceInYears(new Date(), parseISO(patient.dateOfBirth))}
                </StyledText>
              </Cell>
              <Cell>
                <StyledText
                  fontSize={screenPercentageToDP(1.7, Orientation.Height)}
                  color={theme.colors.TEXT_DARK}
                  fontWeight={700}
                >{patient.referredTo}
                </StyledText>
              </Cell>
            </Row>
          ))}
        </Table>
      </StyledView>
    </StyledView>
  );
};
