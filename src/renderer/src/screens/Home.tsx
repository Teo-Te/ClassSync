import Versions from '@renderer/components/Versions'
import electronLogo from '@renderer/assets/electron.svg'
import { Button } from '@renderer/components/ui/button'
import { Link } from 'react-router-dom'

const Home = () => {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  return (
    <div className="flex flex-col items-center justify-center">
      <img alt="logo" className="logo" src={electronLogo} />
      <div className="creator">Powered by electron-vite</div>
      <div className="text mb-4">
        Build an Electron app with <span className="react">React</span>
        &nbsp;and <span className="ts">TypeScript</span>
      </div>

      <div className="flex space-x-4 mb-4">
        <Button variant="default" asChild>
          <Link to="/about">About</Link>
        </Button>
        <Button variant="ghost" onClick={ipcHandle}>
          Send IPC
        </Button>
      </div>

      <p className="tip">
        Please try pressing <code>F12</code> to open the devTool
      </p>
      <Versions />
    </div>
  )
}
export default Home
