// src/main/db/repositories/CourseRepository.ts
import BaseRepository from './BaseRepository'
import { AssignmentType, Course, CourseWithTeacherDetails, Teacher } from '@shared/types/database'
import { CourseCreateDto } from '@shared/types/dto'

export default class CourseRepository extends BaseRepository {
  // Get all courses (global)
  getAll(): Course[] {
    const statement = this.prepare('SELECT * FROM courses ORDER BY name')
    return statement.all() as Course[]
  }

  // Get courses assigned to a specific class
  getByClassId(classId: number): Course[] {
    const statement = this.prepare(`
      SELECT c.* FROM courses c
      JOIN class_courses cc ON c.id = cc.course_id
      WHERE cc.class_id = ?
      ORDER BY c.name
    `)
    return statement.all(classId) as Course[]
  }

  getById(id: number): Course | undefined {
    const statement = this.prepare('SELECT * FROM courses WHERE id = ?')
    return statement.get(id) as Course | undefined
  }

  // Create global course (no class_id needed)
  create(data: CourseCreateDto): Course {
    const statement = this.prepare(`
      INSERT INTO courses (name, hours_per_week, lecture_hours, seminar_hours)
      VALUES (?, ?, ?, ?)
    `)

    const result = statement.run(
      data.name,
      data.hours_per_week || 4,
      data.lecture_hours || 2,
      data.seminar_hours || 2
    )

    return {
      id: result.lastInsertRowid as number,
      name: data.name,
      hours_per_week: data.hours_per_week || 4,
      lecture_hours: data.lecture_hours || 2,
      seminar_hours: data.seminar_hours || 2,
      created_at: new Date().toISOString()
    }
  }

  // Assign course to class
  assignToClass(courseId: number, classId: number): boolean {
    try {
      const statement = this.prepare(`
        INSERT INTO class_courses (class_id, course_id) VALUES (?, ?)
      `)
      statement.run(classId, courseId)
      return true
    } catch (err) {
      console.error('Error assigning course to class:', err)
      return false
    }
  }

  // Remove course from class
  removeFromClass(courseId: number, classId: number): boolean {
    const statement = this.prepare(`
      DELETE FROM class_courses 
      WHERE class_id = ? AND course_id = ?
    `)
    const result = statement.run(classId, courseId)
    return result.changes > 0
  }

  // Get available courses for a class (courses not yet assigned)
  getAvailableForClass(classId: number): Course[] {
    const statement = this.prepare(`
      SELECT c.* FROM courses c
      WHERE c.id NOT IN (
        SELECT cc.course_id FROM class_courses cc 
        WHERE cc.class_id = ?
      )
      ORDER BY c.name
    `)
    return statement.all(classId) as Course[]
  }

  // Get courses with teachers for a specific class
  getCoursesWithTeachers(classId: number): (Course & { teachers: number[] })[] {
    const courses = this.getByClassId(classId)

    return courses.map((course) => {
      const teachers = this.getAssignedTeacherIds(course.id)
      return {
        ...course,
        teachers
      }
    })
  }

  getCourseWithTeacherDetails(courseId: number): CourseWithTeacherDetails | null {
    try {
      // Get course
      const course = this.getById(courseId)
      if (!course) return null

      // Get assigned teachers with types
      const assignedTeachers = this.getAssignedTeachers(courseId)

      const lectureTeacher = assignedTeachers.find((t) => t.type === 'lecture')
      const seminarTeacher = assignedTeachers.find((t) => t.type === 'seminar')

      return {
        ...course,
        lectureTeacher: lectureTeacher || undefined,
        seminarTeacher: seminarTeacher || undefined,
        teachers: assignedTeachers.map((t) => t.id) // For backward compatibility
      }
    } catch (error) {
      console.error('Repository error in getCourseWithTeacherDetails:', error)
      return null
    }
  }

  removeTeacherByType(courseId: number, type: AssignmentType): boolean {
    try {
      const statement = this.prepare(`
        DELETE FROM course_teachers 
        WHERE course_id = ? AND type = ?
      `)
      const result = statement.run(courseId, type)
      return result.changes > 0
    } catch (error) {
      console.error('Error removing teacher from course by type:', error)
      throw error
    }
  }

  removeTeacher(courseId: number, teacherId: number, type?: AssignmentType): boolean {
    try {
      let statement

      if (type) {
        statement = this.prepare(`
          DELETE FROM course_teachers 
          WHERE course_id = ? AND teacher_id = ? AND type = ?
        `)
        const result = statement.run(courseId, teacherId, type)
        return result.changes > 0
      } else {
        statement = this.prepare(`
          DELETE FROM course_teachers 
          WHERE course_id = ? AND teacher_id = ?
        `)
        const result = statement.run(courseId, teacherId)
        return result.changes > 0
      }
    } catch (error) {
      console.error('Error removing teacher from course:', error)
      throw error
    }
  }

  getAssignedTeachers(courseId: number): (Teacher & { type: AssignmentType })[] {
    try {
      const statement = this.prepare(`
        SELECT t.*, ct.type FROM teachers t
        JOIN course_teachers ct ON t.id = ct.teacher_id
        WHERE ct.course_id = ?
        ORDER BY ct.type, t.first_name, t.last_name
      `)
      return statement.all(courseId) as (Teacher & { type: AssignmentType })[]
    } catch (error) {
      console.error('Repository error in getAssignedTeachers:', error)
      return []
    }
  }

  getAssignedTeacherIds(courseId: number): number[] {
    try {
      const statement = this.prepare(`
        SELECT teacher_id FROM course_teachers WHERE course_id = ?
      `)
      const results = statement.all(courseId) as { teacher_id: number }[]
      return results.map((result) => result.teacher_id)
    } catch (error) {
      console.error('Repository error in getAssignedTeacherIds:', error)
      return []
    }
  }

  delete(id: number): boolean {
    const statement = this.prepare('DELETE FROM courses WHERE id = ?')
    const result = statement.run(id)
    return result.changes > 0
  }

  update(id: number, data: Partial<CourseCreateDto>): boolean {
    const statement = this.prepare(`
      UPDATE courses 
      SET name = COALESCE(?, name),
          hours_per_week = COALESCE(?, hours_per_week),
          lecture_hours = COALESCE(?, lecture_hours),
          seminar_hours = COALESCE(?, seminar_hours)
      WHERE id = ?
    `)

    const result = statement.run(
      data.name || null,
      data.hours_per_week || null,
      data.lecture_hours || null,
      data.seminar_hours || null,
      id
    )

    return result.changes > 0
  }

  getEligibleTeachers(courseId: number, type?: AssignmentType): Teacher[] {
    try {
      let statement

      if (type) {
        statement = this.prepare(`
          SELECT DISTINCT t.* FROM teachers t
          JOIN teacher_courses tc ON t.id = tc.teacher_id
          WHERE tc.course_id = ? AND (tc.type = ? OR tc.type = 'both')
          ORDER BY t.first_name, t.last_name
        `)
        return statement.all(courseId, type) as Teacher[]
      } else {
        statement = this.prepare(`
          SELECT DISTINCT t.* FROM teachers t
          JOIN teacher_courses tc ON t.id = tc.teacher_id
          WHERE tc.course_id = ?
          ORDER BY t.first_name, t.last_name
        `)
        return statement.all(courseId) as Teacher[]
      }
    } catch (error) {
      console.error('Repository error in getEligibleTeachers:', error)
      return []
    }
  }

  assignTeacher(courseId: number, teacherId: number, type: AssignmentType): boolean {
    try {
      // Check if teacher is eligible for this type
      const eligibleTeachers = this.getEligibleTeachers(courseId, type)
      const isEligible = eligibleTeachers.some((teacher) => teacher.id === teacherId)

      if (!isEligible) {
        throw new Error(`Teacher is not qualified to teach ${type} for this course`)
      }

      // Remove existing assignment of same type (only one teacher per type)
      this.removeTeacherByType(courseId, type)

      // Add new assignment
      const statement = this.prepare(`
        INSERT INTO course_teachers (course_id, teacher_id, type) VALUES (?, ?, ?)
      `)
      statement.run(courseId, teacherId, type)
      return true
    } catch (err: any) {
      console.error('Error assigning teacher to course:', err)
      throw err
    }
  }

  getCoursesWithTeacherDetails(classId: number): CourseWithTeacherDetails[] {
    try {
      const courses = this.getByClassId(classId)
      return courses.map((course) => {
        const details = this.getCourseWithTeacherDetails(course.id)
        return details || { ...course, teachers: [] }
      })
    } catch (error) {
      console.error('Repository error in getCoursesWithTeacherDetails:', error)
      return []
    }
  }
}
