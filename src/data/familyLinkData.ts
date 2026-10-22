export type LocalLinkProfile = { id: string; name: string; selectedAge: string };
export function minimalFamilyDraft(uid: string, profile: LocalLinkProfile, nickname: string) {
  const alias = nickname.trim();
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(uid) || !profile.id || profile.id.length > 256) throw new Error('Identificador no compatible.');
  if (!alias || alias.length > 60 || /[\u0000-\u001f\u007f]/.test(alias) || !['3-5', '6-8', '9-10'].includes(profile.selectedAge)) throw new Error('Revisá el apodo y el rango de edad.');
  // Deliberate allowlist: never spread a local child profile into a cloud write.
  return { ownerUid: uid, schemaVersion: 1, nickname: alias, ageRange: profile.selectedAge };
}
export async function familyProfileId(uid: string, localId: string) {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(uid) || !localId || localId.length > 256) throw new Error('Identificador no compatible.');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify([uid, localId])));
  return Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, '0')).join('');
}
