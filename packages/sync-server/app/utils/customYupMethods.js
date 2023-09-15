import * as yup from 'yup';

// Initialize method
yup.addMethod(yup.string, 'whenSetting', function whenSetting() {});

// Override method with settings implementation
export const createCustomYupMethods = settings => {
  yup.addMethod(yup.string, 'whenSetting', function whenSetting(key, { is, then, otherwise }) {
    return this.test('whenSetting', '', async value => {
      const config = await settings.get(key);
      if (typeof is === 'function' ? is(config) : is === config) {
        return then.validate(value);
      }
      return otherwise.validate(value);
    });
  });
};
