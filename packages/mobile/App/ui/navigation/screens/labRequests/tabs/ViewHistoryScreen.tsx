import React, { ReactElement } from 'react';
import { View, StyleSheet } from 'react-native';
import { compose } from 'redux';
import { ErrorScreen } from '~/ui/components/ErrorScreen';
import { LoadingScreen } from '~/ui/components/LoadingScreen';
import { withPatient } from '~/ui/containers/Patient';
import { useBackendEffect } from '~/ui/hooks';
import { ILabRequest } from '~/types';
import { StyledView, StyledText } from '/styled/common';
import { theme } from '/styled/theme';
import { ScrollView } from 'react-native-gesture-handler';
import { formatDate } from '/helpers/date';
import { DateFormats, LabRequestStatus } from '~/ui/helpers/constants';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { Svg, Circle } from 'react-native-svg';

const SyncStatusindicator = ({ synced }) => {
  return (
    <StyledView flexDirection="row">
      <Svg height="20" width="20">
        <Circle fill={synced ? 'green' : 'red'} r={5} cx={10} cy={10} />
      </Svg>
      <StyledText color={theme.colors.TEXT_DARK} fontSize={13}>{synced ? 'Synced' : 'Syncing'}</StyledText>
    </StyledView>
  );
};
interface LabRequestRowProps {
  labRequest: ILabRequest;
}

const styles = StyleSheet.create({
  displayId: {
    paddingVertical: 6,
    borderRadius: 2,
    marginRight: 8,
    backgroundColor: theme.colors.SECONDARY_MAIN,
    justifyContent: 'center',
  },
});

const LabRequestRow = ({ labRequest }: LabRequestRowProps): JSX.Element => (
  <StyledView
    minHeight={40}
    maxWidth="100%"
    justifyContent="space-between"
    flexDirection="row"
    flexGrow={1}
    alignItems="center"
    paddingLeft={16}
    paddingRight={16}
    background={theme.colors.BACKGROUND_GREY}
    borderBottomWidth={0.5}
    borderColor={theme.colors.DISABLED_GREY}
  >
    <StyledView width={screenPercentageToDP(17, Orientation.Width)}>
      {labRequest.displayId === 'NO_DISPLAY_ID' ? null : (
        <View style={styles.displayId}>
          <StyledText
            fontWeight="bold"
            fontSize={11}
            color={theme.colors.LIGHT_BLUE}
            textAlign="center"
          >
            {labRequest.displayId === 'NO_DISPLAY_ID'
              ? ''
              : labRequest.displayId}
          </StyledText>
        </View>
      )}
    </StyledView>
    <StyledView width={screenPercentageToDP(23, Orientation.Width)}>
      <StyledText color={theme.colors.TEXT_DARK} fontSize={13}>
        {formatDate(
          labRequest.requestedDate,
          DateFormats.DAY_MONTH_YEAR_SHORT,
        )}
      </StyledText>
    </StyledView>
    <StyledView width={screenPercentageToDP(20, Orientation.Width)}>
      <StyledText
        fontWeight="bold"
        color={theme.colors.TEXT_DARK}
        fontSize={13}
      >
        {labRequest.labTestCategory.name}
      </StyledText>
    </StyledView>
    <StyledView width={screenPercentageToDP(35, Orientation.Width)}>
      <SyncStatusindicator synced={!labRequest.markedForUpload || !labRequest.encounter.markedForUpload}/>
    </StyledView>
  </StyledView>
);

export const DumbViewHistoryScreen = ({ selectedPatient }): ReactElement => {
  const [data, error] = useBackendEffect(
    ({ models }) => models.LabRequest.getForPatient(selectedPatient.id),
    [],
  );

  if (error) return <ErrorScreen error={error} />;
  if (!data) return <LoadingScreen />;

  const rows = data.map(labRequest => (
    <LabRequestRow key={labRequest.id} labRequest={labRequest} />
  ));

  return (
    <>
      <ScrollView>{rows}</ScrollView>
    </>
  );
};

export const ViewHistoryScreen = compose(withPatient)(DumbViewHistoryScreen);
