/**
 * DEPRECATED: Duplicate frontend school facts have been removed.
 *
 * The official single source of truth for Sherwood College FAQ and knowledge
 * is maintained exclusively on the server in:
 *   backend/data/school_faq.json
 *
 * All AI queries (streaming and standard) now query the backend directly,
 * ensuring real-time propagation of live FAQ edits without client bundling or caching divergence.
 */

export function getSchoolInformationAnswer() {
  // Always return null to enforce backend single source of truth
  return null;
}
