import { HashRouter, Routes, Route } from 'react-router-dom'
import Layout from './layouts/main'
import Home from './screens/Home'
import About from './screens/About'
import Classes from './screens/Classes'
import Schedule from './screens/Schedule'
import Settings from './screens/Settings'
import Teachers from './screens/Teachers'
import ClassDetails from './screens/ClassDetails'
import Courses from './screens/Courses'

function App(): React.JSX.Element {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/classes/:classId" element={<ClassDetails />} />
          <Route path="/teachers" element={<Teachers />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/about" element={<About />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </HashRouter>
  )
}

export default App
