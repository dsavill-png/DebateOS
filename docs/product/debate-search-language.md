# College policy debate search language

This vocabulary supports NDT/CEDA-style search. It treats the argument family, requested component, speech or side, topic or target, and response direction as separate signals. It does not require a new ranker for every file, country, tournament or topic. Topic aliases and corpus-specific classifications can expand independently.

| Position | Searchable components and responses |
| --- | --- |
| Policy affirmative | Plan text and planks, inherency, harms and significance, advantage and add-on, link, internal link, impact, solvency |
| Critical, hybrid or performance affirmative | Advocacy or method, thesis terms, link and impact, framework, role of the ballot or judge, solvency or method defense |
| Case negative | Inherency and harms answers, no link and internal-link takeouts, impact defense and turns, solvency deficits and circumvention, presumption and weighing |
| Disadvantage | Uniqueness, brink, link, internal link, impact, non-uniqueness, link and impact defense, link and impact turns |
| Counterplan | Text and planks, solvency, solvency deficit, net benefit, competition, permutation and permutation answers, conditionality and fiat |
| Kritik | Link, impact or implication, alternative, alternative solvency and deficits, framework, permutation and answers |
| Topicality, framework and theory | Interpretation and counter-interpretation, violation, standards, voters, topical version, reasonability, competing interpretations, conditionality, role of the ballot and judge |
| Rebuttal | Frontline or answers, speech context, impact weighing by magnitude, probability and timeframe, and presumption |

A link answers what triggers an argument. An internal link explains a later step. An impact explains why the chain matters. Impact defense reduces the probability, severity or scope of the asserted impact. An impact turn argues that the opposing side's impact is beneficial or that its direction reverses. A card can support a particular role in one file and another elsewhere. Recital of a speech name is treated as a retrieval preference.

The system uses tags, headings, file identity and the existing curated classifications. Structural matches are useful starting points and still require a read of the card. For example, an arms-transfer disadvantage link may live under a link heading even if its own tag never says “DA.” The result cannot acquire a verified preview without eligible provenance. An analytic, plan text or shell lacking an indexed card can only be located through an eligible source file in the current preview.

## Unified search

Search all three record types by default. Named positions rank first for position requests. A requested evidence role puts matching cards first, and explicit file or folder requests favor source documents. Optional result filters keep the submitted search. An argument result can carry its indexed section path, supporting cards with current revision checks, and its original source document. Exact file paths and supported links remain visible when evidence coverage is incomplete.

## Claim-directed answers

A request such as “answers to [claim] (named answers file)” separates the target proposition from the optional file or folder hint. It ranks explicit responses and evidence filed under a matching answer heading above related cards. Treat topic overlap as context. An answer section can establish what the card responds to, while the tag and evidence determine how it responds. Preserve heading breadcrumbs and differentiate direct matches from related material.

## Verification

The automated suite includes 45 student-style prompts across policy and critical positions, negative case strategies, off-case positions, responses, and case and procedural jargon. It also exercises role and direction differences on fixtures. The live preview is a bounded evidence collection. Interpretation tests measure recognition of the prompt, and a coach-labeled holdout is still required to measure search relevance comprehensively.

## Research basis

- [Finding Your Voice: A Comprehensive Guide to Collegiate Policy Debate](https://d-scholarship.pitt.edu/20817/1/Finding_Your_Voice_FINAL.pdf), University of Pittsburgh. See the chapters on the 1AC, 1NC, counterplans, kritiks and performance.
- [National Debate Tournament Standing Rules](https://nationaldebatetournament.org/about/standing-rules/standing-rules-for-the-tournament/) and [CEDA Constitution and By-Laws](https://cedadebate.org/wp-content/uploads/CEDA-Constitution-and-By-laws-4-19-22.pdf) for competition and evidence-policy context.
- [Emory University Policy Debate Manual](https://milwaukeedebateleague.org/wp-content/uploads/Documents/Emory-University-Policy-Debate-Manual.pdf) for common evidence and argument vocabulary.
- [Competing Interpretations and Reasonability in Topicality Debates](https://openurl.ebsco.com/contentitem/gcd%3A136654563?id=ebsco%3Agcd%3A136654563&sid=ebsco%3Aplink%3Acrawler) for the distinction between topicality decision standards.
