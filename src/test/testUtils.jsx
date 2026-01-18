import { render } from '@testing-library/react'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import { AppStateProvider } from '../contexts/AppStateContext'

/**
 * Custom render function with all providers
 * @param {React.ReactElement} ui - Component to render
 * @param {Object} options - Render options
 * @param {string} options.route - Initial route (e.g., '/?qr=true&machine_id=TEST123')
 * @param {Object} options.initialState - Initial AppState
 * @param {Object} options.renderOptions - Additional render options
 * @returns {Object} Render result with all testing utilities
 */
export function renderWithProviders(
  ui,
  {
    route = '/',
    initialState = {},
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }) {
    return (
      <MemoryRouter initialEntries={[route]}>
        <AppStateProvider initialState={initialState}>
          {children}
        </AppStateProvider>
      </MemoryRouter>
    )
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions })
  }
}

// Re-export everything from React Testing Library
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
