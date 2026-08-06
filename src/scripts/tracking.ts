// Centralised progress/interaction tracking.
//
// Today this only persists to the browser's localStorage - this course is
// most likely going to be used standalone, without an LMS. If that changes
// and SCORM reporting is ever needed, THIS is the file that should change:
// every component calls these functions rather than touching localStorage
// (or a future LMS API) directly, so adding a `wrapper.setValue(...)` call
// inside each function here is the only change required - no hunting
// through every page/component.

const PAGE_PROGRESS_KEY = 'a8-data-ethics-progress';
const INTERACTION_PREFIX = 'a8-data-ethics-mcq:';

export function normalisePath(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;
}

/** Marks a page visited and returns the full visited-pages list. */
export function recordPageVisit(pathname: string): string[] {
  const current = normalisePath(pathname);
  const visited = new Set(getVisitedPages());
  visited.add(current);
  const list = Array.from(visited);
  localStorage.setItem(PAGE_PROGRESS_KEY, JSON.stringify(list));
  return list;
}

export function getVisitedPages(): string[] {
  try {
    return JSON.parse(localStorage.getItem(PAGE_PROGRESS_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export type McqResult = 'correct' | 'partlyCorrect' | 'incorrect';

export interface McqResultRecord {
  selected: number[];
  result: McqResult;
}

/** Records a single-attempt quiz answer, keyed by the question's id. */
export function recordInteraction(id: string, data: McqResultRecord): void {
  localStorage.setItem(`${INTERACTION_PREFIX}${id}`, JSON.stringify(data));
}

/** Returns a previously-recorded answer for this question, if any. */
export function getInteraction(id: string): McqResultRecord | null {
  const saved = localStorage.getItem(`${INTERACTION_PREFIX}${id}`);
  if (!saved) return null;
  try {
    return JSON.parse(saved) as McqResultRecord;
  } catch {
    return null;
  }
}
