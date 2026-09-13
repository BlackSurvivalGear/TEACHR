(() => {
  const launcher = document.getElementById('teachrChatLauncher');
  const panel = document.getElementById('teachrChatPanel');
  const close = document.getElementById('teachrChatClose');
  const minimise = document.getElementById('teachrChatMinimise');
  const newChat = document.getElementById('teachrChatNew');
  const form = document.getElementById('teachrChatForm');
  const input = document.getElementById('teachrChatInput');
  const messages = document.getElementById('teachrChatMessages');
  const welcome = document.getElementById('teachrChatWelcome');
  const prompts = [...document.querySelectorAll('[data-chat-prompt]')];
  if (!launcher || !panel || !form || !input || !messages) return;

  function openPanel() {
    panel.hidden = false;
    launcher.setAttribute('aria-expanded', 'true');
    input.focus();
  }

  function closePanel() {
    panel.hidden = true;
    launcher.setAttribute('aria-expanded', 'false');
    launcher.focus();
  }

  function resetChat() {
    messages.replaceChildren();
    welcome.hidden = false;
    input.value = '';
    input.focus();
  }

  function addUserMessage(text) {
    const bubble = document.createElement('div');
    bubble.className = 'teachr-chat-message user';
    bubble.textContent = text;
    messages.appendChild(bubble);
    welcome.hidden = true;
    messages.parentElement.scrollTop = messages.parentElement.scrollHeight;
  }

  function submitShellMessage(text) {
    const value = String(text || '').trim();
    if (!value) return;
    addUserMessage(value);
    input.value = '';
    // Stage 1 intentionally provides UI only. Stage 2 connects this action to TEACHR AI.
  }

  launcher.addEventListener('click', openPanel);
  close?.addEventListener('click', closePanel);
  minimise?.addEventListener('click', closePanel);
  newChat?.addEventListener('click', resetChat);
  prompts.forEach(button => button.addEventListener('click', () => {
    input.value = button.dataset.chatPrompt || button.textContent.trim();
    input.focus();
  }));
  form.addEventListener('submit', event => {
    event.preventDefault();
    submitShellMessage(input.value);
  });
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) closePanel();
  });

  window.TEACHR_CHAT_PANEL = Object.freeze({ open: openPanel, close: closePanel, reset: resetChat, stage: 1 });
})();