import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { TransactionsTable } from './components/TransactionsTable'

function App() {
  return (
    <div className="min-h-screen bg-page">
      <Header />
      <main>
        <Hero />
        <TransactionsTable />
      </main>
    </div>
  )
}

export default App
