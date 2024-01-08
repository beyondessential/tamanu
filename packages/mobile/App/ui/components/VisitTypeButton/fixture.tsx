import React, { useState, useCallback } from 'react';
import { RowView } from '/styled/common';
import { VisitTypeButton } from './index';
import { HeaderIcons, VisitTypes } from '/helpers/constants';

export function VisitButtonList(): JSX.Element {
  const [selectedType, selectType] = useState<string>('');
  const setType = useCallback(type => {
    selectType(type);
  }, []);

  return (
    <RowView width="100%" justifyContent="space-around">
      <VisitTypeButton
        Icon={HeaderIcons[VisitTypes.CLINIC]}
        type={VisitTypes.CLINIC}
        selected={selectedType === VisitTypes.CLINIC}
        onPress={setType}
        title=""
        subtitle=""
      />
      <VisitTypeButton
        Icon={HeaderIcons[VisitTypes.HOSPITAL]}
        type={VisitTypes.HOSPITAL}
        selected={selectedType === VisitTypes.HOSPITAL}
        onPress={setType}
        title=""
        subtitle=""
      />
      <VisitTypeButton
        Icon={HeaderIcons[VisitTypes.VISIT]}
        type={VisitTypes.VISIT}
        selected={selectedType === VisitTypes.VISIT}
        onPress={setType}
        title=""
        subtitle=""
      />
    </RowView>
  );
}
