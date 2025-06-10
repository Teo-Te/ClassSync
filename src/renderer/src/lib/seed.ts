import { Course, Teacher, Class, CourseType } from '@shared/types/database'

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

export async function seedDatabase() {
  console.log('🌱 Starting database seeding...')

  try {
    // 1. Seed Teachers
    const teachers = await seedTeachers()

    // 2. Seed Courses
    const courses = await seedCourses()

    // 3. Seed Classes
    const classes = await seedClasses()

    // 4. Assign Courses to Classes
    await assignCoursesToClasses(classes, courses)

    // 5. Assign Teachers to Courses with types
    await assignTeachersToCourses(teachers, courses)

    console.log('✅ Database seeding completed successfully!')
    return { success: true, message: 'Database seeded successfully' }
  } catch (error) {
    console.error('❌ Database seeding failed:', error)
    return { success: false, message: 'Database seeding failed', error: error as Error }
  }
}

async function seedTeachers(): Promise<Teacher[]> {
  console.log('👨‍🏫 Seeding teachers...')

  const teacherData: SeedTeacher[] = [
    // Professors (Dr./Prof. - Can teach both lectures and seminars)
    {
      first_name: 'John',
      last_name: 'Anderson',
      email: 'j.anderson@university.edu',
      phone: '+1-555-0101',
      title: 'Dr.',
      specializations: ['Software Engineering', 'Computer Architecture']
    },
    {
      first_name: 'Maria',
      last_name: 'Rodriguez',
      email: 'm.rodriguez@university.edu',
      phone: '+1-555-0102',
      title: 'Prof.',
      specializations: ['Data Structures', 'Algorithms', 'Machine Learning']
    },
    {
      first_name: 'Robert',
      last_name: 'Chen',
      email: 'r.chen@university.edu',
      phone: '+1-555-0103',
      title: 'Dr.',
      specializations: ['Database Systems', 'Data Mining']
    },
    {
      first_name: 'Sarah',
      last_name: 'Johnson',
      email: 's.johnson@university.edu',
      phone: '+1-555-0104',
      title: 'Prof.',
      specializations: ['Network Security', 'Cybersecurity']
    },

    // PhD holders (Mainly lectures, some seminars)
    {
      first_name: 'Michael',
      last_name: 'Wilson',
      email: 'm.wilson@university.edu',
      phone: '+1-555-0201',
      title: 'PhD',
      specializations: ['Programming Languages', 'Compilers']
    },
    {
      first_name: 'Lisa',
      last_name: 'Thompson',
      email: 'l.thompson@university.edu',
      phone: '+1-555-0202',
      title: 'PhD',
      specializations: ['Human-Computer Interaction', 'UI/UX']
    },
    {
      first_name: 'David',
      last_name: 'Kim',
      email: 'd.kim@university.edu',
      phone: '+1-555-0203',
      title: 'PhD',
      specializations: ['Operating Systems', 'Distributed Systems']
    },

    // MSc holders (Mainly seminars, some lectures)
    {
      first_name: 'Anna',
      last_name: 'Kowalski',
      email: 'a.kowalski@university.edu',
      phone: '+1-555-0301',
      title: 'MSc',
      specializations: ['Web Development', 'Frontend']
    },
    {
      first_name: 'James',
      last_name: 'Brown',
      email: 'j.brown@university.edu',
      phone: '+1-555-0302',
      title: 'MSc',
      specializations: ['Mobile Development', 'Testing']
    },
    {
      first_name: 'Elena',
      last_name: 'Petrov',
      email: 'e.petrov@university.edu',
      phone: '+1-555-0303',
      title: 'MSc',
      specializations: ['DevOps', 'Cloud Computing']
    },

    // Assistant Professors (Seminars focused)
    {
      first_name: 'Thomas',
      last_name: 'Garcia',
      email: 't.garcia@university.edu',
      phone: '+1-555-0401',
      title: 'Asst. Prof.',
      specializations: ['Software Engineering', 'Agile']
    },
    {
      first_name: 'Jennifer',
      last_name: 'Lee',
      email: 'j.lee@university.edu',
      phone: '+1-555-0402',
      title: 'Asst. Prof.',
      specializations: ['Database', 'Analytics']
    },

    // Lecturers (Seminars only)
    {
      first_name: 'Mark',
      last_name: 'Taylor',
      email: 'm.taylor@university.edu',
      phone: '+1-555-0501',
      title: 'Lecturer',
      specializations: ['Programming', 'OOP']
    },
    {
      first_name: 'Sophie',
      last_name: 'Martin',
      email: 's.martin@university.edu',
      phone: '+1-555-0502',
      title: 'Lecturer',
      specializations: ['Mathematics']
    },
    {
      first_name: 'Alex',
      last_name: 'Wright',
      email: 'a.wright@university.edu',
      phone: '+1-555-0503',
      title: 'Lecturer',
      specializations: ['Project Management']
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

  return createdTeachers
}

async function seedCourses(): Promise<Course[]> {
  console.log('📚 Seeding courses...')

  const courseData: SeedCourse[] = [
    // Year 1 Courses
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
      name: 'Digital Logic Design',
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
      name: 'Discrete Mathematics',
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

    // Year 2 Courses
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
      name: 'Software Engineering',
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
    {
      name: 'Human-Computer Interaction',
      hours_per_week: 4,
      lecture_hours: 2,
      seminar_hours: 2
    },

    // Year 3 Courses
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
      name: 'Distributed Systems',
      hours_per_week: 4,
      lecture_hours: 2,
      seminar_hours: 2
    },
    {
      name: 'Cloud Computing',
      hours_per_week: 4,
      lecture_hours: 2,
      seminar_hours: 2
    },
    {
      name: 'Senior Project',
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

  return createdCourses
}

async function seedClasses(): Promise<Class[]> {
  console.log('🎓 Seeding classes...')

  const classData: SeedClass[] = [
    // Year 1 Classes
    { name: '1A', year: 1, semester: 1 },
    { name: '1B', year: 1, semester: 1 },
    { name: '1C', year: 1, semester: 2 },

    // Year 2 Classes
    { name: '2A', year: 2, semester: 1 },
    { name: '2B', year: 2, semester: 1 },
    { name: '2C', year: 2, semester: 2 },

    // Year 3 Classes
    { name: '3A', year: 3, semester: 1 },
    { name: '3B', year: 3, semester: 1 },
    { name: '3C', year: 3, semester: 2 }
  ]

  const createdClasses: Class[] = []

  for (const classInfo of classData) {
    try {
      const classObj = await window.api.classes.create(classInfo)
      createdClasses.push(classObj)
      console.log(`✅ Created class: ${classInfo.name} (Year ${classInfo.year})`)
    } catch (error) {
      console.error(`❌ Failed to create class: ${classInfo.name}`, error)
    }
  }

  return createdClasses
}

async function assignCoursesToClasses(classes: Class[], courses: Course[]) {
  console.log('🔗 Assigning courses to classes...')

  // Course assignment mapping by year
  const coursesByYear = {
    1: [
      'Programming Fundamentals',
      'Mathematics for CS',
      'Digital Logic Design',
      'Computer Architecture',
      'Object-Oriented Programming',
      'Discrete Mathematics',
      'Data Structures'
    ],
    2: [
      'Algorithms and Complexity',
      'Database Systems',
      'Operating Systems',
      'Computer Networks',
      'Software Engineering',
      'Web Development',
      'Human-Computer Interaction'
    ],
    3: [
      'Machine Learning',
      'Cybersecurity',
      'Mobile Development',
      'Distributed Systems',
      'Cloud Computing',
      'Senior Project'
    ]
  }

  for (const classObj of classes) {
    const yearCourses = coursesByYear[classObj.year as keyof typeof coursesByYear] || []

    for (const courseName of yearCourses) {
      const course = courses.find((c) => c.name === courseName)
      if (!course) {
        console.error(`❌ Course not found: ${courseName}`)
        continue
      }

      try {
        await window.api.courses.assignToClass(course.id, classObj.id)
        console.log(`✅ Assigned ${course.name} to class ${classObj.name}`)
      } catch (error) {
        console.error(`❌ Failed to assign ${course.name} to class ${classObj.name}`, error)
      }
    }
  }
}

async function assignTeachersToCourses(teachers: Teacher[], courses: Course[]) {
  console.log('👩‍🏫 Assigning teachers to courses...')

  // Teacher assignments based on name and specialization
  const assignments = [
    // Professors/Doctors - Both lectures and seminars
    {
      teacherName: 'John Anderson',
      courses: [
        { name: 'Computer Architecture', type: 'both' as CourseType },
        { name: 'Software Engineering', type: 'both' as CourseType }
      ]
    },
    {
      teacherName: 'Maria Rodriguez',
      courses: [
        { name: 'Data Structures', type: 'both' as CourseType },
        { name: 'Algorithms and Complexity', type: 'both' as CourseType },
        { name: 'Machine Learning', type: 'lecture' as CourseType }
      ]
    },
    {
      teacherName: 'Robert Chen',
      courses: [{ name: 'Database Systems', type: 'both' as CourseType }]
    },
    {
      teacherName: 'Sarah Johnson',
      courses: [
        { name: 'Computer Networks', type: 'both' as CourseType },
        { name: 'Cybersecurity', type: 'both' as CourseType }
      ]
    },

    // PhDs - Mainly lectures, some seminars
    {
      teacherName: 'Michael Wilson',
      courses: [
        { name: 'Programming Fundamentals', type: 'lecture' as CourseType },
        { name: 'Object-Oriented Programming', type: 'both' as CourseType }
      ]
    },
    {
      teacherName: 'Lisa Thompson',
      courses: [
        { name: 'Human-Computer Interaction', type: 'both' as CourseType },
        { name: 'Web Development', type: 'seminar' as CourseType }
      ]
    },
    {
      teacherName: 'David Kim',
      courses: [
        { name: 'Operating Systems', type: 'both' as CourseType },
        { name: 'Distributed Systems', type: 'lecture' as CourseType }
      ]
    },

    // MSc - Mainly seminars, some lectures
    {
      teacherName: 'Anna Kowalski',
      courses: [
        { name: 'Web Development', type: 'seminar' as CourseType },
        { name: 'Object-Oriented Programming', type: 'seminar' as CourseType }
      ]
    },
    {
      teacherName: 'James Brown',
      courses: [
        { name: 'Mobile Development', type: 'seminar' as CourseType },
        { name: 'Software Engineering', type: 'seminar' as CourseType }
      ]
    },
    {
      teacherName: 'Elena Petrov',
      courses: [
        { name: 'Cloud Computing', type: 'seminar' as CourseType },
        { name: 'Operating Systems', type: 'seminar' as CourseType }
      ]
    },

    // Assistant Professors - Seminars focused
    {
      teacherName: 'Thomas Garcia',
      courses: [
        { name: 'Software Engineering', type: 'seminar' as CourseType },
        { name: 'Senior Project', type: 'seminar' as CourseType }
      ]
    },
    {
      teacherName: 'Jennifer Lee',
      courses: [
        { name: 'Database Systems', type: 'seminar' as CourseType },
        { name: 'Machine Learning', type: 'seminar' as CourseType }
      ]
    },

    // Lecturers - Seminars only
    {
      teacherName: 'Mark Taylor',
      courses: [
        { name: 'Programming Fundamentals', type: 'seminar' as CourseType },
        { name: 'Object-Oriented Programming', type: 'seminar' as CourseType }
      ]
    },
    {
      teacherName: 'Sophie Martin',
      courses: [
        { name: 'Mathematics for CS', type: 'seminar' as CourseType },
        { name: 'Discrete Mathematics', type: 'seminar' as CourseType }
      ]
    },
    {
      teacherName: 'Alex Wright',
      courses: [{ name: 'Senior Project', type: 'seminar' as CourseType }]
    }
  ]

  for (const assignment of assignments) {
    const teacher = teachers.find(
      (t) => `${t.first_name} ${t.last_name}` === assignment.teacherName
    )

    if (!teacher) {
      console.error(`❌ Teacher not found: ${assignment.teacherName}`)
      continue
    }

    for (const courseAssignment of assignment.courses) {
      const course = courses.find((c) => c.name === courseAssignment.name)
      if (!course) {
        console.error(`❌ Course not found: ${courseAssignment.name}`)
        continue
      }

      try {
        await window.api.teachers.assignCourse(teacher.id, course.id, courseAssignment.type)
        console.log(
          `✅ Assigned ${teacher.first_name} ${teacher.last_name} to ${course.name} (${courseAssignment.type})`
        )
      } catch (error) {
        console.error(
          `❌ Failed to assign teacher ${teacher.first_name} ${teacher.last_name} to course ${course.name}`,
          error
        )
      }
    }
  }
}
