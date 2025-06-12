import { getDatabase } from '../index'

export function runInitialMigration() {
  const db = getDatabase()

  // Create tables in a transaction to ensure all or nothing succeeds
  db.transaction(() => {
    // Classes table
    db.exec(`
      CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        year INTEGER NOT NULL,
        semester INTEGER NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // Courses table (global courses - no class_id)
    db.exec(`
      CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        hours_per_week INTEGER NOT NULL DEFAULT 4,
        lecture_hours INTEGER NOT NULL DEFAULT 2,
        seminar_hours INTEGER NOT NULL DEFAULT 2,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // Class-Course junction table (many-to-many relationship)
    db.exec(`
      CREATE TABLE IF NOT EXISTS class_courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_id INTEGER NOT NULL,
        course_id INTEGER NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        UNIQUE(class_id, course_id)
      );
    `)

    // Teachers table
    db.exec(`
      CREATE TABLE IF NOT EXISTS teachers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE,
        phone TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // Teacher-Course junction table (teachers can teach specific courses)
    db.exec(`
      CREATE TABLE IF NOT EXISTS teacher_courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        teacher_id INTEGER NOT NULL,
        course_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('lecture', 'seminar', 'both')) DEFAULT 'both',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES teachers (id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
        UNIQUE (teacher_id, course_id)
      );
    `)

    // Course Teachers table (teacher assigned to specific course for a class)
    db.exec(`
      CREATE TABLE IF NOT EXISTS course_teachers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER NOT NULL,
        teacher_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('lecture', 'seminar')) DEFAULT 'lecture',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
        UNIQUE(course_id, teacher_id, type)
      );
    `)

    // NEW: Saved Schedules table (replaces old schedules table)
    db.exec(`
      CREATE TABLE IF NOT EXISTS saved_schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        data TEXT NOT NULL, -- JSON string of GeneratedSchedule
        metadata TEXT, -- Additional metadata as JSON (constraints, etc.)
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // Rooms table
    db.exec(`
      CREATE TABLE IF NOT EXISTS rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('lecture', 'seminar')),
        capacity INTEGER NOT NULL DEFAULT 50,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // App Settings table
    db.exec(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        lecture_rooms_count INTEGER NOT NULL DEFAULT 0,
        seminar_rooms_count INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // Insert default settings
    db.exec(`
      INSERT OR IGNORE INTO app_settings (id, lecture_rooms_count, seminar_rooms_count) 
      VALUES (1, 0, 0);
    `)

    // Create generic_settings table for key-value pairs
    db.exec(`
      CREATE TABLE IF NOT EXISTS generic_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `)

    // Create indexes for better query performance
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_class_courses_class_id ON class_courses (class_id);
      CREATE INDEX IF NOT EXISTS idx_class_courses_course_id ON class_courses (course_id);
      CREATE INDEX IF NOT EXISTS idx_teacher_courses_teacher_id ON teacher_courses (teacher_id);
      CREATE INDEX IF NOT EXISTS idx_teacher_courses_course_id ON teacher_courses (course_id);
      CREATE INDEX IF NOT EXISTS idx_teacher_courses_type ON teacher_courses (type);
      CREATE INDEX IF NOT EXISTS idx_course_teachers_course_id ON course_teachers (course_id);
      CREATE INDEX IF NOT EXISTS idx_course_teachers_teacher_id ON course_teachers (teacher_id);
      CREATE INDEX IF NOT EXISTS idx_course_teachers_type ON course_teachers (type);
      CREATE INDEX IF NOT EXISTS idx_course_teachers_course_type ON course_teachers (course_id, type);
      CREATE INDEX IF NOT EXISTS idx_rooms_type ON rooms (type);
      
      -- NEW: Indexes for saved schedules
      CREATE INDEX IF NOT EXISTS idx_saved_schedules_uuid ON saved_schedules (uuid);
      CREATE INDEX IF NOT EXISTS idx_saved_schedules_created_at ON saved_schedules (created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_saved_schedules_name ON saved_schedules (name);
    `)

    console.log('Initial migration completed successfully with saved schedules support')
  })()
}
