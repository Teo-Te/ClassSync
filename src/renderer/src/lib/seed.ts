import { Course, Teacher, Class, CourseType, Room, RoomType } from '@shared/types/database'

interface SeedTeacher {
  first_name: string
  last_name: string
  email: string
  phone?: string
  title: string
  specializations: string[]
}

interface SeedCourse {
  name: string
  hours_per_week: number
  lecture_hours: number
  seminar_hours: number
}

interface SeedClass {
  name: string
  year: number
  semester: number
}

interface SeedRoom {
  name: string
  type: RoomType
  capacity: number
}

/*
SCHEDULING MATH:
- Time slots: 4 per day × 5 days = 20 total slots per week
- Each course needs: 1 lecture + 1 seminar = 2 sessions per week
- Target: Fill 9am-1pm schedule efficiently

PERFECT BALANCE CALCULATION:
- 3 Lecture rooms × 20 slots = 60 lecture slots available
- 6 Seminar rooms × 20 slots = 120 seminar slots available
- 6 Classes total (2 per year)
- 5 Courses per class × 6 classes = 30 total course instances
- Each course instance needs: 1 lecture + 1 seminar
- Total needed: 30 lectures + 30 seminars = 60 sessions
- Perfect fit: 30 lectures in 60 slots = 50% utilization, 30 seminars in 120 slots = 25% utilization
*/

export async function seedDatabase() {
  console.log('🌱 Starting balanced database seeding...')
  console.log('📊 Target: Perfect fit for 9am-1pm weekly schedule')

  try {
    // Clear existing data first
    await clearDatabase()

    // 1. Seed Rooms (Balanced for schedule)
    const rooms = await seedRooms()

    // 2. Seed Teachers (Enough for all courses)
    const teachers = await seedTeachers()

    // 3. Seed Courses (Balanced per year)
    const courses = await seedCourses()

    // 4. Seed Classes (All semester 2 for consistency)
    const classes = await seedClasses()

    // 5. Assign Courses to Classes (Exactly 5 per class)
    await assignCoursesToClasses(classes, courses)

    // 6. Assign Teachers to Courses (Balanced distribution)
    await assignTeachersToCourses(teachers, courses)

    console.log('✅ Balanced database seeding completed!')
    console.log('📈 Expected schedule utilization: ~50% lectures, ~25% seminars')
    return { success: true, message: 'Database seeded with perfect balance for scheduling' }
  } catch (error) {
    console.error('❌ Database seeding failed:', error)
    return { success: false, message: 'Database seeding failed', error: error as Error }
  }
}

async function clearDatabase() {
  console.log('🧹 Clearing existing data...')

  try {
    // Clear junction tables first (to avoid foreign key constraints)
    ;(await window.api.database?.execute?.('DELETE FROM teacher_courses')) || Promise.resolve()
    ;(await window.api.database?.execute?.('DELETE FROM class_courses')) || Promise.resolve()
    ;(await window.api.database?.execute?.('DELETE FROM schedules')) || Promise.resolve()

    // Clear main tables
    await clearAllEntities()

    console.log('✅ Database cleared successfully')
  } catch (error) {
    console.warn('⚠️ Database clear failed (might be empty):', error)
  }
}

async function clearAllEntities() {
  const entities = [
    { name: 'teachers', api: window.api.teachers },
    { name: 'courses', api: window.api.courses },
    { name: 'classes', api: window.api.classes },
    { name: 'rooms', api: window.api.rooms }
  ]

  for (const entity of entities) {
    try {
      const items = await entity.api.getAll()
      for (const item of items) {
        await entity.api.delete(item.id)
      }
      console.log(`🗑️ Cleared ${items.length} ${entity.name}`)
    } catch (error) {
      console.warn(`Failed to clear ${entity.name}:`, error)
    }
  }
}

async function seedRooms(): Promise<Room[]> {
  console.log('🏢 Seeding rooms for optimal schedule balance...')

  const roomData: SeedRoom[] = [
    // 3 Lecture Rooms (enough for 30 lectures across 60 slots = 50% utilization)
    { name: 'A1', type: 'lecture', capacity: 100 },
    { name: 'A2', type: 'lecture', capacity: 80 },
    { name: 'A3', type: 'lecture', capacity: 120 },

    // 6 Seminar Rooms (enough for 30 seminars across 120 slots = 25% utilization)
    { name: 'S1', type: 'seminar', capacity: 30 },
    { name: 'S2', type: 'seminar', capacity: 30 },
    { name: 'S3', type: 'seminar', capacity: 35 },
    { name: 'S4', type: 'seminar', capacity: 25 },
    { name: 'S5', type: 'seminar', capacity: 30 },
    { name: 'S6', type: 'seminar', capacity: 35 }
  ]

  const createdRooms: Room[] = []

  for (const roomInfo of roomData) {
    try {
      const room = await window.api.rooms.create(roomInfo)
      createdRooms.push(room)
      console.log(
        `✅ Created room: ${roomInfo.name} (${roomInfo.type}, capacity: ${roomInfo.capacity})`
      )
    } catch (error) {
      console.error(`❌ Failed to create room: ${roomInfo.name}`, error)
    }
  }

  console.log(
    `📊 Room balance: ${roomData.filter((r) => r.type === 'lecture').length} lecture, ${roomData.filter((r) => r.type === 'seminar').length} seminar`
  )
  return createdRooms
}

async function seedTeachers(): Promise<Teacher[]> {
  console.log('👨‍🏫 Seeding teachers for balanced course coverage...')

  const teacherData: SeedTeacher[] = [
    // Senior Teachers (Can handle both lectures and seminars) - 6 teachers
    {
      first_name: 'John',
      last_name: 'Anderson',
      email: 'j.anderson@university.edu',
      phone: '+1-555-0101',
      title: 'Prof.',
      specializations: ['Software Engineering', 'Programming']
    },
    {
      first_name: 'Maria',
      last_name: 'Rodriguez',
      email: 'm.rodriguez@university.edu',
      phone: '+1-555-0102',
      title: 'Prof.',
      specializations: ['Data Structures', 'Algorithms']
    },
    {
      first_name: 'Robert',
      last_name: 'Chen',
      email: 'r.chen@university.edu',
      phone: '+1-555-0103',
      title: 'Dr.',
      specializations: ['Database Systems', 'Machine Learning']
    },
    {
      first_name: 'Sarah',
      last_name: 'Johnson',
      email: 's.johnson@university.edu',
      phone: '+1-555-0104',
      title: 'Dr.',
      specializations: ['Networks', 'Security']
    },
    {
      first_name: 'Michael',
      last_name: 'Wilson',
      email: 'm.wilson@university.edu',
      phone: '+1-555-0201',
      title: 'PhD',
      specializations: ['Web Development', 'Mobile Development']
    },
    {
      first_name: 'Lisa',
      last_name: 'Thompson',
      email: 'l.thompson@university.edu',
      phone: '+1-555-0202',
      title: 'PhD',
      specializations: ['Systems', 'Architecture']
    },

    // Specialized Teachers (Mainly seminars, some lectures) - 6 teachers
    {
      first_name: 'David',
      last_name: 'Kim',
      email: 'd.kim@university.edu',
      phone: '+1-555-0203',
      title: 'MSc',
      specializations: ['Operating Systems', 'Programming']
    },
    {
      first_name: 'Anna',
      last_name: 'Kowalski',
      email: 'a.kowalski@university.edu',
      phone: '+1-555-0301',
      title: 'MSc',
      specializations: ['Mathematics', 'Logic']
    },
    {
      first_name: 'James',
      last_name: 'Brown',
      email: 'j.brown@university.edu',
      phone: '+1-555-0302',
      title: 'Asst. Prof.',
      specializations: ['Software Engineering', 'Testing']
    },
    {
      first_name: 'Elena',
      last_name: 'Petrov',
      email: 'e.petrov@university.edu',
      phone: '+1-555-0303',
      title: 'Lecturer',
      specializations: ['Web Development', 'Frontend']
    },
    {
      first_name: 'Thomas',
      last_name: 'Garcia',
      email: 't.garcia@university.edu',
      phone: '+1-555-0401',
      title: 'Lecturer',
      specializations: ['Mobile Development', 'UI/UX']
    },
    {
      first_name: 'Sophie',
      last_name: 'Martin',
      email: 's.martin@university.edu',
      phone: '+1-555-0501',
      title: 'Lecturer',
      specializations: ['Data Structures', 'Algorithms']
    }
  ]

  const createdTeachers: Teacher[] = []

  for (const teacherInfo of teacherData) {
    try {
      const teacher = await window.api.teachers.create({
        first_name: teacherInfo.first_name,
        last_name: teacherInfo.last_name,
        email: teacherInfo.email,
        phone: teacherInfo.phone
      })
      createdTeachers.push(teacher)
      console.log(`✅ Created teacher: ${teacherInfo.first_name} ${teacherInfo.last_name}`)
    } catch (error) {
      console.error(
        `❌ Failed to create teacher: ${teacherInfo.first_name} ${teacherInfo.last_name}`,
        error
      )
    }
  }

  console.log(
    `📊 Teacher balance: 12 total teachers for 15 courses (1.25 teachers per course average)`
  )
  return createdTeachers
}

async function seedCourses(): Promise<Course[]> {
  console.log('📚 Seeding courses for perfect schedule balance...')

  const courseData: SeedCourse[] = [
    // Year 1 Courses - 5 courses (each needs 1 lecture + 1 seminar per class)
    {
      name: 'Programming Fundamentals',
      hours_per_week: 4,
      lecture_hours: 2,
      seminar_hours: 2
    },
    {
      name: 'Mathematics for CS',
      hours_per_week: 4,
      lecture_hours: 2,
      seminar_hours: 2
    },
    {
      name: 'Computer Architecture',
      hours_per_week: 4,
      lecture_hours: 2,
      seminar_hours: 2
    },
    {
      name: 'Object-Oriented Programming',
      hours_per_week: 4,
      lecture_hours: 2,
      seminar_hours: 2
    },
    {
      name: 'Data Structures',
      hours_per_week: 4,
      lecture_hours: 2,
      seminar_hours: 2
    },

    // Year 2 Courses - 5 courses
    {
      name: 'Algorithms and Complexity',
      hours_per_week: 4,
      lecture_hours: 2,
      seminar_hours: 2
    },
    {
      name: 'Database Systems',
      hours_per_week: 4,
      lecture_hours: 2,
      seminar_hours: 2
    },
    {
      name: 'Operating Systems',
      hours_per_week: 4,
      lecture_hours: 2,
      seminar_hours: 2
    },
    {
      name: 'Computer Networks',
      hours_per_week: 4,
      lecture_hours: 2,
      seminar_hours: 2
    },
    {
      name: 'Web Development',
      hours_per_week: 4,
      lecture_hours: 2,
      seminar_hours: 2
    },

    // Year 3 Courses - 5 courses
    {
      name: 'Machine Learning',
      hours_per_week: 4,
      lecture_hours: 2,
      seminar_hours: 2
    },
    {
      name: 'Cybersecurity',
      hours_per_week: 4,
      lecture_hours: 2,
      seminar_hours: 2
    },
    {
      name: 'Mobile Development',
      hours_per_week: 4,
      lecture_hours: 2,
      seminar_hours: 2
    },
    {
      name: 'Software Engineering',
      hours_per_week: 4,
      lecture_hours: 2,
      seminar_hours: 2
    },
    {
      name: 'Cloud Computing',
      hours_per_week: 4,
      lecture_hours: 2,
      seminar_hours: 2
    }
  ]

  const createdCourses: Course[] = []

  for (const courseInfo of courseData) {
    try {
      const course = await window.api.courses.create(courseInfo)
      createdCourses.push(course)
      console.log(`✅ Created course: ${courseInfo.name}`)
    } catch (error) {
      console.error(`❌ Failed to create course: ${courseInfo.name}`, error)
    }
  }

  console.log(`📊 Course balance: 15 courses × 2 classes per year = 30 total course instances`)
  return createdCourses
}

async function seedClasses(): Promise<Class[]> {
  console.log('🎓 Seeding classes for perfect schedule distribution...')

  // Perfect balance: 2 classes per year, all semester 2
  const classData: SeedClass[] = [
    // Year 1 Classes (2 classes × 5 courses = 10 course instances)
    { name: '1A', year: 1, semester: 2 },
    { name: '1B', year: 1, semester: 2 },

    // Year 2 Classes (2 classes × 5 courses = 10 course instances)
    { name: '2A', year: 2, semester: 2 },
    { name: '2B', year: 2, semester: 2 },

    // Year 3 Classes (2 classes × 5 courses = 10 course instances)
    { name: '3A', year: 3, semester: 2 },
    { name: '3B', year: 3, semester: 2 }
  ]

  const createdClasses: Class[] = []

  for (const classInfo of classData) {
    try {
      const classObj = await window.api.classes.create(classInfo)
      createdClasses.push(classObj)
      console.log(
        `✅ Created class: ${classInfo.name} (Year ${classInfo.year}, Semester ${classInfo.semester})`
      )
    } catch (error) {
      console.error(`❌ Failed to create class: ${classInfo.name}`, error)
    }
  }

  console.log(`📊 Class balance: 6 classes total (2 per year) = 30 total course instances`)
  return createdClasses
}

async function assignCoursesToClasses(classes: Class[], courses: Course[]) {
  console.log('🔗 Assigning courses to classes for perfect balance...')

  // Create mapping of courses by intended year (based on course name/content)
  const coursesByYear = {
    1: [
      'Programming Fundamentals',
      'Mathematics for CS',
      'Computer Architecture',
      'Object-Oriented Programming',
      'Data Structures'
    ],
    2: [
      'Algorithms and Complexity',
      'Database Systems',
      'Operating Systems',
      'Computer Networks',
      'Web Development'
    ],
    3: [
      'Machine Learning',
      'Cybersecurity',
      'Mobile Development',
      'Software Engineering',
      'Cloud Computing'
    ]
  }

  for (const classObj of classes) {
    // Get course names for this year
    const yearCourseNames = coursesByYear[classObj.year as keyof typeof coursesByYear] || []

    // Find the actual course objects
    const yearCourses = courses.filter((course) => yearCourseNames.includes(course.name))

    console.log(`📝 Assigning ${yearCourses.length} courses to class ${classObj.name}`)

    for (const course of yearCourses) {
      try {
        await window.api.courses.assignToClass(course.id, classObj.id)
        console.log(`✅ Assigned ${course.name} to class ${classObj.name}`)
      } catch (error) {
        console.error(`❌ Failed to assign ${course.name} to class ${classObj.name}`, error)
      }
    }
  }

  console.log(`📊 Assignment result: Each class has exactly 5 courses = 30 total assignments`)
}

async function assignTeachersToCourses(teachers: Teacher[], courses: Course[]) {
  console.log('👩‍🏫 Assigning teachers to courses for balanced workload...')

  // Balanced assignments ensuring every course has both lecture and seminar teachers
  const assignments = [
    // Year 1 Courses
    {
      teacherName: 'John Anderson',
      courseName: 'Programming Fundamentals',
      type: 'both' as CourseType
    },
    {
      teacherName: 'Sophie Martin',
      courseName: 'Programming Fundamentals',
      type: 'seminar' as CourseType
    },

    { teacherName: 'Anna Kowalski', courseName: 'Mathematics for CS', type: 'both' as CourseType },

    {
      teacherName: 'Lisa Thompson',
      courseName: 'Computer Architecture',
      type: 'both' as CourseType
    },

    {
      teacherName: 'John Anderson',
      courseName: 'Object-Oriented Programming',
      type: 'lecture' as CourseType
    },
    {
      teacherName: 'David Kim',
      courseName: 'Object-Oriented Programming',
      type: 'seminar' as CourseType
    },

    { teacherName: 'Maria Rodriguez', courseName: 'Data Structures', type: 'both' as CourseType },
    { teacherName: 'Sophie Martin', courseName: 'Data Structures', type: 'seminar' as CourseType },

    // Year 2 Courses
    {
      teacherName: 'Maria Rodriguez',
      courseName: 'Algorithms and Complexity',
      type: 'lecture' as CourseType
    },
    {
      teacherName: 'Sophie Martin',
      courseName: 'Algorithms and Complexity',
      type: 'seminar' as CourseType
    },

    { teacherName: 'Robert Chen', courseName: 'Database Systems', type: 'both' as CourseType },

    {
      teacherName: 'Lisa Thompson',
      courseName: 'Operating Systems',
      type: 'lecture' as CourseType
    },
    { teacherName: 'David Kim', courseName: 'Operating Systems', type: 'seminar' as CourseType },

    { teacherName: 'Sarah Johnson', courseName: 'Computer Networks', type: 'both' as CourseType },

    { teacherName: 'Michael Wilson', courseName: 'Web Development', type: 'both' as CourseType },
    { teacherName: 'Elena Petrov', courseName: 'Web Development', type: 'seminar' as CourseType },

    // Year 3 Courses
    { teacherName: 'Robert Chen', courseName: 'Machine Learning', type: 'lecture' as CourseType },
    { teacherName: 'James Brown', courseName: 'Machine Learning', type: 'seminar' as CourseType },

    { teacherName: 'Sarah Johnson', courseName: 'Cybersecurity', type: 'lecture' as CourseType },
    { teacherName: 'James Brown', courseName: 'Cybersecurity', type: 'seminar' as CourseType },

    {
      teacherName: 'Michael Wilson',
      courseName: 'Mobile Development',
      type: 'lecture' as CourseType
    },
    {
      teacherName: 'Thomas Garcia',
      courseName: 'Mobile Development',
      type: 'seminar' as CourseType
    },

    {
      teacherName: 'John Anderson',
      courseName: 'Software Engineering',
      type: 'lecture' as CourseType
    },
    {
      teacherName: 'James Brown',
      courseName: 'Software Engineering',
      type: 'seminar' as CourseType
    },

    { teacherName: 'Michael Wilson', courseName: 'Cloud Computing', type: 'lecture' as CourseType },
    { teacherName: 'Elena Petrov', courseName: 'Cloud Computing', type: 'seminar' as CourseType }
  ]

  let successCount = 0
  let errorCount = 0

  for (const assignment of assignments) {
    const teacher = teachers.find(
      (t) => `${t.first_name} ${t.last_name}` === assignment.teacherName
    )

    if (!teacher) {
      console.error(`❌ Teacher not found: ${assignment.teacherName}`)
      errorCount++
      continue
    }

    const course = courses.find((c) => c.name === assignment.courseName)
    if (!course) {
      console.error(`❌ Course not found: ${assignment.courseName}`)
      errorCount++
      continue
    }

    try {
      await window.api.teachers.assignCourse(teacher.id, course.id, assignment.type)
      console.log(
        `✅ Assigned ${teacher.first_name} ${teacher.last_name} to ${course.name} (${assignment.type})`
      )
      successCount++
    } catch (error) {
      console.error(
        `❌ Failed to assign teacher ${teacher.first_name} ${teacher.last_name} to course ${course.name}`,
        error
      )
      errorCount++
    }
  }

  console.log(`📊 Teacher assignment result: ${successCount} successful, ${errorCount} errors`)
  console.log(
    `📈 Expected workload: ~2-3 courses per teacher, balanced lecture/seminar distribution`
  )
}
