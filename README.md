# PokePurge 🗂️

A comprehensive Pokemon GO inventory management tool that helps trainers make informed decisions about which Pokemon to keep, transfer, or prioritize based on competitive viability, rarity, and utility.

## ✨ Features

- **Smart Trashability Analysis** - Categorizes Pokemon from Essential to Trash based on meta relevance
- **Recommended Count Calculator** - Suggests optimal number of each Pokemon to keep
- **Multi-League PvP Rankings** - Integrates data from Great, Ultra, and Master League
- **Type Coverage Analysis** - Identifies Pokemon that fill important type niches
- **Raid Utility Scoring** - Highlights top raid attackers and defenders
- **Real-time Data Pipeline** - Automated data collection from multiple sources
- **Interactive Table** - Sort, filter, and search through your Pokemon collection

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/pokepurge.git
   cd pokepurge
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

## 📊 Data Pipeline

PokePurge includes a sophisticated data pipeline that automatically collects and processes Pokemon GO data:

### Running the Data Pipeline

```bash
# Run complete pipeline (includes web scraping)
node fetchData/runAll.js

# Skip scraping, use existing data
node fetchData/runAll.js --skip-scrapers

# Run with verbose output
node fetchData/runAll.js --verbose

# Validate data integrity
node fetchData/validate.js
```

### Pipeline Stages

1. **Data Scraping** - Collects Pokemon variants, PvP rankings, raid tiers
2. **Data Processing** - Cleans, validates, and enriches the data
3. **Data Building** - Generates final Pokemon dataset with trashability scores

### Data Sources

- **PokeGOHub** - Pokemon variants and forms
- **PvPoke** - Competitive rankings and meta analysis
- **PokeAPI** - Type information and candy data
- **GamePress** - Raid tiers and gym defender rankings

## 🎯 Trashability Categories

| Category | Description | Action |
|----------|-------------|---------|
| **Essential** | Meta-defining Pokemon, irreplaceable | Keep all good IVs |
| **Valuable** | Strong meta picks, high utility | Keep 2-3 good copies |
| **Reliable** | Solid performers, consistent value | Keep 1-2 copies |
| **Useful** | Situational value, niche roles | Keep 1 copy |
| **Niche** | Very specific use cases | Keep if space allows |
| **Replaceable** | Outclassed but functional | Transfer extras |
| **Outclassed** | Better alternatives exist | Consider transferring |
| **Legacy-Only** | Only valuable with legacy moves | Keep legacy, transfer others |
| **Trap** | Looks good but performs poorly | Transfer |
| **Trash** | No competitive value | Transfer all |

## 🛠️ Development

### Project Structure

```
pokepurge/
├── src/                    # React frontend
│   ├── components/         # React components
│   ├── data/              # Pokemon data files
│   └── styles/            # CSS styles
├── fetchData/             # Data pipeline
│   ├── scrapers/          # Data collection scripts
│   ├── processors/        # Data processing scripts
│   ├── builders/          # Data building scripts
│   ├── config/            # Pipeline configuration
│   └── outputs/           # Generated data files
└── public/                # Static assets
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Data Pipeline Scripts

- `node fetchData/runAll.js` - Run complete pipeline
- `node fetchData/validate.js` - Validate data integrity
- `node fetchData/summary.js` - Show pipeline status

## 📈 Performance

- **Lightning Fast Processing** - Complete pipeline runs in ~1 second (excluding scraping)
- **Smart Caching** - Avoids re-scraping recent data
- **Efficient Validation** - Multi-stage validation ensures data quality
- **Hot Reload** - Instant updates during development

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **PvPoke** - Competitive Pokemon GO rankings and analysis
- **PokeGOHub** - Comprehensive Pokemon GO database
- **PokeAPI** - Pokemon species and type data
- **GamePress** - Raid and gym meta analysis

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/pokepurge/issues) page
2. Run `node fetchData/validate.js` to check data integrity
3. Try `node fetchData/runAll.js --skip-scrapers` for faster processing
4. Create a new issue with detailed information

---

**Made with ❤️ for the Pokemon GO community**
