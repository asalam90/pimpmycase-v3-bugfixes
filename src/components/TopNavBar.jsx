import { useState } from 'react'

const TopNavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleMenuClick = () => {
    setIsMenuOpen(!isMenuOpen)
    // Add menu functionality here
    console.log('Menu clicked')
  }

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '85px',
        backgroundColor: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        zIndex: 1000,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}
    >
      {/* Left Side - Menu Icon */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {/* Hamburger Menu Icon */}
        <button
          onClick={handleMenuClick}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            transition: 'transform 200ms ease-out'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
          }}
          aria-label="Menu"
        >
          <div style={{ width: '28px', height: '5px', backgroundColor: '#5d5d5d', borderRadius: '2px' }} />
          <div style={{ width: '28px', height: '5px', backgroundColor: '#5d5d5d', borderRadius: '2px' }} />
        </button>
      </div>

      {/* Center - Logo */}
      <div style={{
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        height: '100%'
      }}>
        <img
          src="/navbar logo.png"
          alt="Logo"
          style={{
            height: '60px',
            width: 'auto',
            objectFit: 'contain'
          }}
        />
      </div>

      {/* Right Side - Empty for balance */}
      <div style={{ width: '80px' }}></div>
    </nav>
  )
}

export default TopNavBar
