/** @typedef {{ x: number; y: number }} Point */

import { getStroke } from 'perfect-freehand';

export const SIGNATURE_VIEWBOX_WIDTH = 480;
export const SIGNATURE_VIEWBOX_HEIGHT = 144;
export const SIGNATURE_VIEWBOX = `0 0 ${SIGNATURE_VIEWBOX_WIDTH} ${SIGNATURE_VIEWBOX_HEIGHT}`;

/** @satisfies {import('perfect-freehand').StrokeOptions} */
const STROKE_OPTIONS = /** @type {const} */ ({
  simulatePressure: false,
  size: 3,
  streamline: 0.75,
  thinning: 0,
});

/**
 * Converts perfect-freehand outline points to an SVG path `d` string.
 * Used for display only; centreline points are stored in body instead.
 */
function getSvgPathFromStroke(stroke) {
  if (!stroke.length) return '';

  const roundAll = nums => nums.map(n => n.toFixed(2));

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

/**
 * @privateRemarks The inner `for` loop is equivalent to mapping with
 * ```js
 * stroke => stroke.map(({ x, y }) => [Math.round(x), Math.round(y)])
 * ```
 * but there’s no point storing a line segment between two identical points.
 * (e.g. `[[1,1],[1,1],[2,2]]` looks the same as `[[1,1],[2,2]]`.)
 * @param {Point[][]} strokes
 */
function serializeStrokes(strokes) {
  return strokes.map(stroke => {
    const serialized = [];
    for (const { x, y } of stroke) {
      const curr = [Math.round(x), Math.round(y)];
      const prev = serialized[serialized.length - 1];
      if (prev && prev[0] === curr[0] && prev[1] === curr[1]) continue;
      serialized.push(curr);
    }
    return serialized;
  });
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

/**
 * @privateRemarks Emulates `compressSignatureBody` from
 * `@tamanu/shared/utils/signatureCompression`. Used in frontend only for form validation to flag
 * extremely complex signatures that may exceed database index size limit.
 * @param {`[${string}]` | '' | null | undefined} body Centreline JSON stored in
 * survey_response_answers.body when uncompressed.
 * @returns {Promise<number>} gzip-compressed base64 string for database storage.
 */
export async function estimateCompressedSize(body) {
  if (!body) return 0;

  const byteArray = new TextEncoder().encode(body);
  const cs = new CompressionStream('gzip');
  const writer = cs.writable.getWriter();
  writer.write(byteArray);
  writer.close();
  const buffer = await new Response(cs.readable).arrayBuffer();
  return new Uint8Array(buffer).toBase64().length;
}
