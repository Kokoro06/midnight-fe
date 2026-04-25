import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Festival from './pages/Festival'
import Month from './pages/Month'
import Quiz from './pages/Quiz'
import Effect from './pages/Effect'
import Result from './pages/Result'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/festival" element={<Festival />} />
        <Route path="/month" element={<Month />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/effect" element={<Effect />} />
        <Route path="/result" element={<Result />} />
      </Routes>
    </BrowserRouter>
  )
}
