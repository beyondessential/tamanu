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
      // A group can pin one of its fields onto a form that would otherwise filter it out — the
      // sliding fee scale pair does, since they are required once that plan is selected and would
      // otherwise be required but absent on the new patient form, leaving nothing to answer.
      // It only bypasses this filter: checkHidden still applies after it, so a field the
      // deployment hides stays hidden. What keeps that safe is the validation refusing to require
      // a field it cannot show (see isShown in patientDetailValidations).
      // Kept separate from `required` so marking a field required never moves it on its own.
      if (fields[fieldName].alwaysShow) return true;

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
