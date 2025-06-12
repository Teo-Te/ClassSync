// src/renderer/src/components/header.tsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu,
  Search,
  X,
  Home,
  Info,
  GraduationCap,
  Calendar,
  Users,
  BookOpen,
  Settings,
  Building
} from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@renderer/components/ui/sheet'
import { Link } from 'react-router-dom'
import electronLogo from '@renderer/assets/electron.svg'

const Header = () => {
  const [isOpen, setIsOpen] = useState(false)

  const navigationItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'About', path: '/about', icon: Info },
    { name: 'Classes', path: '/classes', icon: GraduationCap },
    { name: 'Schedule', path: '/schedule', icon: Calendar },
    { name: 'Teachers', path: '/teachers', icon: Users },
    { name: 'Courses', path: '/courses', icon: BookOpen },
    { name: 'Rooms', path: '/rooms', icon: Building },
    { name: 'Settings', path: '/settings', icon: Settings }
  ]

  return (
    <header
      id="start"
      className="w-full bg-black/90 border-b border-gray-800 flex items-center justify-between h-16 px-4"
    >
      {/* Logo and Title */}
      <div className="flex items-center gap-2">
        <img src={electronLogo} alt="ClassSync" className="w-8 h-8" />
        <motion.h1
          className="font-bold text-xl text-white"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          ClassSync
        </motion.h1>
      </div>

      <div className="max-w-md w-full px-4">
        <div className="relative">
          <p className="text-white text-center">
            The Automated Class Scheduling Tool for Universities
          </p>
        </div>
      </div>

      {/* Navigation */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="bg-black/95 border-gray-800 backdrop-blur-sm">
          <SheetHeader>
            <SheetTitle className="text-white flex items-center gap-2">
              <Menu className="w-5 h-5 text-lime-500" />
              Navigation
            </SheetTitle>
          </SheetHeader>
          <nav className="mt-8">
            <ul className="space-y-2">
              {navigationItems.map((item, index) => (
                <motion.li
                  key={item.path}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.2,
                    delay: 0.1 * index
                  }}
                >
                  <Link
                    to={item.path}
                    className="flex items-center gap-3 py-3 px-4 text-gray-300 hover:text-lime-400 hover:bg-white/5 transition-all duration-200 rounded-lg group"
                    onClick={() => setIsOpen(false)}
                  >
                    <item.icon className="w-5 h-5 text-gray-400 group-hover:text-lime-500 transition-colors" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </nav>

          {/* Footer in navigation */}
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <div className="w-6 h-6 bg-lime-500 rounded flex items-center justify-center">
                <Calendar className="w-3 h-3 text-black" />
              </div>
              <span>ClassSync v1.0</span>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}

export default Header
