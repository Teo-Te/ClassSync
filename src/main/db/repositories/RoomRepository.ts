import BaseRepository from './BaseRepository'
import { Room, RoomType } from '@shared/types/database'

interface CreateRoomDto {
  name: string
  type: RoomType
  capacity: number
}

interface UpdateRoomDto {
  name?: string
  type?: RoomType
  capacity?: number
}

export default class RoomRepository extends BaseRepository {
  constructor() {
    super()
  }

  getAll(): Room[] {
    try {
      const statement = this.prepare('SELECT * FROM rooms ORDER BY type, name')
      return statement.all() as Room[]
    } catch (error) {
      console.error('Repository error in getAll:', error)
      return []
    }
  }

  getById(id: number): Room | null {
    try {
      const statement = this.prepare('SELECT * FROM rooms WHERE id = ?')
      return (statement.get(id) as Room) || null
    } catch (error) {
      console.error('Repository error in getById:', error)
      return null
    }
  }

  getByType(type: RoomType): Room[] {
    try {
      const statement = this.prepare('SELECT * FROM rooms WHERE type = ? ORDER BY name')
      return statement.all(type) as Room[]
    } catch (error) {
      console.error('Repository error in getByType:', error)
      return []
    }
  }

  create(data: CreateRoomDto): Room {
    try {
      const statement = this.prepare(`
        INSERT INTO rooms (name, type, capacity)
        VALUES (?, ?, ?)
      `)

      const result = statement.run(data.name, data.type, data.capacity)

      if (result.changes === 0) {
        throw new Error('Failed to create room')
      }

      const newRoom = this.getById(Number(result.lastInsertRowid))
      if (!newRoom) {
        throw new Error('Failed to retrieve created room')
      }

      return newRoom
    } catch (error) {
      console.error('Repository error in create:', error)
      throw new Error('Failed to create room')
    }
  }

  update(id: number, data: UpdateRoomDto): boolean {
    try {
      const setParts: string[] = []
      const values: any[] = []

      if (data.name !== undefined) {
        setParts.push('name = ?')
        values.push(data.name)
      }
      if (data.type !== undefined) {
        setParts.push('type = ?')
        values.push(data.type)
      }
      if (data.capacity !== undefined) {
        setParts.push('capacity = ?')
        values.push(data.capacity)
      }

      if (setParts.length === 0) {
        return true // Nothing to update
      }

      values.push(id)
      const statement = this.prepare(`
        UPDATE rooms 
        SET ${setParts.join(', ')}
        WHERE id = ?
      `)

      const result = statement.run(...values)
      return result.changes > 0
    } catch (error) {
      console.error('Repository error in update:', error)
      return false
    }
  }

  delete(id: number): boolean {
    try {
      const statement = this.prepare('DELETE FROM rooms WHERE id = ?')
      const result = statement.run(id)
      return result.changes > 0
    } catch (error) {
      console.error('Repository error in delete:', error)
      return false
    }
  }

  getCapacityByType(type: RoomType): number {
    try {
      const statement = this.prepare('SELECT SUM(capacity) as total FROM rooms WHERE type = ?')
      const result = statement.get(type) as { total: number | null }
      return result.total || 0
    } catch (error) {
      console.error('Repository error in getCapacityByType:', error)
      return 0
    }
  }

  getRoomStats() {
    try {
      const statement = this.prepare(`
        SELECT 
          type,
          COUNT(*) as count,
          SUM(capacity) as total_capacity,
          AVG(capacity) as avg_capacity
        FROM rooms 
        GROUP BY type
      `)
      return statement.all() as Array<{
        type: RoomType
        count: number
        total_capacity: number
        avg_capacity: number
      }>
    } catch (error) {
      console.error('Repository error in getRoomStats:', error)
      return []
    }
  }
}
