# 🟦 Valuable Tier Definition - Final

## Overview
**"Strong alternatives / backups / format MVPs"**

The Valuable tier represents Pokemon that are legitimate alternatives to Essential tier Pokemon. These are rewarding investments that provide strong performance in competitive formats, serving as excellent backups, format specialists, or alternatives when Essential Pokemon are unavailable.

**Target Distribution**: 10-15% (160-240 Pokemon)  
**Current Achievement**: 12.9% (209 Pokemon) ✅ **Perfect**

---

## 📊 Tier Score Thresholds Reference Table

| Criteria Type | Valuable Threshold | Notes |
|---------------|-------------------|-------|
| **PvP Score** | 80-89 | Strong alternatives to Essential tier |
| **Core League Performance** | 87+ with 20+ PvP score | High performers that just missed Essential |
| **Multiple League Presence** | 85+ in 2+ core leagues | Versatile alternatives |
| **Raid Score** | 8.0-8.9 | A+ Tier specialists (just below S tier) |
| **Type Ranking** | Rank 4-10 in type | Strong type specialists |
| **Limited League Excellence** | 97+ limited + 80+ core | Exceptional specialists with backup |
| **Gym Role** | S-tier only | Best gym attackers/defenders |

---

## ⚠️ Edge Case Appendix: Tier Resolution Scenarios

**1. Shadow Zapdos**
- **PvP Score**: 86.6 (Ultra League)
- **Raid Score**: A+ Tier Electric
- **Tier**: Valuable (Strong dual utility - excellent raid specialist with solid PvP)

**2. Blastoise**
- **PvP Score**: 90.2 (Great League)
- **Raid Score**: None
- **Tier**: Valuable (High PvP performance, strong Water type alternative)

**3. Shadow Machamp**
- **PvP Score**: 87.5 (Great League)
- **Raid Score**: A Tier Fighting
- **Tier**: Valuable (Excellent versatility - good in both PvP and raids)

**4. Cobalion**
- **PvP Score**: 90.7 (Ultra League)
- **Role**: Best Fighting tank
- **Tier**: Valuable (Best-in-role recognition despite missing Essential)

**5. Mega X Charizard**
- **PvP Score**: 90.6 (Master League)
- **Raid Score**: A Tier Fire
- **Tier**: Valuable (Strong dual utility with good performance in both areas)

**6. Carbink**
- **PvP Score**: 90.8 (Great League)
- **Typing**: Rock/Fairy (unique defensive combination)
- **Tier**: Valuable (Unique typing provides irreplaceable role)

---

## 🔁 Rotating League Clarification

For Valuable tier Pokemon:
- **Core leagues** (Great, Ultra, Master) are primary consideration
- **Limited format excellence** (97+ score) can qualify if backed by decent core performance (80+)
- **Format MVPs** in major rotating formats (Battle Frontier, Hisui) count toward Valuable status
- **Seasonal league dominance** alone does not qualify without core league backup

---

## 🔄 Moveset Meta Alignment

Valuable tier Pokemon typically feature:
> "Optimized PvP movesets with solid energy gain and at least one charge move offering either strong bait pressure or high closing power, making them effective alternatives to Essential tier Pokemon."

For raid specialists:
> "Access to optimal raid movesets with strong DPS or TDO performance, representing clear alternatives to Essential tier raid leaders."

---

## 📋 Classification Logic

### PvP Alternatives
```
IF maxCoreScore >= 87 AND pvpScore >= 20 THEN Valuable
OR IF coreLeagueCount85 >= 2 AND maxCoreScore >= 85 AND pvpScore >= 18 THEN Valuable
OR IF maxLimitedScore >= 97 AND maxCoreScore >= 80 AND pvpScore >= 18 THEN Valuable
```

### Raid Alternatives
```
IF tierScore >= 15 AND raidScore >= 25 THEN Valuable (A+ Tier specialists)
OR IF tierScore >= 10 AND raidScore >= 30 THEN Valuable (High-performing A Tier)
OR IF hasTopTypeRanking (rank 1-3) AND tierScore >= 10 THEN Valuable
```

### Special Recognition
```
IF isBestGymSpecialist AND pvpScore >= 15 AND maxCoreScore >= 75 THEN Valuable
```

---

## 🎯 Quality Standards

**Current Quality Metrics**:
- **73.2% High Quality**: 87+ PvP or A+ Tier raids
- **Rewarding Development**: Clear improvement over lower tiers
- **Alternative Viability**: Legitimate substitutes for Essential Pokemon

**Quality Categories**:
- **High PvP Alternatives (87+)**: 96 Pokemon
- **A+ Tier Raid Specialists**: 13 Pokemon  
- **A Tier Raid Specialists**: 44 Pokemon
- **Good PvP Performance (85-86.9)**: 18 Pokemon
- **Moderate but Specialized**: 38 Pokemon

---

## 💡 Usage Guidance

### For Players
- **Priority 2**: Develop after Essential tier is complete
- **Investment Level**: High level, good moves, competitive IVs
- **Purpose**: Team depth, league specialists, raid alternatives
- **Value Proposition**: Rewarding alternatives that provide genuine utility

### For Developers
- **Threshold Maintenance**: Monitor 87+ PvP and A+ raid performance
- **Quality Assurance**: Maintain 70%+ high quality rate
- **Alternative Recognition**: Ensure legitimate Essential alternatives are captured
- **Size Control**: Keep within 10-15% target range

---

## 🔧 Maintenance Notes

- **Pattern-Based Logic**: No static lists, uses smart recognition patterns
- **Quality Monitoring**: Regular validation of 73.2% quality rate
- **Alternative Validation**: Ensure all strong alternatives to Essential Pokemon are included
- **Size Calibration**: Maintain 200-250 Pokemon target range

The Valuable tier successfully represents "strong alternatives worth developing" with excellent quality and perfect size calibration.
