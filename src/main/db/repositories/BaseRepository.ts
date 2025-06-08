import { getDatabase, Database, Statement } from '../index'

export default abstract class BaseRepository {
  protected db: Database

  constructor() {
    this.db = getDatabase()
  }

  protected prepare(sql: string): Statement {
    return this.db.prepare(sql)
  }
}
