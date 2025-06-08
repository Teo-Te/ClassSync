import BaseRepository from './BaseRepository'
import { AppSettings } from '@shared/types/database'

interface UpdateSettingsDto {
  lecture_rooms_count?: number
  seminar_rooms_count?: number
}

export default class SettingsRepository extends BaseRepository {
  constructor() {
    super()
  }

  get(): AppSettings {
    try {
      const statement = this.prepare('SELECT * FROM app_settings WHERE id = 1')
      const settings = statement.get() as AppSettings

      if (!settings) {
        // Create default settings if none exist
        const createStatement = this.prepare(`
          INSERT INTO app_settings (id, lecture_rooms_count, seminar_rooms_count)
          VALUES (1, 0, 0)
        `)
        createStatement.run()

        return {
          id: 1,
          lecture_rooms_count: 0,
          seminar_rooms_count: 0,
          updated_at: new Date().toISOString()
        }
      }

      return settings
    } catch (error) {
      console.error('Repository error in get:', error)
      return {
        id: 1,
        lecture_rooms_count: 0,
        seminar_rooms_count: 0,
        updated_at: new Date().toISOString()
      }
    }
  }

  update(data: UpdateSettingsDto): boolean {
    try {
      const setParts: string[] = []
      const values: any[] = []

      if (data.lecture_rooms_count !== undefined) {
        setParts.push('lecture_rooms_count = ?')
        values.push(data.lecture_rooms_count)
      }
      if (data.seminar_rooms_count !== undefined) {
        setParts.push('seminar_rooms_count = ?')
        values.push(data.seminar_rooms_count)
      }

      if (setParts.length === 0) {
        return true // Nothing to update
      }

      setParts.push('updated_at = ?')
      values.push(new Date().toISOString())

      const statement = this.prepare(`
        UPDATE app_settings 
        SET ${setParts.join(', ')}
        WHERE id = 1
      `)

      const result = statement.run(...values)
      return result.changes > 0
    } catch (error) {
      console.error('Repository error in update:', error)
      return false
    }
  }

  updateRoomCounts(lectureCount: number, seminarCount: number): boolean {
    try {
      const statement = this.prepare(`
        UPDATE app_settings 
        SET lecture_rooms_count = ?, seminar_rooms_count = ?, updated_at = ?
        WHERE id = 1
      `)

      const result = statement.run(lectureCount, seminarCount, new Date().toISOString())
      return result.changes > 0
    } catch (error) {
      console.error('Repository error in updateRoomCounts:', error)
      return false
    }
  }
}
