# Dynamax Data System - Quick Reference

## 🚀 Quick Start

### Run the Complete Pipeline

```bash
# Full data pipeline (includes Dynamax scraping)
npm run build-data

# Or run individual components
node fetchData/processors/dynamaxDataScraper.js
node fetchData/processors/dynamaxDataIntegrator.js
```

### Test with Sample Data

```bash
# Create sample data for testing
node -e "
const fs = require('fs');
const sampleData = {
  metadata: { totalRaids: 3, totalCounters: 5 },
  raids: {
    'Raikou': { tier: 5, counters: [{ pokemon: 'Excadrill', effectiveness: 'super-effective', role: 'Attacker' }] }
  },
  counters: { 'Excadrill': { effectiveAgainst: ['Raikou'], averageTier: 5 } },
  vulnerabilities: { 'Raikou': { topCounters: [{ pokemon: 'Excadrill', role: 'Attacker' }] } }
};
fs.mkdirSync('public/data', { recursive: true });
fs.writeFileSync('public/data/dynamax-battle-data.json', JSON.stringify(sampleData, null, 2));
console.log('✅ Sample data created');
"
```

## 📁 File Structure

```
fetchData/
├── processors/
│   ├── dynamaxDataScraper.js           # Web scraping engine
│   ├── dynamaxDataIntegrator.js        # Data integration system
│   └── dynamax-scraping-config.json    # Configuration settings
├── runAll.js                           # Main pipeline (includes Dynamax steps)
└── validate.js                         # Data validation

src/
├── types/pokemon.ts                    # TypeScript interfaces (includes Max Battle fields)
└── components/PokemonDetail.tsx        # UI component (displays Max Battle data)

public/data/
├── pokemon.json                        # Enhanced Pokemon data
└── dynamax-battle-data.json           # Raw Dynamax battle data

docs/
├── DYNAMAX_DATA_SCRAPING.md           # Complete documentation
└── DYNAMAX_QUICK_REFERENCE.md         # This file
```

## 🔧 Configuration

### Key Settings (`dynamax-scraping-config.json`)

```json
{
  "scraping": {
    "maxGuidesPerSource": 10,    # Limit guides per source
    "minTierLevel": 3,           # Only process Tier 3+ raids
    "retryAttempts": 3,          # Retry failed requests
    "retryDelay": 2000           # Delay between retries (ms)
  },
  "integration": {
    "recommendedCountBonus": {
      "multipleTargets": { "threshold": 3, "bonus": 1 },
      "highTierEffective": { "threshold": 4.0, "bonus": 1 }
    }
  }
}
```

## 📊 Data Flow

```
Web Sources → Scraper → Raw Data → Integrator → Enhanced Pokemon Data → UI
```

### Input Sources

- **Pokemon GO Hub**: Dynamax raid guides
- **GamePress**: DPS/TDO data
- **Community**: Tier lists and analysis

### Output Enhancement

- **Recommended Count**: +1-2 copies for versatile counters
- **Trashability**: Boost to Essential/Valuable for effective counters
- **AI Analysis**: Add Max Battle context
- **UI Data**: Effectiveness and vulnerability arrays

## 🎯 Key Functions

### Scraper (`dynamaxDataScraper.js`)

```javascript
// Main entry point
scraper.scrapeAll()

// Individual methods
scraper.scrapePokemonGoHub()      # Scrape Pokemon GO Hub guides
scraper.scrapeGamePress()         # Scrape GamePress data
scraper.processEffectivenessData() # Process type effectiveness
```

### Integrator (`dynamaxDataIntegrator.js`)

```javascript
// Main entry point
integrator.integrate()

// Individual phases
integrator.enhanceRecommendedCounts()  # Boost copy recommendations
integrator.boostTrashabilityForCounters() # Improve tier ratings
integrator.addMaxBattleContext()       # Enhance AI analysis
integrator.generateEffectivenessData() # Create UI data
```

## 📋 Data Structures

### Raw Dynamax Data

```json
{
  "raids": {
    "RaidBoss": {
      "tier": 5,
      "counters": [{ "pokemon": "Counter", "effectiveness": "super-effective", "role": "Attacker" }]
    }
  },
  "counters": {
    "Pokemon": { "effectiveAgainst": ["Boss1", "Boss2"], "averageTier": 4.5 }
  }
}
```

### Enhanced Pokemon Data

```json
{
  "name": "Excadrill",
  "trashability": "Essential", // Boosted from "Reliable"
  "recommendedCount": 3, // Boosted from 1
  "dynamaxRoleSummary": "...Dominates Max Battles against Raikou...",
  "maxBattleEffectiveAgainst": [{ "name": "Raikou", "tier": 5, "effectiveness": "super-effective" }]
}
```

## 🎨 UI Integration

### TypeScript Interface

```typescript
interface Pokemon {
  maxBattleEffectiveAgainst?: Array<{
    name: string;
    difficulty: number;
    effectiveness: string;
    moveInfo?: {
      moveName: string;
      moveType: string;
      reason: string;
    };
  }>;
  maxBattleVulnerableTo?: Array<{
    name: string;
    role: string;
    difficulty?: number;
    effectiveness: string;
    moveInfo?: {
      moveName: string;
      moveType: string;
      reason: string;
    };
  }>;
}
```

### React Component Usage

```tsx
{
  pokemon.maxBattleEffectiveAgainst?.map((target, index) => (
    <div key={index}>
      <span>{target.name}</span>
      <span>{target.difficulty}★</span>
      <span>{target.effectiveness === "super-effective" ? "2x" : "1x"}</span>
      {target.moveInfo && (
        <span>
          {target.moveInfo.moveName} ({target.moveInfo.moveType})
        </span>
      )}
    </div>
  ));
}
```

## 🔍 Debugging

### Check Data Integration

```bash
# Verify enhanced Pokemon data
grep -A 5 "maxBattleEffectiveAgainst" public/data/pokemon.json

# Check integration stats
node -e "
const data = JSON.parse(require('fs').readFileSync('public/data/pokemon.json'));
const enhanced = data.filter(p => p.maxBattleEffectiveAgainst?.length > 0);
console.log(\`Enhanced \${enhanced.length} Pokemon with Max Battle data\`);
"
```

### Validate Scraping Results

```bash
# Check raw Dynamax data
cat public/data/dynamax-battle-data.json | jq '.metadata'

# Verify specific Pokemon
node -e "
const data = JSON.parse(require('fs').readFileSync('public/data/pokemon.json'));
const excadrill = data.find(p => p.name === 'Excadrill');
console.log('Excadrill Max Battle data:', {
  effective: excadrill?.maxBattleEffectiveAgainst,
  trashability: excadrill?.trashability,
  count: excadrill?.recommendedCount
});
"
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Scraping Fails (403 Error)

- **Expected behavior** - System uses fallback data
- **Solution**: Check if sample data exists in `public/data/dynamax-battle-data.json`

#### 2. No Enhanced Pokemon

- **Check**: Integration ran after scraping
- **Fix**: Run `node fetchData/processors/dynamaxDataIntegrator.js`

#### 3. UI Not Showing Data

- **Check**: TypeScript interfaces match data structure
- **Fix**: Verify `maxBattleEffectiveAgainst` field exists in Pokemon data

#### 4. Pipeline Timeout

- **Cause**: Scraping taking too long
- **Fix**: Increase timeout in `runAll.js` or disable scraping temporarily

### Error Recovery

```bash
# Restore from backup
cp public/data/pokemon-backup-*.json public/data/pokemon.json

# Regenerate with fallback data
node fetchData/processors/dynamaxDataIntegrator.js
```

## 🔄 Adding New Data Sources

### 1. Extend Scraper

```javascript
// Add to dynamaxDataScraper.js
async scrapeNewSource() {
  const response = await axios.get('https://newsource.com/api');
  // Parse and process data
  this.dynamaxData.raids[bossName] = processedData;
}
```

### 2. Update Configuration

```json
// Add to dynamax-scraping-config.json
"sources": {
  "newSource": {
    "baseUrl": "https://newsource.com",
    "enabled": true,
    "rateLimit": 1000
  }
}
```

### 3. Test Integration

```bash
# Test new source
node -e "
const scraper = require('./fetchData/processors/dynamaxDataScraper.js');
const instance = new scraper();
instance.scrapeNewSource().then(() => console.log('✅ New source working'));
"
```

## 📈 Performance Monitoring

### Metrics to Track

- **Scraping success rate**: % of successful requests
- **Data freshness**: Time since last update
- **Enhancement coverage**: % of Pokemon with Max Battle data
- **Integration time**: Duration of data processing

### Monitoring Commands

```bash
# Check last update time
node -e "
const meta = JSON.parse(require('fs').readFileSync('public/data/dynamax-battle-data.json')).metadata;
console.log('Last updated:', new Date(meta.lastUpdated).toLocaleString());
console.log('Data age:', Math.round((Date.now() - new Date(meta.lastUpdated)) / (1000 * 60 * 60)), 'hours');
"

# Count enhanced Pokemon
node -e "
const data = JSON.parse(require('fs').readFileSync('public/data/pokemon.json'));
const stats = {
  total: data.length,
  withMaxBattle: data.filter(p => p.maxBattleEffectiveAgainst?.length > 0).length,
  withVulnerability: data.filter(p => p.maxBattleVulnerableTo?.length > 0).length
};
console.log('Enhancement stats:', stats);
"
```
