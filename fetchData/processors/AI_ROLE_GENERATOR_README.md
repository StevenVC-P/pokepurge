# AI-Powered Pokemon Role Summary Generator

This script uses OpenAI's GPT-4o-mini API to generate natural language role summaries and detailed notes for Pokemon based on their competitive performance data.

## Features

- **AI-Generated Content**: Uses OpenAI API to create natural, contextual role summaries and notes
- **Smart Prompting**: Provides detailed Pokemon performance data to the AI for accurate analysis
- **Rate Limiting**: Built-in rate limiting to respect API limits (5 Pokemon per batch, 2-second delays)
- **Error Handling**: Graceful fallbacks if API calls fail
- **Demo Mode**: Test prompts without requiring an API key

## Setup

### 1. Get OpenAI API Key

1. Sign up at [OpenAI](https://platform.openai.com/)
2. Create an API key in your dashboard
3. Set the environment variable:
   ```bash
   export OPENAI_API_KEY=your_api_key_here
   ```

### 2. Install Dependencies

No additional dependencies required - uses Node.js built-in modules.

## Usage

### Demo Mode (No API Key Required)

```bash
node fetchData/processors/addRoleSummaryAndNotes.js --demo
```

This shows sample prompts that would be sent to the AI without making actual API calls.

### Full Processing (Requires API Key)

```bash
export OPENAI_API_KEY=your_api_key_here
node fetchData/processors/addRoleSummaryAndNotes.js
```

## Configuration

### Batch Size

Currently set to process 3 Pokemon per batch with 2-second delays. Adjust in the code:

```javascript
const updatedData = await processPokemonBatch(testData, 3); // Batch size
await sleep(2000); // Delay between batches
```

### Test Limit

Currently processes only first 10 Pokemon for testing. Remove this limit for full processing:

```javascript
// Remove or modify this line:
const testData = data.slice(0, 10);
```

## AI Prompts

### Role Summary Prompt

Generates concise 1-2 sentence descriptions focusing on:

- Primary competitive role (PvP/Raid/Defense)
- Performance tier (Meta-defining, Strong, Solid, etc.)
- Key strengths and capabilities
- Practical advice (keep/transfer/invest)

### Detailed Notes Prompt

Generates comprehensive explanations including:

- Performance tier reasoning
- Specific PvP league scores
- Raid utility and type rankings
- Defense capabilities
- Recommended count explanations
- Special form considerations

## Example Output

**Pokemon**: Shadow Mewtwo
**Role Summary**: "Meta-defining raid specialist with elite psychic/ghost attacking power and powerful offensive typing. High investment priority."
**Notes**: "Rated Essential due to meta-defining performance and unique competitive value. Strong PvP performance in Great League (71), Ultra League (72.8), Master League (81). S Tier raid performance with top rankings in psychic (rank 1), ghost (rank 3), normal (rank 6), ice (rank 5). Keep one copy for collection or very specific use cases. Shadow form provides increased attack at the cost of defense."

## Cost Estimation

- **Model**: GPT-4o-mini ($0.15/1M input tokens, $0.60/1M output tokens)
- **Per Pokemon**: ~500 input tokens + ~150 output tokens = ~$0.00016 per Pokemon
- **Full Dataset**: ~1,620 Pokemon × $0.00016 = ~$0.26 total

## Rate Limits

OpenAI free tier limits:

- 3 requests per minute
- 200 requests per day

The script is configured to respect these limits with appropriate delays.

## Troubleshooting

### API Key Issues

```
❌ OPENAI_API_KEY environment variable is required
```

Solution: Set your API key as an environment variable or use `--demo` mode.

### Rate Limit Errors

```
Error: Rate limit exceeded
```

Solution: The script includes automatic retries and delays. For persistent issues, increase the delay between batches.

### API Errors

The script includes fallback text if API calls fail, ensuring the process completes even with occasional errors.
