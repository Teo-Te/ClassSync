// src/renderer/src/components/schedules/ai/AIChatbot.tsx
import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Bot,
  User,
  Clock,
  Calendar,
  Users,
  Building,
  BookOpen,
  Loader2,
  Sparkles,
  MessageSquare,
  Copy,
  Download,
  Minimize2,
  Maximize2,
  X
} from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Badge } from '@renderer/components/ui/badge'
import { geminiService, AIMessage } from '@renderer/lib/ai/geminiService'
import { GeneratedSchedule, Teacher, Class, Room, Course } from '@shared/types/database'

interface AIChatbotProps {
  isOpen: boolean
  onClose: () => void
  onToggleMinimize: () => void
  isMinimized: boolean
  schedule: GeneratedSchedule
  teachers: Teacher[]
  classes: Class[]
  rooms: Room[]
  courses: Course[]
}

const AIChatbot: React.FC<AIChatbotProps> = ({
  isOpen,
  onClose,
  onToggleMinimize,
  isMinimized,
  schedule,
  teachers,
  classes,
  rooms,
  courses
}) => {
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Quick action suggestions
  const quickActions = [
    {
      icon: Users,
      text: 'Show me teacher workloads',
      query: "Show me each teacher's workload and total hours"
    },
    {
      icon: Calendar,
      text: 'Weekly distribution',
      query: 'How are sessions distributed across the week?'
    },
    { icon: Building, text: 'Room utilization', query: 'Show me room utilization statistics' },
    {
      icon: BookOpen,
      text: 'Course overview',
      query: 'Give me an overview of all courses and their schedules'
    },
    {
      icon: Clock,
      text: 'Time conflicts',
      query: 'Are there any scheduling conflicts I should know about?'
    }
  ]

  useEffect(() => {
    if (isOpen && !isInitialized) {
      initializeChat()
    }
  }, [isOpen])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen, isMinimized])

  const initializeChat = async () => {
    // Set context using the individual props
    geminiService.setContext({ schedule, teachers, classes, rooms, courses })

    const welcomeMessage: AIMessage = {
      id: 'welcome',
      type: 'assistant',
      content: `Hello! I'm your ClassSync AI Assistant. I have access to your current schedule with ${schedule.sessions.length} sessions and can help you with:

🔍 **Schedule Analysis** - Find specific teacher, class, or room schedules
📊 **Statistics** - Get insights about workloads and utilization
⚠️ **Conflict Review** - Analyze and explain any scheduling issues
💡 **Optimization Tips** - Suggest improvements for your schedule

What would you like to know about your schedule?`,
      timestamp: new Date()
    }

    setMessages([welcomeMessage])
    setIsInitialized(true)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await geminiService.chatQuery(inputValue, messages)
      setMessages((prev) => [...prev, response])
    } catch (error) {
      const errorMessage: AIMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content:
          'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickAction = (query: string) => {
    setInputValue(query)
    setTimeout(() => handleSendMessage(), 100)
  }

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`fixed bottom-4 right-4 ${
        isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
      } bg-black border border-white/20 rounded-lg shadow-2xl z-50 overflow-hidden transition-all duration-300`}
    >
      <div className="flex flex-col h-full">
        {/* Header - Always visible */}
        <div className="p-4 border-b border-white/20 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-white font-medium">AI Assistant</h3>
              <p className="text-white/60 text-sm">Schedule Analysis & Support</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={onToggleMinimize}
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white p-2 h-8 w-8"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
            <Button
              onClick={onClose}
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white p-2 h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Quick Actions */}
            {messages.length <= 1 && (
              <div className="p-3 border-b border-white/10 flex-shrink-0">
                <p className="text-white/70 text-xs mb-2">Quick actions:</p>
                <div className="flex flex-wrap gap-1">
                  {quickActions.slice(0, 3).map((action, index) => (
                    <Button
                      key={index}
                      onClick={() => handleQuickAction(action.query)}
                      size="sm"
                      className="bg-white/5 hover:bg-white/10 text-white text-xs h-6"
                      disabled={isLoading}
                    >
                      <action.icon className="w-3 h-3 mr-1" />
                      {action.text}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages - Scrollable area */}
            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto p-4 space-y-4">
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.type === 'user'
                            ? 'bg-lime-500'
                            : 'bg-gradient-to-r from-purple-500 to-blue-500'
                        }`}
                      >
                        {message.type === 'user' ? (
                          <User className="w-4 h-4 text-black" />
                        ) : (
                          <Bot className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div className={`max-w-[80%] ${message.type === 'user' ? 'text-right' : ''}`}>
                        <div
                          className={`rounded-xl p-3 ${
                            message.type === 'user'
                              ? 'bg-lime-500 text-black'
                              : 'bg-white/10 text-white'
                          }`}
                        >
                          <div className="whitespace-pre-wrap text-sm leading-relaxed">
                            {message.content}
                          </div>
                        </div>
                        <div className="text-xs text-white/50 mt-1">
                          {formatTimestamp(message.timestamp)}
                        </div>
                        {message.type === 'assistant' && (
                          <Button
                            onClick={() => copyMessage(message.content)}
                            size="sm"
                            className="mt-1 bg-transparent hover:bg-white/10 text-white/50 p-1 h-6"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white/10 rounded-xl p-3">
                      <div className="flex items-center gap-2 text-white/70">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">AI is thinking...</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input - Fixed at bottom */}
            <div className="p-4 border-t border-white/20 flex-shrink-0">
              {!geminiService.isAvailable() ? (
                <div className="text-center">
                  <Badge className="bg-yellow-500/20 text-yellow-300">
                    Configure Gemini API key in Settings to enable AI chat
                  </Badge>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    placeholder="Ask about the schedule..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    className="bg-lime-500 hover:bg-lime-600 text-black"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}

export default AIChatbot
