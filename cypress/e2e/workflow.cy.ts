describe('Workflow Canvas - Creation and Execution', () => {
  beforeEach(() => {
    cy.visit('/canvas');
    cy.wait(1000); // Wait for page to load
  });

  it('should load the workflow canvas page', () => {
    cy.contains('Workflow Canvas').should('be.visible');
    cy.get('.workflow-canvas').should('exist');
    cy.get('.node-panel').should('be.visible');
  });

  it('should display available node types in the left panel', () => {
    cy.get('.node-panel').within(() => {
      cy.contains('Available Nodes').should('be.visible');
      cy.contains('Data Source').should('be.visible');
      cy.contains('Data Processing').should('be.visible');
      cy.contains('Model Training').should('be.visible');
      cy.contains('Model Deployment').should('be.visible');
    });
  });

  it('should add a node to the canvas via drag and drop', () => {
    // Get initial node count
    cy.get('.workflow-node').should('have.length', 0);

    // Drag a Data Source node onto the canvas
    cy.contains('.node-type', 'Data Source')
      .trigger('dragstart');

    cy.get('.workflow-canvas')
      .trigger('drop', { clientX: 400, clientY: 300 })
      .trigger('dragend');

    // Verify node was added
    cy.get('.workflow-node').should('have.length', 1);
    cy.get('.workflow-node').first().should('contain', 'Data Source');
  });

  it('should add multiple nodes to the canvas', () => {
    // Add Data Source node
    cy.contains('.node-type', 'Data Source')
      .trigger('dragstart');
    cy.get('.workflow-canvas')
      .trigger('drop', { clientX: 300, clientY: 200 });

    // Add Data Processing node
    cy.contains('.node-type', 'Data Processing')
      .trigger('dragstart');
    cy.get('.workflow-canvas')
      .trigger('drop', { clientX: 500, clientY: 200 });

    // Add Model Training node
    cy.contains('.node-type', 'Model Training')
      .trigger('dragstart');
    cy.get('.workflow-canvas')
      .trigger('drop', { clientX: 700, clientY: 200 });

    // Verify all nodes were added
    cy.get('.workflow-node').should('have.length', 3);
  });

  it('should select a node when clicked', () => {
    // Add a node first
    cy.contains('.node-type', 'Data Source')
      .trigger('dragstart');
    cy.get('.workflow-canvas')
      .trigger('drop', { clientX: 400, clientY: 300 });

    // Click the node to select it
    cy.get('.workflow-node').first().click();
    cy.get('.workflow-node').first().should('have.class', 'selected');
  });

  it('should delete a node when delete button is clicked', () => {
    // Add a node
    cy.contains('.node-type', 'Data Source')
      .trigger('dragstart');
    cy.get('.workflow-canvas')
      .trigger('drop', { clientX: 400, clientY: 300 });

    cy.get('.workflow-node').should('have.length', 1);

    // Hover over the node to reveal action bubbles
    cy.get('.workflow-node').first().trigger('mouseover');

    // Click delete button (if visible)
    cy.get('.node-delete').first().click({ force: true });

    // Verify node was deleted
    cy.get('.workflow-node').should('have.length', 0);
  });

  it('should create a connection between two nodes', () => {
    // Add two nodes
    cy.contains('.node-type', 'Data Source')
      .trigger('dragstart');
    cy.get('.workflow-canvas')
      .trigger('drop', { clientX: 300, clientY: 300 });

    cy.contains('.node-type', 'Data Processing')
      .trigger('dragstart');
    cy.get('.workflow-canvas')
      .trigger('drop', { clientX: 600, clientY: 300 });

    // Get initial connection count
    cy.get('svg line, svg path').then(($connections) => {
      const initialCount = $connections.length;

      // Click output connector of first node
      cy.get('.workflow-node').first()
        .find('.connector-output')
        .click({ force: true });

      // Click input connector of second node
      cy.get('.workflow-node').eq(1)
        .find('.connector-input')
        .click({ force: true });

      // Verify connection was created
      cy.get('svg line, svg path').should('have.length.gt', initialCount);
    });
  });

  it('should execute the workflow', () => {
    // Add nodes and create a simple workflow
    cy.contains('.node-type', 'Data Source')
      .trigger('dragstart');
    cy.get('.workflow-canvas')
      .trigger('drop', { clientX: 300, clientY: 300 });

    cy.contains('.node-type', 'Data Processing')
      .trigger('dragstart');
    cy.get('.workflow-canvas')
      .trigger('drop', { clientX: 600, clientY: 300 });

    // Find and click the Execute button
    cy.contains('button', 'Execute').click();

    // Verify execution started (nodes should have executing class)
    cy.get('.workflow-node.executing', { timeout: 10000 }).should('exist');
  });

  it('should use keyboard shortcut to delete selected node', () => {
    // Add a node
    cy.contains('.node-type', 'Data Source')
      .trigger('dragstart');
    cy.get('.workflow-canvas')
      .trigger('drop', { clientX: 400, clientY: 300 });

    // Select the node
    cy.get('.workflow-node').first().click();
    cy.get('.workflow-node').should('have.class', 'selected');

    // Press Delete key
    cy.get('body').type('{del}');

    // Verify node was deleted
    cy.get('.workflow-node').should('have.length', 0);
  });

  it('should duplicate a node using keyboard shortcut', () => {
    // Add a node
    cy.contains('.node-type', 'Data Source')
      .trigger('dragstart');
    cy.get('.workflow-canvas')
      .trigger('drop', { clientX: 400, clientY: 300 });

    // Select the node
    cy.get('.workflow-node').first().click();

    // Press Ctrl+D (or Cmd+D on Mac)
    cy.get('body').type('{ctrl}d');

    // Verify node was duplicated
    cy.get('.workflow-node').should('have.length', 2);
  });

  it('should clear the canvas', () => {
    // Add multiple nodes
    cy.contains('.node-type', 'Data Source')
      .trigger('dragstart');
    cy.get('.workflow-canvas')
      .trigger('drop', { clientX: 300, clientY: 300 });

    cy.contains('.node-type', 'Data Processing')
      .trigger('dragstart');
    cy.get('.workflow-canvas')
      .trigger('drop', { clientX: 600, clientY: 300 });

    cy.get('.workflow-node').should('have.length', 2);

    // Click Clear button
    cy.contains('button', 'Clear').click();

    // Verify canvas was cleared
    cy.get('.workflow-node').should('have.length', 0);
  });

  it('should load a workflow template', () => {
    // Click Templates button
    cy.contains('button', 'Templates').click();

    // Select a template from the modal
    cy.get('.pf-v6-c-modal-box').should('be.visible');
    cy.contains('ML Pipeline').should('be.visible');

    // Click on a template card
    cy.contains('.pf-v6-c-card', 'ML Pipeline').click();

    // Verify nodes were loaded from template
    cy.get('.workflow-node').should('have.length.gt', 0);
  });
});
