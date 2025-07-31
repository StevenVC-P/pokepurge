# 🟧 Useful Tier Definition - Final

## Overview
**"Situational spice / one-cup wonders / limited role"**

The Useful tier represents Pokemon with limited but genuine utility. These are situational specialists, format-specific performers, or Pokemon that excel in very narrow roles. While not broadly viable, they can provide value in specific circumstances or team compositions.

**Target Distribution**: 10-15% (160-240 Pokemon)  
**Current Status**: Not yet implemented 🔄 **Pending**

---

## 📊 Tier Score Thresholds Reference Table

| Criteria Type | Useful Threshold | Notes |
|---------------|------------------|-------|
| **PvP Score** | 60-69 | Limited but functional performance |
| **Core League Performance** | 75-79.9 | Decent in specific matchups |
| **Raid Score** | 6.0-6.9 | B Tier specialists |
| **Type Ranking** | Rank 21-30 in type | Decent type options |
| **Cup Performance** | 85+ in specific cups | Format specialists |
| **Gym Role** | B tier or higher | Moderate gym utility |
| **Spice Factor** | Unique but limited utility | Surprise picks |

---

## ⚠️ Edge Case Appendix: Tier Resolution Scenarios

**1. Pidgeot**
- **PvP Score**: 76.2 (Great League)
- **Role**: Normal/Flying with decent bulk
- **Tier**: Useful (Functional but heavily outclassed by better Normal types)

**2. Beedrill**
- **PvP Score**: 75.8 (Great League)
- **Accessibility**: Common, easy to obtain
- **Tier**: Useful (Budget option with limited utility)

**3. Mega Beedrill**
- **Raid Score**: B+ Tier Bug
- **PvP Score**: 67.1 (Limited)
- **Tier**: Useful (Niche raid specialist with minimal broader utility)

**4. Galvantula**
- **PvP Score**: 79.8 (Great League)
- **Typing**: Bug/Electric (unique but limited)
- **Tier**: Useful (Interesting typing but very niche application)

**5. Cup Specialists**
- **Performance**: 85+ in specific themed cups
- **Core Performance**: 60-74
- **Tier**: Useful (One-cup wonders with limited broader application)

**6. Spice Picks**
- **Performance**: Unexpected utility in specific matchups
- **Meta Position**: Off-meta but functional
- **Tier**: Useful (Surprise factor with situational value)

---

## 🔁 Rotating League Clarification

For Useful tier Pokemon:
- **Core league performance** of 75-79.9 may qualify for specific roles
- **Cup dominance** (85+) in themed formats can elevate otherwise weak Pokemon
- **Limited format specialists** with narrow but strong performance
- **Seasonal picks** that excel in specific meta conditions

---

## 🔄 Moveset Meta Alignment

Useful tier Pokemon typically feature:
> "Functional movesets that excel in specific situations or matchups, though lacking the consistency or power for broader competitive use."

For specialists:
> "Access to unique move combinations that provide niche utility or surprise factor, making them valuable for specific team strategies despite overall limitations."

---

## 📋 Classification Logic

### Situational PvP
```
IF maxCoreScore >= 75 AND maxCoreScore < 80 AND hasNicheUtility THEN Useful
OR IF cupSpecialist AND cupScore >= 85 AND coreScore >= 60 THEN Useful
OR IF spicePick AND functionalInMeta THEN Useful
```

### Limited Raid Utility
```
IF tierScore >= 6 AND tierScore < 10 AND hasTypeUtility THEN Useful
OR IF budgetOption AND accessible AND raidScore >= 12 THEN Useful
```

### Format Specialists
```
IF formatDominant AND limitedScope THEN Useful
OR IF uniqueTyping AND situationalValue THEN Useful
```

---

## 🎯 Implementation Criteria

### Primary Qualifications
1. **Situational PvP Value**: 75-79.9 core league performance
2. **Cup Specialists**: 85+ in specific themed cups
3. **Budget Raiders**: B Tier raid utility with accessibility
4. **Spice Picks**: Off-meta Pokemon with genuine surprise value
5. **Format MVPs**: Strong in limited/rotating formats

### Quality Standards
- **Genuine Utility**: Each Pokemon must have clear situational value
- **Limited Scope**: Utility should be narrow but real
- **Accessibility Factor**: Consider ease of obtaining/building
- **Meta Relevance**: Some connection to competitive play

---

## 💡 Usage Guidance

### For Players
- **Priority 4**: Develop only for specific situations or fun
- **Investment Level**: Low to moderate, situational moves
- **Purpose**: Situational coverage, cup specialists, spice picks
- **Value Proposition**: Niche utility and surprise factor

### For Developers
- **Scope Definition**: Clear situational utility required
- **Quality Control**: Avoid Pokemon with no genuine value
- **Format Tracking**: Monitor cup and format performance
- **Spice Recognition**: Identify legitimate off-meta picks

---

## 🔧 Implementation Strategy

### Phase 1: Identify Candidates
- Pokemon with 75-79.9 core league scores
- Cup specialists with 85+ themed performance
- B Tier raid specialists with unique utility
- Off-meta picks with documented success

### Phase 2: Validate Utility
- Verify genuine situational value
- Confirm limited but real competitive use
- Check accessibility and building requirements
- Validate spice pick potential

### Phase 3: Size Control
- Target 160-240 Pokemon (10-15%)
- Balance between different utility types
- Ensure clear distinction from Reliable tier
- Maintain meaningful tier separation

---

## 📊 Expected Categories

### Situational PvP (40-50%)
- Pokemon with 75-79.9 core performance
- Niche typing advantages
- Specific matchup specialists

### Cup Specialists (25-30%)
- Themed cup dominators
- Format-specific MVPs
- Seasonal meta picks

### Budget Raiders (15-20%)
- B Tier raid specialists
- Accessible alternatives
- Type coverage options

### Spice Picks (10-15%)
- Off-meta surprises
- Unique utility Pokemon
- Creative team options

---

## 🔄 Maintenance Notes

- **Utility Validation**: Regular review of situational value
- **Format Tracking**: Monitor cup and limited format performance
- **Meta Evolution**: Adjust for changing competitive landscape
- **Size Management**: Maintain 10-15% target distribution

The Useful tier will capture Pokemon with genuine but limited utility, providing value for specific situations while maintaining clear separation from higher tiers.
