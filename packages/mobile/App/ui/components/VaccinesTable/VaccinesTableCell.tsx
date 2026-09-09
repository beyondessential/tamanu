import { Popup } from 'popup-ui';
import React, { useCallback } from 'react';
import type { IAdministeredVaccine, IPatient, IScheduledVaccine } from '~/types';
import type { VaccineStatusMessage } from '~/ui/helpers/getVaccineStatus';
import { VaccineStatus } from '~/ui/helpers/patient';
import { BypassWarningIcon } from './BypassWarningIcon';
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
    Popup.hide();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const onPressItem = useCallback(() => {
    if (cellStatus !== VaccineStatus.GIVEN && dueStatus.warningMessage) {
      Popup.show({
        type: 'Warning',
        title: 'Vaccination Warning',
        button: true,
        textBody: dueStatus.warningMessage,
        buttonText: getTranslation('general.action.ok', 'OK'),
        callback: (): void => Popup.hide(),
        icon: <BypassWarningIcon onBypassWarning={onAdminister} />,
      });

      return;
    }

    if (vaccineStatus) onAdminister();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <StyledTouchableOpacity onPress={onPressItem}>
      <CellContent vaccineStatus={vaccineStatus} cellStatus={cellStatus} />
    </StyledTouchableOpacity>
  );
};
