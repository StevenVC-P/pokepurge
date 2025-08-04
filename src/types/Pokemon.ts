export interface OptimizedMoves {
  fast?: string; // Move ID reference
  charge1?: string; // Move ID reference
  charge2?: string; // Move ID reference
}

export interface MovesetStats {
  turnsToCharge1?: number;
  turnsToCharge2?: number;
  fastDPS: number;
  fastEPS: number;
  charge1DPE: number;
  charge2DPE: number;
  hasSecondCharge: boolean;
  stab: {
    fast: boolean;
    charge1: boolean;
    charge2: boolean;
  };
}

export interface LeagueData {
  rating?: number;
  score?: number;
  scoreDetails?: number[];
  moveset?: string[];
  stats?: {
    product: number;
    atk: number;
    def: number;
    hp: number;
  };
  moves?: OptimizedMoves;
  movesetStats?: MovesetStats;
}

export interface WeaknessAnalysis {
  totalImpact: number;
  defensiveRating: string;
  weaknessCount: number;
  resistanceCount: number;
  majorWeaknesses: Array<{
    type: string;
    effectiveness: number;
    usage: number;
    impact: number;
  }>;
  majorResistances: Array<{
    type: string;
    effectiveness: number;
    usage: number;
    benefit: number;
  }>;
  hasHighImpactWeaknesses: boolean;
  hasHighBenefitResistances: boolean;
  netDefensiveScore: number;
}

export interface MaxBattleTarget {
  name: string;
  tier: number;
  effectiveness: string;
}

export interface MaxBattleCounter {
  name: string;
  role: string;
  effectiveness: string;
}

export interface MaxMoveRecommendation {
  moveName: string;
  moveType: string;
  category: 'Attack' | 'Guard' | 'Spirit';
  priority: 'Primary' | 'Secondary' | 'Situational';
  description: string;
}

export interface DynamaxRole {
  primary: 'Attacker' | 'Defender' | 'Healer' | 'Hybrid';
  secondary?: 'Attacker' | 'Defender' | 'Healer';
  confidence: number; // 0-100
  reasoning: string;
}

export interface Pokemon {
  id: number;
  name: string;
  base: string;
  form: string;
  types: string[];
  trashability: string;
  recommendedCount: number;
  candy: string;
  dynamax: boolean;
  url: string;
  leagues: {
    great?: LeagueData;
    ultra?: LeagueData;
    master?: LeagueData;
  };
  raidTier: string;
  defenderTier: string;
  bestTypes: Object;
  trashabilityScore: number;
  weaknessAnalysis?: WeaknessAnalysis;
  // AI-generated role metadata
  quickRole?: string;
  keyTags?: string[];
  roleSummary?: string;
  notes?: string;
  // Dynamax-specific fields (only present for dynamax Pokemon)
  dynamaxScore?: number;
  regularTrashability?: string;
  regularRecommendedCount?: number;
  regularTrashabilityScore?: number;
  // Dynamax AI analysis
  dynamaxQuickRole?: string;
  dynamaxKeyTags?: string[];
  dynamaxRoleSummary?: string;
  dynamaxNotes?: string;
  // Max Battle effectiveness data
  maxBattleEffectiveAgainst?: MaxBattleTarget[];
  maxBattleVulnerableTo?: MaxBattleCounter[];
  // Max Move recommendations and strategy
  maxMoveRecommendations?: MaxMoveRecommendation[];
  dynamaxRole?: DynamaxRole;
}
