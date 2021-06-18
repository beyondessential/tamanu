import React, { ReactElement } from 'react';
import { compose } from 'redux';
import { ErrorScreen } from '~/ui/components/ErrorScreen';
import { LoadingScreen } from '~/ui/components/LoadingScreen';
import { withPatient } from '~/ui/containers/Patient';
import { useBackendEffect } from '~/ui/hooks';
import { Text } from 'react-native';
import { ILabRequest } from '~/types';
import { StyledView, StyledText, FullView } from '/styled/common';
import { theme } from '/styled/theme';
import { ScrollView } from 'react-native-gesture-handler';
import { formatDate } from '/helpers/date';
import { DateFormats } from '~/ui/helpers/constants';

interface LabRequestRowProps {
  labRequest: ILabRequest,
  index: number,
}
const LabRequestRow = ({ labRequest, index }: LabRequestRowProps): JSX.Element => {
  return (
  <StyledView
    minHeight={40}
    maxWidth="100%"
    justifyContent="space-between"
    flexDirection="row"
    flexGrow={1}
    alignItems="center"
    paddingLeft={16}
    paddingRight={16}
    background={index % 2 ? theme.colors.WHITE : theme.colors.BACKGROUND_GREY}
  >
    <StyledView maxWidth="80%">
      <StyledText fontWeight="bold" color={theme.colors.LIGHT_BLUE}>
        {labRequest.displayId}
      </StyledText>
      <StyledText fontWeight="bold" color={theme.colors.LIGHT_BLUE}>
        {formatDate(labRequest.requestedDate, DateFormats.DAY_MONTH_YEAR_SHORT)}
      </StyledText>
      <StyledText fontWeight="bold" color={theme.colors.LIGHT_BLUE}>
        {labRequest.category?.name || 'Covid swab'}
      </StyledText>
    </StyledView>
    <StyledView alignItems="flex-end" justifyContent="center" maxWidth="60%" > 
      <StyledText fontWeight="bold" color={theme.colors.LIGHT_BLUE}>
        {labRequest.status}
      </StyledText>
    </StyledView>
  </StyledView>
);
    }

export const DumbViewHistoryScreen = ({ selectedPatient }): ReactElement => {
  const [data, error] = useBackendEffect(
    ({ models }) => models.LabRequest.getForPatient(selectedPatient.id),
    [],
  );

  if (error) return <ErrorScreen error={error} />;
  if (!data) return <LoadingScreen />;

  const rows = data.map((labRequest, i) => <LabRequestRow key={labRequest.id} labRequest={labRequest} index={i} />);

  return (
    <>
      <StyledText>{'This list shows lab requests from this device only (although they should sync)'}</StyledText>
      <ScrollView>
        {rows}
      </ScrollView>
    </>
  );
};

export const ViewHistoryScreen = compose(withPatient)(DumbViewHistoryScreen);
