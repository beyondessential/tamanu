/** @typedef {{ x: number; y: number }} Point */

import { getStroke } from 'perfect-freehand';

export const SIGNATURE_VIEWBOX_WIDTH = 480;
export const SIGNATURE_VIEWBOX_HEIGHT = 150;
export const SIGNATURE_VIEWBOX = `0 0 ${SIGNATURE_VIEWBOX_WIDTH} ${SIGNATURE_VIEWBOX_HEIGHT}`;

/** Minimum viewBox distance between captured pointer samples. */
const SIGNATURE_MIN_POINT_DISTANCE = 3;

/**
 * @param {Point | undefined} lastPoint
 * @param {Point} nextPoint
 * @param {number} [minDistance=SIGNATURE_MIN_POINT_DISTANCE]
 */
function isFarEnoughFromLastPoint(
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
 * @param {Point[]} stroke
 * @param {Point} point
 */
export function appendStrokePointIfFarEnough(stroke, point) {
  if (!isFarEnoughFromLastPoint(stroke.at(-1), point)) return stroke;
  return [...stroke, point];
}

/** @satisfies {import('perfect-freehand').StrokeOptions} */
const STROKE_OPTIONS = /** @type {const} */ ({
  simulatePressure: false,
  size: 3,
  streamline: 0.75,
  thinning: 0,
});

/**
 * @privateRemarks No harm in rendering with higher precision, but it bloats the
 * `d` attribute length.
 * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/d
 * @param {number[]} nums
 */
function roundAll(nums) {
  return nums.map(n => n.toFixed(2));
}

/**
 * Converts perfect-freehand outline points to an SVG path `d` string.
 * Used for display only; centreline points are stored in body instead.
 */
function getSvgPathFromStroke(stroke) {
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

/** @param {Point[]} points */
function pointsToSvgPath(points) {
  if (!points.length) return '';
  const outline = getStroke(points, STROKE_OPTIONS);
  return getSvgPathFromStroke(outline);
}

/** @param {string[]} paths */
function concatenateSvgPaths(...paths) {
  return paths
    .map(path => path?.trim())
    .filter(Boolean)
    .join(' ');
}

/** @param {Point[][]} strokes */
function serializeStrokes(strokes) {
  return strokes.map(stroke => stroke.map(({ x, y }) => [Math.round(x), Math.round(y)]));
}

/**
 * @param {string | null | undefined} body
 * @returns {Point[][]}
 */
function parseSignatureBody(body) {
  if (!body) return [];

  const parsed = JSON.parse(body);
  return parsed.map(stroke => stroke.map(([x, y]) => ({ x, y })));
}

/** @param {Point[][]} strokes */
function serializeSignatureBody(strokes) {
  return JSON.stringify(serializeStrokes(strokes));
}

/**
 * Merges in-session centreline strokes into an existing body value.
 * @param {string} existingBody
 * @param {Point[][]} strokePointLists
 */
export function mergeStrokesIntoBody(existingBody, strokePointLists) {
  if (!strokePointLists.length) return existingBody || '';

  return serializeSignatureBody([...parseSignatureBody(existingBody), ...strokePointLists]);
}

/** Converts a stored body value to an SVG path `d` string for display. */
export function bodyToDisplayPath(body) {
  return concatenateSvgPaths(...parseSignatureBody(body).map(pointsToSvgPath));
}
