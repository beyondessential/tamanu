/**
 * Whether a deployment shows a configurable patient field. The patient details form filters on
 * this, and the validation consults it so it never requires a field it cannot show — rules that
 * have to agree, so they read it from here rather than each reaching for the setting.
 */
export const isPatientFieldShown = (getSetting, field) => !getSetting(`fields.${field}.hidden`);
