import Header from '@renderer/components/header'
import { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
}

function Layout({ children }: LayoutProps): React.JSX.Element {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="min-h-screen">{children}</main>

      <footer className="bg-gray-100 p-2 text-center text-sm text-gray-600 w-full">
        ClassSync © {new Date().getFullYear()}
      </footer>
    </div>
  )
}

export default Layout
