// src/renderer/src/components/schedules/ai/AISettings.tsx
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Key, Eye, EyeOff, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { Badge } from '@renderer/components/ui/badge'
import { geminiService } from '@renderer/lib/ai/geminiService'

interface AISettingsProps {
  onClose: () => void
}

const AISettings: React.FC<AISettingsProps> = ({ onClose }) => {
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [savedSuccessfully, setSavedSuccessfully] = useState(false)

  useEffect(() => {
    loadCurrentApiKey()
  }, [])

  const testConnection = async () => {
    if (!apiKey.trim()) {
      setConnectionStatus('error')
      return
    }

    setIsTestingConnection(true)
    setConnectionStatus('idle')

    try {
      // Save using the correct API
      await window.api.settings.setSetting('gemini-api-key', apiKey.trim())

      // Refresh geminiService to pick up the new API key
      await geminiService.refreshApiKey()

      // Test the connection with a simple query
      const testResponse = await geminiService.chatQuery(
        'Hello, can you respond with just "OK" to test the connection?',
        [] // empty history for test
      )

      if (
        testResponse.content.toLowerCase().includes('ok') ||
        testResponse.content.toLowerCase().includes('hello')
      ) {
        setConnectionStatus('success')
      } else {
        setConnectionStatus('error')
      }
    } catch (error) {
      console.error('Connection test failed:', error)
      setConnectionStatus('error')
    } finally {
      setIsTestingConnection(false)
    }
  }

  const loadCurrentApiKey = async () => {
    try {
      const currentKey = await window.api.settings.getSetting('gemini-api-key')
      if (currentKey) {
        setApiKey(currentKey)
        setConnectionStatus('success')
      }
    } catch (error) {
      console.error('Failed to load API key:', error)
    }
  }

  const saveApiKey = async () => {
    try {
      // Use the correct API consistently
      await window.api.settings.setSetting('gemini-api-key', apiKey.trim())

      // Refresh geminiService
      await geminiService.refreshApiKey()

      setSavedSuccessfully(true)
      setTimeout(() => setSavedSuccessfully(false), 3000)
    } catch (error) {
      console.error('Failed to save API key:', error)
    }
  }

  const removeApiKey = async () => {
    try {
      await window.api.settings.removeSetting('gemini-api-key')
      setApiKey('')
      setConnectionStatus('idle')
    } catch (error) {
      console.error('Failed to remove API key:', error)
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* API Key Configuration */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-purple-400" />
            <h3 className="text-white font-medium">Gemini API Key</h3>
          </div>
          <Badge
            className={`${
              connectionStatus === 'success'
                ? 'bg-green-500/20 text-green-300'
                : connectionStatus === 'error'
                  ? 'bg-red-500/20 text-red-300'
                  : 'bg-white/10 text-white/70'
            }`}
          >
            {connectionStatus === 'success' ? (
              <>
                <CheckCircle className="w-3 h-3 mr-1" />
                Connected
              </>
            ) : connectionStatus === 'error' ? (
              <>
                <AlertCircle className="w-3 h-3 mr-1" />
                Error
              </>
            ) : (
              'Not Configured'
            )}
          </Badge>
        </div>

        <div className="space-y-2">
          <Label className="text-white">API Key</Label>
          <div className="relative">
            <Input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Google Gemini API key..."
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 pr-12"
            />
            <Button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent hover:bg-white/10 text-white/70 p-1 h-auto"
            >
              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={testConnection}
            disabled={!apiKey.trim() || isTestingConnection}
            size="sm"
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            {isTestingConnection ? 'Testing...' : 'Test Connection'}
          </Button>

          <Button
            onClick={saveApiKey}
            disabled={!apiKey.trim()}
            size="sm"
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            {savedSuccessfully ? (
              <>
                <CheckCircle className="w-4 h-4 mr-1" />
                Saved!
              </>
            ) : (
              'Save Key'
            )}
          </Button>

          {apiKey && (
            <Button
              onClick={removeApiKey}
              size="sm"
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Remove Key
            </Button>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="border-t border-white/20 pt-4">
        <h4 className="text-white font-medium mb-3">How to Get Your API Key</h4>
        <div className="space-y-2 text-white/80 text-sm mb-4">
          <p>1. Visit the Google AI Studio website</p>
          <p>2. Sign in with your Google account</p>
          <p>3. Create a new API key for Gemini</p>
          <p>4. Copy the API key and paste it above</p>
          <p>5. Test the connection to verify it works</p>
        </div>

        <Button
          onClick={() => window.open('https://aistudio.google.com/app/apikey', '_blank')}
          size="sm"
          className="bg-white/10 hover:bg-white/20 text-white"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Open Google AI Studio
        </Button>
      </div>

      {/* Features Info */}
      <div className="border-t border-white/20 pt-4">
        <h4 className="text-white font-medium mb-3">AI Features</h4>
        <div className="space-y-2 text-white/80 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span>Schedule optimization and conflict resolution</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span>Interactive chatbot for schedule queries</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span>Intelligent analysis and recommendations</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span>Data-driven insights and statistics</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AISettings
