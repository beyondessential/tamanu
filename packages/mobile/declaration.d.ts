import { StringSchema } from 'yup';

declare module '*.svg' {
  import { SvgProps } from 'react-native-svg';
  const content: React.StatelessComponent<SvgProps>;
  export default content;
}

// extend yup with custom methods
declare module 'yup' {
  interface StringSchema {
    translatedLabel(label: React.ReactNode): this;
  }
}
