import React, { useState, useCallback, ReactElement, useMemo, useEffect } from 'react';
import { TouchableWithoutFeedback, Platform, StyleSheet } from 'react-native';
import { ReferenceDataType } from '~/types';
import { useBackend } from '~/ui/hooks';
import { BaseInputProps } from '~/ui/interfaces/BaseInputProps';
import { StyledView, StyledText } from '~/ui/styled/common';
import { Button } from '../Button';
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
  label,
  error,
  referenceDataType,
  disabled = false,
  required = false,
}: ReferenceDataFieldProps): JSX.Element => {
  const { models } = useBackend();
  const [dropdownItems, setDropdownItems] = useState([]);

  useEffect(() => {
    (async (): Promise<void> => {
      const repo = models.ReferenceData.getRepository();
      const data = await repo.find({
        where: {
          type: referenceDataType,
        },
      });

      setDropdownItems(data.map(item => ({ label: item.name, value: item.id })));
    })();
  }, []);

  return (
    <Dropdown
      value={value}
      onChange={onChange}
      options={dropdownItems}
    />
  );
});
