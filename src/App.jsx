import React from 'react'
import HowIgniteWorks from './components/HowIgniteWorks/HowIgniteWorks'
import BusinessValue from './components/BusinessValue/BusinessValue'
import Footer from './components/Footer/Footer'

function App() {
  return (
    <div className="app-layout">
      <main>
        <HowIgniteWorks />
        <BusinessValue />
      </main>
      <Footer />
    </div>
  )
}

export default App
