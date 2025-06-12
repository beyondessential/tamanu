import path from 'path';
import { Font } from '@react-pdf/renderer';

const baseDir =
  typeof __dirname !== 'undefined' ? path.join(__dirname, '../../assets/fonts') : '/fonts';

export const registerFonts = () => {
  if (Font.getRegisteredFontFamilies().includes('Rubik')) return;
  Font.register({
    family: 'Rubik',
    fonts: [
      {
        src: path.join(baseDir, 'Rubik-Regular.ttf'),
        fontWeight: 400,
      },
      {
        src: path.join(baseDir, 'Rubik-Italic.ttf'),
        fontStyle: 'italic',
        fontWeight: 400,
      },
      {
        src: path.join(baseDir, 'Rubik-Bold.ttf'),
        fontWeight: 700,
      },
      {
        src: path.join(baseDir, 'Rubik-BoldItalic.ttf'),
        fontStyle: 'italic',
        fontWeight: 700,
      },
    ],
  });
};
