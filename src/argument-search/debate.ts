export type DebateFamily = 'policy-aff' | 'critical-aff' | 'case-neg' | 'disadvantage' | 'counterplan' | 'kritik' | 'topicality' | 'framework' | 'theory' | 'presumption';
type Side = 'aff' | 'neg';
type Rule = readonly [name: string, pattern: RegExp];

// Longer phrases take precedence when the same words identify different jobs.
const roleRules: readonly Rule[] = [
  ['permutation answer', /\b(?:perm(?:utation)? answers?|answers? to (?:the )?perm(?:utation)?|perm links?|perm fails?)\b/],
  ['permutation', /\b(?:perms?|permutations?|do both|do the cp|do the counterplan|severance perm|intrinsic perm)\b/],
  ['alternative solvency deficit', /\b(?:alt(?:ernative)? (?:fails?|solvency deficit|does not solve)|no alt(?:ernative)? solvency)\b/],
  ['alternative solvency', /\b(?:alt(?:ernative)? solvency|alt(?:ernative)? solves)\b/],
  ['solvency deficit', /\b(?:solvency deficits?|no solvency|circumvention|does not solve|fails? to solve)\b/],
  ['impact defense', /\b(?:impact (?:defen[cs]e|take ?outs?)|no impact|impact empirically denied)\b|!\s*d\b/],
  ['impact turn', /\b(?:impact turns?|straight turn(?:ing)? the impact)\b|!\s*turn\b/],
  ['link turn', /\b(?:link turns?|turns? the link)\b/],
  ['internal link defense', /\b(?:internal link (?:defen[cs]e|take ?out)|no internal link|no i link)\b/],
  ['link defense', /\b(?:no links?|link (?:defen[cs]e|take ?outs?)|link take ?outs?)\b/],
  ['non-uniqueness', /\b(?:non ?unique(?:ness)?|no (?:uq|uniqueness)|already happening)\b/],
  ['net benefit', /\b(?:net benefits?|n b)\b/],
  ['internal link', /\b(?:internal links?|i links?)\b/],
  ['uniqueness', /\b(?:uniqueness|uniq|uq|u q|brink)\b/],
  ['solvency', /\b(?:solvency|solves?|solvency advocate)\b/],
  ['competition', /\b(?:competition|competiti(?:ve|veness)|mutual exclusivity|textual competition|functional competition)\b/],
  ['alternative', /\b(?:alt(?:ernative)? text|alt|alternative)\b/],
  ['role of the ballot', /\b(?:rotb|role of (?:the )?ballot)\b/],
  ['role of the judge', /\b(?:roj|role of (?:the )?judge)\b/],
  ['method', /\b(?:method|praxis|advocacy statement)\b/],
  ['topical version', /\b(?:tva|topical versions?(?: of the aff(?:irmative)?)?)\b/],
  ['counter-interpretation', /\b(?:counter ?interp(?:retation)?|we meet|c interp)\b/],
  ['violation', /\b(?:violations?|extra t|effects t|fx t)\b/],
  ['reasonability', /\b(?:reasonability|reasonably topical)\b/],
  ['competing interpretations', /\b(?:competing interp(?:retation)?s?)\b/],
  ['interpretation', /\b(?:interpretations?|interp|definitions?)\b/],
  ['standards', /\b(?:standards?|limits|ground|predictability|reciprocity)\b/],
  ['voters', /\b(?:voters?|voting issues?|fairness|education|reject the team|reject the argument)\b/],
  ['conditionality', /\b(?:condo|conditionality|dispositionality|dispo)\b/],
  ['fiat', /\b(?:fiat|multi actor fiat|durable fiat)\b/],
  ['inherency', /\b(?:inherency|inherent barriers?)\b/],
  ['harms', /\b(?:harms?|significance)\b/],
  ['plan text', /\b(?:plan text|cp text|counterplan text|planks?)\b/],
  ['advantage', /\b(?:advantages?|add ons?)\b/],
  ['weighing', /\b(?:impact calc(?:ulus)?|weighing|magnitude|time ?frame|probability|outweighs)\b/],
  ['presumption', /\bpresumption\b/],
  ['link', /\blinks?\b/],
  ['impact', /\b(?:impact offense|impacts?|implications?)\b|!\s*o\b/],
];

const families: readonly (readonly [DebateFamily, RegExp])[] = [
  ['case-neg', /\b(?:case neg(?:ative)?|on case|case answers?)\b/],
  ['critical-aff', /\b(?:(?:k|kritik|critical|performance|non topical|planless) aff(?:irmative)?s?)\b/],
  ['policy-aff', /\b(?:policy aff(?:irmative)?|1ac|affirmative case)\b/],
  ['counterplan', /\b(?:counter ?plans?|cps?|pics?|plan inclusive counterplan)\b/],
  ['disadvantage', /\b(?:das?|disads?|disadvantages?)\b/],
  ['kritik', /\b(?:kritiks?|critiques?|k)\b/],
  ['topicality', /\b(?:topicality|t usfg|t substantial\w*|t reduce|effects t|extra t|fx t|tva)\b/],
  ['framework', /\b(?:framework|rotb|roj|role of (?:the )?(?:ballot|judge))\b/],
  ['theory', /\b(?:theory|condo|conditionality|dispositionality|fiat abuse)\b/],
  ['presumption', /\bpresumption\b/],
];

const promptWords = /\b(?:a|an|the|for|of|to|on|in|against|versus|vs|some|find|give|show|me|what|where|how|with|about|should|we|they|read|cards?|evidence|blocks?|answers?|respond|answer|frontlines?|extensions?|aff|neg|good|bad|best|1ac|1nc|2ac|2nc|1ar|1nr|2ar|2nr)\b/g;

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9!]+/g, ' ').trim();
}

function aliasTopics(value: string) {
  return value.replace(/\b(?:indo|indian|india) ?(?:pakistan|pakistani|pak)\b|\b(?:pakistan|pakistani|pak) (?:indo|india|indian)\b/g, 'india pakistan')
    .replace(/\b(?:cap k|capitalism kritik)\b/g, 'capitalism kritik')
    .replace(/\b(?:recession|economic downturn|economic contraction|econ decline)\b/g, 'economic decline')
    .replace(/\bunited states federal government\b/g, 'usfg')
    .replace(/\b(?:military sales|weapons sales|arms sales|weapons transfers)\b/g, 'arms transfers')
    .replace(/\b(?:mid term|mid terms|midterm)\b/g, 'midterms');
}

function familyOf(value: string) {
  return families.find(([, pattern]) => pattern.test(value))?.[0];
}

export function interpretDebateQuery(query: string) {
  const normalized = aliasTopics(normalize(query));
  const roleMatch = roleRules.find(([, pattern]) => pattern.test(normalized));
  // "Acquisition of land" and similar plain searches don't get treated as debate roles.
  const [position, target] = normalized.split(/\b(?:against|versus|vs|answers? to)\b/, 2);
  const targetFamily = target ? familyOf(target.trim()) : undefined;
  const role = roleMatch?.[0];
  const family = role === 'role of the ballot' || role === 'role of the judge' ? 'framework'
    : familyOf(position.trim()) ?? familyOf(normalized);
  const speech = normalized.match(/\b(?:1ac|1nc|2ac|2nc|1ar|1nr|2ar|2nr)\b/)?.[0];
  const side: Side | undefined = speech ? (speech.endsWith('ac') || speech.endsWith('ar') ? 'aff' : 'neg')
    : /\b(?:on (?:the )?aff|aff answers?)\b/.test(normalized) ? 'aff'
    : /\b(?:on (?:the )?neg|neg answers?)\b/.test(normalized) ? 'neg' : undefined;
  const response = /\b(?:at|answers? to|answers? against|against|frontlines?|respond to)\b/.test(normalized);
  const direction = /\bgood\b/.test(normalized) ? 'good' : /\bbad\b/.test(normalized) ? 'bad' : undefined;
  let topical = roleMatch ? normalized.replace(roleMatch[1], ' ') : normalized;
  if (/\bt usfg\b/.test(topical)) topical = topical.replace(/\bt usfg\b/, 'usfg');
  for (const [, pattern] of families) topical = topical.replace(pattern, ' ');
  topical = topical.replace(/\b(?:performance affs?|k affs?|policy affs?|critical affs?|affs|disad|da|cp|k)\b/g, ' ');
  const terms = [...new Set(topical.replace(promptWords, ' ').replace(/\bat\b/g, ' ').split(/\s+/).filter(term => /[a-z0-9]/.test(term)))];
  return { role, family, targetFamily, speech, side, response, direction, topics: terms };
}

export type DebateQuery = ReturnType<typeof interpretDebateQuery>;

type RecordContext = { tag: string; evidence?: string; sectionHeadings?: readonly string[] };
type DebateMatch = { score: number; compatible: boolean };
export function matchDebateRecord(query: DebateQuery, record: RecordContext, title: string, folder: string): DebateMatch | null {
  if (!query.role && !query.family && !query.speech && !query.response) return null;
  const tag = aliasTopics(normalize(record.tag));
  const sections = (record.sectionHeadings ?? []).map(value => aliasTopics(normalize(value)));
  const titleText = aliasTopics(normalize(title));
  const folderText = aliasTopics(normalize(folder));
  const context = [tag, ...sections, titleText, folderText].join(' ');
  const hits = query.topics.filter(term => new RegExp(`\\b${term}\\b`).test(context)).length;
  if (hits !== query.topics.length) return null;

  const tagRole = roleRules.find(([, pattern]) => pattern.test(tag))?.[0];
  const sectionRole = sections.toReversed().map(section => {
    // "AT UQ outweighs link" is a response section, not an affirmative claim about the link.
    if (/^at\b/.test(section)) return undefined;
    return roleRules.find(([, pattern]) => pattern.test(section))?.[0];
  }).find(Boolean);
  const family = sections.toReversed().map(familyOf).find(Boolean) ?? familyOf(titleText) ?? familyOf(folderText);
  const familyMatches = !query.family || family === query.family;
  if (query.family && family && !familyMatches) return null;

  const counteredWar = /\b(no (?:\w+ ){0,5}(?:war|escalation)|(?:war|escalation) (?:is )?unlikely|risk.{0,32} (?:is )?zero|caps? (?:\w+ ){0,5}(?:war|conflict|escalation)|deter\w* (?:\w+ ){0,5}(?:war|escalation))\b/.test(tag);
  const offense = /\b(?:causes?|guarantees?|triggers?|ends in) (?:\w+ ){0,3}(?:extinction|nuclear war)\b/.test(tag);
  const explicitAnswer = tagRole && /defense|turn|deficit|non-uniqueness|permutation answer/.test(tagRole);
  const role = explicitAnswer ? tagRole : counteredWar && !offense ? 'impact defense' : offense ? 'impact' : sectionRole ?? tagRole;
  const responds = /\b(?:at|answers?|no link|does not solve|fails|defense)\b/.test(tag) || sections.some(section => /^at\b|\b(?:answers?|defen[cs]e)\b/.test(section));
  const directionMatches = !query.direction || new RegExp(`\\b${query.direction}\\b`).test([tag, ...sections].join(' '));
  const speechMatches = Boolean(query.speech && new RegExp(`\\b${query.speech}\\b`).test(context));
  const sideMatches = query.side === 'aff' ? /\b(?:1ac|2ac|1ar|2ar|aff answers?)\b/.test(context)
    : query.side === 'neg' && /\b(?:1nc|2nc|1nr|2nr|case neg)\b/.test(context);
  const targetMatches = !query.targetFamily || familyOf(tag) === query.targetFamily
    || sections.some(section => familyOf(section) === query.targetFamily) || familyOf(titleText) === query.targetFamily;
  const compatible = (!query.role || role === query.role) && familyMatches && (!query.response || responds) && directionMatches && targetMatches;
  if (!role && !family && !speechMatches && !responds) return null;
  if (query.family && !family && query.topics.length === 0) return null;
  const termEvidence = query.topics.filter(term => tag.split(' ').includes(term)).length;
  return { compatible, score: termEvidence * 2 + Number(speechMatches) * 3 + Number(sideMatches) + Number(role === query.role && Boolean(role)) * 4 };
}
