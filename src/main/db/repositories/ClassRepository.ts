import BaseRepository from './BaseRepository'
import { Class } from '@shared/types/database'
import { ClassCreateDto, ClassUpdateDto } from '@shared/types/dto'

export default class ClassRepository extends BaseRepository {
  getAll(): Class[] {
    const statement = this.prepare('SELECT * FROM classes')
    return statement.all() as Class[]
  }

  getById(id: number): Class | undefined {
    const statement = this.prepare('SELECT * FROM classes WHERE id = ?')
    return statement.get(id) as Class | undefined
  }

  create(data: ClassCreateDto): Class {
    const statement = this.prepare('INSERT INTO classes (name, year, semester) VALUES (?, ?, ?)')
    const result = statement.run(data.name, data.year, data.semester)

    return {
      id: result.lastInsertRowid as number,
      ...data,
      created_at: new Date().toISOString()
    }
  }

  update(id: number, data: ClassUpdateDto): boolean {
    const statement = this.prepare(`
    UPDATE classes 
    SET name = COALESCE(?, name),
        year = COALESCE(?, year),
        semester = COALESCE(?, semester)
    WHERE id = ?
  `)

    const result = statement.run(data.name || null, data.year || null, data.semester || null, id)

    return result.changes > 0
  }

  delete(id: number): boolean {
    const statement = this.prepare('DELETE FROM classes WHERE id = ?')
    const result = statement.run(id)
    return result.changes > 0
  }
}
