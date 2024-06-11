import React from 'react';
import { AutocompleteField, TextField } from '../../../../../components';
import { ConfiguredMandatoryPatientFields } from '../../../ConfiguredMandatoryPatientFields';
import { TranslatedText } from '../../../../../components/Translation/TranslatedText';
import { LinkedField } from '../../../../../components/Field/LinkedField';
import { HierarchyFields } from '../../../../../components/Field/HierarchyFields';
import {
  PATIENT_FIELD_DEFINITION_TYPES,
  REFERENCE_DATA_RELATION_TYPES,
  REFERENCE_TYPES,
} from '@tamanu/constants';
import { useFilterPatientFields } from '../../../useFilterPatientFields';
import { PatientField } from '../../../PatientFields';

const HealthCenterLinkedVillageField = props => (
  <LinkedField
    {...props}
    linkedFieldName="healthCenterId"
    endpoint="referenceData/facilityCatchment/:id/facility"
    name="villageId"
    component={AutocompleteField}
  />
);

export const CambodiaLocationFields = ({ filterByMandatory, secondary }) => {
  const LOCATION_FIELDS = {
    streetVillage: {
      component: TextField,
      label: (
        <TranslatedText
          stringId="general.localisedField.streetVillage.label"
          fallback="Street No. & Name"
        />
      ),
    },
  };

  const CURRENT_LOCATION_HIERARCHY_FIELDS = {
    divisionId: {
      referenceType: REFERENCE_TYPES.DIVISION,
      label: (
        <TranslatedText stringId="general.localisedField.divisionId.label" fallback="Province" />
      ),
    },
    subdivisionId: {
      referenceType: REFERENCE_TYPES.SUBDIVISION,
      label: (
        <TranslatedText stringId="general.localisedField.subdivisionId.label" fallback="District" />
      ),
    },
    settlementId: {
      referenceType: REFERENCE_TYPES.SETTLEMENT,
      label: (
        <TranslatedText stringId="general.localisedField.settlementId.label" fallback="Commune" />
      ),
    },
    villageId: {
      component: HealthCenterLinkedVillageField,
      referenceType: REFERENCE_TYPES.VILLAGE,
      label: (
        <TranslatedText stringId="general.localisedField.villageId.label" fallback="Village" />
      ),
    },
  };

  const SECONDARY_LOCATION_HIERARCHY_FIELDS = {
    secondaryDivisionId: {
      referenceType: REFERENCE_TYPES.DIVISION,
      label: (
        <TranslatedText stringId="cambodiaPatientDetails.province.label" fallback="Province" />
      ),
    },
    secondarySubdivisionId: {
      referenceType: REFERENCE_TYPES.SUBDIVISION,
      label: (
        <TranslatedText stringId="cambodiaPatientDetails.district.label" fallback="District" />
      ),
    },
    secondarySettlementId: {
      referenceType: REFERENCE_TYPES.SETTLEMENT,
      label: <TranslatedText stringId="cambodiaPatientDetails.commune.label" fallback="Commune" />,
    },
    secondaryVillageId: {
      referenceType: REFERENCE_TYPES.VILLAGE,
      label: (
        <TranslatedText stringId="general.localisedField.villageId.label" fallback="Village" />
      ),
    },
  };

  const { fieldsToShow: locationHierarchyFieldsToShow } = useFilterPatientFields({
    fields: secondary ? SECONDARY_LOCATION_HIERARCHY_FIELDS : CURRENT_LOCATION_HIERARCHY_FIELDS,
    filterByMandatory,
  });

  return (
    <>
      <HierarchyFields
        relationType={REFERENCE_DATA_RELATION_TYPES.ADDRESS_HIERARCHY}
        leafNodeType={REFERENCE_TYPES.VILLAGE}
        fields={locationHierarchyFieldsToShow}
      />
      {secondary ? (
        <PatientField
          definition={{
            name: (
              <TranslatedText
                stringId="general.localisedField.streetVillage.label"
                fallback="Street No. & Name"
              />
            ),
            definitionId: 'fieldDefinition-secondaryAddressStreet',
            fieldType: PATIENT_FIELD_DEFINITION_TYPES.STRING,
          }}
        />
      ) : (
        <ConfiguredMandatoryPatientFields
          fields={LOCATION_FIELDS}
          filterByMandatory={filterByMandatory}
        />
      )}
    </>
  );
};
