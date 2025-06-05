import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export const AI_MODEL = 'gpt-4o-mini-2025-05-28' // GPT-4.1 as specified 