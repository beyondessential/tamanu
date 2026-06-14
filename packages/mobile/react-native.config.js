const path = require('path');

const datetimepickerRoot = path.join(
  __dirname,
  'node_modules/@react-native-community/datetimepicker',
);
const datetimepickerAndroid = path.join(datetimepickerRoot, 'android');

/**
 * @react-native-community/datetimepicker@9.1.0 extends BaseReactPackage, which
 * the RN CLI autolinker does not detect. Declare it manually so Gradle runs
 * codegen and registers the RNCDatePicker TurboModule.
 */
module.exports = {
  dependencies: {
    '@react-native-community/datetimepicker': {
      root: datetimepickerRoot,
      platforms: {
        android: {
          sourceDir: datetimepickerAndroid,
          packageImportPath:
            'import com.reactcommunity.rndatetimepicker.RNDateTimePickerPackage;',
          packageInstance: 'new RNDateTimePickerPackage()',
          libraryName: 'RNDateTimePickerCGen',
          componentDescriptors: [],
          cmakeListsPath: path.join(
            datetimepickerAndroid,
            'build/generated/source/codegen/jni/CMakeLists.txt',
          ),
        },
      },
    },
  },
};
