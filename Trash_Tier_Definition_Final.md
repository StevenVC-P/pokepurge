# 🟥 Trash Tier Definition - Final

## Overview
**"No real use — bad stats, moves, or fully outclassed"**

The Trash tier represents Pokemon with no meaningful competitive utility. These Pokemon have poor stats, terrible movesets, or are so completely outclassed that they serve no purpose other than candy generation. Investment in these Pokemon is not recommended under any circumstances.

**Target Distribution**: 30-35% (480-560 Pokemon)  
**Current Status**: Not yet implemented 🔄 **Pending**

---

## 📊 Tier Score Thresholds Reference Table

| Criteria Type | Trash Threshold | Notes |
|---------------|-----------------|-------|
| **PvP Score** | <50 | Extremely poor performance |
| **Core League Performance** | <60 | Unusable in competitive formats |
| **Raid Score** | <5.0 | No raid utility |
| **Type Ranking** | Outside top 40 | Worst representatives of their type |
| **Gym Role** | No value | Completely outclassed |
| **Collection Value** | Common and weak | No redeeming qualities |
| **Investment Return** | Negative | Resources better spent elsewhere |

---

## ⚠️ Edge Case Appendix: Tier Resolution Scenarios

**1. Caterpie**
- **PvP Score**: <20 (All leagues)
- **Role**: Unevolved Bug type
- **Tier**: Trash (No competitive utility, evolution material only)

**2. Magikarp**
- **PvP Score**: <15 (All leagues)
- **Evolution**: Gyarados (higher tier)
- **Tier**: Trash (Only value is evolution potential)

**3. Sunkern**
- **PvP Score**: <25 (All leagues)
- **Stats**: Extremely poor across all categories
- **Tier**: Trash (Lowest base stat total in the game)

**4. Azurill**
- **PvP Score**: <30 (All leagues)
- **Evolution Line**: Azumarill (Essential tier)
- **Tier**: Trash (Pre-evolution with no independent value)

**5. Cosmog**
- **PvP Score**: <10 (All leagues)
- **Legendary Status**: Rare but completely unusable
- **Tier**: Trash (Rarity doesn't compensate for complete lack of utility)

**6. Completely Outclassed**
- **Performance**: Decent stats but better alternatives exist
- **Redundancy**: No unique utility or niche
- **Tier**: Trash (When better options are readily available)

---

## 🔁 Rotating League Clarification

For Trash tier Pokemon:
- **No format** provides meaningful competitive utility
- **Even fringe formats** offer no viable application
- **Collection value** is minimal due to commonality
- **Investment** provides no return in any competitive context

---

## 🔄 Moveset Meta Alignment

Trash tier Pokemon typically feature:
> "Movesets that are fundamentally flawed, lacking the power, coverage, typing synergy, or energy management needed for any competitive application."

For evolution materials:
> "Pokemon whose only value lies in their evolution potential, with no independent competitive merit in their current form."

---

## 📋 Classification Logic

### No Competitive Value
```
IF maxCoreScore < 60 AND pvpScore < 8 AND raidScore < 5 THEN Trash
OR IF completelyOutclassed AND noUniqueUtility THEN Trash
```

### Evolution Materials
```
IF preEvolution AND noIndependentValue AND commonlyAvailable THEN Trash
OR IF evolutionMaterial AND currentFormUseless THEN Trash
```

### Resource Waste
```
IF investmentReturn <= 0 AND betterAlternativesExist THEN Trash
OR IF powerCreepVictim AND noRedeeming Qualities THEN Trash
```

---

## 🎯 Implementation Criteria

### Primary Qualifications
1. **Extremely Poor Performance**: <60 core league scores with no utility
2. **Complete Outclassing**: Better alternatives exist in every possible role
3. **Evolution Materials**: Pre-evolutions with no independent value
4. **Resource Waste**: Investment provides no competitive return
5. **Power Creep Victims**: Pokemon made obsolete by newer releases

### Quality Standards
- **Zero Utility**: No meaningful competitive application
- **Resource Efficiency**: Better alternatives readily available
- **Clear Separation**: Distinct from Niche tier minimal utility
- **Investment Guidance**: Clear "do not invest" recommendation

---

## 💡 Usage Guidance

### For Players
- **Priority**: Transfer for candy immediately
- **Investment Level**: Zero resources
- **Purpose**: Candy generation only
- **Value Proposition**: No competitive value, transfer recommended

### For Developers
- **Clear Identification**: Obvious lack of utility
- **Resource Guidance**: Strong transfer recommendations
- **Size Management**: Largest tier (30-35%)
- **Power Creep Tracking**: Monitor Pokemon becoming obsolete

---

## 🔧 Implementation Strategy

### Phase 1: Identify Clear Cases
- Pokemon with <60 core performance and no utility
- Pre-evolutions with no independent value
- Completely outclassed Pokemon
- Power creep victims

### Phase 2: Validate Zero Utility
- Confirm no competitive application exists
- Verify better alternatives are available
- Check for any hidden utility or niche
- Ensure clear separation from Niche tier

### Phase 3: Size Control
- Target 480-560 Pokemon (30-35%)
- Largest tier by design
- Clear transfer recommendations
- Maintain competitive relevance focus

---

## 📊 Expected Categories

### Pre-Evolutions (40-50%)
- Unevolved Pokemon with no independent value
- Evolution materials only
- Common and easily replaceable

### Completely Outclassed (25-30%)
- Pokemon with better alternatives in every role
- Redundant typing with poor performance
- No unique utility or niche

### Power Creep Victims (15-20%)
- Pokemon made obsolete by newer releases
- Previously viable but now outclassed
- No remaining competitive relevance

### Fundamentally Flawed (10-15%)
- Pokemon with inherently poor design
- Terrible stat distributions
- Unusable movesets

---

## 🔄 Maintenance Notes

- **Power Creep Monitoring**: Track Pokemon becoming obsolete
- **Transfer Recommendations**: Clear guidance for resource management
- **Size Balance**: Maintain as largest tier (30-35%)
- **Utility Verification**: Ensure zero competitive value

The Trash tier provides clear guidance on Pokemon that offer no competitive value, helping players make efficient resource management decisions while maintaining the integrity of the tier system.
