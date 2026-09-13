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
  const send = form?.querySelector('.teachr-chat-send');
  const note = document.querySelector('.teachr-chat-note');
  const prompts = [...document.querySelectorAll('[data-chat-prompt]')];
  if (!launcher || !panel || !form || !input || !messages || !send) return;

  const history = [];
  let controller = null;

  function openPanel() {
    if (document.documentElement.dataset.auth !== 'signed-in') return;
    panel.hidden = false;
    launcher.setAttribute('aria-expanded', 'true');
    input.focus();
  }

  function closePanel() {
    panel.hidden = true;
    launcher.setAttribute('aria-expanded', 'false');
    launcher.focus();
  }

  function setBusy(busy) {
    input.disabled = busy;
    send.disabled = busy;
    prompts.forEach(button => { button.disabled = busy; });
    if (busy) {
      send.textContent = 'Stop';
      send.disabled = false;
      send.dataset.mode = 'stop';
      if (note) note.textContent = 'TEACHR is thinking…';
    } else {
      send.textContent = 'Send';
      send.dataset.mode = 'send';
      if (note) note.textContent = 'AI assists. The teacher teaches.';
    }
  }

  function resetChat() {
    controller?.abort();
    controller = null;
    history.length = 0;
    messages.replaceChildren();
    welcome.hidden = false;
    input.value = '';
    setBusy(false);
    input.focus();
  }

  function addMessage(role, text, extraClass = '') {
    const bubble = document.createElement('div');
    bubble.className = `teachr-chat-message ${role}${extraClass ? ` ${extraClass}` : ''}`;
    bubble.textContent = text;
    messages.appendChild(bubble);
    welcome.hidden = true;
    messages.parentElement.scrollTop = messages.parentElement.scrollHeight;
    return bubble;
  }

  function conversationPrompt(message) {
    const recent = history.slice(-8).map(item => `${item.role === 'user' ? 'Teacher' : 'TEACHR AI'}: ${item.content}`).join('\n\n');
    return recent
      ? `Continue this TEACHR conversation. Respond only to the teacher's latest message.\n\n${recent}\n\nTeacher: ${message}`
      : message;
  }

  async function submitMessage(text) {
    const value = String(text || '').trim();
    if (!value || controller) return;
    if (!window.TEACHR_AUTH?.getIdToken || !window.TEACHR_AI?.generate) {
      addMessage('assistant', 'TEACHR AI is still starting. Try again in a moment.', 'error');
      return;
    }

    addMessage('user', value);
    input.value = '';
    controller = new AbortController();
    setBusy(true);
    const pending = addMessage('assistant', 'Thinking…', 'pending');

    try {
      const token = await window.TEACHR_AUTH.getIdToken();
      if (!token) throw Object.assign(new Error('Sign in to use TEACHR AI.'), { code: 'AUTH_REQUIRED' });
      const payload = await window.TEACHR_AI.generate({
        token,
        prompt: conversationPrompt(value),
        tool: 'chat',
        signal: controller.signal,
        includeCurriculum: false
      });
      pending.textContent = payload.content.trim();
      pending.classList.remove('pending');
      history.push({ role: 'user', content: value }, { role: 'assistant', content: payload.content.trim() });
    } catch (error) {
      if (error?.name === 'AbortError') {
        pending.textContent = 'Response stopped.';
      } else {
        pending.textContent = error?.message || 'TEACHR AI could not complete that request. Please try again.';
        pending.classList.remove('pending');
        pending.classList.add('error');
      }
    } finally {
      controller = null;
      setBusy(false);
      input.focus();
    }
  }

  function stopGeneration() {
    if (controller) controller.abort();
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
    if (send.dataset.mode === 'stop') return stopGeneration();
    submitMessage(input.value);
  });
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!controller) form.requestSubmit();
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) closePanel();
  });
  window.addEventListener('teachr:authchange', event => {
    if (event.detail?.mode !== 'signed-in') closePanel();
  });

  setBusy(false);
  window.TEACHR_CHAT_PANEL = Object.freeze({ open: openPanel, close: closePanel, reset: resetChat, stop: stopGeneration, stage: 2 });
})();