import React, { memo } from 'react';
import Svg, { Pattern, Defs, Image, Use, Path, G } from 'react-native-svg';

export const NullValueCell = memo(() => (
  <Svg width="85" height="79" viewBox="0 0 85 80" fill="none">
    <Path d="M85 0H0V80H85V0Z" fill="url(#pattern0)" />
    <Defs>
      <Pattern
        id="pattern0"
        patternContentUnits="objectBoundingBox"
        width="1"
        height="1"
      >
        <Use xlinkHref="#image0" transform="scale(0.0055)" />
      </Pattern>
      <G id="image0">
        <Image
          width="400"
          height="400"
          xlinkHref={{
            uri:
                'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAAGQBAMAAABykSv/AAAAFVBMVEX39/f29vb6+vr5+fn19fX4+Pj7+/vE9xmnAAAC70lEQVR4AdSUwa3CQAxE55eQjytIBHdQGjBsA5HSfy0Qc7G0RNbcZn3a1Zt3GCVr/E3HzDH3OP/HeZnOgKYBa595xeXaYh5x2dsJ2DSNKOI5dUmpX8A1DRhZfXdNA1akOuCaBoys3lzTgJHVm2sasOIddcA1DViR6oBrGjCyenNNA8b8i2FrGvg2XHJqTakeuKaBOWbLDS2leuCaBqhtfcxT00CRGgaAWw66AHR1UQBClwYoF9sgAOViGwSA+J7SAIQuDUDo0gDEtpYGWNnqN00D9NZYNI13O3dwAkAIQ1FQsAGrsDH770FIzrmKgbntEmxgeHxAFz+ADtABOkAH6AAdoAN0gA7QATpAB+gAHaADdICuOuw/X4zayHodAB2gA3SADtABOkAH6AAdoAN0gA7QATpAB+gAHaBT0D16AegAHaADdIAO0AE6QAfoAB2gA3SADtABOkAH6ABd7p/N+DnxvVK8mh1s0AE6QAfoAB2gA3SAri/QATpAB+gAHaADdIAO0AE6BZ2CTkEH6AAdoAN0gA7QATpAB+gAHaADdIAO0AE6QAfobNDZoAN0gA7QATpAB+gAHaADdIAO0AE6QAfoAB2gA3SATkGnoAN0gA7QATpAB+gAHaADdIAO0AE6QAfoAB2gA3Q26GzQATpAB+gAHaADdIAO0AE6QAfoAB2gA3SADtABOgWdgk5BB+gAHaADdIAO0AE6QAfoAB2gA3SADtABOkAH6GzQ2aADdIAO0AE6QAfoAB2gA3SADtABOkAH6AAdoAN0CjoFnYIO0AE6QAfoAB2gA3SADtABOkAH6AAdoAN0gA7Q2aCzQQfoAB2gA3SADtABOkAH6AAdoAN0gA7QATpAB+gUdAo6BR2gA3SADtABOkAH6AAdoAN0gA7QATpAB+gAHaCzQWeDDtABOkAH6AAdoAN0gA7QATpAB+gAHaADdIAO0CnoFHQKOkAH6AAdoAN0gA7QATpAB+gAHaADdIAO0AE6QGeD7gLgnopDNn7qMgAAAABJRU5ErkJggg==',
          }}
        />
      </G>
    </Defs>
  </Svg>
));
