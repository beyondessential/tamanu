import { getStroke } from 'perfect-freehand';

/** Fixed coordinate space for signature capture and display (survey_response_answers.body paths use this space). */
export const SIGNATURE_VIEWBOX_WIDTH = 300;
export const SIGNATURE_VIEWBOX_HEIGHT = 150;

const STROKE_OPTIONS = {
  size: 2,
  thinning: 0.5,
  smoothing: 0.5,
  streamline: 0.5,
};

/**
 * Converts perfect-freehand outline points to an SVG path `d` string.
 * Stored alone in survey_response_answers.body (no wrapper SVG markup).
 */
export function getSvgPathFromStroke(stroke) {
  if (!stroke.length) {
    return '';
  }

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ['M', ...stroke[0], 'Q'],
  );

  d.push('Z');
  return d.join(' ');
}

/** @param {Array<{ x: number, y: number, pressure?: number }>} points */
export function pointsToSvgPath(points) {
  if (!points.length) return '';

  const strokePoints = points.map(({ x, y, pressure = 0.5 }) => [x, y, pressure]);
  const outline = getStroke(strokePoints, STROKE_OPTIONS);
  return getSvgPathFromStroke(outline);
}

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
