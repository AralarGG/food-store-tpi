import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'

export const MainLayout = () => (
  <div className="min-h-screen bg-stone-50 text-stone-900">
    <Navbar />
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Outlet />
    </main>
  </div>
)
