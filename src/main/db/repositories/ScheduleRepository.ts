// src/main/db/repositories/ScheduleRepository.ts
import BaseRepository from './BaseRepository'
import { GeneratedSchedule } from '@shared/types/database'
import { v4 as uuidv4 } from 'uuid'

export interface SavedSchedule {
  id: number
  uuid: string
  name: string
  description?: string
  data: string // JSON string
  metadata?: string // JSON string
  created_at: string
  updated_at?: string
}

export interface ParsedSavedSchedule extends Omit<SavedSchedule, 'data' | 'metadata'> {
  data: GeneratedSchedule
  metadata?: any
}

export default class ScheduleRepository extends BaseRepository {
  // Get all saved schedules
  getAll(): SavedSchedule[] {
    const statement = this.prepare(`
      SELECT * FROM saved_schedules
      ORDER BY created_at DESC
    `)
    return statement.all() as SavedSchedule[]
  }

  // Get schedule by ID with parsed data
  getById(id: number): ParsedSavedSchedule | undefined {
    const statement = this.prepare(`
      SELECT * FROM saved_schedules
      WHERE id = ?
    `)

    const schedule = statement.get(id) as SavedSchedule

    if (!schedule) return undefined

    return {
      ...schedule,
      data: JSON.parse(schedule.data) as GeneratedSchedule,
      metadata: schedule.metadata ? JSON.parse(schedule.metadata) : undefined
    }
  }

  // Save a new schedule
  create(data: {
    name: string
    description?: string
    data: GeneratedSchedule
    metadata?: any
  }): SavedSchedule {
    const statement = this.prepare(`
      INSERT INTO saved_schedules (uuid, name, description, data, metadata)
      VALUES (?, ?, ?, ?, ?)
    `)

    const uuid = uuidv4()
    const jsonData = JSON.stringify(data.data)
    const jsonMetadata = data.metadata ? JSON.stringify(data.metadata) : undefined

    const result = statement.run(uuid, data.name, data.description || null, jsonData, jsonMetadata)

    return {
      id: result.lastInsertRowid as number,
      uuid,
      name: data.name,
      description: data.description,
      data: jsonData,
      metadata: jsonMetadata,
      created_at: new Date().toISOString()
    }
  }

  // Update existing schedule
  update(
    id: number,
    data: {
      name?: string
      description?: string
      data?: GeneratedSchedule
      metadata?: any
    }
  ): boolean {
    const updates: string[] = []
    const values: any[] = []

    if (data.name !== undefined) {
      updates.push('name = ?')
      values.push(data.name)
    }
    if (data.description !== undefined) {
      updates.push('description = ?')
      values.push(data.description)
    }
    if (data.data !== undefined) {
      updates.push('data = ?')
      values.push(JSON.stringify(data.data))
    }
    if (data.metadata !== undefined) {
      updates.push('metadata = ?')
      values.push(JSON.stringify(data.metadata))
    }

    if (updates.length === 0) return false

    updates.push('updated_at = ?')
    values.push(new Date().toISOString())
    values.push(id)

    const statement = this.prepare(`
      UPDATE saved_schedules 
      SET ${updates.join(', ')}
      WHERE id = ?
    `)

    const result = statement.run(...values)
    return result.changes > 0
  }

  // Delete schedule
  delete(id: number): boolean {
    const statement = this.prepare('DELETE FROM saved_schedules WHERE id = ?')
    const result = statement.run(id)
    return result.changes > 0
  }

  // Get schedule by UUID
  getByUuid(uuid: string): ParsedSavedSchedule | undefined {
    const statement = this.prepare(`
      SELECT * FROM saved_schedules
      WHERE uuid = ?
    `)

    const schedule = statement.get(uuid) as SavedSchedule

    if (!schedule) return undefined

    return {
      ...schedule,
      data: JSON.parse(schedule.data) as GeneratedSchedule,
      metadata: schedule.metadata ? JSON.parse(schedule.metadata) : undefined
    }
  }

  // Search schedules by name
  search(query: string): SavedSchedule[] {
    const statement = this.prepare(`
      SELECT * FROM saved_schedules
      WHERE name LIKE ? OR description LIKE ?
      ORDER BY created_at DESC
    `)

    const searchTerm = `%${query}%`
    return statement.all(searchTerm, searchTerm) as SavedSchedule[]
  }
}
