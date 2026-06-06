// Verifies the features pulled into the main family tree (create-tree.html),
// the new whole-tree overview (big-tree.html), and the rail "whole tree" link.
// Uses the shared LOCAL_HOST; override with `--env baseHost=http://localhost:5000`.
import { LOCAL_HOST } from './utils'
const BASE = Cypress.env('baseHost') || LOCAL_HOST

// Stub the shared-tree API with the bundled sample family so the pages have a
// real multi-person tree to render (no backend/DB needed for the test).
function stubApi() {
  cy.readFile('examples/data/data.json').then((data) => {
    cy.intercept('GET', '/api/tree', data).as('getTree')
  })
  cy.intercept('PUT', '/api/tree', { statusCode: 200, body: { ok: true } }).as('putTree')
}

describe('Main family tree (builder)', () => {
  beforeEach(() => {
    stubApi()
    cy.visit(BASE + '/examples/create-tree.html')
    cy.get('.card_cont').should('have.length.at.least', 6)
  })

  it('has the v2/19 custom fields with native input types', () => {
    cy.get('form#familyForm').within(() => {
      // avatar is type=text (not url) so uploaded relative paths pass validation
      cy.get('input[name="avatar"]').should('have.attr', 'type', 'text')
      cy.get('input[name="death date"]').should('have.attr', 'type', 'date')
      cy.get('input[name="email"]').should('have.attr', 'type', 'email')
      cy.get('input[name="phone"]').should('have.attr', 'type', 'tel')
      cy.get('textarea[name="bio"]').should('exist')
      // marriage/divorce dates (rel_reference → date) for the main person's spouse
      cy.get('input[name^="marriage date__ref__"]').should('have.attr', 'type', 'date')
      cy.get('input[name^="divorce date__ref__"]').should('have.attr', 'type', 'date')
    })
  })

  it('shows the birthday in the card label (v2/5 custom text)', () => {
    cy.contains('.card-label', 'b. 1970').should('exist')
  })

  it('renders the v2/8 hover action buttons on cards', () => {
    cy.get('.f3-card-action-edit').should('exist')
    cy.get('.f3-card-action-add').should('exist')
  })

  it('has a whole-tree rail link below the menu button', () => {
    cy.get('.f3-gallery-rail-btn').should('have.length', 2)
    cy.get('.f3-gallery-rail-btn[title="See the whole tree"]').should('exist')
  })

  it('captures a screenshot of the builder', () => {
    cy.wait(1400)
    cy.screenshot('builder-overview', { capture: 'viewport' })
  })
})

describe('Whole family tree (big-tree overview)', () => {
  beforeEach(() => {
    stubApi()
    cy.visit(BASE + '/examples/big-tree.html')
    cy.get('.card_cont').should('have.length.at.least', 6)
  })

  it('renders the whole tree and is reachable from the rail', () => {
    // on the big-tree page the rail link flips to "Back to the builder"
    cy.get('.f3-gallery-rail-btn[title="Back to the builder"]').should('exist')
  })

  it('shows every person at once (all 13 of the sample family)', () => {
    cy.wait(1200)
    cy.get('.card_cont').should('have.length.at.least', 13)
    cy.contains('#bt-count', 'Showing all 13').should('exist')
  })

  it('can re-focus then restore the whole tree with "Show everyone"', () => {
    cy.wait(1200)
    // focusing a leaf person renders fewer people...
    cy.contains('.card-label div', 'Carla').click()
    cy.wait(800)
    cy.get('#bt-count').should('not.contain', 'Showing all 13')
    // ...and "Show everyone" brings them all back
    cy.get('#bt-show-all').click()
    cy.wait(800)
    cy.contains('#bt-count', 'Showing all 13').should('exist')
  })

  it('can search for a person', () => {
    cy.get('#bt-search-input').type('Ben')
    cy.get('#bt-dropdown').should('be.visible')
    cy.contains('#bt-dropdown div', 'Ben').should('exist')
  })

  it('captures a screenshot of the whole tree', () => {
    cy.wait(1200)
    cy.screenshot('big-tree-overview', { capture: 'viewport' })
  })
})

describe('Rail navigation', () => {
  it('switches from the builder to the whole tree', () => {
    stubApi()
    cy.visit(BASE + '/examples/create-tree.html')
    cy.get('.card_cont').should('have.length.at.least', 6)
    cy.get('.f3-gallery-rail-btn[title="See the whole tree"]').click()
    cy.url().should('include', 'big-tree.html')
    cy.get('.card_cont').should('have.length.at.least', 6)
  })
})

describe('Child ordering (oldest on the left)', () => {
  // children listed in array order Mike(1990), Zara(1985), Anna(1995);
  // by birthday the left-to-right order should be Zara, Mike, Anna.
  const family = [
    { id: 'p1', data: { gender: 'M', 'first name': 'Dad' }, rels: { spouses: ['p2'], children: ['c1', 'c2', 'c3'] } },
    { id: 'p2', data: { gender: 'F', 'first name': 'Mom' }, rels: { spouses: ['p1'], children: ['c1', 'c2', 'c3'] } },
    { id: 'c1', data: { gender: 'M', 'first name': 'Mike', birthday: '1990' }, rels: { parents: ['p1', 'p2'] } },
    { id: 'c2', data: { gender: 'F', 'first name': 'Zara', birthday: '1985' }, rels: { parents: ['p1', 'p2'] } },
    { id: 'c3', data: { gender: 'F', 'first name': 'Anna', birthday: '1995' }, rels: { parents: ['p1', 'p2'] } },
  ]

  function childOrder() {
    return cy.get('.card_cont').then(($conts) => {
      return [...$conts]
        .map((c) => ({
          name: ((c.querySelector('.card-label div') || {}).textContent || '').trim(),
          left: c.getBoundingClientRect().left,
        }))
        .filter((k) => ['Mike', 'Zara', 'Anna'].includes(k.name))
        .sort((a, b) => a.left - b.left)
        .map((k) => k.name)
    })
  }

  it('orders children oldest-first left-to-right in the builder', () => {
    cy.intercept('GET', '/api/tree', family)
    cy.intercept('PUT', '/api/tree', { statusCode: 200, body: { ok: true } })
    cy.visit(BASE + '/examples/create-tree.html')
    cy.get('.card_cont').should('have.length.at.least', 5)
    cy.wait(1500)
    childOrder().should('deep.equal', ['Zara', 'Mike', 'Anna'])
  })

  it('orders children oldest-first in the whole-tree overview', () => {
    cy.intercept('GET', '/api/tree', family)
    cy.visit(BASE + '/examples/big-tree.html')
    cy.get('.card_cont').should('have.length.at.least', 5)
    cy.wait(1500)
    childOrder().should('deep.equal', ['Zara', 'Mike', 'Anna'])
  })
})
