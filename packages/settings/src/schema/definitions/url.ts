import * as yup from 'yup';

// URL validation via the parser rather than yup's .url() regex, which rejects
// hosts without a TLD (localhost) and template placeholders like {minVersion}.
// Empty values pass; compose .required() where a value must be set.
export const urlSchema = yup.string().test('is-url', 'must be a valid URL', value => {
  if (value == null || value === '') return true;
  try {
    return Boolean(new URL(value));
  } catch {
    return false;
  }
});
