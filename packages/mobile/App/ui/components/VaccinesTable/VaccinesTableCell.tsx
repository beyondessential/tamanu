import React, { useCallback } from 'react';
import { Alert } from 'react-native';
import type { IAdministeredVaccine, IPatient, IScheduledVaccine } from '~/types';
import type { VaccineStatusMessage } from '~/ui/helpers/getVaccineStatus';
import { VaccineStatus } from '~/ui/helpers/patient';
import { useTranslation } from '/contexts/TranslationContext';
import { VaccineStatusCells } from '/helpers/constants';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { CenterView, StyledImage, StyledTouchableOpacity, StyledView } from '/styled/common';
import { theme } from '/styled/theme';

export interface VaccineTableCellData {
  administeredVaccine: IAdministeredVaccine;
  patientAdministeredVaccines: IAdministeredVaccine[];
  scheduledVaccine: IScheduledVaccine;
  vaccineStatus: VaccineStatus;
  patient: IPatient;
  label: string;
  dueStatus: VaccineStatusMessage;
}

interface VaccineTableCellProps {
  data: VaccineTableCellData;
  onPress?: (item: any) => void;
  id?: string;
  status: VaccineStatus;
}

export const CellContent = ({
  cellStatus,
  vaccineStatus,
}: {
  vaccineStatus?: string;
  cellStatus?: string;
}): JSX.Element => {
  const cellData = VaccineStatusCells[cellStatus] || VaccineStatusCells[vaccineStatus];
  const Icon = cellData.Icon;

  return (
    <StyledView
      style={{
        width: 85,
        height: 80,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: theme.colors.BOX_OUTLINE,
        backgroundColor: cellData.background,
        alignItems: 'center',
      }}
    >
      {cellStatus ? (
        <CenterView flex={1}>
          <Icon size={screenPercentageToDP(4.13, Orientation.Height)} />
        </CenterView>
      ) : (
        <StyledImage source={require('../../assets/NullValueCell.png')} />
      )}
    </StyledView>
  );
};

export const VaccineTableCell = ({ data, status, onPress }: VaccineTableCellProps): JSX.Element => {
  const { getTranslation } = useTranslation();
  const { scheduledVaccine, administeredVaccine, vaccineStatus, dueStatus } = data;
  const {
    vaccine: drug,
    id: scheduledVaccineId,
    label: scheduledVaccineLabel,
    doseLabel,
  } = scheduledVaccine;

  const cellStatus = vaccineStatus === VaccineStatus.SCHEDULED ? dueStatus.status : status;

  const onAdminister = useCallback(() => {
    onPress({
      ...drug,
      status: vaccineStatus,
      scheduledVaccineId,
      scheduledVaccineLabel,
      doseLabel,
      administeredVaccine,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const onPressItem = useCallback(() => {
    if (cellStatus !== VaccineStatus.GIVEN && dueStatus.warningMessage) {
      Alert.alert(
        getTranslation('vaccine.warning.title', 'Administer vaccine?'),
        dueStatus.warningMessage,
        [
          { text: getTranslation('general.action.dismiss', 'Dismiss'), style: 'cancel' },
          {
            text: getTranslation('vaccine.action.administerAnyway', 'Administer anyway'),
            style: 'destructive',
            onPress: onAdminister,
          },
        ],
      );
      return;
    }

    if (vaccineStatus) onAdminister();
  }, [cellStatus, dueStatus.warningMessage, getTranslation, onAdminister, vaccineStatus]);

  return (
    <StyledTouchableOpacity onPress={onPressItem}>
      <CellContent vaccineStatus={vaccineStatus} cellStatus={cellStatus} />
    </StyledTouchableOpacity>
  );
};
