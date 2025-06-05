import type { Database } from '../../types/database'
import { supabaseAdmin } from './admin'

export type Question = Database['public']['Tables']['questions']['Row']
export type QuestionInstance = Database['public']['Tables']['question_instances']['Row']
export type Answer = Database['public']['Tables']['answers']['Row']
export type Company = Database['public']['Tables']['companies']['Row']
export type User = Database['public']['Tables']['users']['Row']

/**
 * Get all active questions with their modules
 */
export async function getActiveQuestions() {
  const { data, error } = await supabaseAdmin
    .from('questions')
    .select(`
      *,
      modules (
        id,
        name
      )
    `)
    .eq('active', true)
    .order('id')

  if (error) throw error
  return data
}

/**
 * Get question instances for an employee
 */
export async function getEmployeeQuestionInstances(employeeId: string) {
  const { data, error } = await supabaseAdmin
    .from('question_instances')
    .select(`
      *,
      questions (*)
    `)
    .eq('employee_id', employeeId)
    .order('ordinal')

  if (error) throw error
  return data
}

/**
 * Get answers for specific question instances
 */
export async function getAnswersForQuestionInstances(questionInstanceIds: string[]) {
  const { data, error } = await supabaseAdmin
    .from('answers')
    .select('*')
    .in('question_instance_id', questionInstanceIds)

  if (error) throw error
  return data
}

/**
 * Get company by ID
 */
export async function getCompany(companyId: string) {
  const { data, error } = await supabaseAdmin
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single()

  if (error) throw error
  return data
}

/**
 * Get user by ID
 */
export async function getUser(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}

/**
 * Get all employees for a company
 */
export async function getCompanyEmployees(companyId: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('company_id', companyId)
    .eq('role', 'employee')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Get employee survey progress
 */
export async function getEmployeeSurveyProgress(employeeId: string) {
  // Get total question instances for employee
  const { data: instances, error: instancesError } = await supabaseAdmin
    .from('question_instances')
    .select('id')
    .eq('employee_id', employeeId)

  if (instancesError) throw instancesError

  // Get answered question instances
  const { data: answers, error: answersError } = await supabaseAdmin
    .from('answers')
    .select('question_instance_id')
    .in('question_instance_id', instances?.map((i: { id: string }) => i.id) || [])

  if (answersError) throw answersError

  return {
    total: instances?.length || 0,
    completed: answers?.length || 0,
    progress: instances?.length ? (answers?.length || 0) / instances.length : 0
  }
} 