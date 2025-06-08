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

    // Courses table (subjects within a class)
    db.exec(`
      CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        hours_per_week INTEGER NOT NULL DEFAULT 4,
        lecture_hours INTEGER NOT NULL DEFAULT 2,
        seminar_hours INTEGER NOT NULL DEFAULT 2,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE
      );
    `)

    // Teachers table
    db.exec(`
      CREATE TABLE IF NOT EXISTS teachers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // Teacher Subjects table (many-to-many)
    db.exec(`
      CREATE TABLE IF NOT EXISTS teacher_subjects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        teacher_id INTEGER NOT NULL,
        subject_name TEXT NOT NULL,
        FOREIGN KEY (teacher_id) REFERENCES teachers (id) ON DELETE CASCADE,
        UNIQUE (teacher_id, subject_name)
      );
    `)

    // Course Teachers table (assignment)
    db.exec(`
      CREATE TABLE IF NOT EXISTS course_teachers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER NOT NULL,
        teacher_id INTEGER NOT NULL,
        FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
        FOREIGN KEY (teacher_id) REFERENCES teachers (id) ON DELETE CASCADE,
        UNIQUE (course_id, teacher_id)
      );
    `)

    // Schedules table
    db.exec(`
      CREATE TABLE IF NOT EXISTS schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        class_id INTEGER NOT NULL,
        data TEXT NOT NULL, -- JSON data of schedule
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE
      );
    `)

    // Create indexes for better query performance
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_courses_class_id ON courses (class_id);
      CREATE INDEX IF NOT EXISTS idx_teacher_subjects_teacher_id ON teacher_subjects (teacher_id);
      CREATE INDEX IF NOT EXISTS idx_course_teachers_course_id ON course_teachers (course_id);
      CREATE INDEX IF NOT EXISTS idx_course_teachers_teacher_id ON course_teachers (teacher_id);
      CREATE INDEX IF NOT EXISTS idx_schedules_class_id ON schedules (class_id);
    `)
  })()
}
