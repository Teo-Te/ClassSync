import { Heart, Code, Coffee, Battery, BatteryCharging } from 'lucide-react'
import electronLogo from '@renderer/assets/electron.svg'

const Footer = () => {
  return (
    <footer className="bg-black border-t border-white/10 py-8 mt-auto">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between">
          {/* Left side - Brand */}
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <img src={electronLogo} alt="Electron Logo" className="w-6 h-6" />
            <span className="text-white font-semibold">ClassSync</span>
          </div>

          {/* Center - Made with love */}
          <div className="flex items-center gap-2 text-white/60 text-sm mb-4 md:mb-0">
            <span>Made with</span>
            <BatteryCharging className="w-4 h-4 text-red-400 fill-current" />
            <span>and</span>
            <Coffee className="w-4 h-4 text-yellow-600" />
            <span>by Arteo Fejzo</span>
          </div>

          {/* Right side - Year */}
          <div className="text-white/40 text-sm">
            © {new Date().getFullYear()} ClassSync. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
