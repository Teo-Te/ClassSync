import Header from '@renderer/components/header'
import Footer from '@renderer/components/footer'
import { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
}

function Layout({ children }: LayoutProps): React.JSX.Element {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="min-h-screen">{children}</main>

      <Footer />
    </div>
  )
}

export default Layout
