# Wiki Chatbot Configuration Guide

This guide explains how to configure the AI-powered wiki chatbot for the TUM Community Platform.

## Overview

The wiki chatbot uses OpenAI's API to provide intelligent, context-aware assistance to authenticated users. It retrieves relevant wiki articles and generates responses using a Retrieval-Augmented Generation (RAG) approach.

**Requirements**: 8.1, 8.2, 8.3, 8.4

## Required Configuration

### OpenAI API Key

**Environment Variable**: `OPENAI_API_KEY`

**Required**: Yes

**Description**: Your OpenAI API key is required for the chatbot to function. Without this key, the chatbot will not be able to generate responses.

**How to obtain**:
1. Create an account at [OpenAI Platform](https://platform.openai.com/)
2. Navigate to [API Keys](https://platform.openai.com/api-keys)
3. Click "Create new secret key"
4. Copy the key and add it to your `.env.local` file

**Example**:
```env
OPENAI_API_KEY=sk-proj-abc123...xyz789
```

**Security Note**: Never commit your API key to version control. Keep it in `.env.local` which is gitignored.

## Optional Configuration

### Model Selection

**Environment Variable**: `OPENAI_MODEL`

**Required**: No

**Default**: `gpt-4-turbo-preview`

**Description**: Specifies which OpenAI language model to use for generating chatbot responses.

**Supported Models**:
- `gpt-4-turbo-preview` - Latest GPT-4 Turbo model (recommended for best quality)
- `gpt-4` - Standard GPT-4 model (high quality, higher cost)
- `gpt-3.5-turbo` - Faster and more cost-effective (good for development/testing)

**Recommendations**:
- **Production**: Use `gpt-4-turbo-preview` for best response quality and accuracy
- **Development**: Use `gpt-3.5-turbo` to reduce API costs during testing
- **Budget-conscious**: Use `gpt-3.5-turbo` with careful prompt engineering

**Example**:
```env
OPENAI_MODEL=gpt-4-turbo-preview
```

### Temperature

**Environment Variable**: `OPENAI_TEMPERATURE`

**Required**: No

**Default**: `0.7`

**Valid Range**: `0.0` to `2.0`

**Description**: Controls the creativity and randomness of the chatbot's responses.

**Temperature Guide**:
- **0.0 - 0.3**: Very focused and deterministic
  - Use for: Factual queries, technical documentation
  - Behavior: Consistent, predictable responses
  
- **0.4 - 0.9**: Balanced creativity and consistency (recommended range)
  - Use for: General educational content, student assistance
  - Behavior: Natural, helpful responses with some variation
  
- **1.0 - 2.0**: Highly creative and varied
  - Use for: Brainstorming, creative suggestions
  - Behavior: More diverse responses, less predictable

**Recommendations**:
- **Default (0.7)**: Good balance for educational wiki content
- **Lower (0.3-0.5)**: When accuracy is critical (e.g., course requirements, deadlines)
- **Higher (0.8-1.0)**: When exploring topics or generating recommendations

**Example**:
```env
OPENAI_TEMPERATURE=0.7
```

**Validation**: If an invalid value is provided, the system will log a warning and use the default value of 0.7.

### Max Tokens

**Environment Variable**: `OPENAI_MAX_TOKENS`

**Required**: No

**Default**: `1000`

**Valid Range**: `1` to `4096`

**Description**: Maximum number of tokens (roughly words) in the chatbot's response. This controls response length and API costs.

**Token Length Guide**:
- **500-1000**: Short to medium responses
  - Use for: Quick answers, concise explanations
  - Typical length: 1-2 paragraphs
  
- **1000-2000**: Standard responses (recommended range)
  - Use for: Detailed explanations, multi-part answers
  - Typical length: 2-4 paragraphs
  
- **2000-4096**: Long, comprehensive responses
  - Use for: In-depth explanations, complex topics
  - Typical length: 4+ paragraphs
  - Note: Higher API costs

**Recommendations**:
- **Default (1000)**: Sufficient for most wiki queries
- **Lower (500-800)**: For cost optimization or when brief answers are preferred
- **Higher (1500-2000)**: For complex topics requiring detailed explanations

**Cost Considerations**: 
- Higher token limits increase API costs proportionally
- Monitor your OpenAI usage dashboard to track costs
- Consider starting with lower limits and increasing if needed

**Example**:
```env
OPENAI_MAX_TOKENS=1000
```

**Validation**: If an invalid value is provided (non-numeric, negative, or > 4096), the system will log a warning and use the default value of 1000.

## Configuration Examples

### Development Environment

Optimized for cost-effectiveness during development:

```env
OPENAI_API_KEY=sk-proj-your-dev-key
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=800
```

### Production Environment

Optimized for quality and user experience:

```env
OPENAI_API_KEY=sk-proj-your-prod-key
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=1000
```

### High-Accuracy Mode

For critical information (course requirements, deadlines):

```env
OPENAI_API_KEY=sk-proj-your-key
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_TEMPERATURE=0.3
OPENAI_MAX_TOKENS=1000
```

### Budget-Conscious Mode

Minimize costs while maintaining functionality:

```env
OPENAI_API_KEY=sk-proj-your-key
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=600
```

## Setup Instructions

1. **Copy the example file**:
   ```bash
   cp .env.example .env.local
   ```

2. **Add your OpenAI API key**:
   - Obtain your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
   - Replace `your-openai-api-key` with your actual key

3. **Customize optional settings** (if desired):
   - Adjust `OPENAI_MODEL` based on your quality/cost requirements
   - Tune `OPENAI_TEMPERATURE` for your use case
   - Set `OPENAI_MAX_TOKENS` based on desired response length

4. **Restart your development server**:
   ```bash
   npm run dev
   ```

## Validation and Error Handling

The chatbot configuration system includes built-in validation:

### Missing API Key
- **Error**: Application will throw an error on startup
- **Message**: "OPENAI_API_KEY environment variable is required"
- **Solution**: Add your API key to `.env.local`

### Invalid Temperature
- **Behavior**: System uses default value (0.7)
- **Warning**: Logged to console
- **Example**: "Invalid OPENAI_TEMPERATURE value: abc. Using default: 0.7"

### Invalid Max Tokens
- **Behavior**: System uses default value (1000)
- **Warning**: Logged to console
- **Example**: "Invalid OPENAI_MAX_TOKENS value: -100. Using default: 1000"

### Invalid Model Name
- **Behavior**: OpenAI API will return an error when first request is made
- **Solution**: Check OpenAI documentation for supported model names

## Monitoring and Optimization

### Cost Monitoring

Monitor your OpenAI API usage:
1. Visit [OpenAI Usage Dashboard](https://platform.openai.com/usage)
2. Track daily/monthly costs
3. Set up usage alerts if available

### Performance Optimization

**If responses are too slow**:
- Switch to `gpt-3.5-turbo` for faster responses
- Reduce `OPENAI_MAX_TOKENS` to limit response length

**If responses are too expensive**:
- Use `gpt-3.5-turbo` instead of GPT-4
- Lower `OPENAI_MAX_TOKENS` to reduce token usage
- Implement caching for common queries (future enhancement)

**If responses lack quality**:
- Upgrade to `gpt-4-turbo-preview` or `gpt-4`
- Increase `OPENAI_MAX_TOKENS` for more detailed responses
- Adjust `OPENAI_TEMPERATURE` (lower for more focused responses)

## Troubleshooting

### Chatbot not responding

**Check**:
1. Is `OPENAI_API_KEY` set in `.env.local`?
2. Is the API key valid? (Check OpenAI dashboard)
3. Do you have API credits available?
4. Check browser console and server logs for errors

### Responses are inconsistent

**Solution**: Lower the `OPENAI_TEMPERATURE` value (try 0.3-0.5)

### Responses are too short

**Solution**: Increase `OPENAI_MAX_TOKENS` (try 1500-2000)

### Responses are too long

**Solution**: Decrease `OPENAI_MAX_TOKENS` (try 500-800)

### API rate limit errors

**Solution**: 
- Implement request queuing (future enhancement)
- Upgrade your OpenAI plan for higher rate limits
- Add exponential backoff retry logic (already implemented)

## Security Best Practices

1. **Never commit API keys**: Always use `.env.local` for sensitive values
2. **Rotate keys regularly**: Generate new API keys periodically
3. **Use separate keys**: Different keys for development and production
4. **Monitor usage**: Set up alerts for unusual API usage patterns
5. **Restrict key permissions**: Use OpenAI's key permission settings if available

## Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [OpenAI Models Overview](https://platform.openai.com/docs/models)
- [OpenAI Pricing](https://openai.com/pricing)
- [OpenAI Usage Dashboard](https://platform.openai.com/usage)

## Support

For issues related to:
- **Configuration**: Check this guide and validation error messages
- **OpenAI API**: Consult [OpenAI Documentation](https://platform.openai.com/docs)
- **Application bugs**: Check application logs and error messages
