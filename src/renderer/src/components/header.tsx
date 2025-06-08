import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, Search, X } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
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

  return (
    <header className="w-full bg-gray-900 border-b border-gray-800 flex items-center justify-between h-16 px-4">
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

      {/* Search Bar */}
      <div className="max-w-md w-full px-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search..."
            className="pl-8 bg-gray-800 border-gray-700 focus:border-lime-500"
          />
        </div>
      </div>

      {/* Navigation */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="text-white">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="bg-gray-800 border-gray-900">
          <SheetHeader>
            <SheetTitle className="text-white">Navigation</SheetTitle>
          </SheetHeader>
          <nav className="mt-8">
            <ul className="space-y-4">
              {[
                { name: 'Home', path: '/' },
                { name: 'About', path: '/about' },
                { name: 'Classes', path: '/classes' },
                { name: 'Schedule', path: '/schedule' },
                { name: 'Teachers', path: '/teachers' },
                { name: 'Settings', path: '/settings' }
              ].map((item, index) => (
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
                    className="block py-2 px-4 text-gray-300 hover:text-lime-500 transition-colors rounded-md hover:bg-gray-700"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.name}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  )
}

export default Header
