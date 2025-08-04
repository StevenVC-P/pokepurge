#!/usr/bin/env python3
"""
Batch AI Processor for Pokemon Analysis
Updates all Pokemon with improved AI analysis, saving progress every 50 Pokemon.
"""

import json
import sys
import os
import time
from typing import Dict, List, Any

# Add the current directory to the path
sys.path.append(os.path.dirname(__file__))

from pokemon_agent import PokemonAgent

class BatchAIProcessor:
    def __init__(self, data_file: str = 'public/data/pokemon.json', backup_interval: int = 50):
        self.data_file = data_file
        self.backup_interval = backup_interval
        self.agent = PokemonAgent()
        self.processed_count = 0
        self.error_count = 0
        self.start_time = time.time()
        
    def load_pokemon_data(self) -> List[Dict[str, Any]]:
        """Load Pokemon data from JSON file."""
        try:
            with open(self.data_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"❌ Error loading Pokemon data: {e}")
            return []
    
    def save_pokemon_data(self, pokemon_data: List[Dict[str, Any]], suffix: str = "") -> bool:
        """Save Pokemon data to JSON file."""
        try:
            output_file = self.data_file
            if suffix:
                base_name = self.data_file.replace('.json', '')
                output_file = f"{base_name}_{suffix}.json"
            
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(pokemon_data, f, indent=2, ensure_ascii=False)
            return True
        except Exception as e:
            print(f"❌ Error saving Pokemon data: {e}")
            return False
    
    def process_pokemon_batch(self, pokemon_data: List[Dict[str, Any]], start_idx: int = 0) -> List[Dict[str, Any]]:
        """Process Pokemon in batches with progress saving."""
        total_pokemon = len(pokemon_data)
        
        print(f"🚀 Starting batch AI processing...")
        print(f"📊 Total Pokemon: {total_pokemon}")
        print(f"💾 Backup interval: every {self.backup_interval} Pokemon")
        print(f"🎯 Target: Semi-serious and hardcore casual players")
        print("-" * 60)
        
        for i in range(start_idx, total_pokemon):
            pokemon = pokemon_data[i]
            pokemon_name = pokemon.get('name', f'Pokemon #{i}')
            
            try:
                # Generate AI analysis
                analysis = self.agent.analyze_pokemon(pokemon)
                
                # Update Pokemon with new analysis
                pokemon.update({
                    'quickRole': analysis.get('quickRole', 'Unknown'),
                    'keyTags': analysis.get('keyTags', []),
                    'roleSummary': analysis.get('roleSummary', ''),
                    'notes': analysis.get('notes', '')
                })
                
                self.processed_count += 1
                
                # Progress indicator
                if self.processed_count % 10 == 0:
                    progress = (i + 1) / total_pokemon * 100
                    elapsed = time.time() - self.start_time
                    rate = self.processed_count / elapsed if elapsed > 0 else 0
                    eta = (total_pokemon - i - 1) / rate if rate > 0 else 0
                    
                    print(f"⚡ Progress: {i+1:4d}/{total_pokemon} ({progress:5.1f}%) | "
                          f"Rate: {rate:4.1f}/sec | ETA: {eta/60:4.1f}m | "
                          f"Current: {pokemon_name}")
                
                # Save backup every N Pokemon
                if (i + 1) % self.backup_interval == 0:
                    backup_suffix = f"backup_{i+1:04d}"
                    if self.save_pokemon_data(pokemon_data, backup_suffix):
                        elapsed = time.time() - self.start_time
                        print(f"💾 Backup saved: {backup_suffix}.json ({elapsed/60:.1f}m elapsed)")
                    else:
                        print(f"⚠️  Backup failed for {backup_suffix}")
                
            except Exception as e:
                self.error_count += 1
                print(f"❌ Error processing {pokemon_name}: {e}")
                
                # Add minimal fallback data
                pokemon.update({
                    'quickRole': 'Unknown',
                    'keyTags': ['Processing Error'],
                    'roleSummary': f"Error processing {pokemon_name}. Please review manually.",
                    'notes': f"AI analysis failed: {str(e)}"
                })
        
        return pokemon_data
    
    def generate_summary_report(self, pokemon_data: List[Dict[str, Any]]) -> None:
        """Generate a summary report of the processing results."""
        total_time = time.time() - self.start_time
        
        # Count roles and tags
        role_counts = {}
        tag_counts = {}
        
        for pokemon in pokemon_data:
            role = pokemon.get('quickRole', 'Unknown')
            role_counts[role] = role_counts.get(role, 0) + 1
            
            tags = pokemon.get('keyTags', [])
            for tag in tags:
                tag_counts[tag] = tag_counts.get(tag, 0) + 1
        
        print("\n" + "="*60)
        print("📊 BATCH PROCESSING SUMMARY")
        print("="*60)
        print(f"⏱️  Total time: {total_time/60:.1f} minutes")
        print(f"✅ Processed: {self.processed_count} Pokemon")
        print(f"❌ Errors: {self.error_count} Pokemon")
        print(f"⚡ Rate: {self.processed_count/total_time:.1f} Pokemon/second")
        
        print(f"\n🎭 TOP ROLES:")
        for role, count in sorted(role_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
            percentage = count / len(pokemon_data) * 100
            print(f"  {role:20s}: {count:4d} ({percentage:4.1f}%)")
        
        print(f"\n🏷️  TOP TAGS:")
        for tag, count in sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:15]:
            percentage = count / len(pokemon_data) * 100
            print(f"  {tag:20s}: {count:4d} ({percentage:4.1f}%)")
        
        print("\n🎯 GUIDANCE FOR PLAYERS:")
        print("  • Meta Relevant + Essential Build = Must have")
        print("  • High Priority + Core Team = Build multiple")
        print("  • Budget Friendly + Type Coverage = Good value")
        print("  • Trash Tier + Candy Fodder = Transfer immediately")
        print("="*60)

def main():
    """Main execution function."""
    processor = BatchAIProcessor()
    
    # Load Pokemon data
    pokemon_data = processor.load_pokemon_data()
    if not pokemon_data:
        print("❌ Failed to load Pokemon data. Exiting.")
        return
    
    # Process all Pokemon
    updated_data = processor.process_pokemon_batch(pokemon_data)
    
    # Save final results
    if processor.save_pokemon_data(updated_data):
        print(f"\n✅ Final data saved to {processor.data_file}")
    else:
        print(f"\n❌ Failed to save final data")
    
    # Generate summary report
    processor.generate_summary_report(updated_data)

if __name__ == "__main__":
    main()
