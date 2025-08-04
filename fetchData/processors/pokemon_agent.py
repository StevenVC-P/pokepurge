#!/usr/bin/env python3
"""
JSON-Configured Pokemon Role Summary Agent

A fast, rule-based agent that generates Pokemon role summaries and notes
using a JSON configuration file. Much faster than LLM-based approaches.

Usage:
    python pokemon_agent.py [--demo] [--config agent_config.json]
"""

import json
import sys
import os
from pathlib import Path
from typing import Dict, List, Any, Optional

class PokemonAgent:
    def __init__(self, config_path: str = "agent_config.json"):
        """Initialize the agent with configuration."""
        # Make path relative to script location
        script_dir = Path(__file__).parent
        if not os.path.isabs(config_path):
            config_path = script_dir / config_path
        self.config_path = config_path
        self.config = self.load_config()

    def _parse_rank(self, rank_str: str) -> int:
        """Parse rank string to integer, handling decimals and periods."""
        try:
            # Remove any trailing periods and convert to float first, then int
            rank_clean = str(rank_str).rstrip('.')
            return int(float(rank_clean))
        except (ValueError, TypeError):
            return 999  # Default high rank for invalid values

    def load_config(self) -> Dict[str, Any]:
        """Load agent configuration from JSON file."""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"❌ Config file not found: {self.config_path}")
            sys.exit(1)
        except json.JSONDecodeError as e:
            print(f"❌ Invalid JSON in config file: {e}")
            sys.exit(1)
    
    def analyze_pokemon(self, pokemon: Dict[str, Any]) -> Dict[str, str]:
        """Analyze a Pokemon and generate role summary and notes."""
        # Calculate performance metrics
        performance_tier = self.calculate_performance_tier(pokemon)
        role_type = self.determine_role_type(pokemon)
        strengths = self.identify_strengths(pokemon)
        
        # Generate role summary
        role_summary = self.generate_role_summary(
            pokemon, performance_tier, role_type, strengths
        )
        
        # Generate detailed notes
        notes = self.generate_notes(
            pokemon, performance_tier, role_type, strengths
        )
        
        # Generate tags
        tags = self.generate_tags(pokemon, performance_tier, role_type, strengths)
        role_config = self.config['role_types'][role_type]

        return {
            "quickRole": role_config['name'],
            "keyTags": tags,
            "roleSummary": role_summary,
            "notes": notes
        }
    
    def calculate_performance_tier(self, pokemon: Dict[str, Any]) -> str:
        """Calculate performance tier based on PvP, raid, and defense data."""
        leagues = pokemon.get('leagues', {})
        raid_tier = pokemon.get('raidTier', '')
        defense_tier = pokemon.get('defenderTier', '')
        best_types = pokemon.get('bestTypes', [])
        recommended_count = pokemon.get('recommendedCount', 0)
        
        # Calculate PvP metrics
        pvp_scores = [league.get('score', 0) for league in leagues.values() if league]
        max_pvp_score = max(pvp_scores) if pvp_scores else 0
        strong_leagues = len([score for score in pvp_scores if score >= 75])
        
        # Calculate raid metrics
        raid_score = self.config['raid_tier_rankings'].get(raid_tier, 0)
        top_type_rankings = len([t for t in best_types if self._parse_rank(t.get('rank', '999')) <= 10])
        
        # Determine tier
        tiers = self.config['performance_tiers']
        
        if (max_pvp_score >= 90 and strong_leagues >= 2 and raid_score >= 4):
            return 'meta_defining'
        elif (max_pvp_score >= 80 and (strong_leagues >= 1 or raid_score >= 3)):
            return 'strong'
        elif (max_pvp_score >= 70 or raid_score >= 3):
            return 'solid'
        elif (max_pvp_score >= 60 or raid_score >= 2):
            return 'situational'
        elif (max_pvp_score >= 50 or raid_score >= 1):
            return 'limited'
        else:
            return 'trash'
    
    def determine_role_type(self, pokemon: Dict[str, Any]) -> str:
        """Determine the primary role type of the Pokemon."""
        leagues = pokemon.get('leagues', {}) or {}
        raid_tier = pokemon.get('raidTier') or ''
        defense_tier = pokemon.get('defenderTier') or ''
        best_types = pokemon.get('bestTypes') or []
        
        # Calculate metrics
        pvp_scores = [league.get('score', 0) for league in leagues.values() if league]
        max_pvp_score = max(pvp_scores) if pvp_scores else 0
        strong_leagues = len([score for score in pvp_scores if score >= 75])
        
        raid_score = self.config['raid_tier_rankings'].get(raid_tier, 0)
        top_type_rankings = len([t for t in best_types if self._parse_rank(t.get('rank', '999')) <= 10])
        
        has_good_defense = any(tier in (defense_tier or '') for tier in ['S Tier', 'A+ Tier', 'A Tier'])
        
        # Determine role based on conditions (ordered by priority)
        if max_pvp_score >= 85 and strong_leagues >= 2 and raid_score >= 3:
            return 'meta_anchor'
        elif max_pvp_score >= 80 and strong_leagues >= 1:
            return 'pvp_specialist'
        elif max_pvp_score >= 75 and strong_leagues >= 1:
            return 'league_anchor'
        elif raid_score >= 3 or top_type_rankings >= 1:
            return 'raid_specialist'
        elif raid_score >= 2 or top_type_rankings >= 1:
            return 'type_specialist'
        elif has_good_defense and max_pvp_score >= 60:
            return 'gym_defender'
        elif max_pvp_score >= 65:
            return 'cup_specialist'
        elif max_pvp_score >= 50:
            return 'spice_pick'
        elif max_pvp_score >= 45 or raid_score >= 1:
            return 'budget_option'
        else:
            return 'collector_only'
    
    def identify_strengths(self, pokemon: Dict[str, Any]) -> List[str]:
        """Identify key strengths of the Pokemon."""
        strengths = []
        leagues = pokemon.get('leagues', {}) or {}
        best_types = pokemon.get('bestTypes', []) or []
        types = pokemon.get('types', []) or []
        raid_tier = pokemon.get('raidTier') or ''
        
        # League performance strengths
        strong_leagues = []
        for league, data in leagues.items():
            if data and data.get('score', 0) >= 80:
                strong_leagues.append(f"{league.title()} League ({data['score']})")
        
        if strong_leagues:
            if len(strong_leagues) > 1:
                strengths.append(f"{' & '.join(strong_leagues)} performance")
            else:
                strengths.append(strong_leagues[0])
        
        # Type specialization strengths
        elite_types = [t['type'] for t in best_types if self._parse_rank(t.get('rank', '999')) <= 5]
        if elite_types:
            type_str = '/'.join(elite_types[:2])
            strengths.append(f"elite {type_str} attacker")
        
        # Typing advantages
        defensive_types = self.config['type_effectiveness']['defensive_types']
        offensive_types = self.config['type_effectiveness']['offensive_types']
        
        if any(t in defensive_types for t in types):
            strengths.append("excellent defensive typing")
        elif any(t in offensive_types for t in types):
            strengths.append("powerful offensive typing")
        
        # Raid tier strengths
        if 'S Tier' in raid_tier:
            strengths.append("top-tier raid performance")
        elif 'A+ Tier' in raid_tier:
            strengths.append("elite raid utility")
        
        return strengths[:2]  # Limit to top 2 strengths
    
    def generate_role_summary(self, pokemon: Dict[str, Any], tier: str, role: str, strengths: List[str]) -> str:
        """Generate a concise role summary."""
        template = self.config['role_summary_templates'][tier]
        role_config = self.config['role_types'][role]

        pokemon_name = pokemon.get('name', 'This Pokemon')
        role_name = role_config['name']

        # Determine best use case and key strength
        best_use_case = self.get_best_use_case(pokemon)
        key_strength = strengths[0] if strengths else "basic utility"
        type_coverage = self.get_type_coverage(pokemon)

        # Fill template based on tier
        if tier == 'trash':
            return template.format(pokemon_name=pokemon_name)
        elif tier in ['situational', 'limited']:
            specific_use = self.get_specific_use_case(pokemon)
            backup_role = f"backup {role_name.lower()}" if tier == 'limited' else role_name.lower()
            return template.format(
                pokemon_name=pokemon_name,
                role=role_name.lower(),
                specific_use=specific_use,
                backup_role=backup_role,
                type_coverage=type_coverage
            )
        else:
            return template.format(
                pokemon_name=pokemon_name,
                role=role_name.lower(),
                best_use_case=best_use_case,
                key_strength=key_strength
            )

    def get_best_use_case(self, pokemon: Dict[str, Any]) -> str:
        """Determine the best use case for the Pokemon."""
        leagues = pokemon.get('leagues', {}) or {}
        raid_tier = pokemon.get('raidTier', '') or ''
        defense_tier = pokemon.get('defenderTier', '') or ''

        # Check PvP leagues
        pvp_scores = [(name, league.get('score', 0)) for name, league in leagues.items() if league and isinstance(league, dict)]
        best_league = max(pvp_scores, key=lambda x: x[1]) if pvp_scores else None

        if best_league and best_league[1] >= 75:
            league_name = best_league[0].replace('_', ' ').title()
            return f"{league_name} League"
        elif raid_tier in ['S Tier', 'A+ Tier', 'A Tier']:
            return "raid battles"
        elif defense_tier in ['S Tier', 'A+ Tier', 'A Tier']:
            return "gym defense"
        else:
            return "niche situations"

    def get_specific_use_case(self, pokemon: Dict[str, Any]) -> str:
        """Get specific use case for situational Pokemon."""
        leagues = pokemon.get('leagues', {}) or {}
        form = pokemon.get('form', '') or ''
        form = form.lower()

        if 'shadow' in form:
            return "glass cannon raids"
        elif 'mega' in form:
            return "temporary raid boosts"
        elif 'gigantamax' in form:
            return "Max Battles"
        elif leagues and isinstance(leagues, dict):
            # Find best league
            valid_leagues = [(name, league) for name, league in leagues.items() if league and isinstance(league, dict)]
            if valid_leagues:
                best_league = max(valid_leagues, key=lambda x: x[1].get('score', 0))
                if best_league[1].get('score', 0) >= 60:
                    return f"{best_league[0].replace('_', ' ').title()} League coverage"

        return "type coverage gaps"

    def get_type_coverage(self, pokemon: Dict[str, Any]) -> str:
        """Get type coverage description for the Pokemon."""
        types = pokemon.get('types', []) or []
        if len(types) >= 2:
            return f"{'/'.join(types)} coverage"
        elif len(types) == 1:
            return f"{types[0]} type coverage"
        else:
            return "type coverage"

    def generate_tags(self, pokemon: Dict[str, Any], tier: str, role: str, strengths: List[str]) -> List[str]:
        """Generate appropriate tags based on Pokemon tier and characteristics."""
        tags = []
        trashability = (pokemon.get('trashability') or '').lower()
        form = (pokemon.get('form') or '').lower()
        recommended_count = pokemon.get('recommendedCount', 0) or 0
        leagues = pokemon.get('leagues', {}) or {}
        raid_tier = pokemon.get('raidTier') or ''

        # Priority tags based on trashability
        priority_mapping = {
            'essential': ['Meta Relevant', 'Essential Build'],
            'valuable': ['High Priority', 'Core Team'],
            'reliable': ['Budget Friendly', 'Type Coverage'],
            'useful': ['Future Investment'],
            'niche': ['Spice Factor'],
            'trash': ['Trash Tier', 'Candy Fodder']
        }

        if trashability in priority_mapping:
            tags.extend(priority_mapping[trashability][:2])

        # Investment level tags
        if recommended_count >= 4:
            tags.append('Heavy Investment')
        elif recommended_count >= 2:
            tags.append('XL Investment')
        elif recommended_count == 1:
            tags.append('Low Investment')
        elif recommended_count == 0:
            tags.append('Skip Building')

        # Performance style tags
        if 'shadow' in form:
            tags.append('Glass Cannon')
        elif raid_tier in ['S Tier', 'A+ Tier']:
            tags.append('High DPS')
        elif any(league and league.get('score', 0) >= 80 for league in leagues.values()):
            tags.append('League Staple')

        # Role-specific tags
        role_tags = {
            'meta_anchor': ['Core Team', 'League Staple'],
            'pvp_specialist': ['League Staple', 'Anti-Meta'],
            'league_anchor': ['League Staple', 'Safe Switch'],
            'raid_specialist': ['High DPS', 'Raid Filler'],
            'type_specialist': ['Type Coverage', 'Raid Filler'],
            'gym_defender': ['Gym Defender', 'Tanky'],
            'cup_specialist': ['Cup Meta', 'Niche Cup'],
            'spice_pick': ['Spice Factor', 'Flex Pick'],
            'budget_option': ['Budget Friendly', 'Low Investment'],
            'collector_only': ['Candy Fodder', 'Skip Building']
        }

        if role in role_tags:
            for tag in role_tags[role]:
                if tag not in tags:
                    tags.append(tag)
                    if len(tags) >= 4:  # Limit to 4 main tags
                        break

        # Form-specific tags (always add if applicable)
        if 'shadow' in form and 'Shadow Boost' not in tags:
            tags.append('Shadow Boost')
        elif 'mega' in form and 'Mega Evolution' not in tags:
            tags.append('Mega Evolution')
        elif 'gigantamax' in form and 'Gigantamax' not in tags:
            tags.append('Gigantamax')

        # Ensure we have 2-5 tags
        tags = tags[:5]
        if len(tags) < 2:
            tags.extend(['Type Coverage', 'Future Investment'])

        return tags[:5]

    def generate_notes(self, pokemon: Dict[str, Any], tier: str, role: str, strengths: List[str]) -> str:
        """Generate detailed notes."""
        notes = []
        tier_config = self.config['performance_tiers'][tier]
        
        # Tier explanation
        notes.append(f"Rated {tier_config['descriptor']} due to overall performance analysis.")
        
        # PvP analysis
        leagues = pokemon.get('leagues', {})
        strong_leagues = []
        for league, data in leagues.items():
            if data and data.get('score', 0) >= 70:
                strong_leagues.append(f"{league.title()} League ({data['score']})")
        
        if strong_leagues:
            notes.append(f"Strong PvP performance in: {', '.join(strong_leagues)}.")
        
        # Raid analysis
        raid_tier = pokemon.get('raidTier', '')
        best_types = pokemon.get('bestTypes', [])
        if raid_tier and 'null' not in raid_tier.lower():
            top_types = [f"{t['type']} (rank {t['rank']})" for t in best_types[:3] if self._parse_rank(t.get('rank', '999')) <= 15]
            if top_types:
                notes.append(f"{raid_tier} raid performance with rankings in: {', '.join(top_types)}.")
            else:
                notes.append(f"{raid_tier} raid performance.")
        
        # Defense analysis
        defense_tier = pokemon.get('defenderTier', '')
        if defense_tier and 'null' not in defense_tier.lower():
            notes.append(f"{defense_tier} gym defender.")
        
        # Recommended count
        count = pokemon.get('recommendedCount', 0)
        if count >= 4:
            notes.append(f"High recommended count ({count}) indicates multiple roles.")
        elif count >= 2:
            notes.append(f"Moderate recommended count ({count}) suggests specific utility.")
        elif count == 1:
            notes.append("Keep one copy for collection or specific use cases.")
        else:
            notes.append("No copies recommended - transfer for candy.")
        
        # Special form notes
        form = pokemon.get('form', '')
        if form and form != 'normal':
            if 'shadow' in form.lower():
                notes.append("Shadow form provides increased attack at the cost of defense.")
            elif 'mega' in form.lower():
                notes.append("Mega evolution provides temporary power boost.")
            elif 'gigantamax' in form.lower():
                notes.append("Gigantamax form designed for Max Battle mechanics.")
        
        return " ".join(notes)

def main():
    """Main function to process Pokemon data."""
    # Parse command line arguments
    demo_mode = '--demo' in sys.argv
    config_file = 'agent_config.json'
    
    if '--config' in sys.argv:
        config_idx = sys.argv.index('--config')
        if config_idx + 1 < len(sys.argv):
            config_file = sys.argv[config_idx + 1]
    
    # Initialize agent
    agent = PokemonAgent(config_file)
    
    # File paths
    input_path = Path(__file__).parent / '../outputs/PokemonMaster.json'
    output_path = Path(__file__).parent / '../../public/data/pokemon.json'
    
    if demo_mode:
        print("🎭 Running JSON Agent in DEMO mode")
        
        # Load sample data
        with open(input_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Process first 3 Pokemon
        for i, pokemon in enumerate(data[:3]):
            print(f"\n=== JSON AGENT DEMO {i+1}: {pokemon['name']} ===")
            result = agent.analyze_pokemon(pokemon)
            print(f"Role Summary: {result['roleSummary']}")
            print(f"Notes: {result['notes']}")
            print("=" * 50)
        
        print("\n💡 To run full processing, remove --demo flag")
        return
    
    # Full processing
    print("🤖 JSON Agent: Adding Role Summary and Notes to Pokemon data...")
    
    # Load data
    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Process Pokemon (limit to 10 for testing)
    test_data = data[:10]  # Remove [:10] for full processing
    print(f"🧪 Processing {len(test_data)} Pokemon for testing")
    
    # Process each Pokemon
    for i, pokemon in enumerate(test_data):
        if i % 50 == 0:
            print(f"Processing Pokemon {i+1}/{len(test_data)}...")
        
        result = agent.analyze_pokemon(pokemon)
        pokemon['roleSummary'] = result['roleSummary']
        pokemon['notes'] = result['notes']
    
    # Save results
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(test_data, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Successfully processed {len(test_data)} Pokemon")
    print(f"📁 Output saved to: {output_path}")
    
    # Show sample result
    if test_data:
        sample = test_data[0]
        print(f"\n📋 Sample Result:")
        print(f"Pokemon: {sample['name']}")
        print(f"Role Summary: {sample['roleSummary']}")
        print(f"Notes: {sample['notes']}")

if __name__ == "__main__":
    main()
