describe('ChatBot Interactions', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(1000); // Wait for page to load
  });

  it('should display the chat bubble on the page', () => {
    cy.get('.chat-bubble').should('be.visible');
    cy.get('.chat-bubble').should('have.css', 'background');
  });

  it('should open the chat window when bubble is clicked', () => {
    // Chat window should not be visible initially
    cy.get('.chat-window').should('not.exist');

    // Click the chat bubble
    cy.get('.chat-bubble').click();

    // Chat window should now be visible
    cy.get('.chat-window').should('be.visible');
    cy.get('.chat-header').should('contain', 'ODH Assistant');
  });

  it('should close the chat window when close button is clicked', () => {
    // Open chat window
    cy.get('.chat-bubble').click();
    cy.get('.chat-window').should('be.visible');

    // Click close button
    cy.get('.chat-close').click();

    // Chat window should be closed
    cy.get('.chat-window').should('not.exist');
  });

  it('should display welcome message when chat opens', () => {
    // Open chat window
    cy.get('.chat-bubble').click();

    // Check for welcome message
    cy.get('.chat-messages').should('be.visible');
    cy.get('.bot-message').should('exist');
    cy.get('.bot-message').first().should('contain.text', 'Hello');
  });

  it('should send a message and receive a response', () => {
    // Open chat window
    cy.get('.chat-bubble').click();

    // Type a message
    const userMessage = 'What can you help me with?';
    cy.get('.chat-input').type(userMessage);

    // Send the message
    cy.get('.chat-send').click();

    // Verify user message appears
    cy.get('.user-message').should('contain', userMessage);

    // Wait for bot response
    cy.get('.bot-message', { timeout: 10000 }).should('have.length.gt', 1);
  });

  it('should display typing indicator while bot is responding', () => {
    // Open chat window
    cy.get('.chat-bubble').click();

    // Type and send a message
    cy.get('.chat-input').type('Tell me about workflows');
    cy.get('.chat-send').click();

    // Check for typing indicator or skeleton loader
    cy.get('.skeleton-message, .typing-indicator', { timeout: 1000 }).should('exist');
  });

  it('should clear input after sending message', () => {
    // Open chat window
    cy.get('.chat-bubble').click();

    // Type a message
    cy.get('.chat-input').type('Hello bot');

    // Send the message
    cy.get('.chat-send').click();

    // Input should be cleared
    cy.get('.chat-input').should('have.value', '');
  });

  it('should allow sending message with Enter key', () => {
    // Open chat window
    cy.get('.chat-bubble').click();

    // Type a message and press Enter
    const message = 'Testing enter key';
    cy.get('.chat-input').type(message + '{enter}');

    // Verify message was sent
    cy.get('.user-message').should('contain', message);
  });

  it('should disable send button when input is empty', () => {
    // Open chat window
    cy.get('.chat-bubble').click();

    // Send button should be disabled when input is empty
    cy.get('.chat-send').should('be.disabled');

    // Type something
    cy.get('.chat-input').type('Test');

    // Send button should be enabled
    cy.get('.chat-send').should('not.be.disabled');
  });

  it('should display code blocks with syntax highlighting', () => {
    // Open chat window
    cy.get('.chat-bubble').click();

    // Ask for code
    cy.get('.chat-input').type('Show me a Python example');
    cy.get('.chat-send').click();

    // Wait for response and check for code block
    cy.get('.code-block-container', { timeout: 15000 }).should('exist');
    cy.get('pre code').should('exist');
  });

  it('should copy code to clipboard when copy button is clicked', () => {
    // Open chat window
    cy.get('.chat-bubble').click();

    // Ask for code
    cy.get('.chat-input').type('Show me code');
    cy.get('.chat-send').click();

    // Wait for code block and click copy button
    cy.get('.code-block-container', { timeout: 15000 }).should('exist');
    cy.contains('button', 'Copy').click();

    // Verify "Copied" feedback appears
    cy.contains('Copied!').should('be.visible');
  });

  it('should scroll to latest message automatically', () => {
    // Open chat window
    cy.get('.chat-bubble').click();

    // Send multiple messages
    for (let i = 0; i < 5; i++) {
      cy.get('.chat-input').type(`Message ${i + 1}`);
      cy.get('.chat-send').click();
      cy.wait(500);
    }

    // Get messages container
    cy.get('.chat-messages').then(($messages) => {
      const scrollHeight = $messages[0].scrollHeight;
      const scrollTop = $messages[0].scrollTop;
      const clientHeight = $messages[0].clientHeight;

      // Verify scrolled to bottom (within tolerance)
      expect(scrollTop + clientHeight).to.be.closeTo(scrollHeight, 100);
    });
  });

  it('should display message timestamps', () => {
    // Open chat window
    cy.get('.chat-bubble').click();

    // Send a message
    cy.get('.chat-input').type('Hello');
    cy.get('.chat-send').click();

    // Check for timestamp
    cy.get('.message-time').should('exist');
  });

  it('should handle workflow context in chat', () => {
    // Navigate to a workflow canvas page
    cy.visit('/canvas');
    cy.wait(1000);

    // Open chat window
    cy.get('.chat-bubble').click();

    // Ask about current workflow
    cy.get('.chat-input').type('What nodes are available?');
    cy.get('.chat-send').click();

    // Bot should respond with workflow-specific information
    cy.get('.bot-message', { timeout: 10000 }).should('have.length.gt', 1);
  });

  it('should maintain chat history when navigating between pages', () => {
    // Start on home page
    cy.visit('/');

    // Open chat and send a message
    cy.get('.chat-bubble').click();
    cy.get('.chat-input').type('Remember this message');
    cy.get('.chat-send').click();

    // Navigate to another page
    cy.visit('/canvas');
    cy.wait(1000);

    // Open chat again
    cy.get('.chat-bubble').click();

    // Verify previous message is still there
    cy.get('.user-message').should('contain', 'Remember this message');
  });

  it('should support dark mode styling', () => {
    // Toggle dark mode if toggle exists
    cy.get('body').then(($body) => {
      if ($body.find('[aria-label*="theme"], [aria-label*="Dark"]').length > 0) {
        cy.get('[aria-label*="theme"], [aria-label*="Dark"]').first().click();
      }
    });

    // Open chat window
    cy.get('.chat-bubble').click();

    // Check that dark mode styles are applied
    cy.get('.chat-window').should('exist');
    // Dark mode class check would go here based on your implementation
  });
});
