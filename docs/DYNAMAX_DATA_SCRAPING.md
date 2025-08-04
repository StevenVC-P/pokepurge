# Dynamax Data Scraping & Integration Documentation

## Overview

This document details the comprehensive system built to scrape, process, and integrate Dynamax battle data into the PokePurge application. The system enhances Pokemon recommendations, trashability assessments, and provides users with actionable Max Battle effectiveness information.

## Data Sources

### Primary Sources

#### 1. Pokemon GO Hub (pokemongohub.net)

- **Target Content**: Dynamax raid guides and Max Battle counter recommendations
- **URL Pattern**: `/post/guide/dynamax-*`, `/post/tag/max-battle/`
- **Data Extracted**:
  - Raid boss tier information (Tier 3, 4, 5, 6)
  - Counter Pokemon recommendations
  - Move type effectiveness
  - Role classifications (Attacker, Defender, Healer)
- **Scraping Method**: HTML parsing with Cheerio
- **Rate Limiting**: 1 second between requests
- **Status**: Implemented with 403 error handling

#### 2. GamePress (pokemongo.gamepress.gg)

- **Target Content**: DPS/TDO spreadsheets and raid analysis
- **URL Pattern**: `/comprehensive-dps-spreadsheet`, `/tier-*-raid-guides`
- **Data Extracted**:
  - Damage per second calculations
  - Total damage output metrics
  - Type effectiveness multipliers
- **Scraping Method**: API integration planned
- **Status**: Framework implemented, awaiting API access

#### 3. The Silph Road (reddit.com/r/TheSilphRoad)

- **Target Content**: Community tier lists and analysis posts
- **URL Pattern**: Search for "Dynamax tier list", "Max Battle guide"
- **Data Extracted**:
  - Community consensus rankings
  - Meta analysis insights
  - Battle strategy discussions
- **Scraping Method**: Reddit API integration
- **Status**: Planned (requires authentication)

### Fallback Data Sources

When primary scraping fails, the system uses:

- Type effectiveness charts
- Historical raid boss patterns
- Community-contributed data files

## Scraping Methodology

### 1. Web Scraping Architecture

```javascript
class DynamaxDataScraper {
  sources: {
    pokemonGoHub: "https://pokemongohub.net",
    gamePress: "https://pokemongo.gamepress.gg",
    silphRoad: "https://www.reddit.com/r/TheSilphRoad",
  };
}
```

### 2. Data Extraction Process

#### Step 1: Guide Discovery

- Scan category pages for Dynamax-related content
- Filter by keywords: "Dynamax", "Max Battle", "Tier 3+", "counters"
- Extract guide URLs and metadata

#### Step 2: Content Parsing

- Parse HTML structure using CSS selectors
- Extract Pokemon names using regex patterns
- Identify tier levels from titles and content
- Parse effectiveness indicators (2x, super-effective, etc.)

#### Step 3: Data Validation

- Verify Pokemon names against master list
- Validate tier levels (1-6)
- Check effectiveness values
- Remove duplicates and inconsistencies

### 3. Error Handling

- **403 Forbidden**: Graceful fallback to cached data
- **Rate Limiting**: Exponential backoff with jitter
- **Parse Errors**: Skip malformed entries, log for review
- **Network Timeouts**: Retry with increased timeout

## Data Organization

### 1. Raw Data Structure

```json
{
  "metadata": {
    "lastUpdated": "2025-01-04T15:09:00.000Z",
    "version": "1.0.0",
    "sources": ["pokemongohub", "gamepress"],
    "totalRaids": 5,
    "totalCounters": 14
  },
  "raids": {
    "Raikou": {
      "tier": 5,
      "counters": [
        {
          "pokemon": "Excadrill",
          "effectiveness": "super-effective",
          "moveType": "Ground",
          "role": "Attacker"
        }
      ],
      "url": "https://pokemongohub.net/guide/dynamax-raikou",
      "lastUpdated": "2025-01-04T15:09:00.000Z"
    }
  }
}
```

### 2. Processed Counter Mappings

```json
{
  "counters": {
    "Excadrill": {
      "effectiveAgainst": ["Raikou", "Magnezone"],
      "averageTier": 4.5,
      "targets": [
        {
          "target": "Raikou",
          "tier": 5,
          "effectiveness": "super-effective",
          "role": "Attacker"
        }
      ]
    }
  }
}
```

### 3. Vulnerability Analysis

```json
{
  "vulnerabilities": {
    "Raikou": {
      "tier": 5,
      "weakTo": [
        {
          "pokemon": "Excadrill",
          "effectiveness": "super-effective",
          "role": "Attacker"
        }
      ],
      "topCounters": [
        {
          "pokemon": "Excadrill",
          "effectiveness": "super-effective",
          "role": "Attacker"
        }
      ]
    }
  }
}
```

## Integration Process

### 1. Data Enhancement Pipeline

The integration system enhances existing Pokemon data through multiple phases:

#### Phase 1: Recommended Count Enhancement

- **Multi-target bonus**: +1 copy for Pokemon effective against 3+ bosses
- **High-tier bonus**: +1 copy for average tier 4+ effectiveness
- **Versatility bonus**: +2 copies for 5+ targets or tier 5 average
- **Caps**: 3 copies for Dynamax, 6 for regular Pokemon

#### Phase 2: Trashability Improvements

- **Essential tier**: 3+ targets with tier 4+ average
- **Valuable tier**: 2+ targets or tier 4+ average
- **Reliable tier**: Any tier 3+ effectiveness
- **Smart upgrades**: Only improves existing ratings

#### Phase 3: AI Analysis Enhancement

- **Max Battle context**: "Dominates Max Battles against [targets]"
- **Vulnerability warnings**: "Vulnerable to [counters] in Max Battles"
- **Strategic advice**: Role-specific guidance

#### Phase 4: UI Data Generation

- **Effectiveness arrays**: What this Pokemon counters
- **Vulnerability arrays**: What counters this Pokemon
- **Tier information**: Raid difficulty levels
- **Role classifications**: Attacker/Defender/Healer context

### 2. Data Flow Architecture

```
Raw Web Data → Scraper → Validator → Processor → Integrator → Pokemon JSON → UI
```

## Configuration System

### 1. Scraping Configuration

```json
{
  "scraping": {
    "maxGuidesPerSource": 10,
    "minTierLevel": 3,
    "retryAttempts": 3,
    "retryDelay": 2000,
    "respectRobotsTxt": true
  }
}
```

### 2. Integration Rules

```json
{
  "integration": {
    "recommendedCountBonus": {
      "multipleTargets": { "threshold": 3, "bonus": 1 },
      "highTierEffective": { "threshold": 4.0, "bonus": 1 }
    },
    "trashabilityBoosts": {
      "essential": { "minTargets": 3, "minAverageTier": 4.0 },
      "valuable": { "minTargets": 2, "minAverageTier": 4.0 }
    }
  }
}
```

## Sample Data Results

### Enhanced Pokemon Examples

#### Excadrill (Dynamax)

- **Original**: Reliable tier, 1 recommended copy
- **Enhanced**: Valuable tier, 3 recommended copies
- **Reason**: Effective against Tier 5 Raikou
- **AI Enhancement**: "Dominates Max Battles against Raikou and similar raid bosses"

#### Blastoise (Gigantamax)

- **Original**: Useful tier, 1 recommended copy
- **Enhanced**: Valuable tier, 3 recommended copies
- **Reason**: Effective against Tier 4 Charizard and Tier 5 Gigantamax Charizard
- **AI Enhancement**: "Excellent Max Battle counter with effectiveness against 2 different raid bosses"

## Quality Assurance

### 1. Data Validation Rules

- Pokemon names must exist in master database
- Tier levels must be 1-6
- Effectiveness values must be valid multipliers
- Minimum 1 counter per raid boss
- Maximum 20 counters per raid boss

### 2. Integration Verification

- Backup creation before data modification
- Validation of enhanced data structure
- Rollback capability for failed integrations
- Comprehensive logging of all changes

## Future Enhancements

### 1. Planned Data Sources

- **PokeMiners**: Datamined raid boss stats
- **PvPoke**: Simulation-based effectiveness
- **Discord Communities**: Real-time strategy discussions
- **YouTube Guides**: Video content analysis

### 2. Advanced Features

- **Move effectiveness analysis**: Max Move damage calculations
- **Team composition suggestions**: Synergy analysis
- **Battle strategy guides**: Tactical recommendations
- **Real-time updates**: Live raid boss rotation tracking

### 3. Automation Improvements

- **Scheduled scraping**: Weekly data updates
- **Change detection**: Alert on new raid bosses
- **Performance monitoring**: Scraping success rates
- **Data quality metrics**: Accuracy tracking

## Technical Implementation

### 1. File Structure

```
fetchData/
├── processors/
│   ├── dynamaxDataScraper.js      # Main scraping engine
│   ├── dynamaxDataIntegrator.js   # Data integration system
│   └── dynamax-scraping-config.json # Configuration file
└── runAll.js                      # Pipeline integration
```

### 2. Dependencies

- **axios**: HTTP requests
- **cheerio**: HTML parsing
- **fs**: File system operations
- **path**: Path utilities

### 3. Error Monitoring

- Comprehensive logging system
- Graceful failure handling
- Fallback data mechanisms
- Performance metrics tracking

This system provides a robust, scalable foundation for maintaining up-to-date Dynamax battle effectiveness data, ensuring users always have access to the latest strategic information for Max Battle success.

## Appendix: Code Examples

### A. Scraping Implementation

```javascript
// Extract Pokemon names from guide content
extractPokemonName(title) {
  const match = title.match(/(?:Dynamax|Gigantamax)?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
  return match ? match[1].trim() : null;
}

// Parse effectiveness indicators
parseEffectiveness(text) {
  if (text.toLowerCase().includes('super effective') || text.includes('2x'))
    return 'super-effective';
  if (text.toLowerCase().includes('not very effective') || text.includes('0.5x'))
    return 'not-very-effective';
  return 'neutral';
}
```

### B. Integration Logic

```javascript
// Recommended count enhancement
if (counterData.effectiveAgainst.length >= 3) bonus += 1;
if (counterData.averageTier >= 4) bonus += 1;
const newCount = Math.min(currentCount + bonus, maxCount);

// Trashability boost determination
if (effectiveAgainst.length >= 3 && averageTier >= 4.0) {
  targetTier = "Essential";
} else if (effectiveAgainst.length >= 2 || averageTier >= 4.0) {
  targetTier = "Valuable";
}
```

### C. UI Data Structure

```typescript
interface MaxBattleTarget {
  name: string;
  tier: number;
  effectiveness: string;
}

interface Pokemon {
  maxBattleEffectiveAgainst?: MaxBattleTarget[];
  maxBattleVulnerableTo?: MaxBattleCounter[];
  dynamaxRoleSummary?: string;
  dynamaxNotes?: string;
}
```

## Data Sources Attribution

- **Pokemon GO Hub**: Primary source for Dynamax raid guides and counter recommendations
- **GamePress**: DPS/TDO calculations and comprehensive raid analysis
- **The Silph Road**: Community research and meta analysis
- **Sample Data**: Generated for testing and demonstration purposes

All scraped data respects robots.txt and implements appropriate rate limiting to avoid overwhelming source servers.
