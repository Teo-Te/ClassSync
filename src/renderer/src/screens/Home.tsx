import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Calendar,
  Users,
  Building,
  GraduationCap,
  BookOpen,
  Clock,
  TrendingUp,
  Zap,
  ArrowRight,
  Plus,
  BarChart3,
  Settings,
  Star,
  Sparkles
} from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { Badge } from '@renderer/components/ui/badge'

const Home = () => {
  const [stats, setStats] = useState({
    teachers: 0,
    rooms: 0,
    classes: 0,
    courses: 0
  })
  const [isAIConfigured, setIsAIConfigured] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
    const checkAI = async () => {
      const apiKey = await window.api.settings.getSetting('gemini-api-key')
      if (apiKey) {
        setIsAIConfigured(!!apiKey)
      }
    }
    checkAI()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [teachers, rooms, classes, courses] = await Promise.all([
        window.api.teachers.getAll(),
        window.api.rooms.getAll(),
        window.api.classes.getAll(),
        window.api.courses.getAll()
      ])

      setStats({
        teachers: teachers.length,
        rooms: rooms.length,
        classes: classes.length,
        courses: courses.length
      })
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: 'Generate Schedule',
      description: 'Create optimized class schedules',
      icon: Calendar,
      color: 'lime',
      to: '/schedule#start',
      featured: true
    },
    {
      title: 'Manage Teachers',
      description: 'Add and edit teacher information',
      icon: Users,
      color: 'blue',
      to: '/teachers#start'
    },
    {
      title: 'Manage Classes',
      description: 'Set up student classes and groups',
      icon: GraduationCap,
      color: 'purple',
      to: '/classes#start'
    },
    {
      title: 'Manage Courses',
      description: 'Define courses and curricula',
      icon: BookOpen,
      color: 'orange',
      to: '/courses#start'
    },
    {
      title: 'Settings',
      description: 'Configure application preferences',
      icon: Settings,
      color: 'gray',
      to: '/settings#start'
    },
    {
      title: 'About',
      description: 'Learn more about ClassSync',
      icon: BarChart3,
      color: 'green',
      to: '/about#start'
    }
  ]

  const getColorClasses = (color: string) => {
    const colors = {
      lime: 'bg-lime-500 text-black hover:bg-lime-600',
      blue: 'bg-blue-500 text-white hover:bg-blue-600',
      green: 'bg-green-500 text-white hover:bg-green-600',
      purple: 'bg-purple-500 text-white hover:bg-purple-600',
      orange: 'bg-orange-500 text-white hover:bg-orange-600',
      gray: 'bg-gray-500 text-white hover:bg-gray-600'
    }
    return colors[color] || colors.gray
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-lime-500 rounded-lg mx-auto mb-4"></div>
          <div className="text-white">Loading dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {isAIConfigured && (
        <div className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">
          <Sparkles className="w-3 h-3" />
          AI Ready
        </div>
      )}
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-br from-lime-500/20 via-black to-purple-500/20 w-full"
      >
        <div className="absolute inset-0 opacity-50"></div>

        <div className="relative container mx-auto px-6 py-16">
          <div className="flex items-center justify-between">
            <div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-4 mb-6"
              >
                <div className="w-16 h-16 bg-lime-500 rounded-xl flex items-center justify-center shadow-2xl">
                  <Calendar className="w-8 h-8 text-black" />
                </div>
                <div>
                  <h1 className="text-5xl font-bold text-white mb-2">ClassSync</h1>
                  <p className="text-xl text-white/80">Intelligent University Scheduling</p>
                </div>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="text-white/70 text-lg max-w-2xl mb-8"
              >
                Streamline your academic scheduling with AI-powered optimization. Manage teachers,
                rooms, and classes with intelligent conflict resolution.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="flex gap-4"
              >
                <Button
                  asChild
                  className="bg-lime-500 hover:bg-lime-600 text-black font-semibold px-8 py-3 text-lg"
                >
                  <Link to="/schedule">
                    <Zap className="w-5 h-5 mr-2" />
                    Generate Schedule
                  </Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="container mx-auto px-6 py-12">
        {/* System Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-white mb-8">System Overview</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-black border-white/20 hover:border-blue-500/50 transition-colors duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Users className="w-10 h-10 text-blue-500" />
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                    Active
                  </Badge>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stats.teachers}</div>
                <div className="text-white/70">Teachers</div>
                <div className="text-blue-400 text-sm mt-2">+2 this week</div>
              </CardContent>
            </Card>

            <Card className="bg-black border-white/20 hover:border-green-500/50 transition-colors duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Building className="w-10 h-10 text-green-500" />
                  <Badge variant="secondary" className="bg-green-500/20 text-green-300">
                    Available
                  </Badge>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stats.rooms}</div>
                <div className="text-white/70">Rooms</div>
                <div className="text-green-400 text-sm mt-2">85% utilization</div>
              </CardContent>
            </Card>

            <Card className="bg-black border-white/20 hover:border-purple-500/50 transition-colors duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <GraduationCap className="w-10 h-10 text-purple-500" />
                  <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                    Enrolled
                  </Badge>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stats.classes}</div>
                <div className="text-white/70">Classes</div>
                <div className="text-purple-400 text-sm mt-2">~{stats.classes * 25} students</div>
              </CardContent>
            </Card>

            <Card className="bg-black border-white/20 hover:border-orange-500/50 transition-colors duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <BookOpen className="w-10 h-10 text-orange-500" />
                  <Badge variant="secondary" className="bg-orange-500/20 text-orange-300">
                    Configured
                  </Badge>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stats.courses}</div>
                <div className="text-white/70">Courses</div>
                <div className="text-orange-400 text-sm mt-2">Multi-level curriculum</div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="mb-12"
        >
          <div className="flex items-center justify-start mb-8">
            <h2 className="text-3xl font-bold text-white">Quick Actions</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 + index * 0.1 }}
              >
                <Card
                  className={`bg-black border-white/20 hover:border-${action.color}-500/50 transition-all duration-300 hover:scale-105 ${action.featured ? 'ring-2 ring-lime-500/30' : ''}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          action.color === 'lime'
                            ? 'bg-lime-500/20'
                            : action.color === 'blue'
                              ? 'bg-blue-500/20'
                              : action.color === 'green'
                                ? 'bg-green-500/20'
                                : action.color === 'purple'
                                  ? 'bg-purple-500/20'
                                  : action.color === 'orange'
                                    ? 'bg-orange-500/20'
                                    : 'bg-gray-500/20'
                        }`}
                      >
                        <action.icon
                          className={`w-6 h-6 ${
                            action.color === 'lime'
                              ? 'text-lime-400'
                              : action.color === 'blue'
                                ? 'text-blue-400'
                                : action.color === 'green'
                                  ? 'text-green-400'
                                  : action.color === 'purple'
                                    ? 'text-purple-400'
                                    : action.color === 'orange'
                                      ? 'text-orange-400'
                                      : 'text-gray-400'
                          }`}
                        />
                      </div>
                      {action.featured && (
                        <Badge className="bg-lime-500/20 text-lime-300">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>

                    <h3 className="text-xl font-semibold text-white mb-2">{action.title}</h3>
                    <p className="text-white/70 mb-4">{action.description}</p>

                    <Button asChild className={`w-full ${getColorClasses(action.color)}`}>
                      <Link to={action.to}>
                        <Plus className="w-4 h-4 mr-2" />
                        Get Started
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Home
