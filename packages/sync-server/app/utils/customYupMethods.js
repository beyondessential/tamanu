import * as yup from 'yup';

yup.addMethod(yup.mixed, 'whenSetting', function whenSetting(key, { is, then, otherwise }) {
  return this.test(async (value, context) => {
    const { settings } = context.options.context || {};
    if (!settings) {
      return context.createError({
        message:
          'Settings reader must be passed to yup validation context to use custom "whenSetting" method',
      });
    }
    const settingValue = await settings.get(key);
    const settingIs = typeof is === 'function' ? is(settingValue) : is === settingValue;
    const schema = settingIs ? then : otherwise;

    try {
      schema.validateSync(value);
      return true;
    } catch ({ message, path, type, errors, inner }) {
      return context.createError({ message, path, type, errors, inner });
    }
  });
});
