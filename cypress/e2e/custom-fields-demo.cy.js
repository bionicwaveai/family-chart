// Verification spec for the custom-fields family tree demo and the new
// native form field types. Uses the shared LOCAL_HOST like the other specs;
// override with `--env baseHost=http://localhost:5000` to target the Vite dev server.
import { LOCAL_HOST } from './utils'
const BASE = Cypress.env('baseHost') || LOCAL_HOST
const URL = BASE + '/examples/htmls/v2/19-family-tree-custom-fields.html'

describe('Family tree with custom fields', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.visit(URL)
    cy.get('.card_cont').should('have.length.at.least', 6)
  })

  it('renders native input types in the edit form', () => {
    // form opens on the main person (James) in edit mode
    cy.get('form#familyForm').within(() => {
      cy.get('input[name="birth date"]').should('have.attr', 'type', 'date')
      cy.get('input[name="death date"]').should('have.attr', 'type', 'date')
      cy.get('input[name="avatar"]').should('have.attr', 'type', 'url')
      cy.get('input[name="website"]').should('have.attr', 'type', 'url')
      cy.get('input[name="email"]').should('have.attr', 'type', 'email')
      cy.get('input[name="phone"]').should('have.attr', 'type', 'tel')
      cy.get('textarea[name="bio"]').should('exist')
      // marriage / divorce dates are spouse-scoped rel_reference fields rendered as date inputs
      cy.get('input[name^="marriage date__ref__"]').should('have.attr', 'type', 'date')
      cy.get('input[name^="divorce date__ref__"]').should('have.attr', 'type', 'date')
    })
  })

  it('shows clickable links for url fields in the read-only info view', () => {
    // toggle to the read-only info view via the pencil button
    cy.get('.f3-edit-btn').click()
    cy.get('.f3-info-field-value a[target="_blank"]')
      .should('exist')
      .and('have.attr', 'href')
      .and('match', /^https?:\/\//)
  })

  it('persists edits to localStorage', () => {
    cy.get('input[name="occupation"]').clear().type('Master Architect')
    cy.get('form#familyForm button[type="submit"]').click()
    cy.window().then((win) => {
      const saved = JSON.parse(win.localStorage.getItem('f3-custom-fields-demo'))
      const james = saved.find((d) => d.id === 'james')
      expect(james.data.occupation).to.eq('Master Architect')
    })
  })

  it('can add a new person via the toolbar', () => {
    cy.get('#demo-add').click()
    // entering "add relative" mode renders "Add Father/Mother/Spouse/..." placeholder cards
    cy.get('.card-new-rel', { timeout: 6000 }).should('have.length.at.least', 1)
  })

  it('captures screenshots of the tree and the edit form', () => {
    // tall viewport so the whole edit form (with every custom field) is visible at once
    cy.viewport(1500, 1650)
    cy.wait(1600)  // let the initial layout transition settle
    cy.screenshot('custom-fields-overview', { capture: 'viewport' })  // tree + edit form

    // the read-only info view with formatted dates and clickable links
    cy.get('.f3-edit-btn').click()
    cy.wait(300)
    cy.screenshot('custom-fields-info', { capture: 'viewport' })

    // close the form to show the full tree
    cy.get('.f3-close-btn').click()
    cy.viewport(1500, 820)
    cy.wait(1200)
    cy.screenshot('custom-fields-tree', { capture: 'viewport' })
  })
})
