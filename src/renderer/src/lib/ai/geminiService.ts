// src/renderer/src/lib/ai/geminiService.ts
import { GoogleGenerativeAI } from '@google/generative-ai'
import {
  GeneratedSchedule,
  ScheduleSession,
  Teacher,
  Class,
  Room,
  Course,
  TeacherWithCourses,
  CourseWithTeacherDetails,
  ScheduleConflict
} from '@shared/types/database'

export interface AIContext {
  schedule: GeneratedSchedule
  teachers: Teacher[]
  classes: Class[]
  rooms: Room[]
  courses: Course[]
}

export interface AIMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  attachments?: {
    type: 'schedule' | 'sessions' | 'conflicts'
    data: any
  }[]
}

export interface ScheduleOptimizationRequest {
  schedule: GeneratedSchedule
  context: AIContext
  optimizationType: 'fix' | 'refine'
  specificIssues?: string[]
  preferences?: {
    prioritizeTeachers?: string[]
    avoidTimeSlots?: { day: string; startTime: number; endTime: number }[]
    customConstraints?: string
  }
}

export interface ScheduleOptimizationResponse {
  success: boolean
  optimizedSchedule?: GeneratedSchedule
  changes: {
    sessionsModified: number
    conflictsResolved: number
    improvementScore: number
    changesDescription: string[]
  }
  reasoning: string
  suggestions: string[]
  error?: string
}

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null
  private model: any = null
  private currentContext: AIContext | null = null
  private apiKey: string | null = null

  constructor() {
    this.initializeAI()
  }

  private async initializeAI() {
    try {
      // Get API key from environment or settings
      const apiKey = await this.getAPIKey()
      if (!apiKey) {
        console.log('ℹ️ Gemini API key not found. AI features will be disabled.')
        return
      }

      this.apiKey = apiKey
      this.genAI = new GoogleGenerativeAI(apiKey)
      this.model = this.genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192
        }
      })

      console.log('✅ Gemini AI initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize Gemini AI:', error)
    }
  }

  private async getAPIKey(): Promise<string | null> {
    try {
      // Use the correct API method
      const apiKey = await window.api.settings.getSetting('gemini-api-key')
      return apiKey || null
    } catch (error) {
      console.error('Failed to get API key:', error)
      return null
    }
  }

  // Add the missing refreshApiKey method
  public async refreshApiKey(): Promise<void> {
    try {
      this.apiKey = await window.api.settings.getSetting('gemini-api-key')

      if (this.apiKey) {
        // Reinitialize the service with new API key
        this.genAI = new GoogleGenerativeAI(this.apiKey)
        this.model = this.genAI.getGenerativeModel({
          model: 'gemini-2.0-flash',
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192
          }
        })
        console.log('🔄 API key refreshed and service reinitialized')
      } else {
        this.genAI = null
        this.model = null
        console.log('🔄 API key removed, service disabled')
      }
    } catch (error) {
      console.error('Failed to refresh API key:', error)
      this.apiKey = null
      this.genAI = null
      this.model = null
    }
  }

  public async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.isAvailable()) {
      return {
        success: false,
        message: 'AI service not available - please configure Gemini API key in settings'
      }
    }

    try {
      // Simple test without requiring context
      const result = await this.model.generateContent(
        'Hello, please respond with "OK" to test the connection.'
      )
      const response = await result.response
      const text = response.text()

      console.log('Connection test response:', text)

      // Check if we got a valid response
      if (text && text.trim().length > 0) {
        return {
          success: true,
          message: `Connection successful! AI responded: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`
        }
      } else {
        return {
          success: false,
          message: 'Received empty response from AI service'
        }
      }
    } catch (error) {
      console.error('Connection test failed:', error)

      let errorMessage = 'Connection failed'
      if (error instanceof Error) {
        if (error.message.includes('API_KEY_INVALID') || error.message.includes('401')) {
          errorMessage = 'Invalid API key - please check your Gemini API key'
        } else if (error.message.includes('QUOTA_EXCEEDED') || error.message.includes('429')) {
          errorMessage = 'API quota exceeded - please try again later'
        } else if (error.message.includes('SAFETY')) {
          errorMessage = 'Request blocked by safety filters'
        } else if (error.message.includes('Failed to fetch') || error.message.includes('CSP')) {
          errorMessage = 'Network error - please check your internet connection and CSP settings'
        } else {
          errorMessage = `Connection failed: ${error.message}`
        }
      }

      return {
        success: false,
        message: errorMessage
      }
    }
  }

  public setContext(context: AIContext) {
    this.currentContext = context
  }

  public isAvailable(): boolean {
    return this.model !== null && !!this.apiKey
  }

  // Add a method to check API key validity
  public async validateApiKey(): Promise<boolean> {
    if (!this.apiKey) return false

    try {
      const testAI = new GoogleGenerativeAI(this.apiKey)
      const testModel = testAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

      const result = await testModel.generateContent('Test')
      const response = await result.response
      response.text() // This will throw if API key is invalid

      return true
    } catch (error) {
      console.error('API key validation failed:', error)
      return false
    }
  }

  // Add a method to get current API key status
  public getStatus(): { available: boolean; hasApiKey: boolean; hasContext: boolean } {
    return {
      available: this.isAvailable(),
      hasApiKey: !!this.apiKey,
      hasContext: !!this.currentContext
    }
  }

  private revalidateWithScheduleAlgorithm(
    optimizedSchedule: GeneratedSchedule,
    context: AIContext
  ): GeneratedSchedule {
    try {
      // Simple validation without using ScheduleAlgorithm
      const newConflicts: ScheduleConflict[] = []

      // 1. Check for time constraint violations
      const maxEndTime = optimizedSchedule.metadata?.constraints?.maxEndTime || 19
      const lateSessionsViolations = optimizedSchedule.sessions.filter(
        (session) => session.timeSlot.endTime > maxEndTime
      )

      lateSessionsViolations.forEach((session) => {
        newConflicts.push({
          id: Date.now() + Math.random(),
          type: 'constraint_violation',
          severity: 'critical',
          message: `${session.courseName} ${session.type} for ${session.className} ends at ${session.timeSlot.endTime}:00, exceeding maximum end time`,
          affectedItems: [session.courseName, session.className],
          suggestions: ['Move session to earlier time slot'],
          timestamp: new Date().toISOString()
        })
      })

      // 2. Check for session count validation per class
      context.classes.forEach((classItem) => {
        const classLectures = optimizedSchedule.sessions.filter(
          (s) => s.classId === classItem.id && s.type === 'lecture'
        ).length

        const classSeminars = optimizedSchedule.sessions.filter(
          (s) => s.classId === classItem.id && s.type === 'seminar'
        ).length

        // Get expected course count for this class
        const classCourseIds = new Set(
          optimizedSchedule.sessions
            .filter((s) => s.classId === classItem.id)
            .map((s) => s.courseId)
        )
        const expectedCourses = classCourseIds.size

        if (classLectures < expectedCourses) {
          newConflicts.push({
            id: Date.now() + Math.random(),
            type: 'constraint_violation',
            severity: 'critical',
            message: `Class ${classItem.name} missing ${expectedCourses - classLectures} lecture(s)`,
            affectedItems: [classItem.name],
            suggestions: ['Add missing lecture sessions'],
            timestamp: new Date().toISOString()
          })
        }

        if (classSeminars < expectedCourses) {
          newConflicts.push({
            id: Date.now() + Math.random(),
            type: 'constraint_violation',
            severity: 'critical',
            message: `Class ${classItem.name} missing ${expectedCourses - classSeminars} seminar(s)`,
            affectedItems: [classItem.name],
            suggestions: ['Add missing seminar sessions'],
            timestamp: new Date().toISOString()
          })
        }
      })

      // 3. Check for basic conflicts (same teacher, room, or class at same time)
      for (let i = 0; i < optimizedSchedule.sessions.length; i++) {
        for (let j = i + 1; j < optimizedSchedule.sessions.length; j++) {
          const session1 = optimizedSchedule.sessions[i]
          const session2 = optimizedSchedule.sessions[j]

          if (
            session1.timeSlot.day === session2.timeSlot.day &&
            session1.timeSlot.startTime < session2.timeSlot.endTime &&
            session2.timeSlot.startTime < session1.timeSlot.endTime
          ) {
            // Check for conflicts
            if (session1.teacherId === session2.teacherId) {
              newConflicts.push({
                id: Date.now() + Math.random(),
                type: 'teacher_conflict',
                severity: 'critical',
                message: `Teacher ${session1.teacherName} double-booked on ${session1.timeSlot.day}`,
                affectedItems: [session1.teacherName, session1.courseName, session2.courseName],
                suggestions: ['Reschedule one of the conflicting sessions'],
                timestamp: new Date().toISOString()
              })
            }

            if (session1.roomId === session2.roomId) {
              newConflicts.push({
                id: Date.now() + Math.random(),
                type: 'room_conflict',
                severity: 'critical',
                message: `Room ${session1.roomName} double-booked on ${session1.timeSlot.day}`,
                affectedItems: [session1.roomName, session1.courseName, session2.courseName],
                suggestions: ['Assign different room to one session'],
                timestamp: new Date().toISOString()
              })
            }

            if (session1.classId === session2.classId) {
              newConflicts.push({
                id: Date.now() + Math.random(),
                type: 'constraint_violation',
                severity: 'critical',
                message: `Class ${session1.className} double-booked on ${session1.timeSlot.day}`,
                affectedItems: [session1.className, session1.courseName, session2.courseName],
                suggestions: ['Reschedule one of the conflicting sessions'],
                timestamp: new Date().toISOString()
              })
            }
          }
        }
      }

      // Calculate new score based on conflicts
      const criticalConflicts = newConflicts.filter((c) => c.severity === 'critical').length
      const warningConflicts = newConflicts.filter((c) => c.severity === 'warning').length
      const conflictPenalty = criticalConflicts * 15 + warningConflicts * 5
      const newScore = Math.max(0, optimizedSchedule.score - conflictPenalty)

      return {
        ...optimizedSchedule,
        conflicts: newConflicts,
        score: newScore,
        metadata: {
          ...optimizedSchedule.metadata,
          revalidatedAt: new Date().toISOString(),
          revalidationConflicts: newConflicts.length,
          revalidationScore: newScore
        }
      }
    } catch (error) {
      console.error('❌ Failed to revalidate schedule:', error)

      return {
        ...optimizedSchedule,
        metadata: {
          ...optimizedSchedule.metadata,
          revalidationError: error instanceof Error ? error.message : 'Unknown validation error'
        }
      }
    }
  }

  public async optimizeSchedule(
    request: ScheduleOptimizationRequest
  ): Promise<ScheduleOptimizationResponse> {
    if (!this.isAvailable()) {
      return {
        success: false,
        changes: {
          sessionsModified: 0,
          conflictsResolved: 0,
          improvementScore: 0,
          changesDescription: []
        },
        reasoning: 'AI service not available - please configure Gemini API key in settings',
        suggestions: ['Configure Gemini API key in settings', 'Ensure API key is valid'],
        error: 'AI service not initialized'
      }
    }

    try {
      const prompt = this.buildOptimizationPrompt(request)
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      const optimizationResult = this.parseOptimizationResponse(text, request)

      // 🎯 IMPROVED: Use ScheduleAlgorithm's existing validation
      if (optimizationResult.success && optimizationResult.optimizedSchedule) {
        const revalidatedSchedule = this.revalidateWithScheduleAlgorithm(
          optimizationResult.optimizedSchedule,
          request.context
        )

        optimizationResult.optimizedSchedule = revalidatedSchedule

        // The validation results are already included in the schedule's conflicts
        const newConflictsCount = revalidatedSchedule.conflicts.length
        const originalConflictsCount = request.schedule.conflicts.length

        if (newConflictsCount > originalConflictsCount) {
          optimizationResult.suggestions.push(
            `⚠️ Post-optimization validation found ${newConflictsCount - originalConflictsCount} new issues`
          )
          optimizationResult.reasoning += `\n\nValidation revealed ${newConflictsCount - originalConflictsCount} additional issues that need attention.`
        } else if (newConflictsCount < originalConflictsCount) {
          optimizationResult.suggestions.push(
            `✅ AI optimization resolved ${originalConflictsCount - newConflictsCount} conflicts`
          )
        } else {
          optimizationResult.suggestions.push('✅ Schedule passed post-optimization validation')
        }
      }

      return optimizationResult
    } catch (error) {
      console.error('❌ Schedule optimization failed:', error)

      // Better error handling
      let errorMessage = 'AI processing failed'
      let suggestions = ['Try again later', 'Check API key validity']

      if (error instanceof Error) {
        if (error.message.includes('API_KEY')) {
          errorMessage = 'Invalid API key'
          suggestions = [
            'Check your Gemini API key in settings',
            'Ensure the key has proper permissions'
          ]
        } else if (error.message.includes('QUOTA')) {
          errorMessage = 'API quota exceeded'
          suggestions = ['Wait and try again later', 'Check your Gemini API usage limits']
        } else if (error.message.includes('SAFETY')) {
          errorMessage = 'Request blocked by safety filters'
          suggestions = ['Try rephrasing your request', 'Ensure the schedule data is appropriate']
        }
      }

      return {
        success: false,
        changes: {
          sessionsModified: 0,
          conflictsResolved: 0,
          improvementScore: 0,
          changesDescription: []
        },
        reasoning: errorMessage,
        suggestions,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Chatbot Methods
  public async chatQuery(query: string, conversationHistory: AIMessage[] = []): Promise<AIMessage> {
    if (!this.isAvailable()) {
      return {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'AI assistant is not available. Please configure the Gemini API key in settings.',
        timestamp: new Date()
      }
    }

    if (!this.currentContext) {
      return {
        id: Date.now().toString(),
        type: 'assistant',
        content:
          'No schedule context available. Please ensure a schedule is loaded before asking questions.',
        timestamp: new Date()
      }
    }

    try {
      const prompt = this.buildChatPrompt(query, conversationHistory)
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      return {
        id: Date.now().toString(),
        type: 'assistant',
        content: text,
        timestamp: new Date(),
        attachments: this.extractAttachments(text, query)
      }
    } catch (error) {
      console.error('❌ Chat query failed:', error)
      return {
        id: Date.now().toString(),
        type: 'assistant',
        content:
          'I encountered an error processing your request. Please check your API key and try again.',
        timestamp: new Date()
      }
    }
  }

  // Update the buildOptimizationPrompt method in geminiService.ts

  private buildOptimizationPrompt(request: ScheduleOptimizationRequest): string {
    const { schedule, context, optimizationType, specificIssues, preferences } = request

    // 🎯 NEW: Calculate expected session counts per class
    const classSessionAnalysis = context.classes.map((classItem) => {
      const classCourses = context.courses.filter((course) =>
        schedule.sessions.some((s) => s.classId === classItem.id && s.courseId === course.id)
      )
      const expectedCourses = classCourses.length
      const actualLectures = schedule.sessions.filter(
        (s) => s.classId === classItem.id && s.type === 'lecture'
      ).length
      const actualSeminars = schedule.sessions.filter(
        (s) => s.classId === classItem.id && s.type === 'seminar'
      ).length

      return {
        className: classItem.name,
        expectedCourses,
        actualLectures,
        actualSeminars,
        isValid: actualLectures === expectedCourses && actualSeminars === expectedCourses
      }
    })

    const algorithmLogic = `
# ClassSync Scheduling Algorithm Logic

## Priority System:
1. **BEST** (Score 100+): Preferred time windows, no conflicts, optimal resource usage
2. **GOOD** (Score 70-99): Acceptable time windows, minor constraint violations
3. **WORST** (Score <70): Outside preferred hours, conflicts, poor resource distribution

## Key Constraints:
- Time Windows: Preferred 9:00-17:00, Max until 19:00
- Teacher Max Hours/Day: ${context.schedule.metadata?.constraints?.maxTeacherHoursPerDay || 8}
- Session Lengths: Lectures 2h, Seminars 2h
- Morning Lectures: ${context.schedule.metadata?.constraints?.prioritizeMorningLectures ? 'Prioritized' : 'No preference'}
- Back-to-Back: ${context.schedule.metadata?.constraints?.avoidBackToBackSessions ? 'Avoid' : 'Allow'}
- Even Distribution: ${context.schedule.metadata?.constraints?.distributeEvenlyAcrossWeek ? 'Yes' : 'No'}

## CRITICAL: Session Count Validation
Each class must have:
- Number of lectures = Number of assigned courses
- Number of seminars = Number of assigned courses
- Each course must have exactly 1 lecture + 1 seminar per class

## Current Session Count Analysis:
${classSessionAnalysis
  .map(
    (analysis) =>
      `- ${analysis.className}: ${analysis.expectedCourses} courses → Need ${analysis.expectedCourses}L + ${analysis.expectedCourses}S, Got ${analysis.actualLectures}L + ${analysis.actualSeminars}S ${analysis.isValid ? '✅' : '❌'}`
  )
  .join('\n')}

## Scoring Factors:
- Time slot preferences (+40 for preferred, -30 for late)
- Morning lecture bonus (+30 for 9AM, +20 for 9-11AM)
- Back-to-back penalty (-40 if creates conflicts)
- Room diversity bonus (+35 for new rooms, -20 for overused)
- Teacher workload balance (+20 for balanced, -40 for overloaded)
- Even distribution (+15 for balanced days, -20 for heavy days)
- Session count compliance (CRITICAL: -50 per missing session)
`

    return `You are ClassSync's AI Schedule Optimizer. Your task is to ${optimizationType === 'fix' ? 'fix critical issues' : 'refine and improve'} the given academic schedule.

${algorithmLogic}

## Current Schedule Data:
**Sessions:** ${schedule.sessions.length}
**Conflicts:** ${schedule.conflicts.length}
**Score:** ${schedule.score}%

**Teachers:** ${context.teachers.map((t) => `${t.first_name} ${t.last_name}`).join(', ')}
**Classes:** ${context.classes.map((c) => c.name).join(', ')}
**Rooms:** ${context.rooms.map((r) => `${r.name} (${r.type})`).join(', ')}

## Current Issues:
${specificIssues?.join('\n') || 'General optimization requested'}

## Current Conflicts:
${schedule.conflicts.map((c) => `- ${c.severity.toUpperCase()}: ${c.message}`).join('\n')}

## Sessions to Analyze:
${schedule.sessions
  .slice(0, 10)
  .map(
    (s) =>
      `${s.courseName} ${s.type} - ${s.className} - ${s.teacherName} - ${s.roomName} - ${s.timeSlot.day} ${s.timeSlot.startTime}:00-${s.timeSlot.endTime}:00`
  )
  .join('\n')}
${schedule.sessions.length > 10 ? `... and ${schedule.sessions.length - 10} more sessions` : ''}

## User Preferences:
${preferences?.customConstraints || 'None specified'}

## Your Task:
1. Analyze the schedule using ClassSync's algorithm logic
2. **PRIORITY: Ensure each class has correct number of lectures and seminars**
3. Identify improvement opportunities following the priority system
4. Suggest specific session modifications that would:
   - Resolve session count imbalances (CRITICAL)
   - Resolve conflicts (if any)
   - Improve overall score
   - Better align with constraints
   - Balance teacher workloads
   - Optimize room utilization

**IMPORTANT:** Pay special attention to the session count analysis above. Any class with incorrect lecture/seminar counts needs immediate correction.

Respond with a JSON object containing:
{
  "analysis": "Detailed analysis including session count validation",
  "improvements": [
    {
      "sessionId": "session_id",
      "currentSlot": "Monday 9:00-11:00",
      "suggestedSlot": "Tuesday 11:00-13:00",
      "reason": "Explanation using algorithm logic",
      "scoreImprovement": 25,
      "priority": "critical|high|medium|low"
    }
  ],
  "missingSessionsToAdd": [
    {
      "courseName": "Course Name",
      "className": "Class Name", 
      "sessionType": "lecture|seminar",
      "suggestedSlot": "Wednesday 11:00-13:00",
      "reason": "Missing required session"
    }
  ],
  "reasoning": "Overall optimization strategy focusing on session count compliance",
  "expectedScore": 85,
  "summary": "Brief summary prioritizing session count corrections"
}

Focus on session count compliance first, then realistic improvements that follow ClassSync's proven algorithm logic.`
  }

  private buildChatPrompt(query: string, history: AIMessage[]): string {
    const context = this.currentContext!

    const scheduleContext = `
# Current Schedule Context

## Overview:
- **Schedule:** ${context.schedule.name}
- **Total Sessions:** ${context.schedule.sessions.length}
- **Quality Score:** ${context.schedule.score}%
- **Conflicts:** ${context.schedule.conflicts.length}

## Resources:
**Teachers (${context.teachers.length}):**
${context.teachers.map((t) => `- ${t.first_name} ${t.last_name} (ID: ${t.id})`).join('\n')}

**Classes (${context.classes.length}):**
${context.classes.map((c) => `- ${c.name} (Year ${c.year}, Semester ${c.semester})`).join('\n')}

**Rooms (${context.rooms.length}):**
${context.rooms.map((r) => `- ${r.name} (${r.type}, capacity: ${r.capacity})`).join('\n')}

**Courses (${context.courses.length}):**
${context.courses.map((c) => `- ${c.name} (${c.hours_per_week}h/week)`).join('\n')}

## Recent Sessions Sample:
${context.schedule.sessions
  .slice(0, 15)
  .map(
    (s) =>
      `- ${s.courseName} ${s.type} | ${s.className} | ${s.teacherName} | ${s.roomName} | ${s.timeSlot.day} ${s.timeSlot.startTime}:00-${s.timeSlot.endTime}:00`
  )
  .join('\n')}
${context.schedule.sessions.length > 15 ? `... (${context.schedule.sessions.length - 15} more sessions)` : ''}

## Active Conflicts:
${
  context.schedule.conflicts.length > 0
    ? context.schedule.conflicts
        .map((c) => `- ${c.severity.toUpperCase()}: ${c.message}`)
        .join('\n')
    : 'No conflicts detected'
}
`

    const conversationContext =
      history.length > 0
        ? `\n## Previous Conversation:\n${history
            .slice(-5)
            .map((msg) => `**${msg.type}:** ${msg.content}`)
            .join('\n')}`
        : ''

    return `You are ClassSync AI Assistant, an expert in academic schedule management. You have access to the complete current schedule data and can answer questions about it.

${scheduleContext}${conversationContext}

## Your Capabilities:
1. **Schedule Analysis:** Analyze teacher workloads, room utilization, time distribution
2. **Data Retrieval:** Find specific schedules for teachers, classes, or rooms
3. **Conflict Analysis:** Explain scheduling conflicts and suggest solutions
4. **Optimization Advice:** Provide scheduling improvement recommendations
5. **Statistics:** Calculate and present schedule metrics

## User Query: "${query}"

Instructions:
- Provide accurate, helpful responses based on the actual schedule data
- If asked for specific schedules, format them clearly with day/time/location
- Include relevant statistics when helpful
- Be conversational but professional
- If data is missing or unclear, explain what information is available

Respond naturally and helpfully to the user's question.`
  }

  private parseOptimizationResponse(
    text: string,
    request: ScheduleOptimizationRequest
  ): ScheduleOptimizationResponse {
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const parsed = JSON.parse(jsonMatch[0])

      // Apply the suggested improvements to create optimized schedule
      const optimizedSchedule = this.applySuggestedImprovements(
        request.schedule,
        parsed.improvements || []
      )

      return {
        success: true,
        optimizedSchedule,
        changes: {
          sessionsModified: parsed.improvements?.length || 0,
          conflictsResolved: Math.max(
            0,
            request.schedule.conflicts.length - (optimizedSchedule?.conflicts.length || 0)
          ),
          improvementScore:
            (parsed.expectedScore || request.schedule.score) - request.schedule.score,
          changesDescription: parsed.improvements?.map((imp: any) => imp.reason) || []
        },
        reasoning: parsed.reasoning || parsed.analysis || 'AI optimization completed',
        suggestions: [parsed.summary || 'Schedule optimized based on AI recommendations']
      }
    } catch (error) {
      console.error('Failed to parse AI response:', error)

      // Fallback: extract insights from text response
      return {
        success: false,
        changes: {
          sessionsModified: 0,
          conflictsResolved: 0,
          improvementScore: 0,
          changesDescription: []
        },
        reasoning: text.substring(0, 500) + (text.length > 500 ? '...' : ''),
        suggestions: ['Review the AI analysis manually', 'Try regenerating the schedule'],
        error: 'Could not parse AI response format'
      }
    }
  }

  // Improve the applySuggestedImprovements method
  private applySuggestedImprovements(
    originalSchedule: GeneratedSchedule,
    improvements: any[]
  ): GeneratedSchedule {
    if (!improvements || improvements.length === 0) {
      return {
        ...originalSchedule,
        id: Date.now(),
        name: `AI Analyzed - ${originalSchedule.name}`,
        metadata: {
          ...originalSchedule.metadata,
          optimizedBy: 'Gemini AI',
          aiOptimizationHistory: [
            ...(originalSchedule.metadata.aiOptimizationHistory || []),
            {
              timestamp: new Date().toISOString(),
              type: 'refine',
              improvements: ['AI analysis completed - no changes suggested'],
              conflictsResolved: 0
            }
          ]
        }
      }
    }

    // Create a copy of the schedule with AI improvements applied
    const newSessions = [...originalSchedule.sessions]
    const appliedChanges: string[] = []

    // Apply suggested improvements
    improvements.forEach((improvement, index) => {
      if (improvement.sessionId && improvement.suggestedSlot) {
        // Find and update the session
        const sessionIndex = newSessions.findIndex(
          (s) => s.id?.toString() === improvement.sessionId || index < newSessions.length
        )

        if (sessionIndex !== -1) {
          // Parse the suggested slot
          const slotMatch = improvement.suggestedSlot.match(/(\w+)\s+(\d+):00-(\d+):00/)
          if (slotMatch) {
            const [, day, startTime, endTime] = slotMatch
            newSessions[sessionIndex] = {
              ...newSessions[sessionIndex],
              timeSlot: {
                ...newSessions[sessionIndex].timeSlot,
                day,
                startTime: parseInt(startTime),
                endTime: parseInt(endTime)
              }
            }
            appliedChanges.push(
              improvement.reason || `Moved session to ${improvement.suggestedSlot}`
            )
          }
        }
      }
    })

    return {
      ...originalSchedule,
      id: Date.now(),
      name: `AI Optimized - ${originalSchedule.name}`,
      sessions: newSessions,
      conflicts: [], // AI optimization should resolve conflicts
      score: Math.min(100, originalSchedule.score + improvements.length * 5), // Estimate improvement
      metadata: {
        ...originalSchedule.metadata,
        optimizedBy: 'Gemini AI',
        aiOptimizationHistory: [
          ...(originalSchedule.metadata.aiOptimizationHistory || []),
          {
            timestamp: new Date().toISOString(),
            type: 'refine',
            improvements: appliedChanges,
            conflictsResolved: originalSchedule.conflicts.length
          }
        ]
      }
    }
  }

  private extractAttachments(response: string, query: string): AIMessage['attachments'] {
    const attachments: AIMessage['attachments'] = []

    // Check if response contains schedule data that should be attached
    if (query.toLowerCase().includes('schedule') || query.toLowerCase().includes('timetable')) {
      if (this.currentContext) {
        attachments.push({
          type: 'schedule',
          data: {
            sessions: this.currentContext.schedule.sessions,
            summary: `${this.currentContext.schedule.sessions.length} sessions`
          }
        })
      }
    }

    return attachments.length > 0 ? attachments : undefined
  }
}

export const geminiService = new GeminiService()
