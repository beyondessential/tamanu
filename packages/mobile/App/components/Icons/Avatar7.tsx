import React from 'react';
import Svg, {
  Rect,
  Defs,
  Pattern,
  Use,
  Image,
  G,
  SvgProps,
} from 'react-native-svg';

export const Avatar7 = React.memo((props: SvgProps) => (
  <Svg width="30" height="30" viewBox="0 0 30 30" fill="none" {...props}>
    <Rect width="30" height="30" rx="15" fill="url(#pattern0)" />
    <Defs>
      <Pattern
        id="pattern0"
        patternContentUnits="objectBoundingBox"
        width="1"
        height="1"
      >
        <Use xlinkHref="#image0" transform="scale(0.0078125)" />
      </Pattern>
      <G id="image0">
        <Image
          width="128"
          height="128"
          xlinkHref={{
            uri:
              'data:image/jpeg;base64,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',
          }}
        />
      </G>
    </Defs>
  </Svg>
));
