import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export const AI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini-2025-04-14'

export interface AIResponse {
  content: string
  model: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

/**
 * Generate AI response with token usage tracking
 */
export async function generateAIResponse(
  prompt: string,
  systemPrompt?: string
): Promise<AIResponse> {
  const messages: Array<{ role: 'system' | 'user'; content: string }> = []
  
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt })
  }
  
  messages.push({ role: 'user', content: prompt })

  const response = await openai.chat.completions.create({
    model: AI_MODEL,
    messages,
    max_tokens: 1000,
    temperature: 0.7,
  })

  const choice = response.choices[0]
  if (!choice?.message?.content) {
    throw new Error('No response content generated')
  }

  return {
    content: choice.message.content,
    model: AI_MODEL,
    usage: response.usage ? {
      prompt_tokens: response.usage.prompt_tokens,
      completion_tokens: response.usage.completion_tokens,
      total_tokens: response.usage.total_tokens
    } : undefined
  }
} 