# Pokemon GO Data Pipeline

A comprehensive data pipeline for collecting, processing, and organizing Pokemon GO data from multiple sources.

## 📁 Project Structure

```
fetchData/
├── 🤖 runAll.js              # Master orchestration script
├── 🔍 validate.js            # Data validation script
├── 📖 README.md              # This file
├── 
├── 📂 scrapers/              # Data collection scripts
│   ├── getPokemon.js         # Scrape Pokemon variants from PokeGOHub
│   ├── fetch-pcpoke-rankings.js  # Fetch PvPoke league rankings
│   ├── ScrapeBestByType.js   # Scrape best Pokemon by type
│   ├── scrapeRaidTiers.js    # Scrape raid tier data
│   └── scrapeGymDefndersTiers.js  # Scrape gym defender tiers
│
├── 📂 processors/            # Data processing scripts
│   ├── clean_variant.js      # Clean and normalize Pokemon variants
│   ├── addCandyData.js       # Add candy evolution data
│   ├── createConversionDoc.js # Create PvPoke conversion mapping
│   ├── MergePvpokeData.js    # Merge PvPoke rankings with Pokemon data
│   ├── updateRecommendedCount.js  # Calculate recommended counts
│   └── updateTrashability.js # Calculate trashability scores
│
├── 📂 builders/              # Data building scripts
│   └── buildPokemonMaster.js # Build master Pokemon dataset
│
├── 📂 config/                # Configuration files
│   ├── pipeline.json         # Pipeline configuration
│   ├── ruleset.json          # Pokemon scraping rules
│   ├── form_categories.json  # Pokemon form categories
│   └── base-name-overrides.json  # Name override mappings
│
├── 📂 outputs/               # Generated data files
│   ├── pokemon-variants-raw.json      # Raw scraped Pokemon data
│   ├── pokemon-variants.json          # Cleaned Pokemon variants
│   ├── pokemon-variants-with-candy.json  # With candy data added
│   ├── pokemon-pvpoke-conversion.json # PvPoke conversion mapping
│   ├── pokemon-condensed-meta.json    # Merged PvP data
│   ├── PokemonMaster.json             # Master dataset
│   ├── PokemonMaster_updated.json     # With recommended counts
│   ├── best-per-type.json             # Best Pokemon by type
│   ├── raid-tiers.json                # Raid tier data
│   ├── gym-defender-tiers.json        # Gym defender tiers
│   └── rankings/                      # PvPoke league rankings
│       ├── great.json
│       ├── ultra.json
│       ├── master.json
│       └── ...
│
└── 📄 pokemon.json           # Final output file
```

## 🚀 Quick Start

### Run Complete Pipeline
```bash
node runAll.js
```

### Run with Options
```bash
# Skip scraping (use existing data)
node runAll.js --skip-scrapers

# Skip processing (use existing processed data)  
node runAll.js --skip-processors

# Run with verbose output
node runAll.js --verbose

# Show help
node runAll.js --help
```

### Validate Data
```bash
# Validate complete pipeline
node validate.js

# Validate specific stage
node validate.js scraping
node validate.js processing
node validate.js building
```

## 📊 Data Pipeline Flow

### Phase 1: Data Scraping (Parallel)
1. **getPokemon.js** - Scrapes Pokemon variants from PokeGOHub
2. **fetch-pcpoke-rankings.js** - Downloads PvPoke league rankings
3. **ScrapeBestByType.js** - Scrapes best Pokemon by type data
4. **scrapeRaidTiers.js** - Scrapes raid tier information
5. **scrapeGymDefndersTiers.js** - Scrapes gym defender tiers

### Phase 2: Data Processing (Sequential)
1. **clean_variant.js** - Cleans and normalizes Pokemon variant data
2. **addCandyData.js** - Adds candy evolution chain data from PokeAPI
3. **createConversionDoc.js** - Creates PvPoke species ID conversion mapping
4. **MergePvpokeData.js** - Merges PvPoke rankings with Pokemon data

### Phase 3: Data Building (Sequential)
1. **buildPokemonMaster.js** - Builds master Pokemon dataset with all data
2. **updateRecommendedCount.js** - Calculates recommended Pokemon counts
3. **updateTrashability.js** - Calculates trashability scores and tiers

## 📋 Output Files

### Primary Outputs
- **pokemon.json** - Final complete Pokemon dataset for the app
- **PokemonMaster.json** - Master dataset with all collected data

### Intermediate Files
- **pokemon-variants-raw.json** - Raw scraped Pokemon data
- **pokemon-variants.json** - Cleaned Pokemon variants
- **pokemon-variants-with-candy.json** - With candy data added
- **pokemon-condensed-meta.json** - Merged with PvP rankings

### Supporting Data
- **best-per-type.json** - Best Pokemon by type rankings
- **raid-tiers.json** - Raid boss tier classifications
- **gym-defender-tiers.json** - Gym defender tier classifications
- **rankings/*.json** - PvPoke league ranking data

## ⚙️ Configuration

The pipeline is configured via `config/pipeline.json`:

- **Timeouts** - Script execution timeouts
- **Data Sources** - API endpoints and rate limits
- **Validation** - Required files and data integrity checks
- **Leagues** - PvP league definitions and CP caps

## 🔧 Dependencies

Required Node.js packages:
- `puppeteer-extra` - Web scraping
- `puppeteer-extra-plugin-stealth` - Stealth mode for scraping
- `axios` - HTTP requests
- `fs` - File system operations
- `path` - Path utilities

## 📝 Logging

The pipeline provides detailed logging with timestamps and status indicators:
- 📋 Info messages
- ✅ Success messages  
- ⚠️ Warning messages
- ❌ Error messages
- 🔍 Debug messages

## 🛠️ Troubleshooting

### Common Issues

1. **Scraping Timeouts** - Increase timeout values in config
2. **Rate Limiting** - Adjust rate limits in data source config
3. **Missing Files** - Run validation to identify missing dependencies
4. **Memory Issues** - Process data in smaller chunks for large datasets

### Debug Mode
```bash
node runAll.js --verbose
```

### Validate Specific Stage
```bash
node validate.js scraping    # Check scraping outputs
node validate.js processing  # Check processing outputs
node validate.js building    # Check building outputs
```

## 📈 Performance

Typical execution times:
- **Scraping Phase**: 5-15 minutes (depending on network)
- **Processing Phase**: 1-3 minutes
- **Building Phase**: 30-60 seconds
- **Total Pipeline**: 7-20 minutes

## 🔄 Maintenance

### Regular Updates
- Pokemon data changes monthly with game updates
- PvP meta shifts with balance changes
- New leagues and cups are added periodically

### Recommended Schedule
- **Weekly**: Update PvP rankings and meta data
- **Monthly**: Full pipeline run for new Pokemon releases
- **As needed**: Update for new leagues or major meta shifts
