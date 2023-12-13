import React, { memo } from 'react';
import { SvgXml } from 'react-native-svg';

export const NullValueCellIcon = memo(props => {
  const xml =
    `<svg width="87" height="82" viewBox="0 0 87 82" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<rect x="1" y="1" width="85" height="80" fill="url(#pattern0)" stroke="#DEDEDE"/>
<defs>
<pattern id="pattern0" patternContentUnits="objectBoundingBox" width="1.88235" height="2">
<use xlink:href="#image0" transform="scale(0.00470588 0.005)"/>
</pattern>
<image id="image0" width="400" height="400" xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAAGQBAMAAABykSv/AAAAFVBMVEX39/f29vb6+vr5+fn19fX4+Pj7+/vE9xmnAAAC70lEQVR4AdSUwa3CQAxE55eQjytIBHdQGjBsA5HSfy0Qc7G0RNbcZn3a1Zt3GCVr/E3HzDH3OP/HeZnOgKYBa595xeXaYh5x2dsJ2DSNKOI5dUmpX8A1DRhZfXdNA1akOuCaBoys3lzTgJHVm2sasOIddcA1DViR6oBrGjCyenNNA8b8i2FrGvg2XHJqTakeuKaBOWbLDS2leuCaBqhtfcxT00CRGgaAWw66AHR1UQBClwYoF9sgAOViGwSA+J7SAIQuDUDo0gDEtpYGWNnqN00D9NZYNI13O3dwAkAIQ1FQsAGrsDH770FIzrmKgbntEmxgeHxAFz+ADtABOkAH6AAdoAN0gA7QATpAB+gAHaADdICuOuw/X4zayHodAB2gA3SADtABOkAH6AAdoAN0gA7QATpAB+gAHaBT0D16AegAHaADdIAO0AE6QAfoAB2gA3SADtABOkAH6ABd7p/N+DnxvVK8mh1s0AE6QAfoAB2gA3SAri/QATpAB+gAHaADdIAO0AE6BZ2CTkEH6AAdoAN0gA7QATpAB+gAHaADdIAO0AE6QAfobNDZoAN0gA7QATpAB+gAHaADdIAO0AE6QAfoAB2gA3SATkGnoAN0gA7QATpAB+gAHaADdIAO0AE6QAfoAB2gA3Q26GzQATpAB+gAHaADdIAO0AE6QAfoAB2gA3SADtABOgWdgk5BB+gAHaADdIAO0AE6QAfoAB2gA3SADtABOkAH6GzQ2aADdIAO0AE6QAfoAB2gA3SADtABOkAH6AAdoAN0CjoFnYIO0AE6QAfoAB2gA3SADtABOkAH6AAdoAN0gA7Q2aCzQQfoAB2gA3SADtABOkAH6AAdoAN0gA7QATpAB+gUdAo6BR2gA3SADtABOkAH6AAdoAN0gA7QATpAB+gAHaCzQWeDDtABOkAH6AAdoAN0gA7QATpAB+gAHaADdIAO0CnoFHQKOkAH6AAdoAN0gA7QATpAB+gAHaADdIAO0AE6QGeD7gLgnopDNn7qMgAAAABJRU5ErkJggg=="/>
</defs>
</svg>
`;
  return <SvgXml xml={xml} {...props} />;
});
