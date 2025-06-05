import type { Database } from '../../types/database'
import { supabaseAdmin } from './admin'

export type InsertAnswer = Database['public']['Tables']['answers']['Insert']
export type InsertQuestionInstance = Database['public']['Tables']['question_instances']['Insert']
export type InsertUser = Database['public']['Tables']['users']['Insert']
export type UpdateUser = Database['public']['Tables']['users']['Update']

/**
 * Create a new question instance for an employee
 */
export async function createQuestionInstance(data: InsertQuestionInstance) {
  const { data: instance, error } = await supabaseAdmin
    .from('question_instances')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return instance
}

/**
 * Save an answer to a question instance
 */
export async function saveAnswer(data: InsertAnswer) {
  const { data: answer, error } = await supabaseAdmin
    .from('answers')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return answer
}

/**
 * Update an existing answer
 */
export async function updateAnswer(questionInstanceId: string, answerText: string) {
  const { data: answer, error } = await supabaseAdmin
    .from('answers')
    .update({ answer_text: answerText })
    .eq('question_instance_id', questionInstanceId)
    .select()
    .single()

  if (error) throw error
  return answer
}

/**
 * Create or update user record
 */
export async function upsertUser(userData: InsertUser) {
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .upsert(userData, { onConflict: 'id' })
    .select()
    .single()

  if (error) throw error
  return user
}

/**
 * Initialize question instances for a new employee
 */
export async function initializeEmployeeQuestions(employeeId: string, companyId: string) {
  // Get all active questions
  const { data: questions, error: questionsError } = await supabaseAdmin
    .from('questions')
    .select('id')
    .eq('active', true)
    .order('id')

  if (questionsError) throw questionsError

  if (!questions || questions.length === 0) {
    throw new Error('No active questions found')
  }

  // Create question instances for each question
  const instances = questions.map((question: { id: number }, index: number) => ({
    employee_id: employeeId,
    company_id: companyId,
    question_id: question.id,
    ordinal: index + 1,
    parent_instance: null
  }))

  const { data: questionInstances, error } = await supabaseAdmin
    .from('question_instances')
    .insert(instances)
    .select()

  if (error) throw error
  return questionInstances
}

/**
 * Get the next unanswered question instance for an employee
 */
export async function getNextQuestion(employeeId: string) {
  // Get all question instances for employee that don't have answers
  const { data: unansweredInstances, error } = await supabaseAdmin
    .from('question_instances')
    .select(`
      *,
      questions (*),
      answers (id)
    `)
    .eq('employee_id', employeeId)
    .is('answers.id', null)
    .order('ordinal')
    .limit(1)

  if (error) throw error
  return unansweredInstances?.[0] || null
} 