// Keep existing short identities; long canonical keys stay searchable metadata
// while their Firestore document IDs fit the existing server-side ID rules.
export async function contentDocumentId(canonicalKey: string): Promise<string> {
  if (canonicalKey.length <= 128) return canonicalKey;
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalKey));
  return 'content-' + Array.from(new Uint8Array(hash)).map(value => value.toString(16).padStart(2, '0')).join('');
}
