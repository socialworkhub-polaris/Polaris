/**
 * Isolated AI Gateway & LLM Orchestrator for Polaris
 *
 * Primary Provider: Mistral AI (100% EU-Hosted & DSGVO / § 35 SGB I Compliant, Paris/France)
 * Resilient fallback chain and Vercel AI Gateway support.
 *
 * Includes built-in timeout abort controllers, response sanitation, and fallback guarantees.
 */

export interface AIGatewayConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
}

export interface TriageLLMOptions {
  temperature?: number;
  maxTokens?: number;
  config?: AIGatewayConfig;
}

export interface AIGatewayResult<T = any> {
  success: boolean;
  data?: T;
  rawText?: string;
  modelUsed: string;
  provider: 'mistral-eu' | 'vercel-ai-gateway' | 'direct' | 'fallback';
  error?: string;
}

/**
 * Resolves current AI configuration based on environment variables.
 * Defaults to Mistral AI EU (https://api.mistral.ai/v1 with mistral-small-latest)
 */
export function getAIConfig(override?: AIGatewayConfig): Required<AIGatewayConfig> {
  const isVercelGateway = Boolean(process.env.VERCEL_AI_GATEWAY_URL || process.env.AI_GATEWAY_URL);

  const baseUrl =
    override?.baseUrl ||
    process.env.VERCEL_AI_GATEWAY_URL ||
    process.env.AI_GATEWAY_URL ||
    process.env.AI_BASE_URL ||
    'https://api.mistral.ai/v1';

  const apiKey =
    override?.apiKey ||
    process.env.MISTRAL_API_KEY ||
    process.env.AI_API_KEY ||
    '';

  const model =
    override?.model ||
    process.env.AI_MODEL ||
    'mistral-small-latest';

  const timeoutMs = override?.timeoutMs || 25000;

  return {
    apiKey,
    baseUrl: baseUrl.replace(/\/+$/, ''),
    model,
    timeoutMs,
  };
}

/**
 * Strips markdown code fences (e.g. ```json ... ```) from LLM output
 */
export function cleanJSONString(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

/**
 * Executes a structured JSON prompt through Vercel AI Gateway or Direct Provider
 */
export async function executeStructuredPrompt<T = any>(
  systemPrompt: string,
  userPrompt: string,
  options: TriageLLMOptions = {}
): Promise<AIGatewayResult<T>> {
  const config = getAIConfig(options.config);

  if (!config.apiKey || config.apiKey.includes('hier-deinen-echten')) {
    return {
      success: false,
      modelUsed: config.model,
      provider: 'fallback',
      error: 'Missing or placeholder AI_API_KEY',
    };
  }

  const isVercelGateway = Boolean(
    process.env.VERCEL_AI_GATEWAY_URL || process.env.AI_GATEWAY_URL
  );

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    };

    // Forward Vercel AI Gateway tracing headers if active
    if (isVercelGateway) {
      headers['x-vercel-ai-model'] = config.model;
    }

    const endpoint = config.baseUrl.endsWith('/chat/completions')
      ? config.baseUrl
      : `${config.baseUrl}/chat/completions`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: options.temperature ?? 0.1,
        max_tokens: options.maxTokens ?? 1200,
        response_format: { type: 'json_object' },
      }),
    });

    clearTimeout(timeoutId);

    const resolvedProvider = isVercelGateway
      ? 'vercel-ai-gateway'
      : config.baseUrl.includes('mistral.ai')
      ? 'mistral-eu'
      : 'direct';

    if (!response.ok) {
      const errText = await response.text();
      return {
        success: false,
        modelUsed: config.model,
        provider: resolvedProvider,
        error: `HTTP ${response.status}: ${errText.slice(0, 300)}`,
      };
    }

    const aiData = await response.json();
    const rawContent = aiData.choices?.[0]?.message?.content || '{}';
    const cleaned = cleanJSONString(rawContent);
    const parsed = JSON.parse(cleaned) as T;

    return {
      success: true,
      data: parsed,
      rawText: rawContent,
      modelUsed: config.model,
      provider: resolvedProvider,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    const isTimeout = err.name === 'AbortError';
    return {
      success: false,
      modelUsed: config.model,
      provider: isVercelGateway ? 'vercel-ai-gateway' : 'direct',
      error: isTimeout ? `Request timed out after ${config.timeoutMs}ms` : err.message,
    };
  }
}
