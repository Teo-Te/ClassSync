import BetterSqlite3 from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'
import { runInitialMigration } from './migrations/initial'

let db: BetterSqlite3.Database | null = null

export function initDatabase(): BetterSqlite3.Database {
  const dbPath = path.join(app.getPath('userData'), 'classsyncV5.db')
  db = new BetterSqlite3(dbPath)

  // Enable foreign keys
  db.pragma('foreign_keys = ON')

  // Run migrations
  runInitialMigration()

  console.log('Database initialized at:', dbPath)
  return db
}

export function getDatabase(): BetterSqlite3.Database {
  if (!db) {
    return initDatabase()
  }
  return db
}

export type Database = BetterSqlite3.Database
export type Statement = BetterSqlite3.Statement
