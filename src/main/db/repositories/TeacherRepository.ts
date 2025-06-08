import BaseRepository from './BaseRepository'
import { Course, CourseType, Teacher } from '@shared/types/database'
import { TeacherCreateDto, TeacherUpdateDto } from '@shared/types/dto'

export default class TeacherRepository extends BaseRepository {
  getAll(): Teacher[] {
    const statement = this.prepare('SELECT * FROM teachers ORDER BY last_name, first_name')
    return statement.all() as Teacher[]
  }

  getById(id: number): Teacher | undefined {
    const statement = this.prepare('SELECT * FROM teachers WHERE id = ?')
    return statement.get(id) as Teacher | undefined
  }

  create(data: TeacherCreateDto): Teacher {
    const insertTeacher = this.prepare('INSERT INTO teachers (first_name, last_name) VALUES (?, ?)')

    const result = insertTeacher.run(data.first_name, data.last_name)
    const teacherId = result.lastInsertRowid as number

    // Add subjects if provided
    if (data.subjects && data.subjects.length > 0) {
      const insertSubject = this.prepare(
        'INSERT INTO teacher_subjects (teacher_id, subject_name) VALUES (?, ?)'
      )

      for (const subject of data.subjects) {
        try {
          insertSubject.run(teacherId, subject)
        } catch (err) {
          // Ignore duplicate subject errors
          console.log(`Subject ${subject} already exists for teacher ${teacherId}`)
        }
      }
    }

    return {
      id: teacherId,
      first_name: data.first_name,
      last_name: data.last_name,
      created_at: new Date().toISOString()
    }
  }

  update(id: number, data: TeacherUpdateDto): boolean {
    const statement = this.prepare(`
      UPDATE teachers 
      SET first_name = COALESCE(?, first_name), 
          last_name = COALESCE(?, last_name)
      WHERE id = ?
    `)

    const result = statement.run(data.first_name || null, data.last_name || null, id)

    return result.changes > 0
  }

  delete(id: number): boolean {
    const statement = this.prepare('DELETE FROM teachers WHERE id = ?')
    const result = statement.run(id)
    return result.changes > 0
  }

  // Teacher subjects methods
  getSubjects(teacherId: number): string[] {
    const statement = this.prepare('SELECT subject_name FROM teacher_subjects WHERE teacher_id = ?')
    const results = statement.all(teacherId) as { subject_name: string }[]
    return results.map((result) => result.subject_name)
  }

  addSubject(teacherId: number, subject: string): boolean {
    try {
      const statement = this.prepare(
        'INSERT INTO teacher_subjects (teacher_id, subject_name) VALUES (?, ?)'
      )
      statement.run(teacherId, subject)
      return true
    } catch (err) {
      // Handle unique constraint violation
      return false
    }
  }

  removeSubject(teacherId: number, subject: string): boolean {
    const statement = this.prepare(
      'DELETE FROM teacher_subjects WHERE teacher_id = ? AND subject_name = ?'
    )
    const result = statement.run(teacherId, subject)
    return result.changes > 0
  }

  // Get teachers by subject
  getTeachersBySubject(subject: string): Teacher[] {
    const statement = this.prepare(`
      SELECT t.* FROM teachers t
      JOIN teacher_subjects ts ON t.id = ts.teacher_id
      WHERE ts.subject_name = ?
      ORDER BY t.last_name, t.first_name
    `)
    return statement.all(subject) as Teacher[]
  }

  getTeacherCourses(teacherId: number): Course[] {
    const statement = this.prepare(`
      SELECT c.* FROM courses c
      JOIN teacher_courses tc ON c.id = tc.course_id
      WHERE tc.teacher_id = ?
      ORDER BY c.name
    `)
    return statement.all(teacherId) as Course[]
  }

  assignCourse(teacherId: number, courseId: number, type: CourseType = 'both'): boolean {
    try {
      // Remove existing assignment for this course
      this.removeCourse(teacherId, courseId)

      const statement = this.prepare(`
        INSERT INTO teacher_courses (teacher_id, course_id, type) VALUES (?, ?, ?)
      `)
      statement.run(teacherId, courseId, type)
      return true
    } catch (err: any) {
      console.error('Error assigning course to teacher:', err)
      throw err
    }
  }

  removeCourse(teacherId: number, courseId: number): boolean {
    const statement = this.prepare(`
      DELETE FROM teacher_courses 
      WHERE teacher_id = ? AND course_id = ?
    `)
    const result = statement.run(teacherId, courseId)
    return result.changes > 0
  }

  getAvailableCoursesForTeacher(teacherId: number): Course[] {
    const statement = this.prepare(`
      SELECT c.* FROM courses c
      WHERE c.id NOT IN (
        SELECT tc.course_id FROM teacher_courses tc 
        WHERE tc.teacher_id = ?
      )
      ORDER BY c.name
    `)
    return statement.all(teacherId) as Course[]
  }

  getTeacherCoursesWithTypes(teacherId: number): (Course & { type: CourseType })[] {
    try {
      const statement = this.prepare(`
        SELECT c.*, tc.type FROM courses c
        JOIN teacher_courses tc ON c.id = tc.course_id
        WHERE tc.teacher_id = ?
        ORDER BY c.name
      `)
      return statement.all(teacherId) as (Course & { type: CourseType })[]
    } catch (error) {
      console.error('Repository error in getTeacherCoursesWithTypes:', error)
      return []
    }
  }

  updateCourseType(teacherId: number, courseId: number, type: CourseType): boolean {
    try {
      const statement = this.prepare(`
        UPDATE teacher_courses 
        SET type = ? 
        WHERE teacher_id = ? AND course_id = ?
      `)
      const result = statement.run(type, teacherId, courseId)
      return result.changes > 0
    } catch (error) {
      console.error('Error updating course type:', error)
      throw error
    }
  }

  getTeacherWithCourseTypes(
    teacherId: number
  ): (Teacher & { courses: (Course & { type: CourseType })[] }) | null {
    try {
      const teacher = this.getById(teacherId)
      if (!teacher) return null

      const courses = this.getTeacherCoursesWithTypes(teacherId)
      return { ...teacher, courses }
    } catch (error) {
      console.error('Repository error in getTeacherWithCourseTypes:', error)
      return null
    }
  }
}
