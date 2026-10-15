// ==========================================================================
// Assistant Component
// Interactive portfolio query tool for officers and analysts.
// ==========================================================================

import { api } from '../api.js';

export const Assistant = {
  async init(app) {
    this.app = app;
    this.container = document.getElementById('view-assistant');
    await this.render();
    this.attachEvents();
  },

  async render() {
    this.container.innerHTML = `
      <div class="page-title-row">
        <div>
          <h2>Pulse Query Assistant</h2>
          <p class="page-subtitle">Ask direct questions about project delays, cost variances, or mitigation options</p>
        </div>
      </div>

      <div class="chat-container">
        <!-- Chat History -->
        <div class="chat-history" id="chat-messages">
          <div class="chat-bubble chat-bubble-bot">
            👋 <strong>Hello! I'm your portfolio assistant.</strong><br>
            You can ask me questions about any project, sector trends, delay factors, or recommended interventions. Try clicking one of the suggested questions below or type your own.
          </div>
        </div>

        <!-- Preset Chips -->
        <div class="chat-prompt-chips">
          <button class="chip-btn" data-query="Which railway projects have cost overrun above 500 Cr?">
            🚆 Railway overruns > ₹500 Cr
          </button>
          <button class="chip-btn" data-query="What is the current status and primary risk driver for project P10291?">
            ⭐ Status of P10291 (Freight Corridor)
          </button>
          <button class="chip-btn" data-query="What projects are currently facing high delay in Maharashtra?">
            📍 High delay projects in Maharashtra
          </button>
          <button class="chip-btn" data-query="What interventions work best for environmental and forest clearance delays?">
            🌲 Mitigating forest clearance delays
          </button>
        </div>

        <!-- Input Bar -->
        <form class="chat-input-bar" id="chat-form">
          <input type="text" class="chat-input" id="chat-query-input" placeholder="Ask a question about the infrastructure portfolio..." autocomplete="off" />
          <button type="submit" class="btn btn-primary" id="btn-send-query">
            Send Question
          </button>
        </form>
      </div>
    `;
  },

  attachEvents() {
    const form = document.getElementById('chat-form');
    const input = document.getElementById('chat-query-input');

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = input.value.trim();
      if (!q) return;
      this.sendQuery(q);
      input.value = '';
    });

    document.querySelectorAll('.chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const q = btn.getAttribute('data-query');
        if (q) this.sendQuery(q);
      });
    });
  },

  async sendQuery(query) {
    const history = document.getElementById('chat-messages');
    if (!history) return;

    // Append user message
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-bubble chat-bubble-user';
    userMsg.textContent = query;
    history.appendChild(userMsg);

    // Append loading bot message
    const botMsg = document.createElement('div');
    botMsg.className = 'chat-bubble chat-bubble-bot';
    botMsg.innerHTML = '<em>Searching portfolio records & calculating answer...</em>';
    history.appendChild(botMsg);
    history.scrollTop = history.scrollHeight;

    try {
      const res = await api.queryAssistant(query);
      botMsg.innerHTML = this.formatResponse(res.answer || res.response || 'No specific answer found.');
    } catch (err) {
      botMsg.innerHTML = `<span style="color: var(--danger);">Failed to query portfolio assistant: ${err.message}</span>`;
    } finally {
      history.scrollTop = history.scrollHeight;
    }
  },

  formatResponse(text) {
    // Simple conversion of basic markdown bold / line breaks
    let html = text
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
    return html;
  }
};
