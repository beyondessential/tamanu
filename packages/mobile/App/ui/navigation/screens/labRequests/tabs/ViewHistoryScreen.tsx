import React, { ReactElement, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { compose } from 'redux';
import { Routes } from '/helpers/routes';
import { Svg, Circle } from 'react-native-svg';
import { parseISO } from 'date-fns';
import { ErrorScreen } from '~/ui/components/ErrorScreen';
import { LoadingScreen } from '~/ui/components/LoadingScreen';
import { withPatient } from '~/ui/containers/Patient';
import { useBackendEffect } from '~/ui/hooks';
import { ILabRequest } from '~/types';
import { navigateAfterTimeout } from '~/ui/helpers/navigators';
import { StyledView, StyledText } from '/styled/common';
import { theme } from '/styled/theme';
import { formatDate } from '/helpers/date';
import { DateFormats } from '~/ui/helpers/constants';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { getSyncTick, LAST_SUCCESSFUL_PUSH } from '~/services/sync';

const SyncStatusindicator = ({ synced }): JSX.Element => (
  <StyledView flexDirection="row">
    <Svg height="20" width="20">
      <Circle fill={synced ? 'green' : 'red'} r={5} cx={10} cy={10} />
    </Svg>
    <StyledText color={theme.colors.TEXT_DARK} fontSize={13}>
      {synced ? 'Synced' : 'Syncing'}
    </StyledText>
  </StyledView>
);
interface LabRequestRowProps {
  labRequest: ILabRequest;
  synced: boolean;
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

const LabRequestRow = ({ labRequest, synced }: LabRequestRowProps): JSX.Element => {
  let date: string;
  try {
    date = formatDate(parseISO(labRequest.requestedDate), DateFormats.DAY_MONTH_YEAR_SHORT);
  } catch (e) {
    console.warn(e, labRequest.requestedDate);
    date = '-';
  }
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
              {labRequest.displayId === 'NO_DISPLAY_ID' ? '' : labRequest.displayId}
            </StyledText>
          </View>
        )}
      </StyledView>
      <StyledView width={screenPercentageToDP(23, Orientation.Width)}>
        <StyledText color={theme.colors.TEXT_DARK} fontSize={13}>
          {date}
        </StyledText>
      </StyledView>
      <StyledView width={screenPercentageToDP(20, Orientation.Width)}>
        <StyledText fontWeight="bold" color={theme.colors.TEXT_DARK} fontSize={13}>
          {labRequest.labTestCategory.name}
        </StyledText>
      </StyledView>
      <StyledView width={screenPercentageToDP(35, Orientation.Width)}>
        <SyncStatusindicator synced={synced} />
      </StyledView>
    </StyledView>
  );
};

export const DumbViewHistoryScreen = ({ selectedPatient, navigation }): ReactElement => {
  const [data, error] = useBackendEffect(
    ({ models }) => models.LabRequest.getForPatient(selectedPatient.id),
    [selectedPatient],
  );

  const [lastSuccessfulPushTick] = useBackendEffect(
    ({ models }) => getSyncTick(models, LAST_SUCCESSFUL_PUSH),
    [],
  );

  useEffect(() => {
    if (!data) return;
    if (data.length === 0) {
      navigateAfterTimeout(navigation, Routes.HomeStack.LabRequestStack.LabRequestTabs.NewRequest);
    }
  }, [data]);

  if (error) return <ErrorScreen error={error} />;
  if (!data || !lastSuccessfulPushTick) return <LoadingScreen />;

  const rows = data.map(labRequest => {
    const synced = labRequest.updatedAtSyncTick <= lastSuccessfulPushTick;

    return <LabRequestRow key={labRequest.id} labRequest={labRequest} synced={synced} />;
  });

  return (
    <>
      <ScrollView>{rows}</ScrollView>
    </>
  );
};

export const ViewHistoryScreen = compose(withPatient)(DumbViewHistoryScreen);
