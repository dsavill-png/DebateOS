import { openTabroomSession } from './authenticated-session.ts';

export const goldFields = [
  'tournament', 'level', 'date', 'event', 'round', 'aff', 'neg', 'individualVote', 'panelResult',
] as const;

type Field = typeof goldFields[number];
type Scalar = string | number;
type Status = 'exact' | 'explainable transform' | 'unavailable' | 'ambiguous' | 'mismatch';
type Path = readonly (string | number)[];
type Reference = {
  expected: Scalar;
  path?: Path;
  transform?: 'trim' | 'number-to-string';
};
type Sample = {
  personId: number;
  rows: readonly {
    match: readonly { path: Path; value: Scalar }[];
    fields: Partial<Record<Field, Reference>>;
  }[];
};

function at(value: unknown, path: Path): unknown {
  for (const key of path) {
    if (!value || typeof value !== 'object' || !Object.hasOwn(value, key)) return undefined;
    value = (value as Record<string | number, unknown>)[key];
  }
  return value;
}

function scalar(value: unknown): value is Scalar {
  return typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value));
}

function validPath(path: unknown): path is Path {
  return Array.isArray(path) && path.length > 0 && path.length <= 12 &&
    path.every(key => typeof key === 'string' || Number.isSafeInteger(key));
}

function compare(record: unknown, reference: Reference): Status {
  if (!reference.path) return 'unavailable';
  const value = at(record, reference.path);
  if (value == null) return 'unavailable';
  if (!scalar(value)) return 'ambiguous';
  if (value === reference.expected) return 'exact';
  if ((reference.transform === 'trim' && typeof value === 'string' &&
       value.trim() === reference.expected) ||
      (reference.transform === 'number-to-string' && typeof value === 'number' &&
       String(value) === reference.expected)) return 'explainable transform';
  return 'mismatch';
}

export async function validateGoldRecord(
  input: unknown,
  ...sessionArguments: Parameters<typeof openTabroomSession>
) {
  const sample = input as Sample;
  if (!sample || !Number.isSafeInteger(sample.personId) || sample.personId < 1 ||
      !Array.isArray(sample.rows) || sample.rows.length < 1 || sample.rows.length > 5) {
    throw new Error('Invalid gold sample');
  }
  for (const row of sample.rows as Sample['rows']) {
    if (!row || !Array.isArray(row.match) || !row.match.length || row.match.length > 8 ||
        !row.match.every(key => key && validPath(key.path) && scalar(key.value)) ||
        !row.fields || typeof row.fields !== 'object') throw new Error('Invalid gold sample');
    for (const field of goldFields) {
      const ref = row.fields[field];
      if (ref !== undefined && (!ref || !scalar(ref.expected) ||
          (ref.path !== undefined && !validPath(ref.path)) ||
          (ref.transform !== undefined && ref.transform !== 'trim' &&
           ref.transform !== 'number-to-string'))) throw new Error('Invalid gold sample');
    }
  }

  const session = await openTabroomSession(...sessionArguments);
  try {
    if (session.personId !== sample.personId) throw new Error('Gold sample person differs from login');
    const records = await session.readOwnJudgeRecord();
    return (sample.rows as Sample['rows']).map((row, index) => {
      const matches = records.filter(record => row.match.every(key => at(record, key.path) === key.value));
      const vote = row.fields.individualVote;
      const result = row.fields.panelResult;
      const sharedVotePath = vote?.path && result?.path &&
        JSON.stringify(vote.path.map(String)) === JSON.stringify(result.path.map(String));
      return {
        row: index + 1,
        fields: Object.fromEntries(goldFields.map((field): [Field, Status] => {
          const ref = row.fields[field];
          if (matches.length === 0 || !ref) return [field, 'unavailable'];
          if (matches.length > 1 || (field === 'panelResult' && sharedVotePath)) {
            return [field, 'ambiguous'];
          }
          return [field, compare(matches[0], ref)];
        })),
      };
    });
  } finally {
    session.close();
  }
}
