import { useMemo } from 'react';
import { isBoolean } from 'es-toolkit/compat';
import { useSettings } from '../../contexts/Settings';
import { isPatientFieldShown } from '../../utils/patientFields';

export const useFilterPatientFields = ({ fields, filterByMandatory }) => {
  const { getSetting } = useSettings();

  const fieldsToShow = useMemo(() => {
    const checkCondition = (fieldName) =>
      !fields[fieldName].condition || fields[fieldName].condition();
    // LocalisedField renders nothing for a hidden field anyway; dropping it here as well lets a
    // caller ask whether the group has anything left to show, so an all-hidden section can leave
    // out its heading rather than printing one over an empty grid.
    const checkHidden = (fieldName) => isPatientFieldShown(getSetting, fieldName);
    const checkMandatory = (fieldName) => {
      // A group can pin one of its fields onto the form that collects what a patient must answer
      // when they are created, for a reason of its own rather than a deployment's setting. It
      // reads as that setting rather than skipping this filter, because the two renders are
      // filtered on opposite values and a field that answers to neither appears in both.
      // checkHidden still applies after it, so a field the deployment hides stays hidden; what
      // keeps that safe is the validation refusing to require a field it cannot show, off the
      // same isPatientFieldShown this filter uses.
      // Kept separate from `required` so marking a field required never moves it on its own.
      const requiredConfiguration = fields[fieldName].alwaysShow
        ? true
        : getSetting(`fields.${fieldName}.requiredPatientData`);
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
