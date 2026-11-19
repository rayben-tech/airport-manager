import { Route, Routes } from 'react-router-dom'
import MobileLayout from './components/MobileLayout'
import Admin from './pages/Admin'
import AirportMap from './pages/AirportMap'
import Baggage from './pages/Baggage'
import FlightDetail from './pages/FlightDetail'
import FlightSearchForm from './pages/FlightSearchForm'
import Home from './pages/Home'
import MyFlights from './pages/MyFlights'
import Profile from './pages/Profile'
import SearchPage from './pages/SearchPage'
import Services from './pages/Services'
import Settings from './pages/Settings'

function App() {
  return (
    <Routes>
      <Route element={<MobileLayout />}>
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
      <Route path="/admin" element={<Admin />} />
    </Routes>
  )
}

export default App
