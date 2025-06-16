import path from 'path';
import { Font } from '@react-pdf/renderer';

const baseDir =
  typeof __dirname !== 'undefined' ? path.join(__dirname, '../../assets/fonts') : '/fonts';

export const registerFonts = () => {
  Font.register({
    family: 'Rubik',
    src: path.join(baseDir, 'Tajawal-Regular.ttf'),
  });

  Font.register({
    family: 'Rubik-Italic',
    src: path.join(baseDir, 'Tajawal-Regular.ttf'),
  });

  Font.register({
    family: 'Rubik-Bold',
    src: path.join(baseDir, 'Tajawal-Bold.ttf'),
  });

  Font.register({
    family: 'Rubik-BoldItalic',
    src: path.join(baseDir, 'Tajawal-Bold.ttf'),
  });
};
