import React, {
  PropsWithChildren,
  FunctionComponent,
  useMemo,
  FC,
} from 'react';
import { StyledView } from '/styled/common';
import { VaccineCardHeader } from './VaccineCardHeader';
import { IAdministeredVaccine } from '~/types';
import { NotGivenFields } from './NotGivenFields';
import GivenOnTimeFields from './GivenOnTimeFields';
import { VaccineStatusHeader } from './VaccineStatusHeader';
import { VaccineStatus } from '~/ui/helpers/patient';

export type VaccineDataProps = {
  administeredVaccine: IAdministeredVaccine;
  status: string;
  name: string;
  code: string;
};

interface VaccineCardProps {
  vaccineData: VaccineDataProps;
  onCloseModal: () => void;
  onEditDetails: () => void;
}

export const VaccineCard: FunctionComponent<PropsWithChildren<
  VaccineCardProps
>> = ({ vaccineData, onCloseModal, onEditDetails }: VaccineCardProps) => {
  console.log({ vaccineData });
  const Fields: FC<VaccineDataProps> = useMemo(() => {
    switch (vaccineData.status) {
      case VaccineStatus.NOT_GIVEN:
        return NotGivenFields;
      case VaccineStatus.GIVEN:
        return GivenOnTimeFields;
      default:
        return GivenOnTimeFields;
    }
  }, [vaccineData.status]);
  return (
    <StyledView width="80.29%">
      <VaccineCardHeader
        name={vaccineData.name}
        code={vaccineData.code}
        schedule={vaccineData.administeredVaccine.scheduledVaccine.schedule}
        onCloseModal={onCloseModal}
        onEditDetails={onEditDetails}
      />
      <VaccineStatusHeader status={vaccineData.status} />
      <Fields {...vaccineData} />
    </StyledView>
  );
};
