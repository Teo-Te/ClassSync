import BaseRepository from './BaseRepository'
import { Schedule, ParsedSchedule, ScheduleData } from '@shared/types/database'
import { ScheduleCreateDto } from '@shared/types/dto'
import { v4 as uuidv4 } from 'uuid'

export default class ScheduleRepository extends BaseRepository {
  getAll(): Schedule[] {
    const statement = this.prepare(`
      SELECT s.*, c.name as class_name 
      FROM schedules s
      JOIN classes c ON s.class_id = c.id
      ORDER BY s.created_at DESC
    `)
    return statement.all() as Schedule[]
  }

  getById(id: number): ParsedSchedule | undefined {
    const statement = this.prepare(`
      SELECT s.*, c.name as class_name 
      FROM schedules s
      JOIN classes c ON s.class_id = c.id
      WHERE s.id = ?
    `)

    const schedule = statement.get(id) as Schedule & { class_name: string }

    if (!schedule) return undefined

    // Parse the JSON data
    return {
      ...schedule,
      data: JSON.parse(schedule.data) as ScheduleData
    }
  }

  getByClassId(classId: number): Schedule[] {
    const statement = this.prepare(`
      SELECT s.*, c.name as class_name 
      FROM schedules s
      JOIN classes c ON s.class_id = c.id
      WHERE s.class_id = ?
      ORDER BY s.created_at DESC
    `)

    return statement.all(classId) as Schedule[]
  }

  create(data: ScheduleCreateDto & { data: ScheduleData }): Schedule {
    const statement = this.prepare(`
      INSERT INTO schedules (uuid, name, class_id, data)
      VALUES (?, ?, ?, ?)
    `)

    const uuid = uuidv4()
    const jsonData = JSON.stringify(data.data)

    const result = statement.run(uuid, data.name, data.class_id, jsonData)

    return {
      id: result.lastInsertRowid as number,
      uuid,
      name: data.name,
      class_id: data.class_id,
      data: jsonData,
      created_at: new Date().toISOString()
    }
  }

  delete(id: number): boolean {
    const statement = this.prepare('DELETE FROM schedules WHERE id = ?')
    const result = statement.run(id)
    return result.changes > 0
  }

  // Additional method to update schedule data
  updateData(id: number, data: ScheduleData): boolean {
    const statement = this.prepare(`
      UPDATE schedules 
      SET data = ? 
      WHERE id = ?
    `)

    const jsonData = JSON.stringify(data)
    const result = statement.run(jsonData, id)

    return result.changes > 0
  }

  // Generate a new UUID for a schedule
  regenerateUuid(id: number): string | undefined {
    const uuid = uuidv4()
    const statement = this.prepare(`
      UPDATE schedules 
      SET uuid = ? 
      WHERE id = ?
    `)

    const result = statement.run(uuid, id)

    return result.changes > 0 ? uuid : undefined
  }
}
