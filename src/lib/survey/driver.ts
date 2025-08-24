export interface StartPayloadLike {
  completed: boolean
  progress: { current: number, total: number }
  instanceMap: Record<string, { id: string; ordinal: number; question_id: number | null; answer_text?: string }>
}

export interface SurveyDriver {
  loadStart(): Promise<StartPayloadLike>
  saveAnswer(key: string, payload: string): Promise<void>
  maybeCreateFollowUp(params: {
    dimension: string
    instanceId: string
    originalQuestion: string
    answer: string
    currentOrdinal: number
  }): Promise<{ instanceId: string, prompt: string } | null>
}

type SurveyInstance = { id: string; ordinal: number; question_id: number | null; answer_text?: string }
type PersonalSurveyState = { instanceMap: Record<string, SurveyInstance>; total: number }

export class CompanySurveyDriver implements SurveyDriver {
  async loadStart(): Promise<StartPayloadLike> {
    const res = await fetch('/api/survey/start', { method: 'POST' })
    if (!res.ok) throw new Error('Failed to load survey')
    return res.json()
  }
  async saveAnswer(dimension: string, answerText: string): Promise<void> {
    const res = await fetch('/api/survey/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dimension, answerText })
    })
    if (!res.ok) throw new Error('Failed to save answer')
  }
  async maybeCreateFollowUp(params: { dimension: string; instanceId: string; originalQuestion: string; answer: string; currentOrdinal: number; }): Promise<{ instanceId: string; prompt: string; } | null> {
    const res = await fetch('/api/ai/nextQuestion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionInstanceId: params.instanceId,
        originalQuestion: params.originalQuestion,
        employeeAnswer: params.answer,
        currentOrdinal: params.currentOrdinal,
      })
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data?.followUp || !data.followUp.instanceId || !data.followUp.prompt) return null
    return { instanceId: data.followUp.instanceId, prompt: data.followUp.prompt }
  }
}

export class PersonalSurveyDriver implements SurveyDriver {
  private storageKey = 'air_personal_survey_v1'

  private read(): PersonalSurveyState {
    const defaultState: PersonalSurveyState = { instanceMap: {}, total: 20 }
    if (typeof window === 'undefined') return defaultState
    try {
      const raw = window.localStorage.getItem(this.storageKey)
      const parsed = raw ? JSON.parse(raw) : null
      return parsed ? { ...defaultState, ...parsed } : defaultState
    } catch { return defaultState }
  }
  private write(state: PersonalSurveyState) {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(this.storageKey, JSON.stringify(state))
  }

  async loadStart(): Promise<StartPayloadLike> {
    const state = this.read()
    const instanceMap = state.instanceMap || {}
    const total = state.total || 20
    const answered = Object.values(instanceMap).filter((v) => v?.answer_text && String(v.answer_text).length > 0).length
    return {
      completed: answered >= total && total > 0,
      progress: { current: answered + 1, total },
      instanceMap,
    }
  }
  async saveAnswer(dimension: string, answerText: string): Promise<void> {
    const state = this.read()
    state.instanceMap = state.instanceMap || {}
    const prev = state.instanceMap[dimension] || { id: `local_${dimension}`, ordinal: Object.keys(state.instanceMap).length + 1, question_id: null }
    state.instanceMap[dimension] = { ...prev, answer_text: answerText }
    this.write(state)
  }
  async maybeCreateFollowUp(): Promise<{ instanceId: string, prompt: string } | null> {
    return null
  }
}


