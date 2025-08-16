import { NextRequest } from 'next/server'
import { GET as getSubmissions } from '@/app/api/assignments/[id]/submissions/route'
import { POST as gradeSubmission } from '@/app/api/assignments/submissions/[id]/grade/route'

// Mock Prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    assignment: {
      findFirst: jest.fn(),
    },
    assignmentSubmission: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}))

const { prisma } = require('@/lib/db')

describe('Assignment Submissions API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/assignments/[id]/submissions', () => {
    it('should return 401 if no user ID provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/assignments/123/submissions')
      const response = await getSubmissions(request, { params: { id: '123' } })
      
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Authentication required')
    })

    it('should return 404 if assignment not found or access denied', async () => {
      const request = new NextRequest('http://localhost:3000/api/assignments/123/submissions', {
        headers: { 'x-user-id': 'professor-123' }
      })
      
      prisma.assignment.findFirst.mockResolvedValue(null)
      
      const response = await getSubmissions(request, { params: { id: '123' } })
      
      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('Assignment not found or access denied')
    })

    it('should return submissions data for valid request', async () => {
      const request = new NextRequest('http://localhost:3000/api/assignments/123/submissions', {
        headers: { 'x-user-id': 'professor-123' }
      })
      
      const mockAssignment = {
        id: '123',
        title: 'Test Assignment',
        dueDate: new Date(),
        status: 'PUBLISHED',
        class: {
          enrollments: [
            {
              student: {
                id: 'student-1',
                name: 'John Doe',
                email: 'john@example.com'
              }
            }
          ]
        }
      }
      
      const mockSubmissions = [
        {
          id: 'sub-1',
          studentId: 'student-1',
          student: {
            id: 'student-1',
            name: 'John Doe',
            email: 'john@example.com'
          },
          fileUrl: 'http://example.com/file.pdf',
          feedback: 'Great work!',
          submittedAt: new Date(),
          grade: 85,
          gradedAt: new Date(),
          gradedBy: 'professor-123'
        }
      ]
      
      prisma.assignment.findFirst.mockResolvedValue(mockAssignment)
      prisma.assignmentSubmission.findMany.mockResolvedValue(mockSubmissions)
      
      const response = await getSubmissions(request, { params: { id: '123' } })
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.submissions).toHaveLength(1)
      expect(data.totalEnrolled).toBe(1)
      expect(data.totalSubmitted).toBe(1)
      expect(data.totalGraded).toBe(1)
    })
  })

  describe('POST /api/assignments/submissions/[id]/grade', () => {
    it('should return 401 if no user ID provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/assignments/submissions/123/grade', {
        method: 'POST',
        body: JSON.stringify({ grade: 85, feedback: 'Good work!' })
      })
      
      const response = await gradeSubmission(request, { params: { id: '123' } })
      
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Authentication required')
    })

    it('should return 400 if grade is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/assignments/submissions/123/grade', {
        method: 'POST',
        headers: { 'x-user-id': 'professor-123' },
        body: JSON.stringify({ feedback: 'Good work!' })
      })
      
      const response = await gradeSubmission(request, { params: { id: '123' } })
      
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Grade is required')
    })

    it('should return 400 if grade is invalid', async () => {
      const request = new NextRequest('http://localhost:3000/api/assignments/submissions/123/grade', {
        method: 'POST',
        headers: { 'x-user-id': 'professor-123' },
        body: JSON.stringify({ grade: -5, feedback: 'Good work!' })
      })
      
      const response = await gradeSubmission(request, { params: { id: '123' } })
      
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Grade must be a non-negative number')
    })

    it('should return 404 if submission not found or access denied', async () => {
      const request = new NextRequest('http://localhost:3000/api/assignments/submissions/123/grade', {
        method: 'POST',
        headers: { 'x-user-id': 'professor-123' },
        body: JSON.stringify({ grade: 85, feedback: 'Good work!' })
      })
      
      prisma.assignmentSubmission.findFirst.mockResolvedValue(null)
      
      const response = await gradeSubmission(request, { params: { id: '123' } })
      
      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('Submission not found or access denied')
    })

    it('should successfully grade a submission', async () => {
      const request = new NextRequest('http://localhost:3000/api/assignments/submissions/123/grade', {
        method: 'POST',
        headers: { 'x-user-id': 'professor-123' },
        body: JSON.stringify({ grade: 85, feedback: 'Good work!' })
      })
      
      const mockSubmission = {
        id: '123',
        assignment: {
          id: 'assignment-123',
          professorId: 'professor-123'
        }
      }
      
      const mockUpdatedSubmission = {
        id: '123',
        studentId: 'student-1',
        student: {
          id: 'student-1',
          name: 'John Doe',
          email: 'john@example.com'
        },
        grade: 85,
        feedback: 'Good work!',
        gradedAt: new Date(),
        assignment: {
          id: 'assignment-123',
          title: 'Test Assignment'
        }
      }
      
      prisma.assignmentSubmission.findFirst.mockResolvedValue(mockSubmission)
      prisma.assignmentSubmission.update.mockResolvedValue(mockUpdatedSubmission)
      
      const response = await gradeSubmission(request, { params: { id: '123' } })
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.message).toBe('Submission graded successfully')
      expect(data.submission.grade).toBe(85)
      expect(data.submission.feedback).toBe('Good work!')
    })
  })
})
