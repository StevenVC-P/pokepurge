# 🟪 Niche Tier Definition - Final

## Overview
**"Rarely useful, but might shine in fringe formats"**

The Niche tier represents Pokemon with very limited competitive utility. These Pokemon may have occasional value in extremely specific circumstances, fringe formats, or as collection pieces, but generally lack meaningful competitive application.

**Target Distribution**: 20-25% (320-400 Pokemon)  
**Current Status**: Not yet implemented 🔄 **Pending**

---

## 📊 Tier Score Thresholds Reference Table

| Criteria Type | Niche Threshold | Notes |
|---------------|-----------------|-------|
| **PvP Score** | 50-59 | Very limited performance |
| **Core League Performance** | 60-74.9 | Poor but not completely unusable |
| **Raid Score** | <6.0 | C Tier or lower |
| **Type Ranking** | Outside top 30 | Poor type representatives |
| **Fringe Format** | Occasional utility | Very specific circumstances |
| **Gym Role** | C-tier or gimmick | Minimal gym value |
| **Collection Value** | Rare but weak | Pokedex completion |

---

## ⚠️ Edge Case Appendix: Tier Resolution Scenarios

**1. Dunsparce**
- **PvP Score**: 68.4 (Great League)
- **Utility**: Normal type with limited movepool
- **Tier**: Niche (Functional stats but completely outclassed)

**2. Unown**
- **PvP Score**: <30 (All leagues)
- **Collection Value**: Rare, multiple forms
- **Tier**: Niche (Collection piece with no competitive value)

**3. Delibird**
- **PvP Score**: 45.2 (Great League)
- **Seasonal Relevance**: Holiday events
- **Tier**: Niche (Novelty Pokemon with minimal utility)

**4. Luvdisc**
- **PvP Score**: 52.1 (Great League)
- **Role**: Pure Water type
- **Tier**: Niche (Completely outclassed by better Water types)

**5. Fringe Format Specialists**
- **Performance**: Decent in extremely specific formats
- **Broader Utility**: Minimal to none
- **Tier**: Niche (Very narrow application)

**6. Legacy Move Dependencies**
- **Current Performance**: Poor with available moves
- **Legacy Potential**: Decent with unavailable moves
- **Tier**: Niche (Theoretical utility only)

---

## 🔁 Rotating League Clarification

For Niche tier Pokemon:
- **Core league performance** below 75 typically qualifies
- **Fringe format utility** must be extremely limited
- **Collection value** may elevate otherwise useless Pokemon
- **Seasonal relevance** provides minimal tier consideration

---

## 🔄 Moveset Meta Alignment

Niche tier Pokemon typically feature:
> "Limited movesets that provide minimal competitive utility, often lacking the power, coverage, or energy management needed for meaningful competitive application."

For collection pieces:
> "Movesets that may be interesting or unique but fail to provide practical competitive value in any meaningful format or situation."

---

## 📋 Classification Logic

### Poor Performance
```
IF maxCoreScore < 75 AND pvpScore < 12 AND noSpecialUtility THEN Niche
OR IF raidScore < 6 AND pvpScore < 10 THEN Niche
```

### Collection Value
```
IF rare AND collectible AND minimalUtility THEN Niche
OR IF multipleFormsButWeak THEN Niche
```

### Fringe Utility
```
IF verySpecificUtility AND extremelyLimitedScope THEN Niche
OR IF legacyMoveDependent AND currentlyWeak THEN Niche
```

---

## 🎯 Implementation Criteria

### Primary Qualifications
1. **Poor Performance**: <75 core league scores with minimal utility
2. **Collection Pieces**: Rare Pokemon with no competitive value
3. **Outclassed Completely**: Better alternatives exist in every scenario
4. **Fringe Specialists**: Utility only in extremely specific circumstances
5. **Legacy Dependencies**: Theoretical utility with unavailable moves

### Quality Standards
- **Minimal Utility**: Very limited competitive application
- **Collection Value**: May have rarity or aesthetic appeal
- **Clear Outclassing**: Better alternatives readily available
- **Fringe Recognition**: Acknowledge extremely narrow utility

---

## 💡 Usage Guidance

### For Players
- **Priority 5**: Collection purposes only
- **Investment Level**: Minimal resources
- **Purpose**: Pokedex completion, novelty, very specific situations
- **Value Proposition**: Collection completion and occasional surprise utility

### For Developers
- **Utility Recognition**: Acknowledge minimal but existing value
- **Collection Consideration**: Factor in rarity and aesthetic appeal
- **Clear Separation**: Distinguish from completely useless Pokemon
- **Size Management**: Largest tier by design (20-25%)

---

## 🔧 Implementation Strategy

### Phase 1: Identify Candidates
- Pokemon with <75 core league performance
- Collection pieces with minimal utility
- Completely outclassed Pokemon
- Legacy move dependencies

### Phase 2: Validate Minimal Utility
- Confirm extremely limited competitive value
- Check for any fringe format utility
- Verify collection or aesthetic value
- Ensure clear separation from Trash tier

### Phase 3: Size Control
- Target 320-400 Pokemon (20-25%)
- Largest single tier by design
- Balance collection vs minimal utility
- Maintain clear tier boundaries

---

## 📊 Expected Categories

### Poor Performers (50-60%)
- Pokemon with <75 core performance
- Weak stats or movesets
- Completely outclassed options

### Collection Pieces (20-25%)
- Rare Pokemon with no competitive value
- Multiple forms but weak performance
- Aesthetic or novelty appeal

### Fringe Specialists (10-15%)
- Extremely narrow utility
- Legacy move dependencies
- Theoretical but impractical value

### Outclassed Alternatives (10-15%)
- Pokemon with better alternatives in every role
- Redundant typing with poor stats
- Obsolete due to power creep

---

## 🔄 Maintenance Notes

- **Utility Monitoring**: Track any emerging fringe utility
- **Collection Updates**: Monitor new rare releases
- **Power Creep**: Adjust for Pokemon becoming obsolete
- **Size Balance**: Maintain as largest tier (20-25%)

The Niche tier serves as a buffer between Pokemon with minimal utility and those with no value, acknowledging collection appeal while maintaining competitive relevance standards.
