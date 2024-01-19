import * as yup from 'yup';

yup.addMethod(yup.mixed, 'whenSetting', function whenSetting(key, { is, then, otherwise }) {
  return this.test(async (value, { createError, options }) => {
    const { settings } = options.context || {};
    if (!settings) {
      return createError({
        message:
          'Settings reader must be passed to yup validation context to use custom "whenSetting" method',
      });
    }
    const settingValue = await settings.get(key);
    const settingIs = typeof is === 'function' ? is(settingValue) : is === settingValue;
    const schema = settingIs ? then : otherwise;
    const dynamicSchema = typeof schema === 'function' ? schema(this) : schema;

    try {
      await dynamicSchema.validate(value);
      return true;
    } catch ({ message, path, type, errors, inner }) {
      return createError({ message, path, type, errors, inner });
    }
  });
});
