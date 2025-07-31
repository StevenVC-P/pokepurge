# 🟨 Reliable Tier Definition - Final

## Overview
**"Good but replaceable; only good with IVs, cups, or as filler"**

The Reliable tier represents Pokemon that have clear utility but are not quite strong enough for Valuable tier. These Pokemon are solid options for specific roles, budget teams, or niche coverage, but are generally replaceable by higher-tier alternatives.

**Target Distribution**: 15-20% (240-320 Pokemon)  
**Current Status**: 29.8% (482 Pokemon) ⚠️ **Over Target** - Needs redistribution

---

## 📊 Tier Score Thresholds Reference Table

| Criteria Type | Reliable Threshold | Notes |
|---------------|-------------------|-------|
| **PvP Score** | 70-79 | Decent performance but replaceable |
| **Core League Performance** | 80-86.9 | Good but not quite Valuable tier |
| **Raid Score** | ≥7.0 | A Tier raids or strong B+ performance |
| **Type Ranking** | Rank 11-20 in type | Solid type options |
| **Limited League Performance** | 90-96.9 | Good in specific formats |
| **Gym Role** | A or A+ tier | Strong gym utility |
| **Budget Alternative** | Accessible with decent stats | Good for resource-conscious players |

---

## ⚠️ Edge Case Appendix: Tier Resolution Scenarios

**1. Gyarados**
- **PvP Score**: 81.3 (Great League)
- **Accessibility**: Common, easy to obtain
- **Tier**: Reliable (Good Water/Flying option but outclassed by Valuable alternatives)

**2. Starmie**
- **PvP Score**: 84.4 (Great League)
- **Role**: Fast Water/Psychic attacker
- **Tier**: Reliable (Solid performance but niche typing limits broader utility)

**3. Venusaur**
- **PvP Score**: 86.1 (Great League)
- **Accessibility**: Starter Pokemon, widely available
- **Tier**: Reliable (Good Grass option but outclassed by Essential/Valuable Grass types)

**4. Shadow Gengar**
- **PvP Score**: 89.7 (Limited League)
- **Raid Score**: A Tier Ghost
- **Tier**: Reliable (Good dual utility but not quite Valuable tier performance)

**5. Alolan Raichu**
- **PvP Score**: 82.9 (Great League)
- **Typing**: Electric/Psychic (unique but limited)
- **Tier**: Reliable (Decent utility but very niche application)

**6. Mega Gyarados**
- **PvP Score**: 66.1 (Limited)
- **Raid Score**: A Tier Water
- **Tier**: Reliable (Raid specialist with minimal PvP utility)

---

## 🔁 Rotating League Clarification

For Reliable tier Pokemon:
- **Core league performance** of 80-86.9 qualifies for consideration
- **Limited format specialists** (90-96.9) can qualify with some core league presence
- **Cup specialists** may qualify if they show consistent performance across multiple formats
- **Seasonal viability** in major rotating formats counts toward Reliable status

---

## 🔄 Moveset Meta Alignment

Reliable tier Pokemon typically feature:
> "Functional movesets that provide decent performance in their intended roles, though may lack the optimization or power of higher-tier alternatives."

For specialists:
> "Access to role-specific movesets that excel in particular matchups or formats, making them valuable for targeted team building despite overall limitations."

---

## 📋 Classification Logic

### PvP Options
```
IF maxCoreScore >= 80 AND maxCoreScore < 87 AND pvpScore >= 15 THEN Reliable
OR IF limitedScore >= 90 AND coreScore >= 70 AND pvpScore >= 12 THEN Reliable
OR IF cupSpecialist AND consistentPerformance THEN Reliable
```

### Raid Options
```
IF tierScore >= 10 AND tierScore < 15 AND raidScore >= 15 THEN Reliable (A Tier)
OR IF tierScore >= 6 AND raidScore >= 20 THEN Reliable (Strong B+ Tier)
OR IF typeRanking <= 20 AND tierScore >= 6 THEN Reliable
```

### Budget/Accessible Options
```
IF accessible AND functionalStats AND pvpScore >= 12 THEN Reliable
OR IF starterPokemon AND coreScore >= 75 THEN Reliable
```

---

## 🎯 Target Adjustments Needed

**Current Issues**:
- **482 Pokemon (29.8%)** - Nearly double the target
- **Need to demote**: ~160-240 Pokemon to lower tiers
- **Quality threshold**: Too many marginal Pokemon included

**Proposed Tightening**:
1. **Raise PvP threshold**: 80+ core leagues (from current ~75+)
2. **Raid requirements**: A Tier minimum (remove B+ Tier)
3. **Limited league**: Require 92+ (from current 90+)
4. **Accessibility bonus**: Only for Pokemon with 80+ core performance

---

## 💡 Usage Guidance

### For Players
- **Priority 3**: Develop for specific needs or budget constraints
- **Investment Level**: Moderate level, basic moves, functional IVs
- **Purpose**: Fill team gaps, budget alternatives, niche roles
- **Value Proposition**: Solid performance without heavy resource investment

### For Developers
- **Size Control**: Reduce from 482 to 240-320 Pokemon
- **Quality Focus**: Ensure clear utility for each Pokemon
- **Budget Recognition**: Maintain accessible alternatives
- **Niche Validation**: Verify specialized roles have genuine value

---

## 🔧 Implementation Strategy

### Phase 1: Tighten Criteria
- Raise core league requirement to 80+
- Require A Tier minimum for raid specialists
- Increase limited league threshold to 92+

### Phase 2: Redistribute
- Demote 160-240 Pokemon to Useful/Niche tiers
- Focus on Pokemon with marginal utility
- Preserve clear budget alternatives and niche specialists

### Phase 3: Validate
- Ensure 240-320 Pokemon remain
- Verify each Pokemon has clear utility
- Maintain balance between accessibility and performance

---

## 🔄 Maintenance Notes

- **Size Monitoring**: Keep within 15-20% target range
- **Utility Validation**: Regular review of niche roles
- **Budget Balance**: Maintain accessible alternatives
- **Performance Tracking**: Monitor meta shifts affecting tier placement

The Reliable tier needs significant tightening to achieve the target distribution while maintaining its role as "good but replaceable" Pokemon with clear utility.
