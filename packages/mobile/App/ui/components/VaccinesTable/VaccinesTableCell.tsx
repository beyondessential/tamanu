import React, { memo, useCallback } from 'react';
import { Popup } from 'popup-ui';
import { CenterView, StyledImage, StyledTouchableOpacity, StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import { VaccineStatusCells } from '/helpers/constants';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { IAdministeredVaccine, IPatient, IScheduledVaccine } from '~/types';
import { VaccineStatus } from '~/ui/helpers/patient';
import { BypassWarningIcon } from './BypassWarningIcon';
import { VaccineStatusMessage } from '~/ui/helpers/getVaccineStatus';

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
}

export const CellContent = ({
  cellStatus,
  status,
}: {
  status?: string;
  cellStatus?: string;
}): JSX.Element => {
  const cellData = VaccineStatusCells[cellStatus] || VaccineStatusCells[status];
  const Icon = cellData.Icon;

  return (
    <StyledView
      width={85}
      borderRightWidth={1}
      borderColor={theme.colors.BOX_OUTLINE}
      background={cellData.background}
      borderBottomWidth={1}
      height={80}
      alignItems="center"
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

export const VaccineTableCell = memo(
  ({ data, onPress }: VaccineTableCellProps): JSX.Element => {
    const { scheduledVaccine, administeredVaccine, vaccineStatus, dueStatus } = data;
    const { vaccine, id: scheduledVaccineId } = scheduledVaccine;

    let cellStatus = vaccineStatus || dueStatus.status || VaccineStatus.UNKNOWN;
    if (vaccineStatus === VaccineStatus.SCHEDULED) cellStatus = dueStatus.status;

    const onAdminister = useCallback(() => {
      onPress({ ...vaccine, status: vaccineStatus, id: scheduledVaccineId, administeredVaccine });
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
          buttonText: 'Ok',
          callback: (): void => Popup.hide(),
          icon: <BypassWarningIcon onBypassWarning={onAdminister} />,
        });

        return;
      }

      if (vaccineStatus) {
        onAdminister();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data]);

    return (
      <StyledTouchableOpacity onPress={onPressItem}>
        <CellContent status={vaccineStatus} cellStatus={cellStatus} />
      </StyledTouchableOpacity>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.id === nextProps.id;
  },
);
