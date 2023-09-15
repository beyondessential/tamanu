import * as yup from 'yup';

yup.addMethod(yup.string, 'whenSetting', function whenSetting(key, { is, then, otherwise }) {
  return this.test('whenSetting', '', async function doTest(value) {
    const { settings } = this.options.context;
    if (!settings) {
      throw new Error(
        'Settings reader must be passed to yup validation context to use custom "whenSetting" method',
      );
    }
    const config = await settings.get(key);
    if (typeof is === 'function' ? is(config) : is === config) {
      return then.validate(value);
    }
    return otherwise.validate(value);
  });
});
