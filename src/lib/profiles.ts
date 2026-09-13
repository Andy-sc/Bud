export interface Profile {
  id: string;
  label: string;
  email: string;
}

// Fixed pair of profiles for this app — no real email/inbox is ever used;
// these addresses only exist as unique Supabase Auth identifiers. The PIN
// each person picks is stored as that identity's password.
export const PROFILES: Profile[] = [
  { id: "vale", label: "Vale", email: "vale@bud.internal" },
  { id: "jose", label: "Jose", email: "jose@bud.internal" },
];

export function profileById(id: string): Profile | undefined {
  return PROFILES.find((p) => p.id === id);
}
