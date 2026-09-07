/**
 * Dovednosti a certifikace — web strana. Číselník i výpočet platnosti žijí
 * v `convex/lib/skills.ts`, aby backend i frontend počítaly stejně.
 */
export {
  SKILLS,
  EXPIRING_SOON_DAYS,
  credentialState,
  skillByKey,
  skillLabel,
  validityLabel,
  validUntilFor,
} from "../convex/lib/skills";
export type {
  CredentialState,
  SkillDef,
  SkillKey,
} from "../convex/lib/skills";
