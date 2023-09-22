import * as yup from 'yup';

// yup.addMethod(yup.mixed, 'whenSetting', function whenSetting(key, { is, then, otherwise }) {
//   return this.test('whenSetting', 'failed When setting', async function doTest(value) {
//     const { settings } = this.options.context || {};
//     if (!settings) {
//       return this.createError({
//         message:
//           'Settings reader must be passed to yup validation context to use custom "whenSetting" method',
//       });
//     }
//     // determine if validateSync or validate is being called

//     const settingValue = await settings.get(key);
//     const settingIs = typeof is === 'function' ? is(settingValue) : is === settingValue;
//     const schema = settingIs ? then : otherwise;

//     try {
//       await schema.validateSync(value);
//       return true;
//     } catch (err) {
//       return this.createError({
//         message: err.message,
//         path: err.path,
//         type: err.type,
//         errors: err.errors,
//         inner: err.inner,
//       });
//     }
//   });
// });

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
    } catch ({ message, path, type, errors, inner }) {
      return context.createError({ message, path, type, errors, inner });
    }
    return true;
  });
});
