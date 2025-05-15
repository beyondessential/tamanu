import React, { ReactElement } from 'react';
import { StyledView } from '/styled/common';
import { PATIENT_DATA_FIELDS } from '~/ui/helpers/patient';
import { HierarchyFields } from '../../HierarchyFields';
import { screenPercentageToDP, Orientation } from '~/ui/helpers/screen';
import { theme } from '~/ui/styled/theme';
import { TranslatedText } from '../../Translations/TranslatedText';
import { StyledText } from '~/ui/styled/common';
import { ADDITIONAL_DATA_FIELDS } from '~/ui/helpers/additionalData';
import { ReferenceDataType } from '~/types/IReferenceData';
import { ADDRESS_HIERARCHY_FIELD_ID } from '~/ui/navigation/screens/home/PatientDetails/fields';

export const ADDRESS_HIERARCHY_FIELDS = [
  {
    name: ADDITIONAL_DATA_FIELDS.DIVISION_ID,
    referenceType: ReferenceDataType.Division,
    label: (
      <TranslatedText stringId="general.localisedField.divisionId.label" fallback="Division" />
    ),
  },
  {
    name: ADDITIONAL_DATA_FIELDS.SUBDIVISION_ID,
    referenceType: ReferenceDataType.SubDivision,
    label: (
      <TranslatedText
        stringId="general.localisedField.subdivisionId.label"
        fallback="Sub division"
      />
    ),
  },
  {
    name: ADDITIONAL_DATA_FIELDS.SETTLEMENT_ID,
    referenceType: ReferenceDataType.Settlement,
    label: (
      <TranslatedText stringId="general.localisedField.settlementId.label" fallback="Settlement" />
    ),
  },
  {
    name: PATIENT_DATA_FIELDS.VILLAGE_ID,
    referenceType: ReferenceDataType.Village,
    label: <TranslatedText stringId="general.localisedField.villageId.label" fallback="Village" />,
  },
];

const AddressHierarchyField = ({ isEdit }): ReactElement => {
  if (isEdit) {
    return <HierarchyFields fields={ADDRESS_HIERARCHY_FIELDS} />;
  }

  return (
    <StyledView>
      <StyledText
        color={theme.colors.TEXT_SUPER_DARK}
        fontSize={screenPercentageToDP(2.4, Orientation.Height)}
        fontWeight={500}
        marginBottom={screenPercentageToDP(1.2, Orientation.Height)}
      >
        <TranslatedText
          stringId={'patient.details.subheading.currentAddress'}
          fallback={'Current address'}
        />
      </StyledText>
      <HierarchyFields fields={ADDRESS_HIERARCHY_FIELDS} />
    </StyledView>
  );
};

export const hierarchyFieldComponents = {
  [ADDRESS_HIERARCHY_FIELD_ID]: AddressHierarchyField,
};
