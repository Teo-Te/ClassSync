import BaseRepository from './BaseRepository'
import { Teacher } from '@shared/types/database'
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
}
