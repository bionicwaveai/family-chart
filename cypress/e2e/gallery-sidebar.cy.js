// Verifies the collapsible, icon-launched example gallery sidebar.
// Uses the shared LOCAL_HOST; override with `--env baseHost=http://localhost:5000`.
import { LOCAL_HOST } from './utils'
const BASE = Cypress.env('baseHost') || LOCAL_HOST
const URL = BASE + '/examples/htmls/v2/1-basic-tree.html'

describe('Gallery sidebar (collapsible)', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.visit(URL)
    cy.get('.card_cont').should('have.length.at.least', 1)  // chart still renders
  })

  it('is auto-hidden by default with a rail icon to open it', () => {
    cy.get('.f3-gallery-rail-btn').should('be.visible')
    cy.get('.f3-gallery-panel').should('not.have.class', 'open')
    cy.get('.f3-gallery-link').should('not.exist')
  })

  it('pops open and closes the menu via the rail icon', () => {
    cy.get('.f3-gallery-rail-btn').click()
    cy.get('.f3-gallery-panel').should('have.class', 'open')
    cy.get('.f3-gallery-link').should('be.visible').and('have.length.at.least', 5)

    cy.get('.f3-gallery-rail-btn').click()
    cy.get('.f3-gallery-panel').should('not.have.class', 'open')
    cy.get('.f3-gallery-link').should('not.exist')
  })

  it('remembers the open state across page navigation', () => {
    cy.get('.f3-gallery-rail-btn').click()
    cy.get('.f3-gallery-panel').should('have.class', 'open')
    cy.reload()
    cy.get('.f3-gallery-panel').should('have.class', 'open')
  })

  it('captures screenshots of the collapsed and open states', () => {
    cy.screenshot('gallery-collapsed', { capture: 'viewport' })
    cy.get('.f3-gallery-rail-btn').click()
    cy.wait(400)
    cy.screenshot('gallery-open', { capture: 'viewport' })
  })
})
