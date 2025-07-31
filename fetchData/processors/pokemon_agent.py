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
        
        return {
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
        top_type_rankings = len([t for t in best_types if int(t.get('rank', '999').rstrip('.')) <= 10])
        
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
        leagues = pokemon.get('leagues', {})
        raid_tier = pokemon.get('raidTier', '')
        defense_tier = pokemon.get('defenderTier', '')
        best_types = pokemon.get('bestTypes', [])
        
        # Calculate metrics
        pvp_scores = [league.get('score', 0) for league in leagues.values() if league]
        max_pvp_score = max(pvp_scores) if pvp_scores else 0
        strong_leagues = len([score for score in pvp_scores if score >= 75])
        
        raid_score = self.config['raid_tier_rankings'].get(raid_tier, 0)
        top_type_rankings = len([t for t in best_types if int(t.get('rank', '999').rstrip('.')) <= 10])
        
        has_good_defense = any(tier in defense_tier for tier in ['S Tier', 'A+ Tier', 'A Tier'])
        
        # Determine role based on conditions
        if max_pvp_score >= 85 and strong_leagues >= 2 and raid_score >= 3:
            return 'multi_role_powerhouse'
        elif max_pvp_score >= 80 and strong_leagues >= 1:
            return 'pvp_specialist'
        elif raid_score >= 3 or top_type_rankings >= 1:
            return 'raid_specialist'
        elif has_good_defense and max_pvp_score >= 60:
            return 'gym_defender'
        elif max_pvp_score >= 50:
            return 'niche_specialist'
        else:
            return 'collection_only'
    
    def identify_strengths(self, pokemon: Dict[str, Any]) -> List[str]:
        """Identify key strengths of the Pokemon."""
        strengths = []
        leagues = pokemon.get('leagues', {})
        best_types = pokemon.get('bestTypes', [])
        types = pokemon.get('types', [])
        raid_tier = pokemon.get('raidTier', '')
        
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
        elite_types = [t['type'] for t in best_types if int(t.get('rank', 999)) <= 5]
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
        tier_config = self.config['performance_tiers'][tier]
        role_config = self.config['role_types'][role]
        
        descriptor = tier_config['descriptor']
        advice = tier_config['advice']
        role_name = role_config['name']
        
        if tier == 'trash':
            return f"{descriptor} - {advice}."
        
        # Build strengths string
        strengths_str = " and ".join(strengths) if strengths else "basic capabilities"
        
        return f"{descriptor} {role_name} with {strengths_str}. {advice}."
    
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
            top_types = [f"{t['type']} (rank {t['rank']})" for t in best_types[:3] if int(t.get('rank', 999)) <= 15]
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
