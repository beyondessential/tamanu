import { useMemo } from 'react';
import { usePatientFieldLayoutQuery } from '../../api/queries';

/**
 * Returns maps of fieldKey → sortOrder and definitionId → sortOrder
 * from patient_field_layouts, used to sort fields by their configured order.
 *
 * Fields not present in the layout are pushed to the end, preserving
 * their relative order.
 */
export const usePatientFieldLayoutOrder = () => {
  const { data: layoutResponse } = usePatientFieldLayoutQuery();
  const layouts = layoutResponse?.data;

  // Map<section, Map<fieldKey, sortOrder>> — only returns sort orders
  // for fields whose layout section matches, so a misconfigured row
  // (field assigned to the wrong section) is silently ignored.
  const orderByFieldKeyBySection = useMemo(() => {
    if (!layouts) return null;
    const sectionMap = new Map();
    for (const layout of layouts) {
      if (layout.fieldKey && layout.section) {
        if (!sectionMap.has(layout.section)) {
          sectionMap.set(layout.section, new Map());
        }
        sectionMap.get(layout.section).set(layout.fieldKey, layout.sortOrder);
      }
    }
    return sectionMap;
  }, [layouts]);

  const orderByDefinitionId = useMemo(() => {
    if (!layouts) return null;
    const map = new Map();
    for (const layout of layouts) {
      if (layout.definitionId) {
        map.set(layout.definitionId, layout.sortOrder);
      }
    }
    return map;
  }, [layouts]);

  return { orderByFieldKeyBySection, orderByDefinitionId };
};
