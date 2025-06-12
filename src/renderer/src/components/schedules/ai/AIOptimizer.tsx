import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Sparkles,
  Wand2,
  AlertTriangle,
  CheckCircle,
  Loader2,
  TrendingUp,
  Settings
} from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { Badge } from '@renderer/components/ui/badge'
import { Progress } from '@renderer/components/ui/progress'
import { geminiService, ScheduleOptimizationRequest } from '@renderer/lib/ai/geminiService'
import { GeneratedSchedule, Teacher, Class, Room, Course } from '@shared/types/database'

interface AIOptimizerProps {
  schedule: GeneratedSchedule
  teachers: Teacher[]
  classes: Class[]
  rooms: Room[]
  courses: Course[]
  onScheduleOptimized: (optimizedSchedule: GeneratedSchedule) => void
}

export const AIOptimizer: React.FC<AIOptimizerProps> = ({
  schedule,
  teachers,
  classes,
  rooms,
  courses,
  onScheduleOptimized
}) => {
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizationResult, setOptimizationResult] = useState<any>(null)
  const [isAIAvailable, setIsAIAvailable] = useState(false)

  useEffect(() => {
    // Set context and check availability
    geminiService.setContext({ schedule, teachers, classes, rooms, courses })
    setIsAIAvailable(geminiService.isAvailable())
  }, [schedule, teachers, classes, rooms, courses])

  const handleOptimization = async (type: 'fix' | 'refine') => {
    if (!isAIAvailable) {
      alert('Please configure your Gemini API key in Settings first.')
      return
    }

    setIsOptimizing(true)
    setOptimizationResult(null)

    try {
      const request: ScheduleOptimizationRequest = {
        schedule,
        context: { schedule, teachers, classes, rooms, courses },
        optimizationType: type,
        specificIssues: schedule.conflicts.map((c) => c.message)
      }

      const result = await geminiService.optimizeSchedule(request)
      setOptimizationResult(result)

      if (result.success && result.optimizedSchedule) {
        onScheduleOptimized(result.optimizedSchedule)
      }
    } catch (error) {
      console.error('AI optimization failed:', error)
      setOptimizationResult({
        success: false,
        changes: {
          sessionsModified: 0,
          conflictsResolved: 0,
          improvementScore: 0,
          changesDescription: []
        },
        reasoning: 'Optimization failed. Please try again.',
        suggestions: ['Check your API key', 'Try again later']
      })
    } finally {
      setIsOptimizing(false)
    }
  }

  const hasConflicts = schedule.conflicts.length > 0
  const utilizationRate = schedule.metadata.utilizationRate

  return (
    <div className="space-y-6">
      {/* API Key Status */}
      {!isAIAvailable && (
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-yellow-400" />
              <div>
                <h4 className="text-yellow-300 font-medium">AI Not Available</h4>
                <p className="text-yellow-200/80 text-sm">
                  Configure your Gemini API key in Settings to enable AI optimization.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule Status */}
      <Card className="bg-black border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-lime-500" />
            Schedule Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white/70 text-sm">Conflicts</span>
                <Badge
                  className={
                    hasConflicts ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'
                  }
                >
                  {schedule.conflicts.length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70 text-sm">Quality Score</span>
                <Badge className="bg-lime-500/20 text-lime-300">{schedule.score}%</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white/70 text-sm">Room Utilization</span>
                <span className="text-white">{utilizationRate.toFixed(1)}%</span>
              </div>
              <Progress value={utilizationRate} className="h-2" />
            </div>
          </div>

          {schedule.metadata.aiOptimizationHistory &&
            schedule.metadata.aiOptimizationHistory.length > 0 && (
              <div className="pt-4 border-t border-white/20">
                <h4 className="text-white font-medium mb-2">AI Optimization History</h4>
                <div className="space-y-2">
                  {schedule.metadata.aiOptimizationHistory.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-white/70">
                        {entry.type === 'fix' ? 'Fixed' : 'Refined'} -{' '}
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                      <Badge className="bg-lime-500/20 text-lime-300">
                        {entry.conflictsResolved} conflicts resolved
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </CardContent>
      </Card>

      {/* AI Optimization Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Fix with AI */}
        <Card
          className={`border transition-all duration-200 ${
            hasConflicts
              ? 'bg-red-500/10 border-red-500/30 hover:border-red-500/50'
              : 'bg-white/5 border-white/20 hover:border-white/30'
          }`}
        >
          <CardContent className="p-6 text-center">
            <div
              className={`w-12 h-12 rounded-full ${
                hasConflicts ? 'bg-red-500/20' : 'bg-white/10'
              } flex items-center justify-center mx-auto mb-4`}
            >
              <AlertTriangle
                className={`w-6 h-6 ${hasConflicts ? 'text-red-400' : 'text-white/50'}`}
              />
            </div>
            <h3 className="text-white font-medium mb-2">Fix with AI</h3>
            <p className="text-white/70 text-sm mb-4">
              {hasConflicts
                ? 'Resolve scheduling conflicts using AI analysis'
                : 'No conflicts detected in current schedule'}
            </p>
            <Button
              onClick={() => handleOptimization('fix')}
              disabled={!isAIAvailable || isOptimizing || !hasConflicts}
              className="w-full bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
            >
              {isOptimizing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Fixing...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Fix Conflicts
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Refine with AI */}
        <Card className="bg-lime-500/10 border-lime-500/30 hover:border-lime-500/50 transition-all duration-200">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-lime-500/20 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-lime-400" />
            </div>
            <h3 className="text-white font-medium mb-2">Refine with AI</h3>
            <p className="text-white/70 text-sm mb-4">
              Optimize schedule for better efficiency and balance
            </p>
            <Button
              onClick={() => handleOptimization('refine')}
              disabled={!isAIAvailable || isOptimizing}
              className="w-full bg-lime-500 hover:bg-lime-600 text-black disabled:opacity-50"
            >
              {isOptimizing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Refining...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Refine Schedule
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Optimization Result */}
      {optimizationResult && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card
            className={`border ${
              optimizationResult.success
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}
          >
            <CardHeader>
              <CardTitle
                className={`flex items-center gap-2 ${
                  optimizationResult.success ? 'text-green-300' : 'text-red-300'
                }`}
              >
                {optimizationResult.success ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
                AI Optimization Result
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-white/80 leading-relaxed">{optimizationResult.reasoning}</p>

              {optimizationResult.success &&
                optimizationResult.changes.changesDescription.length > 0 && (
                  <div>
                    <h4 className="text-white font-medium mb-2">Changes Made:</h4>
                    <ul className="space-y-1">
                      {optimizationResult.changes.changesDescription.map(
                        (change: string, index: number) => (
                          <li key={index} className="text-white/80 text-sm flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                            {change}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

              {optimizationResult.suggestions.length > 0 && (
                <div>
                  <h4 className="text-white font-medium mb-2">Suggestions:</h4>
                  <ul className="space-y-1">
                    {optimizationResult.suggestions.map((suggestion: string, index: number) => (
                      <li key={index} className="text-white/70 text-sm">
                        • {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-4">
                {optimizationResult.changes.conflictsResolved > 0 && (
                  <Badge className="bg-green-500/20 text-green-300">
                    {optimizationResult.changes.conflictsResolved} conflicts resolved
                  </Badge>
                )}
                {optimizationResult.changes.sessionsModified > 0 && (
                  <Badge className="bg-blue-500/20 text-blue-300">
                    {optimizationResult.changes.sessionsModified} sessions modified
                  </Badge>
                )}
                {optimizationResult.changes.improvementScore > 0 && (
                  <Badge className="bg-lime-500/20 text-lime-300">
                    +{optimizationResult.changes.improvementScore}% score improvement
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
