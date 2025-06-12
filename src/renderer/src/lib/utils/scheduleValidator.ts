// src/renderer/src/lib/utils/scheduleValidator.ts
import { GeneratedSchedule, Class, Course } from '@shared/types/database'

export interface ValidationResult {
  isValid: boolean
  criticalIssues: string[]
  warnings: string[]
  sessionCountAnalysis: {
    className: string
    expectedLectures: number
    actualLectures: number
    expectedSeminars: number
    actualSeminars: number
    isValid: boolean
  }[]
  summary: string
}

export function validateScheduleCompleteness(
  schedule: GeneratedSchedule,
  classes: Class[],
  courses: Course[],
  classCoursesMap: Map<number, Course[]>
): ValidationResult {
  const criticalIssues: string[] = []
  const warnings: string[] = []
  const sessionCountAnalysis: ValidationResult['sessionCountAnalysis'] = []

  let totalExpectedSessions = 0
  let totalActualSessions = schedule.sessions.length

  for (const classItem of classes) {
    const classCourses = classCoursesMap.get(classItem.id) || []
    const expectedCount = classCourses.length

    totalExpectedSessions += expectedCount * 2 // lectures + seminars

    const classLectures = schedule.sessions.filter(
      (s) => s.classId === classItem.id && s.type === 'lecture'
    )
    const classSeminars = schedule.sessions.filter(
      (s) => s.classId === classItem.id && s.type === 'seminar'
    )

    const actualLectures = classLectures.length
    const actualSeminars = classSeminars.length

    const analysis = {
      className: classItem.name,
      expectedLectures: expectedCount,
      actualLectures,
      expectedSeminars: expectedCount,
      actualSeminars,
      isValid: actualLectures === expectedCount && actualSeminars === expectedCount
    }

    sessionCountAnalysis.push(analysis)

    // Check for missing sessions
    if (actualLectures < expectedCount) {
      criticalIssues.push(
        `Class ${classItem.name} missing ${expectedCount - actualLectures} lecture(s)`
      )
    }

    if (actualSeminars < expectedCount) {
      criticalIssues.push(
        `Class ${classItem.name} missing ${expectedCount - actualSeminars} seminar(s)`
      )
    }

    // Check for excess sessions
    if (actualLectures > expectedCount) {
      warnings.push(
        `Class ${classItem.name} has ${actualLectures - expectedCount} excess lecture(s)`
      )
    }

    if (actualSeminars > expectedCount) {
      warnings.push(
        `Class ${classItem.name} has ${actualSeminars - expectedCount} excess seminar(s)`
      )
    }
  }

  const validClasses = sessionCountAnalysis.filter((a) => a.isValid).length
  const isValid = criticalIssues.length === 0

  const summary =
    `Schedule validation: ${validClasses}/${classes.length} classes have correct session counts. ` +
    `Expected ${totalExpectedSessions} sessions, found ${totalActualSessions}. ` +
    `${criticalIssues.length} critical issues, ${warnings.length} warnings.`

  return {
    isValid,
    criticalIssues,
    warnings,
    sessionCountAnalysis,
    summary
  }
}
