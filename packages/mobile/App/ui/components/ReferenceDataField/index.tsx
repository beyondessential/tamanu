import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ReferenceDataType } from '~/types';
import { Database } from '~/infra/db';
import { referenceKeys } from '~/ui/hooks/queries/queryKeys';
import { BaseInputProps } from '~/ui/interfaces/BaseInputProps';
import { Dropdown } from '../Dropdown';
import type { ReferenceData } from '~/models/ReferenceData';

interface ReferenceDataFieldProps extends BaseInputProps {
  value: string;
  onChange: () => void;
  referenceDataType: ReferenceDataType;
  disabled: boolean;
}

function selectDropdownItems(data: ReferenceData[]) {
  return data.map(item => ({ label: item.name, value: item.id }));
}

export const ReferenceDataField = React.memo(
  ({ value, onChange, referenceDataType }: ReferenceDataFieldProps): JSX.Element => {
    const { data: dropdownItems = [] } = useQuery({
      queryKey: referenceKeys.dataByType(referenceDataType),
      queryFn: async () => {
        const repo = Database.models.ReferenceData.getRepository();
        const where = { type: referenceDataType };
        return repo.find({ where });
      },
      select: selectDropdownItems,
    });

    return <Dropdown value={value} onChange={onChange} options={dropdownItems} />;
  },
);
