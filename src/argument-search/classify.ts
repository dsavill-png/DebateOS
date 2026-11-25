import { normalizeSearchText, type SearchCard } from './search.ts';

type Extract = Pick<SearchCard, 'tag' | 'evidence'>;
type Label = Pick<SearchCard, 'claim' | 'condition' | 'classificationBasis'>;
const usChina = /\bus\b.{0,32}\bchina\b|\bchina\b.{0,32}\bus\b/;
const conflict = /\b(war|conflict|fighting|peace|military clash)\b/;
const noConflict = /\b(no (?:direct )?(?:us china |china )?war|war (?:is )?unlikely|avoid\w* (?:direct )?war|preserv\w* peace|restraints|keep the peace|not ready for war|de escalation|brakes on escalation)\b/;
const escalation = /\bescalat\w*\b/;
const negative = /\b(won t|will not|unlikely|refrain\w*|risks? are too high|stakes are too high)\b/;
const japan = /\b(japan|japanese|tokyo)\b/;
const alliance = /\b(alliance|defen[sc]e commitments?|security cooperation)\b/;
const erosion = /\b(erosion|fractur\w*|credibility tipping point|undermines?|breaks? down|weakens?|collapse\w*|drifts? away)\b/;
const consequences = /\b(catastrophic (?:global )?consequences|goes nuclear|ends in extinction|war (?:causes|triggers|results in) (?:extinction|nuclear war))\b/;

/** A narrow suggestion from indexed text. The source passage and coach review remain authoritative. */
export function suggestClaim(source: Extract): Label {
  const tag = normalizeSearchText(source.tag);
  const evidence = normalizeSearchText(source.evidence.slice(0, 800));
  const text = `${tag} ${evidence}`;
  if (japan.test(tag) && alliance.test(tag) && erosion.test(tag) && alliance.test(evidence)) {
    return { claim: { subject: 'japan-alliance', facet: 'alliance-erosion' }, classificationBasis: 'tag-and-excerpt' };
  }
  if (japan.test(tag) && alliance.test(tag) && /\b(strong|holds|resilien\w*)\b/.test(tag) && alliance.test(evidence)) {
    return { claim: { subject: 'japan-alliance', facet: 'alliance-resilience' }, classificationBasis: 'tag-and-excerpt' };
  }
  if (/\btaiwan\b/.test(tag) && escalation.test(tag) && /\btaiwan\b|\broc\b/.test(evidence)) {
    if (negative.test(tag) && (negative.test(evidence) || /stakes thankfully remain too high/.test(evidence))) {
      return { claim: { subject: 'taiwan-escalation', facet: 'escalation-unlikely' }, classificationBasis: 'tag-and-excerpt' };
    }
    if (!negative.test(tag) && /\b(will escalate|inevitable|escalation is likely)\b/.test(tag) && escalation.test(evidence)) {
      return { claim: { subject: 'taiwan-escalation', facet: 'escalation-likely' }, classificationBasis: 'tag-and-excerpt' };
    }
  }
  if (!usChina.test(text) || !conflict.test(text)) return {};
  const narrowNuclearPledge = /\bno first use\b/.test(evidence);
  if (noConflict.test(tag) && noConflict.test(evidence) && !narrowNuclearPledge) {
    const conditional = /\b(absent|outside) (?:a )?taiwan\b/.test(tag);
    return { claim: { subject: 'us-china-war', facet: 'war-unlikely' }, classificationBasis: 'tag-and-excerpt',
      ...(conditional ? { condition: 'Outside a Taiwan scenario' } : {}) };
  }
  if (consequences.test(tag) && consequences.test(evidence)) {
    return { claim: { subject: 'us-china-war', facet: 'war-impacts' }, classificationBasis: 'tag-and-excerpt' };
  }
  if (/\b(war is (?:likely|imminent|inevitable)|are headed toward an inevitable conflict)\b/.test(tag)
    && /\b(likely|inevitable|imminent)\b/.test(evidence) && !negative.test(tag)) {
    return { claim: { subject: 'us-china-war', facet: 'war-likely' }, classificationBasis: 'tag-and-excerpt' };
  }
  if (escalation.test(tag) && /\b(entanglement|miscalculat\w*|escalat\w*)\b/.test(evidence) && !noConflict.test(tag)) {
    return { claim: { subject: 'us-china-war', facet: 'escalation' }, classificationBasis: 'tag-and-excerpt' };
  }
  return {};
}
