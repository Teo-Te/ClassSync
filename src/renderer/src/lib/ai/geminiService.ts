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
      const newConflicts: ScheduleConflict[] = []

      // 1. Check time constraint violations
      const maxEndTime = optimizedSchedule.metadata?.constraints?.maxEndTime || 19
      optimizedSchedule.sessions.forEach((session) => {
        if (session.timeSlot.endTime > maxEndTime) {
          newConflicts.push({
            id: Date.now() + Math.random(),
            type: 'constraint_violation',
            severity: 'critical',
            message: `${session.courseName} ${session.type} ends at ${session.timeSlot.endTime}:00, exceeding maximum time`,
            affectedItems: [session.courseName, session.className],
            suggestions: ['Move to earlier time slot'],
            timestamp: new Date().toISOString()
          })
        }
      })

      // 2. Check for real conflicts (ignore grouped sessions)
      for (let i = 0; i < optimizedSchedule.sessions.length; i++) {
        for (let j = i + 1; j < optimizedSchedule.sessions.length; j++) {
          const session1 = optimizedSchedule.sessions[i]
          const session2 = optimizedSchedule.sessions[j]

          // Skip if different days
          if (session1.timeSlot.day !== session2.timeSlot.day) continue

          // Skip if no time overlap
          if (
            session1.timeSlot.startTime >= session2.timeSlot.endTime ||
            session2.timeSlot.startTime >= session1.timeSlot.endTime
          )
            continue

          // Skip if this is an intentional group (same time/teacher/room for different classes)
          if (session1.isGrouped && session2.isGrouped && session1.groupId === session2.groupId)
            continue

          // Check for real conflicts
          if (session1.teacherId === session2.teacherId) {
            newConflicts.push({
              id: Date.now() + Math.random(),
              type: 'teacher_conflict',
              severity: 'critical',
              message: `Teacher ${session1.teacherName} double-booked on ${session1.timeSlot.day}`,
              affectedItems: [session1.teacherName, session1.courseName, session2.courseName],
              suggestions: ['Reschedule one session'],
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
              suggestions: ['Assign different room'],
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
              suggestions: ['Reschedule one session'],
              timestamp: new Date().toISOString()
            })
          }
        }
      }

      // Calculate conservative score
      const criticalConflicts = newConflicts.filter((c) => c.severity === 'critical').length
      const scoreReduction = criticalConflicts * 10 // Less harsh penalty
      const newScore = Math.max(0, optimizedSchedule.score - scoreReduction)

      return {
        ...optimizedSchedule,
        conflicts: newConflicts,
        score: newScore,
        metadata: {
          ...optimizedSchedule.metadata,
          revalidatedAt: new Date().toISOString(),
          revalidationConflicts: newConflicts.length
        }
      }
    } catch (error) {
      console.error('❌ Revalidation failed:', error)
      return optimizedSchedule // Return unchanged if validation fails
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
        const originalConflictsCount = request.schedule.conflicts.filter(
          (c) => c.severity === 'critical'
        ).length

        const revalidatedSchedule = this.revalidateWithScheduleAlgorithm(
          optimizationResult.optimizedSchedule,
          request.context
        )

        optimizationResult.optimizedSchedule = revalidatedSchedule

        // Calculate conflicts AFTER revalidation
        const newConflictsCount = revalidatedSchedule.conflicts.filter(
          (c) => c.severity === 'critical'
        ).length
        const actualConflictsResolved = Math.max(0, originalConflictsCount - newConflictsCount)

        // 🔧 FIX: Update the conflicts resolved count with the actual number
        optimizationResult.changes.conflictsResolved = actualConflictsResolved

        // Update AI optimization history with correct count
        if (revalidatedSchedule.metadata.aiOptimizationHistory) {
          const lastEntry =
            revalidatedSchedule.metadata.aiOptimizationHistory[
              revalidatedSchedule.metadata.aiOptimizationHistory.length - 1
            ]
          if (lastEntry) {
            lastEntry.conflictsResolved = actualConflictsResolved
          }
        }

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

  private buildOptimizationPrompt(request: ScheduleOptimizationRequest): string {
    const { schedule, context, optimizationType, specificIssues, preferences } = request

    // Calculate session analysis more accurately
    const classSessionAnalysis = context.classes.map((classItem) => {
      const classLectures = schedule.sessions.filter(
        (s) => s.classId === classItem.id && s.type === 'lecture'
      )
      const classSeminars = schedule.sessions.filter(
        (s) => s.classId === classItem.id && s.type === 'seminar'
      )

      // Get unique courses for this class from sessions
      const coursesInSchedule = new Set(
        schedule.sessions.filter((s) => s.classId === classItem.id).map((s) => s.courseId)
      )

      return {
        className: classItem.name,
        expectedCourses: coursesInSchedule.size,
        actualLectures: classLectures.length,
        actualSeminars: classSeminars.length,
        isValid:
          classLectures.length === coursesInSchedule.size &&
          classSeminars.length === coursesInSchedule.size,
        coursesInSchedule: Array.from(coursesInSchedule).map((courseId) => {
          const course = context.courses.find((c) => c.id === courseId)
          return course?.name || `Course ${courseId}`
        })
      }
    })

    // Fix: Properly type the arrays as string arrays
    const actualProblems: string[] = []
    const validationIssues: string[] = []

    // Check for time violations
    const timeViolations = schedule.sessions.filter(
      (s) => s.timeSlot.endTime > (schedule.metadata.constraints?.maxEndTime || 19)
    )
    if (timeViolations.length > 0) {
      actualProblems.push(`${timeViolations.length} sessions end after maximum time`)
    }

    // Check for session count issues
    classSessionAnalysis.forEach((analysis) => {
      if (!analysis.isValid) {
        validationIssues.push(
          `${analysis.className}: ${analysis.actualLectures}L/${analysis.actualSeminars}S (expected ${analysis.expectedCourses} each)`
        )
      }
    })

    if (validationIssues.length > 0) {
      actualProblems.push(`Session count imbalances in ${validationIssues.length} classes`)
    }

    // Check for real conflicts (not grouped sessions)
    const realConflicts = schedule.conflicts.filter((c) => c.severity === 'critical').length
    if (realConflicts > 0) {
      actualProblems.push(`${realConflicts} critical scheduling conflicts`)
    }

    return `You are ClassSync's AI Schedule Optimizer. 

## CRITICAL INSTRUCTIONS:
1. **PRESERVE WORKING SESSIONS**: Do NOT suggest changes to sessions that are working correctly
2. **MINIMAL CHANGES ONLY**: Only suggest changes that fix actual problems
3. **UNDERSTAND GROUPED SESSIONS**: Sessions with same time/teacher/room for different classes are INTENTIONAL
4. **VALIDATE SUGGESTIONS**: Each suggestion must solve a specific problem without creating new ones

## Current Schedule Analysis:
**Total Sessions:** ${schedule.sessions.length}
**Score:** ${schedule.score}%
**Actual Problems Identified:** ${actualProblems.length === 0 ? 'NONE - Schedule appears to be working correctly' : actualProblems.join(', ')}

## Session Count Analysis:
${classSessionAnalysis
  .map(
    (analysis) =>
      `- ${analysis.className}: ${analysis.actualLectures}L + ${analysis.actualSeminars}S for ${analysis.expectedCourses} courses ${analysis.isValid ? '✅' : '❌'}`
  )
  .join('\n')}

## Validation Issues Details:
${validationIssues.length > 0 ? validationIssues.map((issue) => `- ${issue}`).join('\n') : 'No session count issues detected'}

## Detailed Session List:
${schedule.sessions
  .map(
    (s, i) =>
      `${i + 1}. [ID:${s.id}] ${s.courseName} ${s.type} - ${s.className} - ${s.teacherName} - ${s.roomName} - ${s.timeSlot.day} ${s.timeSlot.startTime}:00-${s.timeSlot.endTime}:00${s.isGrouped ? ' [GROUPED]' : ''}`
  )
  .join('\n')}
${schedule.sessions.length > 20 ? `... and ${schedule.sessions.length - 20} more sessions` : ''}

## Current Conflicts (may include false positives):
${
  schedule.conflicts.length === 0
    ? 'None reported'
    : schedule.conflicts
        .slice(0, 10)
        .map((c) => `- ${c.severity}: ${c.message}`)
        .join('\n')
}

## Constraints to Respect:
- Maximum end time: ${schedule.metadata.constraints?.maxEndTime || 19}:00
- Preferred time window: ${schedule.metadata.constraints?.preferredStartTime || 9}:00 - ${schedule.metadata.constraints?.preferredEndTime || 17}:00
- Lecture duration: ${schedule.metadata.constraints?.lectureSessionLength || 2} hours
- Seminar duration: ${schedule.metadata.constraints?.seminarSessionLength || 2} hours

## Your Task:
${
  actualProblems.length === 0
    ? `**NO OPTIMIZATION NEEDED** - The schedule appears to be working correctly. Only suggest minor improvements if absolutely necessary.`
    : `**FIX SPECIFIC ISSUES** - Address only the actual problems: ${actualProblems.join(', ')}`
}

## Response Format:
Respond with JSON ONLY:
{
  "analysis": "Brief analysis of actual issues found",
  "improvements": [
    // ONLY include if there are real problems to fix
    {
      "sessionId": "session_123",
      "problem": "Specific problem this fixes",
      "currentSlot": "Monday 9:00-11:00", 
      "suggestedSlot": "Tuesday 11:00-13:00",
      "reason": "Why this specific change fixes the problem",
      "priority": "critical"
    }
  ],
  "reasoning": "Conservative approach - preserve working elements",
  "expectedScore": ${Math.min(100, schedule.score + 5)},
  "summary": "${actualProblems.length === 0 ? 'No changes needed - schedule is working correctly' : 'Minimal targeted fixes for identified issues'}"
}

**REMEMBER**: 
- Grouped sessions (same time/teacher/room for multiple classes) are INTENTIONAL, not conflicts
- Only suggest changes that fix actual, specific problems
- Preserve all working sessions unchanged
- Be extremely conservative with suggestions
- If no real problems exist, return empty improvements array`
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
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const parsed = JSON.parse(jsonMatch[0])

      // Log the AI response for debugging
      console.log('🤖 AI Response:', parsed)

      // Validate that AI suggestions make sense
      const validImprovements = this.validateAIImprovements(
        parsed.improvements || [],
        request.schedule,
        request.context
      )

      console.log(`🔍 Valid improvements found: ${validImprovements.length}`)

      // DON'T skip improvements if there are conflicts to fix
      const hasConflicts =
        request.schedule.conflicts.filter((c) => c.severity === 'critical').length > 0

      // Only return "no changes needed" if there are NO conflicts AND no valid improvements
      if (validImprovements.length === 0 && !hasConflicts) {
        return {
          success: true,
          optimizedSchedule: {
            ...request.schedule,
            id: Date.now(),
            name: `AI Reviewed - ${request.schedule.name}`,
            metadata: {
              ...request.schedule.metadata,
              optimizedBy: 'Gemini AI',
              aiOptimizationHistory: [
                ...(request.schedule.metadata.aiOptimizationHistory || []),
                {
                  timestamp: new Date().toISOString(),
                  type: 'refine',
                  improvements: ['AI analysis - no changes needed'],
                  conflictsResolved: 0
                }
              ]
            }
          },
          changes: {
            sessionsModified: 0,
            conflictsResolved: 0,
            improvementScore: 0,
            changesDescription: ['No changes needed - schedule is working well']
          },
          reasoning: parsed.reasoning || 'Schedule analysis complete - no changes required',
          suggestions: [
            'Schedule is functioning correctly',
            'Consider manual review if specific issues persist'
          ]
        }
      }

      // If there are conflicts but no valid improvements, try manual resolution
      if (hasConflicts && validImprovements.length === 0) {
        console.log('❌ AI failed to provide valid solutions for existing conflicts')

        const manuallyFixedSchedule = this.attemptManualConflictResolution(
          request.schedule,
          request.context
        )

        return {
          success: true,
          optimizedSchedule: manuallyFixedSchedule,
          changes: {
            sessionsModified:
              manuallyFixedSchedule.sessions.length !== request.schedule.sessions.length ? 1 : 0,
            conflictsResolved: 0, // Will be calculated later in optimizeSchedule method
            improvementScore: manuallyFixedSchedule.score - request.schedule.score,
            changesDescription: [
              'Applied manual conflict resolution since AI suggestions were invalid'
            ]
          },
          reasoning: 'AI could not provide valid solutions, applied manual conflict resolution',
          suggestions: [
            'Manual conflict resolution applied',
            'Review the changes and optimize further if needed'
          ]
        }
      }

      // Apply the validated improvements
      const optimizedSchedule = this.applyValidatedImprovements(
        request.schedule,
        validImprovements,
        request.context
      )

      console.log(`✅ Applied ${validImprovements.length} improvements`)

      return {
        success: true,
        optimizedSchedule,
        changes: {
          sessionsModified: validImprovements.length,
          conflictsResolved: 0, // 🔧 This will be calculated after revalidation in optimizeSchedule
          improvementScore: optimizedSchedule.score - request.schedule.score,
          changesDescription: validImprovements.map((imp) => imp.reason || 'Session optimized')
        },
        reasoning: parsed.reasoning || 'Applied AI-suggested improvements',
        suggestions: [
          parsed.summary || `Applied ${validImprovements.length} changes`,
          'Review results and apply if satisfactory'
        ]
      }
    } catch (error) {
      console.error('Failed to parse AI response:', error)
      console.log('Raw AI response:', text)

      return {
        success: false,
        changes: {
          sessionsModified: 0,
          conflictsResolved: 0,
          improvementScore: 0,
          changesDescription: []
        },
        reasoning: 'AI analysis failed - could not parse response',
        suggestions: ['Manual review recommended', 'Check AI service configuration'],
        error: 'Could not parse AI response'
      }
    }
  }

  private attemptManualConflictResolution(
    schedule: GeneratedSchedule,
    context: AIContext
  ): GeneratedSchedule {
    console.log('🔧 Attempting manual conflict resolution...')

    const newSessions = [...schedule.sessions]
    const resolvedConflicts: string[] = []

    // Store original critical conflicts count
    const originalCriticalConflicts = schedule.conflicts.filter(
      (c) => c.severity === 'critical'
    ).length

    // Find critical conflicts
    const criticalConflicts = schedule.conflicts.filter((c) => c.severity === 'critical')

    for (const conflict of criticalConflicts) {
      if (
        conflict.type === 'teacher_conflict' ||
        conflict.type === 'room_conflict' ||
        conflict.type === 'constraint_violation'
      ) {
        // Find conflicting sessions
        const conflictingSessions = this.findConflictingSessions(newSessions, conflict)

        if (conflictingSessions.length >= 2) {
          // Try to move the second session to a free slot
          const sessionToMove = conflictingSessions[1]
          const newSlot = this.findAlternativeSlot(
            sessionToMove,
            newSessions,
            context,
            schedule.metadata.constraints
          )

          if (newSlot) {
            // Apply the move
            const sessionIndex = newSessions.findIndex((s) => s.id === sessionToMove.id)
            if (sessionIndex !== -1) {
              newSessions[sessionIndex] = {
                ...newSessions[sessionIndex],
                timeSlot: {
                  day: newSlot.day as any,
                  startTime: newSlot.start,
                  endTime: newSlot.end,
                  duration: newSlot.end - newSlot.start
                }
              }

              resolvedConflicts.push(
                `Moved ${sessionToMove.courseName} ${sessionToMove.type} for ${sessionToMove.className} to ${newSlot.day} ${newSlot.start}:00-${newSlot.end}:00`
              )

              console.log(
                `✅ Resolved conflict: moved session to ${newSlot.day} ${newSlot.start}:00-${newSlot.end}:00`
              )
            }
          }
        }
      }
    }

    // Create the fixed schedule
    const fixedSchedule: GeneratedSchedule = {
      ...schedule,
      id: Date.now(),
      name: `Manual Fix - ${schedule.name}`,
      sessions: newSessions,
      conflicts: [], // Will be filled by revalidation
      score: Math.min(100, schedule.score + resolvedConflicts.length * 10),
      metadata: {
        ...schedule.metadata,
        optimizedBy: 'Manual Conflict Resolution',
        aiOptimizationHistory: [
          ...(schedule.metadata.aiOptimizationHistory || []),
          {
            timestamp: new Date().toISOString(),
            type: 'fix',
            improvements: resolvedConflicts,
            conflictsResolved: resolvedConflicts.length // This will be updated after revalidation
          }
        ]
      }
    }

    // Revalidate the fixed schedule
    return this.revalidateWithScheduleAlgorithm(fixedSchedule, context)
  }

  private findConflictingSessions(
    sessions: ScheduleSession[],
    conflict: ScheduleConflict
  ): ScheduleSession[] {
    // Extract relevant info from conflict message to find the sessions
    const conflictingSessions: ScheduleSession[] = []

    if (conflict.type === 'teacher_conflict') {
      // Find sessions by teacher name mentioned in the conflict
      const teacherName = conflict.affectedItems[0]
      const courseName1 = conflict.affectedItems[1]
      const courseName2 = conflict.affectedItems[2]

      const session1 = sessions.find(
        (s) => s.teacherName === teacherName && s.courseName === courseName1
      )
      const session2 = sessions.find(
        (s) => s.teacherName === teacherName && s.courseName === courseName2
      )

      if (session1) conflictingSessions.push(session1)
      if (session2) conflictingSessions.push(session2)
    } else if (conflict.type === 'room_conflict') {
      // Find sessions by room name mentioned in the conflict
      const roomName = conflict.affectedItems[0]
      const courseName1 = conflict.affectedItems[1]
      const courseName2 = conflict.affectedItems[2]

      const session1 = sessions.find((s) => s.roomName === roomName && s.courseName === courseName1)
      const session2 = sessions.find((s) => s.roomName === roomName && s.courseName === courseName2)

      if (session1) conflictingSessions.push(session1)
      if (session2) conflictingSessions.push(session2)
    } else if (conflict.type === 'constraint_violation') {
      // Find sessions by class name mentioned in the conflict
      const className = conflict.affectedItems[0]
      const courseName1 = conflict.affectedItems[1]
      const courseName2 = conflict.affectedItems[2]

      const session1 = sessions.find(
        (s) => s.className === className && s.courseName === courseName1
      )
      const session2 = sessions.find(
        (s) => s.className === className && s.courseName === courseName2
      )

      if (session1) conflictingSessions.push(session1)
      if (session2) conflictingSessions.push(session2)
    }

    return conflictingSessions
  }

  private findAlternativeSlot(
    session: ScheduleSession,
    allSessions: ScheduleSession[],
    context: AIContext,
    constraints: any
  ): { day: string; start: number; end: number } | null {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    const maxEndTime = constraints?.maxEndTime || 19
    const sessionDuration = session.timeSlot.endTime - session.timeSlot.startTime

    // Try different time slots
    for (const day of days) {
      for (let startTime = 9; startTime <= maxEndTime - sessionDuration; startTime++) {
        const endTime = startTime + sessionDuration

        // Check if this slot would create conflicts
        const wouldConflict = this.wouldSlotCreateConflict(
          session,
          day,
          startTime,
          endTime,
          { sessions: allSessions } as GeneratedSchedule,
          context
        )

        if (!wouldConflict && endTime <= maxEndTime) {
          return { day, start: startTime, end: endTime }
        }
      }
    }

    return null // No suitable slot found
  }

  private applyValidatedImprovements(
    originalSchedule: GeneratedSchedule,
    validImprovements: any[],
    context: AIContext
  ): GeneratedSchedule {
    // Create a deep copy of the schedule
    const newSessions = originalSchedule.sessions.map((session) => ({ ...session }))
    const appliedChanges: string[] = []

    // Apply each validated improvement
    for (const improvement of validImprovements) {
      const sessionIndex = newSessions.findIndex((s) => s.id?.toString() === improvement.sessionId)

      if (sessionIndex !== -1 && improvement.parsedSlot) {
        const { day, start, end } = improvement.parsedSlot

        // Apply the change
        newSessions[sessionIndex] = {
          ...newSessions[sessionIndex],
          timeSlot: {
            ...newSessions[sessionIndex].timeSlot,
            day: day as any,
            startTime: start,
            endTime: end,
            duration: end - start
          }
        }

        appliedChanges.push(
          `${newSessions[sessionIndex].courseName} ${newSessions[sessionIndex].type} moved to ${day} ${start}:00-${end}:00`
        )
      }
    }

    // Determine optimization type based on original conflicts
    const optimizationType = originalSchedule.conflicts.length > 0 ? 'fix' : 'refine'

    // Create the optimized schedule
    const optimizedSchedule: GeneratedSchedule = {
      ...originalSchedule,
      id: Date.now(),
      name: `AI Optimized - ${originalSchedule.name}`,
      sessions: newSessions,
      conflicts: [], // Will be filled by revalidation
      score: Math.min(100, originalSchedule.score + validImprovements.length * 2), // Conservative score improvement
      metadata: {
        ...originalSchedule.metadata,
        optimizedBy: 'Gemini AI',
        aiOptimizationHistory: [
          ...(originalSchedule.metadata.aiOptimizationHistory || []),
          {
            timestamp: new Date().toISOString(),
            type: optimizationType,
            improvements: appliedChanges,
            conflictsResolved: 0
          }
        ]
      }
    }

    return optimizedSchedule
  }

  private validateAIImprovements(
    improvements: any[],
    schedule: GeneratedSchedule,
    context: AIContext
  ): any[] {
    if (!improvements || !Array.isArray(improvements)) {
      return []
    }

    // Fix: Explicitly type the array as any[]
    const validImprovements: any[] = []

    for (const improvement of improvements) {
      // Check if improvement has required fields
      if (!improvement.sessionId || !improvement.suggestedSlot) {
        console.log('❌ Skipping invalid improvement - missing required fields')
        continue
      }

      // Find the session to modify
      const sessionToModify = schedule.sessions.find(
        (s) => s.id?.toString() === improvement.sessionId
      )

      if (!sessionToModify) {
        console.log(`❌ Skipping improvement - session ${improvement.sessionId} not found`)
        continue
      }

      // Parse suggested time slot
      const slotMatch = improvement.suggestedSlot.match(/(\w+)\s+(\d+):00-(\d+):00/)
      if (!slotMatch) {
        console.log(
          `❌ Skipping improvement - invalid time slot format: ${improvement.suggestedSlot}`
        )
        continue
      }

      const [, day, startTime, endTime] = slotMatch
      const start = parseInt(startTime)
      const end = parseInt(endTime)

      // Validate the suggested time slot
      const maxEndTime = schedule.metadata.constraints?.maxEndTime || 19
      if (end > maxEndTime) {
        console.log(
          `❌ Skipping improvement - suggested slot ends after max time (${end} > ${maxEndTime})`
        )
        continue
      }

      // Check if the suggested slot would create conflicts
      const wouldCreateConflict = this.wouldSlotCreateConflict(
        sessionToModify,
        day,
        start,
        end,
        schedule,
        context
      )

      if (wouldCreateConflict) {
        console.log(`❌ Skipping improvement - would create conflict: ${improvement.suggestedSlot}`)
        continue
      }

      // If we get here, the improvement is valid
      validImprovements.push({
        ...improvement,
        parsedSlot: { day, start, end }
      })
    }

    console.log(
      `✅ Validated ${validImprovements.length} out of ${improvements.length} AI suggestions`
    )
    return validImprovements
  }

  private wouldSlotCreateConflict(
    sessionToModify: ScheduleSession,
    newDay: string,
    newStart: number,
    newEnd: number,
    schedule: GeneratedSchedule,
    context: AIContext
  ): boolean {
    // Check if any other session would conflict with this new time slot
    for (const otherSession of schedule.sessions) {
      if (otherSession.id === sessionToModify.id) {
        continue // Skip the session we're modifying
      }

      if (otherSession.timeSlot.day !== newDay) {
        continue // Different day, no conflict
      }

      // Check time overlap
      if (newStart < otherSession.timeSlot.endTime && otherSession.timeSlot.startTime < newEnd) {
        // There's a time overlap, check if it's a real conflict

        // Teacher conflict
        if (otherSession.teacherId === sessionToModify.teacherId) {
          return true
        }

        // Room conflict (unless it's an intentional group)
        if (otherSession.roomId === sessionToModify.roomId && !otherSession.isGrouped) {
          return true
        }

        // Class conflict
        if (otherSession.classId === sessionToModify.classId) {
          return true
        }
      }
    }

    return false
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
