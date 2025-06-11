import path from 'path';
import { Font } from '@react-pdf/renderer';

const baseDir =
  typeof __dirname !== 'undefined' ? path.join(__dirname, '../../assets/fonts') : '/fonts';

export const registerFonts = () => {
Font.register({
  family: 'Rubik',
  src: path.join(baseDir, 'Rubik-Regular.ttf'),
});

// base font
Font.register({
  family: 'Rubik-Bold',
  src: path.join(baseDir, 'Rubik-Bold.ttf'),
});

Font.register({
  family: 'Rubik-BoldItalic',
  src: path.join(baseDir, 'Rubik-BoldItalic.ttf'),
});

Font.register({
  family: 'Rubik-LightItalic',
  src: path.join(baseDir, 'Rubik-LightItalic.ttf'),
});

// title font
Font.register({
  family: 'Roboto',
    src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf',
  });
};