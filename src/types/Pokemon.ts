export interface Pokemon {
  id: number;
  name: string;
  base: string;
  form: string;
  trashability: string;
  recommendedCount: number;
  candy: string;
  dynamax: boolean;
  url: string;
  leagues: Object;
  raidTier: string;
  defenderTier: string;
  bestTypes: Object;
  trashabilityScore: number;
}
