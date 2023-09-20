import * as yup from 'yup';

yup.addMethod(yup.string, 'whenSetting', function whenSetting(key, { is, then, otherwise }) {
  return this.test('whenSetting', 'failed When setting', async function doTest(value) {
    const { settings } = this.options.context;
    if (!settings) {
      throw new Error(
        'Settings reader must be passed to yup validation context to use custom "whenSetting" method',
      );
    }
    const settingValue = await settings.get(key);
    const settingIs = typeof is === 'function' ? is(settingValue) : is === settingValue;
    const schema = settingIs ? then : otherwise;
    await schema.validate(value);
    return true;
  });
});
