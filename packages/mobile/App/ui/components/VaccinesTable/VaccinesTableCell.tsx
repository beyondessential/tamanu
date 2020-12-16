import React, { ReactElement, useCallback } from 'react';
import { Popup } from 'popup-ui';
import {
  StyledView,
  StyledTouchableOpacity,
  StyledImage,
  CenterView,
} from '/styled/common';
import { theme } from '/styled/theme';
import { VaccineStatusCells } from '/helpers/constants';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { IAdministeredVaccine } from '~/types';
import { getVaccineStatus, VaccineStatus, ScheduledVaccineStatus } from '~/ui/helpers/patient';

interface VaccineCellMetadata {
   weeksUntilDue?: number;
   scheduledVaccineId?: string;
   status: VaccineStatus;
   schedule: ReactElement;
}

interface VaccineTableCellProps {
  vaccine: IAdministeredVaccine & VaccineCellMetadata;
  status: any;
  onPress?: (item: any) => void;
}

const CellContent = ({
  weeksUntilDue, status,
}: { weeksUntilDue: number | null; status: string | null }): ReactElement => {
  const dueStatus = getVaccineStatus(weeksUntilDue);
  let cellStatus = status || dueStatus;
  if (dueStatus === VaccineStatus.MISSED) cellStatus = dueStatus;
  const Icon = VaccineStatusCells[cellStatus].Icon;
  const background = VaccineStatusCells[cellStatus].background;

  return (
    <StyledView
      width={85}
      borderRightWidth={1}
      borderColor={theme.colors.BOX_OUTLINE}
      background={background}
      borderBottomWidth={1}
      height={80}
      alignItems="center"
    >
      {status
        ? (
          <CenterView flex={1}>
            <Icon size={screenPercentageToDP(4.13, Orientation.Height)} />
          </CenterView>
        ) : <StyledImage source={require('../../assets/NullValueCell.png')} />
      }
    </StyledView>
  );
};

export const VaccineTableCell = ({
  vaccine,
  onPress,
}: VaccineTableCellProps): JSX.Element => {
  const { weeksUntilDue, status } = vaccine;
  const vaccineStatus = getVaccineStatus(weeksUntilDue);
  const isVaccineEditable = status === ScheduledVaccineStatus.SCHEDULED;

  const onPressItem = useCallback(() => {
    if (vaccineStatus === VaccineStatus.NOT_DUE && status === ScheduledVaccineStatus.SCHEDULED) {
      Popup.show({
        type: 'Warning',
        title: 'Vaccine not due',
        button: true,
        textBody: `This patient should receive this vaccine in ${weeksUntilDue} weeks.`,
        buttonText: 'Ok',
        callback: () => Popup.hide(),
      });
    }
    if (vaccineStatus === VaccineStatus.MISSED && status === ScheduledVaccineStatus.SCHEDULED) {
      Popup.show({
        type: 'Warning',
        title: 'Vaccine missed',
        button: true,
        textBody:
          `Patient has missed this vaccine by ${Math.abs(weeksUntilDue)} weeks, please refer to the catchup schedule.`,
        buttonText: 'Ok',
        callback: () => Popup.hide(),
      });
    }

    if (vaccineStatus === VaccineStatus.DUE && isVaccineEditable) {
      onPress(vaccine);
    }
  }, [vaccine]);

  return (vaccine.status) ? (
    <StyledTouchableOpacity onPress={onPressItem}>
      <CellContent status={status} vaccine={vaccine} weeksUntilDue={weeksUntilDue} />
    </StyledTouchableOpacity>
  ) : (
    <CellContent status={null} weeksUntilDue={weeksUntilDue} />
  );
};

VaccineTableCell.defaultProps = {
  onPress: (): null => null,
};
