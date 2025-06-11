import path from 'path';
import { Font } from 'pdfmake/build/pdfmake';

const baseDir =
  typeof __dirname !== 'undefined' ? path.join(__dirname, '../../assets/fonts') : '/fonts';

export const registerFonts = () => {
Font.register({
  family: 'rubik',
  src: path.join(baseDir, 'Rubik-Regular.ttf'),
});

// base font
Font.register({
  family: 'rubik',
  src: path.join(baseDir, 'Rubik-Bold.ttf'),
});

Font.register({
  family: 'rubik',
  src: path.join(baseDir, 'Rubik-BoldItalic.ttf'),
});

Font.register({
  family: 'rubik',
  src: path.join(baseDir, 'Rubik-LightItalic.ttf'),
});

// title font
Font.register({
  family: 'Roboto',
    src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf',
  });
};