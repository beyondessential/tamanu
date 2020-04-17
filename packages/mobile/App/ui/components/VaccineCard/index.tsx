import React, {
  PropsWithChildren,
  FunctionComponent,
  useMemo,
  FC,
} from 'react';
import { StyleSheet } from 'react-native';
import { StyledView } from '/styled/common';
import { VaccineCardHeader } from './VaccineCardHeader';
import { VaccineModel } from '../../models/Vaccine';
import { VaccineStatus } from '/helpers/constants';
import { NotTakenFields } from './NotTakenFields';
import TakenOnTimeFields from './TakenOnTimeFields';
import { VaccineStatusHeader } from './VaccineStatusHeader';
import { TakenNotOnScheduleFields } from './TakenNotOnSchedule';

export type VaccineDataProps = VaccineModel & { dateType: string };

interface VaccineCardProps {
  vaccineData: VaccineDataProps;
  onCloseModal: () => void;
  onEditDetails: () => void;
}

export const VaccineCard: FunctionComponent<PropsWithChildren<
  VaccineCardProps
>> = ({ vaccineData, onCloseModal, onEditDetails }: VaccineCardProps) => {
  const Fields: FC<VaccineDataProps> = useMemo(() => {
    switch (vaccineData.status) {
      case VaccineStatus.NOT_TAKEN:
        return NotTakenFields;
      case VaccineStatus.TAKEN:
        return TakenOnTimeFields;
      case VaccineStatus.TAKEN_NOT_ON_TIME:
        return TakenNotOnScheduleFields;
      default:
        return TakenOnTimeFields;
    }
  }, [vaccineData.status]);
  return (
    <StyledView width="80.29%">
      <VaccineCardHeader
        vaccine={vaccineData}
        onCloseModal={onCloseModal}
        onEditDetails={onEditDetails}
      />
      <VaccineStatusHeader status={vaccineData.status} />
      <Fields {...vaccineData} />
    </StyledView>
  );
};
