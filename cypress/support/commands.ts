/// <reference types="cypress" />

// Custom commands for the application

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to drag and drop a node onto the workflow canvas
       * @example cy.dragNodeToCanvas('Data Source', 100, 100)
       */
      dragNodeToCanvas(nodeType: string, x: number, y: number): Chainable<void>;
    }
  }
}

Cypress.Commands.add('dragNodeToCanvas', (nodeType: string, x: number, y: number) => {
  cy.contains('.node-type', nodeType)
    .trigger('dragstart')
    .then(() => {
      cy.get('.workflow-canvas')
        .trigger('drop', { clientX: x, clientY: y })
        .trigger('dragend');
    });
});

export {};
