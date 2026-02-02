import React, { ReactElement, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { compose } from 'redux';
import { Routes } from '/helpers/routes';
import { Circle, Svg } from 'react-native-svg';
import { ErrorScreen } from '~/ui/components/ErrorScreen';
import { LoadingScreen } from '~/ui/components/LoadingScreen';
import { withPatient } from '~/ui/containers/Patient';
import { useBackendEffect } from '~/ui/hooks';
import { ILabRequest } from '~/types';
import { navigateAfterTimeout } from '~/ui/helpers/navigators';
import { StyledText, StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { getSyncTick, LAST_SUCCESSFUL_PUSH } from '~/services/sync';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { TranslatedReferenceData } from '~/ui/components/Translations/TranslatedReferenceData';
import { useAuth } from '~/ui/contexts/AuthContext';
import { useDateTimeFormat } from '~/ui/contexts/DateTimeContext';

const SyncStatusIndicator = ({ synced }): JSX.Element => (
  <StyledView flexDirection="row">
    <Svg height="20" width="20">
      <Circle fill={synced ? 'green' : 'red'} r={5} cx={10} cy={10} />
    </Svg>
    <StyledText color={theme.colors.TEXT_DARK} fontSize={13}>
      {synced ? (
        <TranslatedText stringId="general.synced.label" fallback="Synced" />
      ) : (
        <TranslatedText stringId="general.syncing.label" fallback="Syncing" />
      )}
    </StyledText>
  </StyledView>
);

interface LabRequestRowProps {
  labRequest: ILabRequest;
  synced: boolean;
  formatShort: (date: string) => string | null;
}

const styles = StyleSheet.create({
  row: {
    minHeight: 50,
    maxWidth: '100%',
    justifyContent: 'space-between',
    flexDirection: 'row',
    flexGrow: 1,
    alignItems: 'center',
    marginLeft: 15,
    marginRight: 15,
    borderBottomWidth: 1,
    borderColor: theme.colors.BOX_OUTLINE,
  },
  text: {
    fontSize: 11,
    color: theme.colors.TEXT_DARK,
  },
});

const LabRequestRow = ({ labRequest, synced, formatShort }: LabRequestRowProps): JSX.Element => {
  const date = formatShort(labRequest.requestedDate) || '-';
  return (
    <StyledView style={styles.row}>
      <StyledView width={screenPercentageToDP(22, Orientation.Width)}>
        <StyledText style={styles.text}>
          {labRequest.displayId === 'NO_DISPLAY_ID' ? '' : labRequest.displayId}
        </StyledText>
      </StyledView>
      <StyledView width={screenPercentageToDP(23, Orientation.Width)}>
        <StyledText style={styles.text}>{date}</StyledText>
      </StyledView>
      <StyledView width={screenPercentageToDP(25, Orientation.Width)}>
        <StyledText style={styles.text}>
          <TranslatedReferenceData
            fallback={labRequest.labTestCategory.name}
            value={labRequest.labTestCategory.id}
            category="labTestCategory"
          />
        </StyledText>
      </StyledView>
      <StyledView width={screenPercentageToDP(30, Orientation.Width)}>
        <SyncStatusIndicator synced={synced} />
      </StyledView>
    </StyledView>
  );
};

export const DumbViewHistoryScreen = ({ selectedPatient, navigation }): ReactElement => {
  const { ability } = useAuth();
  const { formatShort } = useDateTimeFormat();
  const canListSensitive = ability.can('create', 'SensitiveLabRequest');
  const [data, error] = useBackendEffect(
    ({ models }) => models.LabRequest.getForPatient(selectedPatient.id, canListSensitive),
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

    return <LabRequestRow key={labRequest.id} labRequest={labRequest} synced={synced} formatShort={formatShort} />;
  });

  return <ScrollView>{rows}</ScrollView>;
};

export const ViewHistoryScreen = compose(withPatient)(DumbViewHistoryScreen);
