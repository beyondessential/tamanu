import { StyledView } from '/styled/common';
import React, { FC, FunctionComponent, PropsWithChildren, useMemo } from 'react';
import { IAdministeredVaccine } from '~/types';
import { VaccineStatus } from '~/ui/helpers/patient';
import GivenOnTimeFields from './GivenOnTimeFields';
import { NotGivenFields } from './NotGivenFields';
import { VaccineCardHeader } from './VaccineCardHeader';
import { VaccineStatusHeader } from './VaccineStatusHeader';

export type VaccineDataProps = {
  administeredVaccine: IAdministeredVaccine;
  status: VaccineStatus;
  name: string;
  code: string;
};

interface VaccineCardProps {
  vaccineData: VaccineDataProps;
  onCloseModal: () => void;
  onEditDetails: () => void;
}

export const VaccineCard: FunctionComponent<PropsWithChildren<VaccineCardProps>> = ({
  vaccineData,
  onCloseModal,
  onEditDetails,
}: VaccineCardProps) => {
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
    <StyledView>
      <VaccineCardHeader
        name={vaccineData.name}
        code={vaccineData.code}
        status={vaccineData.status}
        onCloseModal={onCloseModal}
        onEditDetails={onEditDetails}
      />
      <VaccineStatusHeader status={vaccineData.status} />
      <Fields {...vaccineData} />
    </StyledView>
  );
};
