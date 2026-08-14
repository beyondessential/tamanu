import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ReferenceDataType } from '~/types';
import { Database } from '~/infra/db';
import { referenceKeys } from '~/ui/hooks/queries/queryKeys';
import { BaseInputProps } from '~/ui/interfaces/BaseInputProps';
import { Dropdown } from '../Dropdown';

interface ReferenceDataFieldProps extends BaseInputProps {
  value: string;
  onChange: () => void;
  referenceDataType: ReferenceDataType;
  disabled: boolean;
}

export const ReferenceDataField = React.memo(({
  value,
  onChange,
  referenceDataType,
}: ReferenceDataFieldProps): JSX.Element => {
  const { data } = useQuery({
    queryKey: referenceKeys.dataByType(referenceDataType),
    queryFn: () =>
      Database.models.ReferenceData.getRepository().find({
        where: {
          type: referenceDataType,
        },
      }),
  });
  const dropdownItems = (data ?? []).map(item => ({ label: item.name, value: item.id }));

  return (
    <Dropdown
      value={value}
      onChange={onChange}
      options={dropdownItems}
    />
  );
});
