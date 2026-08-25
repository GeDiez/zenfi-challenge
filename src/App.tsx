import { ExpensesPanel } from './components/ExpensesPanel'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { MonthStats } from './components/MonthStats'

function App() {
  return (
    <div className="min-h-screen bg-page">
      <Header />
      <main>
        <Hero />
        <MonthStats />
        {/* Everything from here down is scoped by the panel's filter row. */}
        <ExpensesPanel />
      </main>
    </div>
  )
}

export default App
