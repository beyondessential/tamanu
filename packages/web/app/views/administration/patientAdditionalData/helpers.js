import { VISIBILITY_STATUSES, PATIENT_FIELD_SECTION_VALUES } from '@tamanu/constants';
import { globalSettings } from '@tamanu/settings';
import { SECTION_LABELS } from './constants';

const fieldSettingsSchema = globalSettings.properties.fields.properties;

const FALLBACK_OVERRIDES = {
  displayId: 'National Health Number',
};

export function getFieldLabel(layout, getTranslation) {
  if (layout.definition) {
    return layout.definition.name;
  }
  const fallback = FALLBACK_OVERRIDES[layout.fieldKey]
    ?? fieldSettingsSchema[layout.fieldKey]?.name
    ?? layout.fieldKey;
  if (getTranslation) {
    return getTranslation(`general.localisedField.${layout.fieldKey}.label`, fallback);
  }
  return fallback;
}

export function groupLayoutsBySection(layouts) {
  // Pre-create sections in the defined order
  const sections = new Map();
  for (const sectionKey of PATIENT_FIELD_SECTION_VALUES) {
    sections.set(sectionKey, {
      key: sectionKey,
      label: SECTION_LABELS[sectionKey] ?? sectionKey,
      visible: [],
      hidden: [],
    });
  }

  for (const layout of layouts) {
    const key = layout.section ?? `category:${layout.categoryId}`;
    if (!sections.has(key)) {
      const label = layout.category?.name ?? 'Custom fields';
      sections.set(key, { key, label, visible: [], hidden: [] });
    }
    const section = sections.get(key);
    if (layout.visibilityStatus === VISIBILITY_STATUSES.CURRENT) {
      section.visible.push(layout);
    } else {
      section.hidden.push(layout);
    }
  }

  // Sort fields within each section by sortOrder
  for (const section of sections.values()) {
    section.visible.sort((a, b) => a.sortOrder - b.sortOrder);
    section.hidden.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  // Filter out empty sections (e.g. birthDetails when not in use)
  return [...sections.values()].filter(s => s.visible.length > 0 || s.hidden.length > 0);
}
