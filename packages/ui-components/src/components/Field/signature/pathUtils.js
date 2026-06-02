/** @typedef {{ x: number; y: number }} ViewBoxPoint */

import { getStroke } from 'perfect-freehand';

export const SIGNATURE_VIEWBOX_WIDTH = 480;
export const SIGNATURE_VIEWBOX_HEIGHT = 150;
export const SIGNATURE_VIEWBOX = `0 0 ${SIGNATURE_VIEWBOX_WIDTH} ${SIGNATURE_VIEWBOX_HEIGHT}`;

/** Minimum viewBox distance between captured pointer samples. */
export const SIGNATURE_MIN_POINT_DISTANCE = 3;

/**
 * @param {ViewBoxPoint | undefined} lastPoint
 * @param {ViewBoxPoint} nextPoint
 * @param {number} [minDistance=SIGNATURE_MIN_POINT_DISTANCE]
 */
export function isFarEnoughFromLastPoint(
  lastPoint,
  nextPoint,
  minDistance = SIGNATURE_MIN_POINT_DISTANCE,
) {
  if (!lastPoint) return true;

  const dx = nextPoint.x - lastPoint.x;
  const dy = nextPoint.y - lastPoint.y;
  return dx * dx + dy * dy >= minDistance * minDistance;
}

/**
 * @param {ViewBoxPoint[]} stroke
 * @param {ViewBoxPoint} point
 */
export function appendStrokePointIfFarEnough(stroke, point) {
  if (!isFarEnoughFromLastPoint(stroke[stroke.length - 1], point)) return stroke;
  return [...stroke, point];
}

/** @satisfies {import('perfect-freehand').StrokeOptions} */
const STROKE_OPTIONS = /** @type {const} */ ({
  simulatePressure: false,
  size: 3,
  thinning: 0,
});

/**
 * @privateRemarks Excess precision bloats the `d` attribute length.
 * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/d
 * @param {number[]} nums
 */
function roundAll(nums) {
  return nums.map(n => n.toFixed(1));
}

/**
 * Converts perfect-freehand outline points to an SVG path `d` string.
 * Stored alone in survey_response_answers.body (no wrapper SVG markup).
 */
export function getSvgPathFromStroke(stroke) {
  if (!stroke.length) return '';

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      const coordinates = [x0, y0, (x0 + x1) / 2, (y0 + y1) / 2];
      acc.push(...roundAll(coordinates));
      return acc;
    },
    ['M', ...roundAll(stroke[0]), 'Q'],
  );

  return d.join(' ');
}

/** @param {import('perfect-freehand').StrokePoint[]} points */
export function pointsToSvgPath(points) {
  if (!points.length) return '';
  const outline = getStroke(points, STROKE_OPTIONS);
  return getSvgPathFromStroke(outline);
}

/** @param {string[]} paths */
export function appendSvgPaths(...paths) {
  return paths
    .map(path => path?.trim())
    .filter(Boolean)
    .join(' ');
}

/** Merges an existing body value with in-session stroke point arrays. */
export function strokesToCombinedPath(existingPath, strokePointLists) {
  const newSegment = strokePointLists.map(pointsToSvgPath).filter(Boolean).join(' ');
  return appendSvgPaths(existingPath, newSegment);
}
