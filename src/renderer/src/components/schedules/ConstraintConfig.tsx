import { useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Users, Building, BookOpen, Settings } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Switch } from '@renderer/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@renderer/components/ui/card'
import { ScheduleConstraints } from '@shared/types/database'

interface ConstraintConfigProps {
  constraints: ScheduleConstraints
  onConstraintsChange: (constraints: ScheduleConstraints) => void
  onGenerate: () => void
  generating: boolean
}

export const ConstraintConfig = ({
  constraints,
  onConstraintsChange,
  onGenerate,
  generating
}: ConstraintConfigProps) => {
  const updateConstraint = (key: keyof ScheduleConstraints, value: any) => {
    onConstraintsChange({
      ...constraints,
      [key]: value
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Time Constraints */}
      <Card className="bg-black border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-lime-500" />
            Time Constraints
          </CardTitle>
          <CardDescription className="text-white/70">
            Configure preferred and maximum time limits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Preferred Start Time</Label>
              <Input
                type="number"
                min="7"
                max="12"
                value={constraints.preferredStartTime}
                onChange={(e) => updateConstraint('preferredStartTime', Number(e.target.value))}
                className="bg-black border-white/30 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Preferred End Time</Label>
              <Input
                type="number"
                min="12"
                max="18"
                value={constraints.preferredEndTime}
                onChange={(e) => updateConstraint('preferredEndTime', Number(e.target.value))}
                className="bg-black border-white/30 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Maximum End Time</Label>
              <Input
                type="number"
                min="15"
                max="20"
                value={constraints.maxEndTime}
                onChange={(e) => updateConstraint('maxEndTime', Number(e.target.value))}
                className="bg-black border-white/30 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teacher Constraints */}
      <Card className="bg-black border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-lime-500" />
            Teacher Constraints
          </CardTitle>
          <CardDescription className="text-white/70">
            Configure teacher workload and scheduling preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Max Hours Per Day</Label>
              <Input
                type="number"
                min="2"
                max="8"
                value={constraints.maxTeacherHoursPerDay}
                onChange={(e) => updateConstraint('maxTeacherHoursPerDay', Number(e.target.value))}
                className="bg-black border-white/30 text-white"
              />
            </div>
            <div className="flex items-center justify-between p-4 border border-white/20 rounded">
              <div>
                <Label className="text-white">Avoid Back-to-Back Sessions</Label>
                <div className="text-white/70 text-sm">Prevent consecutive teaching sessions</div>
              </div>
              <Switch
                checked={constraints.avoidBackToBackSessions}
                onCheckedChange={(checked) => updateConstraint('avoidBackToBackSessions', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Room Constraints */}
      <Card className="bg-black border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Building className="w-5 h-5 text-lime-500" />
            Room Constraints
          </CardTitle>
          <CardDescription className="text-white/70">
            Configure room allocation preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border border-white/20 rounded">
              <div>
                <Label className="text-white">Use Auditoriums for Large Classes</Label>
                <div className="text-white/70 text-sm">Prioritize larger rooms for big classes</div>
              </div>
              <Switch
                checked={constraints.useAuditoriumsForLargeClasses}
                onCheckedChange={(checked) =>
                  updateConstraint('useAuditoriumsForLargeClasses', checked)
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Large Class Threshold</Label>
              <Input
                type="number"
                min="20"
                max="200"
                value={constraints.largeClassThreshold}
                onChange={(e) => updateConstraint('largeClassThreshold', Number(e.target.value))}
                className="bg-black border-white/30 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Constraints */}
      <Card className="bg-black border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-lime-500" />
            Session Constraints
          </CardTitle>
          <CardDescription className="text-white/70">
            Configure session duration and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Lecture Session Length (hours)</Label>
              <Input
                type="number"
                min="1"
                max="4"
                value={constraints.lectureSessionLength}
                onChange={(e) => updateConstraint('lectureSessionLength', Number(e.target.value))}
                className="bg-black border-white/30 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Seminar Session Length (hours)</Label>
              <Input
                type="number"
                min="1"
                max="4"
                value={constraints.seminarSessionLength}
                onChange={(e) => updateConstraint('seminarSessionLength', Number(e.target.value))}
                className="bg-black border-white/30 text-white"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-white/20 rounded">
              <div>
                <Label className="text-white">Avoid Splitting Sessions</Label>
                <div className="text-white/70 text-sm">Keep session hours together</div>
              </div>
              <Switch
                checked={constraints.avoidSplittingSessions}
                onCheckedChange={(checked) => updateConstraint('avoidSplittingSessions', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border border-white/20 rounded">
              <div>
                <Label className="text-white">Prioritize Morning Lectures</Label>
                <div className="text-white/70 text-sm">Schedule lectures in morning hours</div>
              </div>
              <Switch
                checked={constraints.prioritizeMorningLectures}
                onCheckedChange={(checked) =>
                  updateConstraint('prioritizeMorningLectures', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 border border-white/20 rounded">
              <div>
                <Label className="text-white">Group Same Course Classes</Label>
                <div className="text-white/70 text-sm">
                  Schedule same courses together when possible
                </div>
              </div>
              <Switch
                checked={constraints.groupSameCourseClasses}
                onCheckedChange={(checked) => updateConstraint('groupSameCourseClasses', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border border-white/20 rounded">
              <div>
                <Label className="text-white">Distribute Evenly Across Week</Label>
                <div className="text-white/70 text-sm">Balance schedule across all weekdays</div>
              </div>
              <Switch
                checked={constraints.distributeEvenlyAcrossWeek}
                onCheckedChange={(checked) =>
                  updateConstraint('distributeEvenlyAcrossWeek', checked)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generate Button */}
      <Button
        onClick={onGenerate}
        disabled={generating}
        className="w-full bg-lime-500 hover:bg-lime-600 text-black text-lg py-6"
      >
        {generating ? (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            Generating Schedule...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Generate Schedule
          </div>
        )}
      </Button>
    </motion.div>
  )
}
