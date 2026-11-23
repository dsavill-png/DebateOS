import { createHash } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { manifestDigest, type Manifest } from './season-coverage.ts';
import * as schema from './schema.ts';

export type ManifestSource = {
  id: string;
  sha256: string;
  url: string;
  fetchedAt: string;
  status: number;
  mediaType: string;
  authorization: 'anonymous public';
};
type Tournament = Manifest['tournaments'][number];
export type RetainedManifest = Omit<Manifest, 'tournaments'> & {
  predecessor: number | null;
  approval: string;
  discovery: ManifestSource[];
  tournaments: (Omit<Tournament, 'bulk' | 'events'> & {
    bulk: ManifestSource | null;
    bulkAttempt: ManifestSource | null;
    invite: ManifestSource;
    events: (Tournament['events'][number] & {
      rationale: string;
      type: string;
      evidence: { source: string; pointer: string };
    })[];
  })[];
};

const provider = 'tabroom';
const policy = { authorization: 'public', purpose: 'season membership evidence',
  audience: 'internal', retention: 'public-evidence' };
const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');

export async function persistSeasonManifest(
  db: NodePgDatabase,
  manifest: RetainedManifest,
  pin: string,
  sourceBytes: (source: ManifestSource, filename: string) => Uint8Array,
) {
  if (manifestDigest(manifest) !== pin) throw new Error('Manifest pin mismatch');
  await db.transaction(async tx => {
    await tx.insert(schema.seasonScopes).values({ id: manifest.scopeId }).onConflictDoNothing();
    const { tournaments, discovery, ...definition } = manifest;
    const [revision] = await tx.insert(schema.seasonRevisions).values({
      scope: manifest.scopeId, version: manifest.revision, predecessor: manifest.predecessor,
      definition: { ...definition, pin, discovery: discovery.map(source => source.id) },
      approvedBy: manifest.approval, reason: 'Public collegiate policy coverage',
    }).onConflictDoNothing().returning();
    if (!revision) {
      const [existing] = await tx.select().from(schema.seasonRevisions).where(and(
        eq(schema.seasonRevisions.scope, manifest.scopeId), eq(schema.seasonRevisions.version, manifest.revision),
      ));
      if ((existing?.definition as { pin?: string } | undefined)?.pin !== pin) {
        throw new Error('Conflicting immutable manifest revision');
      }
      return;
    }

    async function retain(source: ManifestSource, filename: string, operation: string, tournament?: string) {
      const bytes = sourceBytes(source, filename);
      if (source.authorization !== 'anonymous public' || hash(bytes) !== source.sha256) {
        throw new Error('Ineligible or mismatched capture ' + source.id);
      }
      const scope = tournament ? { tournament } : { season: manifest.scopeId };
      const method = operation === 'bulk' ? 'bulk' : 'REST';
      await tx.insert(schema.captures).values({
        id: source.id, provider, method, route: source.url, scope, fetchedAt: source.fetchedAt,
        status: source.status, mediaType: source.mediaType, digest: source.sha256, metadata: {}, ...policy,
      }).onConflictDoNothing();
      const [stored] = await tx.select().from(schema.captures).where(eq(schema.captures.id, source.id));
      if (stored.digest !== source.sha256 || stored.route !== source.url ||
          stored.authorization !== 'public' || stored.grant !== null) throw new Error('Conflicting capture lineage');
      let data;
      if (source.status === 200 && source.mediaType.includes('application/json')) {
        try { data = JSON.parse(Buffer.from(bytes).toString('utf8')); } catch { /* Invalid source capture. */ }
      }
      const outcome = source.status === 401 ? 'unauthorized' : source.status === 403 ? 'forbidden'
        : source.status === 404 ? 'ambiguous-not-found' : source.status === 429 ? 'rate-limited'
        : source.status >= 500 ? 'transient-failure' : data === undefined ? 'invalid'
        : Array.isArray(data) && !data.length ? 'empty' : 'observed';
      await tx.insert(schema.operationOutcomes).values({
        id: source.id, provider, operation, route: source.url, scope, attemptedAt: source.fetchedAt,
        status: source.status, mediaType: source.mediaType, snapshot: source.id, outcome,
      }).onConflictDoNothing();
      return data;
    }

    for (const [index, source] of discovery.entries()) {
      await retain(source, index ? 'discovery-end.json' : 'discovery.json', 'discovery');
    }
    for (const tournament of tournaments) {
      const { id, invite, bulk, bulkAttempt } = tournament;
      const invitation = await retain(invite, id + '-invite.json', 'invite', id);
      const exportSource = bulk ?? bulkAttempt;
      const exported = exportSource && await retain(exportSource, id + '-bulk.json', 'bulk', id);
      await tx.insert(schema.tournaments).values({ provider, sourceId: id }).onConflictDoNothing();
      for (const event of tournament.events) {
        const { source, pointer } = event.evidence;
        const root = source === invite.id ? invitation : source === bulk?.id ? exported : undefined;
        const row = pointer.slice(1).split('/').reduce((value, part) =>
          value && Object.hasOwn(value, part) ? value[part] : undefined, root);
        if (String(root?.id) !== id || String(row?.id) !== event.id || row?.name !== event.division) {
          throw new Error('Event classification evidence mismatch ' + id + '/' + event.id);
        }
        const identity = { provider, tournament: id, sourceId: event.id };
        await tx.insert(schema.events).values(identity).onConflictDoNothing();
        const [stored] = await tx.select().from(schema.events).where(and(
          eq(schema.events.provider, provider), eq(schema.events.tournament, id), eq(schema.events.sourceId, event.id),
        ));
        const [membership] = await tx.insert(schema.seasonMemberships).values({
          revision: revision.id, event: stored.id, decision: event.decision, rationale: event.rationale,
          classification: { division: event.division, sourceType: event.type, circuit: 'NDT-CEDA' },
        }).returning();
        const role = 'season-event-classification';
        await tx.insert(schema.evidence).values({
          snapshot: source, parser: 1, pointer, role, subject: stored.id, sourceId: row.id,
          value: { name: row.name, type: row.type }, verification: 'observed', state: 'observed', ...policy,
        }).onConflictDoNothing();
        const [observation] = await tx.select().from(schema.evidence).where(and(
          eq(schema.evidence.snapshot, source), eq(schema.evidence.parser, 1),
          eq(schema.evidence.pointer, pointer), eq(schema.evidence.role, role),
        ));
        await tx.insert(schema.seasonMembershipEvidence).values({ membership: membership.id, evidence: observation.id });
      }
    }
  });
}
