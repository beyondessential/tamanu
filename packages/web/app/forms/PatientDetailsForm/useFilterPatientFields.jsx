import { useMemo } from 'react';
import { isBoolean } from 'es-toolkit/compat';
import { useSettings } from '../../contexts/Settings';

export const useFilterPatientFields = ({ fields, filterByMandatory }) => {
  const { getSetting } = useSettings();

  const fieldsToShow = useMemo(() => {
    const checkCondition = (fieldName) =>
      !fields[fieldName].condition || fields[fieldName].condition();
    // LocalisedField renders nothing for a hidden field anyway; dropping it here as well lets a
    // caller ask whether the group has anything left to show, so an all-hidden section can leave
    // out its heading rather than printing one over an empty grid.
    const checkHidden = (fieldName) => !getSetting(`fields.${fieldName}.hidden`);
    const checkMandatory = (fieldName) => {
      // A field the group has made required for a reason of its own (the sliding fee scale pair,
      // once that plan is selected) is shown wherever it is required — including the new patient
      // form, which otherwise shows only the fields a deployment marks required when creating.
      // Without this it could be required but absent, leaving nothing to answer.
      if (fields[fieldName].required) return true;

      const requiredConfiguration = getSetting(`fields.${fieldName}.requiredPatientData`);
      return (
        !isBoolean(filterByMandatory) ||
        !isBoolean(requiredConfiguration) ||
        requiredConfiguration === filterByMandatory
      );
    };

    return Object.keys(fields)
      .filter(
        (fieldName) =>
          checkMandatory(fieldName) && checkCondition(fieldName) && checkHidden(fieldName),
      )
      .map((fieldName) => {
        // eslint-disable-next-line no-unused-vars
        const { condition, ...rest } = fields[fieldName];
        return {
          ...rest,
          // A group can mark a field required for a reason of its own (the sliding fee scale
          // fields do), which stands whatever the deployment configured.
          required: rest.required ?? !!getSetting(`fields.${fieldName}.requiredPatientData`),
          name: fieldName,
        };
      });
    // We only need to work out which fields to show if either fields or filterByMandatory are changed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields, filterByMandatory]);

  return { fieldsToShow };
};
