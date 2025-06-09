'use client'

import { useState, useEffect } from 'react'
import { UserButton } from '@/components/auth/user-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Users, 
  Link as LinkIcon, 
  Copy, 
  Building, 
  Mail,
  CheckCircle,
  Clock
} from 'lucide-react'

interface CompanyInfo {
  id: string
  name: string
  domain: string
  invite_code: string
  headcount: number
  industry: string
}

interface Employee {
  id: string
  email: string
  full_name: string | null
  role: string
  last_login_at: string | null
  created_at: string
}

export default function SettingsPage() {
  const [company, setCompany] = useState<CompanyInfo | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)

  useEffect(() => {
    loadCompanyData()
  }, [])

  const loadCompanyData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // In a real implementation, this would be an API call
      // For now, we'll show placeholder data
      setCompany({
        id: 'comp_12345',
        name: 'Example Company',
        domain: 'example.com',
        invite_code: 'INV-ABC123',
        headcount: 50,
        industry: 'Technology'
      })

      setEmployees([
        {
          id: 'emp1',
          email: 'john.doe@example.com',
          full_name: 'John Doe',
          role: 'employee',
          last_login_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        }
      ])

    } catch (error) {
      console.error('Failed to load company data:', error)
      setError('Failed to load company information')
    } finally {
      setIsLoading(false)
    }
  }

  const copyInviteCode = () => {
    if (company?.invite_code) {
      const inviteUrl = `${window.location.origin}/join/${company.invite_code}`
      navigator.clipboard.writeText(inviteUrl)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Company Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your company information and employee invitations.
          </p>
        </div>
        <UserButton />
      </div>

      {error && (
        <Alert className="mb-6" variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="mr-2 h-5 w-5" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {company && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Company Name</label>
                  <p className="text-lg font-semibold">{company.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Domain</label>
                  <p className="text-gray-900">{company.domain}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Industry</label>
                  <p className="text-gray-900">{company.industry}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Headcount</label>
                  <p className="text-gray-900">{company.headcount} employees</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Employee Invitation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <LinkIcon className="mr-2 h-5 w-5" />
              Employee Invitation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Invite Code</label>
                <div className="flex items-center space-x-2 mt-1">
                  <code className="bg-gray-100 px-3 py-2 rounded text-sm font-mono">
                    {company?.invite_code}
                  </code>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={copyInviteCode}
                    className="flex items-center"
                  >
                    {copySuccess ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                {copySuccess && (
                  <p className="text-sm text-green-600 mt-1">Invite URL copied to clipboard!</p>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Share this URL with employees:</label>
                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded mt-1 break-all">
                  {company && `${window.location.origin}/join/${company.invite_code}`}
                </p>
              </div>

              <div className="pt-2 border-t">
                <p className="text-sm text-gray-600">
                  Employees can use this code to join your organization and participate in the AI readiness assessment.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee List */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Team Members ({employees.length})
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No employees have joined yet.</p>
              <p className="text-sm">Share the invite code above to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {employees.map((employee) => (
                <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {employee.full_name?.charAt(0) || employee.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{employee.full_name || 'Anonymous'}</p>
                      <p className="text-sm text-gray-600">{employee.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge variant={employee.role === 'manager' ? 'default' : 'secondary'}>
                      {employee.role}
                    </Badge>
                    <div className="flex items-center text-sm text-gray-500">
                      {employee.last_login_at ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                          Active
                        </>
                      ) : (
                        <>
                          <Clock className="h-4 w-4 mr-1 text-orange-500" />
                          Pending
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 