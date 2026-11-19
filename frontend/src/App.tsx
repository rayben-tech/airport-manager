import { Route, Routes } from 'react-router-dom'
import AuthProvider from './components/AuthProvider'
import MobileLayout from './components/MobileLayout'
import RequireAuth from './components/RequireAuth'
import Admin from './pages/Admin'
import AirportMap from './pages/AirportMap'
import Baggage from './pages/Baggage'
import FlightDetail from './pages/FlightDetail'
import FlightSearchForm from './pages/FlightSearchForm'
import Home from './pages/Home'
import Login from './pages/Login'
import MyFlights from './pages/MyFlights'
import Profile from './pages/Profile'
import SearchPage from './pages/SearchPage'
import Services from './pages/Services'
import Settings from './pages/Settings'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<MobileLayout />}>
          <Route path="/login" element={<Login />} />
          <Route element={<RequireAuth />}>
            <Route path="/" element={<Home />} />
            <Route path="/recherche-vol" element={<FlightSearchForm />} />
            <Route path="/vols" element={<MyFlights />} />
            <Route path="/vols/:id" element={<FlightDetail />} />
            <Route path="/carte" element={<AirportMap />} />
            <Route path="/bagages" element={<Baggage />} />
            <Route path="/services" element={<Services />} />
            <Route path="/profil" element={<Profile />} />
            <Route path="/parametres" element={<Settings />} />
            <Route path="/recherche" element={<SearchPage />} />
          </Route>
        </Route>
        <Route element={<RequireAuth role="admin" />}>
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
