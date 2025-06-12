// src/renderer/src/screens/About.tsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Calendar,
  Users,
  Building,
  GraduationCap,
  BookOpen,
  Clock,
  Settings,
  Download,
  Zap,
  ChevronDown,
  ChevronUp,
  Info,
  Target,
  CheckCircle,
  ArrowRight,
  Github,
  Monitor,
  Database,
  FileText,
  MessageSquare
} from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { Badge } from '@renderer/components/ui/badge'

interface FAQItem {
  question: string
  answer: string
  category: 'getting-started' | 'features' | 'troubleshooting' | 'advanced'
}

const About = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const features = [
    {
      icon: Calendar,
      title: 'Smart Schedule Generation',
      description: 'Automatically generate optimized class schedules with conflict detection',
      color: 'lime'
    },
    {
      icon: Users,
      title: 'Teacher Management',
      description: 'Manage teachers, assign courses, and track teaching capabilities',
      color: 'blue'
    },
    {
      icon: Building,
      title: 'Room Management',
      description: 'Configure lecture and seminar rooms with capacity tracking',
      color: 'purple'
    },
    {
      icon: GraduationCap,
      title: 'Class Organization',
      description: 'Organize student classes by year and semester',
      color: 'green'
    },
    {
      icon: BookOpen,
      title: 'Course Curriculum',
      description: 'Define courses with lecture and seminar hour requirements',
      color: 'orange'
    },
    {
      icon: Download,
      title: 'Export Capabilities',
      description: 'Export schedules to PDF, Excel, CSV, and JSON formats',
      color: 'indigo'
    }
  ]

  const faqData: FAQItem[] = [
    // Getting Started
    {
      question: 'How do I get started with ClassSync?',
      answer:
        'Start by setting up your basic data: 1) Add teachers in the Teachers section, 2) Create courses in the Courses section, 3) Set up classes in the Classes section, 4) Configure rooms in Settings, 5) Assign courses to teachers and classes, then generate your first schedule!',
      category: 'getting-started'
    },
    {
      question: 'What data do I need before creating my first schedule?',
      answer:
        'You need: At least one teacher, one or more courses, at least one class, and configured rooms (both lecture and seminar rooms). You should also assign courses to teachers and classes before generating schedules.',
      category: 'getting-started'
    },
    {
      question: 'Can I use sample data to test the app?',
      answer:
        'Yes! Go to Settings and use the "Seed Sample Data" button to automatically populate your database with sample teachers, courses, classes, and room configurations for IT engineering.',
      category: 'getting-started'
    },

    // Features
    {
      question: 'How does the schedule generation algorithm work?',
      answer:
        'ClassSync uses an intelligent algorithm that considers teacher availability, room capacity, course requirements (lecture vs seminar), and time slot constraints to generate conflict-free schedules. It automatically handles room assignments and prevents scheduling conflicts.',
      category: 'features'
    },
    {
      question: 'What export formats are available?',
      answer:
        'You can export schedules in multiple formats: PDF (print-ready with professional formatting), Excel (multiple sheets for different views), CSV (for data analysis), and JSON (for technical integration). You can export complete schedules or filter by specific teachers, classes, or rooms.',
      category: 'features'
    },
    {
      question: 'How do I assign teachers to courses?',
      answer:
        'Go to the Teachers section, click on a teacher card, and select "Manage Courses". You can assign teachers to teach lectures only, seminars only, or both for each course. This helps the scheduler assign appropriate sessions.',
      category: 'features'
    },
    {
      question: 'What are lecture and seminar rooms?',
      answer:
        'Lecture rooms are typically larger spaces for theoretical instruction, while seminar rooms are smaller for interactive sessions. ClassSync automatically assigns the appropriate room type based on the session type (lecture vs seminar).',
      category: 'features'
    },
    {
      question: 'Can I save and load different schedules?',
      answer:
        'Yes! Once you generate a schedule, you can save it with a custom name. Use the "History" button to view, load, or delete previously saved schedules. This allows you to maintain multiple schedule versions.',
      category: 'features'
    },

    // Troubleshooting
    {
      question: 'Why am I getting scheduling conflicts?',
      answer:
        'Conflicts occur when there are insufficient resources (teachers, rooms, or time slots) for the required sessions. Check if: teachers are assigned to courses, enough rooms are configured, course hour requirements are reasonable, and there are sufficient time slots available.',
      category: 'troubleshooting'
    },
    {
      question: 'The schedule generation is not working. What should I check?',
      answer:
        'Ensure you have: 1) At least one teacher assigned to each course, 2) Courses assigned to classes, 3) Both lecture and seminar rooms configured, 4) Reasonable hour requirements for courses. Check the conflicts report if generation completes with issues.',
      category: 'troubleshooting'
    },
    {
      question: 'My exported PDF has formatting issues. How can I fix this?',
      answer:
        'PDF exports are optimized for standard paper sizes. If content appears cut off, try exporting specific teachers/classes/rooms instead of the complete schedule. For large datasets, consider using Excel export which handles extensive data better.',
      category: 'troubleshooting'
    },

    // Advanced
    {
      question: 'How do I modify course hour requirements?',
      answer:
        'In the Courses section, edit any course to adjust lecture hours, seminar hours, and total hours per week. The scheduler uses these values to determine how many sessions to create for each course.',
      category: 'advanced'
    },
    {
      question: 'Can I configure custom time slots?',
      answer:
        'Currently, ClassSync uses standard academic time slots (9-11, 11-13, 13-15, 15-17, 17-19). The system automatically distributes sessions across weekdays (Monday-Friday) based on course requirements.',
      category: 'advanced'
    },
    {
      question: 'How does the app handle different class years and semesters?',
      answer:
        'Classes are organized by year (1-4) and semester (1-2). When assigning courses to classes, you can specify which year and semester each course belongs to, allowing for proper curriculum organization.',
      category: 'advanced'
    },
    {
      question: 'What happens to schedules when I modify teachers or courses?',
      answer:
        "Existing saved schedules remain unchanged when you modify base data. However, you'll need to regenerate schedules to reflect any changes in teacher assignments, course hours, or room configurations.",
      category: 'advanced'
    }
  ]

  const categories = [
    { value: 'all', label: 'All Questions', icon: MessageSquare },
    { value: 'getting-started', label: 'Getting Started', icon: Target },
    { value: 'features', label: 'Features', icon: CheckCircle },
    { value: 'troubleshooting', label: 'Troubleshooting', icon: Settings },
    { value: 'advanced', label: 'Advanced', icon: Database }
  ]

  const filteredFAQ =
    selectedCategory === 'all'
      ? faqData
      : faqData.filter((item) => item.category === selectedCategory)

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index)
  }

  const getFeatureColorClasses = (color: string) => {
    const colorMap = {
      lime: 'text-lime-400 bg-lime-500/10 border-lime-500/20',
      blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      green: 'text-green-400 bg-green-500/10 border-green-500/20',
      orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
      indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
    }
    return colorMap[color as keyof typeof colorMap] || colorMap.lime
  }

  return (
    <div className="container mx-auto p-6 space-y-12 bg-black min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-16 h-16 bg-lime-500 rounded-xl flex items-center justify-center">
            <Calendar className="w-8 h-8 text-black" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white">ClassSync</h1>
            <p className="text-lime-400 text-lg">Smart Academic Schedule Management</p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          <p className="text-white/80 text-lg leading-relaxed">
            ClassSync is a powerful desktop application designed to automate and optimize academic
            schedule generation. Built for educational institutions, it intelligently manages
            teachers, courses, classes, and room assignments to create conflict-free schedules with
            professional export capabilities.
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 pt-4">
          <Badge className="bg-lime-500/20 text-lime-300 px-3 py-1">
            <Monitor className="w-4 h-4 mr-1" />
            Desktop App
          </Badge>
          <Badge className="bg-blue-500/20 text-blue-300 px-3 py-1">
            <Zap className="w-4 h-4 mr-1" />
            AI-Powered
          </Badge>
          <Badge className="bg-purple-500/20 text-purple-300 px-3 py-1">
            <FileText className="w-4 h-4 mr-1" />
            Multi-Export
          </Badge>
        </div>
      </motion.div>

      {/* Key Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-8"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Key Features</h2>
          <p className="text-white/70 max-w-2xl mx-auto">
            Comprehensive tools for managing every aspect of academic scheduling
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <Card className="bg-black border-white/20 hover:border-white/40 transition-all duration-300 h-full">
                <CardContent className="p-6">
                  <div
                    className={`w-12 h-12 rounded-lg ${getFeatureColorClasses(feature.color)} border flex items-center justify-center mb-4`}
                  >
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-white/70 text-sm leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* How It Works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-8"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
          <p className="text-white/70 max-w-2xl mx-auto">
            Simple workflow to get your schedules generated
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: 1,
              title: 'Setup Data',
              desc: 'Add teachers, courses, classes, and rooms',
              icon: Database,
              color: 'blue'
            },
            {
              step: 2,
              title: 'Make Assignments',
              desc: 'Assign courses to teachers and classes',
              icon: Users,
              color: 'green'
            },
            {
              step: 3,
              title: 'Generate Schedule',
              desc: 'Let AI create optimized schedules',
              icon: Zap,
              color: 'lime'
            },
            {
              step: 4,
              title: 'Export & Share',
              desc: 'Export in multiple formats',
              icon: Download,
              color: 'purple'
            }
          ].map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="text-center"
            >
              <div
                className={`w-16 h-16 mx-auto rounded-full ${getFeatureColorClasses(item.color)} border flex items-center justify-center mb-4 relative`}
              >
                <item.icon className="w-7 h-7" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-lime-500 text-black rounded-full flex items-center justify-center text-sm font-bold">
                  {item.step}
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-white/70 text-sm">{item.desc}</p>
              {index < 3 && (
                <ArrowRight className="w-5 h-5 text-white/30 mx-auto mt-4 hidden lg:block" />
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* FAQ Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="space-y-8"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Frequently Asked Questions</h2>
          <p className="text-white/70 max-w-2xl mx-auto">
            Everything you need to know about using ClassSync effectively
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((category) => (
            <Button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`${
                selectedCategory === category.value
                  ? 'bg-lime-500 text-black'
                  : 'bg-white/10 text-white hover:bg-white/20'
              } transition-all duration-200`}
            >
              <category.icon className="w-4 h-4 mr-2" />
              {category.label}
            </Button>
          ))}
        </div>

        {/* FAQ Items */}
        <div className="max-w-4xl mx-auto space-y-4">
          {filteredFAQ.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-black border-white/20 hover:border-white/30 transition-all duration-200">
                <CardContent className="p-0">
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full p-6 text-left hover:bg-white/5 transition-colors duration-200 flex items-center justify-between"
                  >
                    <h3 className="text-white font-medium pr-4">{item.question}</h3>
                    {openFAQ === index ? (
                      <ChevronUp className="w-5 h-5 text-lime-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-white/50 flex-shrink-0" />
                    )}
                  </button>

                  {openFAQ === index && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-6 pb-6"
                    >
                      <div className="pt-4 border-t border-white/10">
                        <p className="text-white/80 leading-relaxed">{item.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Technical Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="space-y-8"
      >
        <Card className="bg-black border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Info className="w-5 h-5 text-lime-500" />
              Technical Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-white font-medium">Application Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/70">Version:</span>
                    <span className="text-lime-400">v1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Platform:</span>
                    <span className="text-white">Electron + React</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Database:</span>
                    <span className="text-white">SQLite</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Export Formats:</span>
                    <span className="text-white">PDF, Excel, CSV, JSON</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-white font-medium">Developer</h4>
                <div className="space-y-3">
                  <div className="text-white/70">
                    <div className="font-medium text-white mb-1">Arteo Fejzo</div>
                    <div className="text-sm">Full-stack developer</div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-white/10 hover:bg-white/20 text-white"
                    onClick={() => window.open('https://github.com/Teo-Te', '_blank')}
                  >
                    <Github className="w-4 h-4 mr-2" />
                    GitHub Profile
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default About
