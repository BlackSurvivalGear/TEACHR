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
  let contextEnabled = true;

  function value(id) {
    const element = document.getElementById(id);
    if (!element) return '';
    if (id === 'topic' && element.value === '__custom__') return document.getElementById('customTopic')?.value?.trim() || '';
    return String(element.value || '').trim();
  }

  function currentContext() {
    const selection = {
      curriculum: value('curriculum'),
      subject: value('subject'),
      year: value('year'),
      topic: value('topic')
    };
    const objective = value('lessonObjective');
    const resolved = window.TEACHR_CURRICULUM?.resolve?.(selection);
    const objectives = resolved?.objectives || [];
    let alignmentType = 'Teacher-defined objective';
    if (resolved?.alignmentLevel === 'verified-objective' && objectives.length) alignmentType = 'Verified curriculum objective';
    else if (resolved?.alignmentLevel === 'not-applicable') alignmentType = 'Not applicable';
    else if (resolved?.alignmentLevel === 'key-stage-aligned' || resolved?.alignmentLevel === 'framework-only') alignmentType = 'Key-stage aligned';
    return { selection, objective, resolved, objectives, alignmentType };
  }

  function contextLabel(context) {
    const parts = [context.selection.year, context.selection.subject, context.selection.topic].filter(Boolean);
    return parts.length ? `Using context: ${parts.join(' · ')}` : 'Using current workspace context';
  }

  function ensureContextControl() {
    let bar = document.getElementById('teachrChatContext');
    if (bar) return bar;
    bar = document.createElement('div');
    bar.id = 'teachrChatContext';
    bar.className = 'teachr-chat-context';
    bar.innerHTML = '<span class="teachr-chat-context-label"></span><label><input type="checkbox" checked> Use context</label>';
    panel.querySelector('.teachr-chat-header')?.insertAdjacentElement('afterend', bar);
    bar.querySelector('input').addEventListener('change', event => {
      contextEnabled = event.target.checked;
      refreshContextLabel();
    });
    return bar;
  }

  function refreshContextLabel() {
    const bar = ensureContextControl();
    const label = bar.querySelector('.teachr-chat-context-label');
    label.textContent = contextEnabled ? contextLabel(currentContext()) : 'Context assistance off';
  }

  function contextPrompt() {
    if (!contextEnabled) return '';
    const context = currentContext();
    const resolved = context.resolved;
    const verified = context.objectives.length
      ? context.objectives.map(item => `- ${item.id || 'objective'} [controlled paraphrase] ${item.summary || ''}`).join('\n')
      : 'None for this exact selection.';
    return `TEACHR WORKSPACE CONTEXT\nCurriculum: ${context.selection.curriculum || 'not specified'}\nSubject: ${context.selection.subject || 'not specified'}\nYear/stage: ${context.selection.year || 'not specified'}\nTopic: ${context.selection.topic || 'not specified'}\nAlignment type: ${context.alignmentType}\nAlignment detail: ${resolved?.alignmentLabel || resolved?.status || 'not resolved'}\nVerified curriculum objectives:\n${verified}\nTeacher lesson objective: ${context.objective || 'No teacher-defined objective supplied.'}\n\nCONTEXT RULES\n- Use this context only when relevant to the teacher request.\n- Keep verified curriculum objectives separate from teacher-defined objectives.\n- Controlled paraphrases are not statutory quotations.\n- Never present an AI-created objective as an official curriculum statement.\n- If alignment is Not applicable, do not claim National Curriculum objective alignment.\n- Current live workspace selections override stale profile or earlier-form defaults.\n\n`;
  }

  function openPanel() {
    if (document.documentElement.dataset.auth !== 'signed-in') return;
    panel.hidden = false;
    launcher.setAttribute('aria-expanded', 'true');
    refreshContextLabel();
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
    refreshContextLabel();
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
    const conversation = recent
      ? `Continue this TEACHR conversation. Respond only to the teacher's latest message.\n\n${recent}\n\nTeacher: ${message}`
      : message;
    return `${contextPrompt()}${conversation}`;
  }

  async function submitMessage(text) {
    const value = String(text || '').trim();
    if (!value || controller) return;
    if (!window.TEACHR_AUTH?.getIdToken || !window.TEACHR_AI?.generate) {
      addMessage('assistant', 'TEACHR AI is still starting. Try again in a moment.', 'error');
      return;
    }
    refreshContextLabel();
    addMessage('user', value);
    input.value = '';
    controller = new AbortController();
    setBusy(true);
    const pending = addMessage('assistant', 'Thinking…', 'pending');
    try {
      const token = await window.TEACHR_AUTH.getIdToken();
      if (!token) throw Object.assign(new Error('Sign in to use TEACHR AI.'), { code: 'AUTH_REQUIRED' });
      const payload = await window.TEACHR_AI.generate({ token, prompt: conversationPrompt(value), tool: 'chat', signal: controller.signal, includeCurriculum: false });
      pending.textContent = payload.content.trim();
      pending.classList.remove('pending');
      history.push({ role: 'user', content: value }, { role: 'assistant', content: payload.content.trim() });
    } catch (error) {
      if (error?.name === 'AbortError') pending.textContent = 'Response stopped.';
      else {
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

  function stopGeneration() { if (controller) controller.abort(); }

  launcher.addEventListener('click', openPanel);
  close?.addEventListener('click', closePanel);
  minimise?.addEventListener('click', closePanel);
  newChat?.addEventListener('click', resetChat);
  prompts.forEach(button => button.addEventListener('click', () => { input.value = button.dataset.chatPrompt || button.textContent.trim(); input.focus(); }));
  ['curriculum', 'subject', 'year', 'topic', 'customTopic', 'lessonObjective'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', refreshContextLabel);
    document.getElementById(id)?.addEventListener('change', refreshContextLabel);
  });
  form.addEventListener('submit', event => { event.preventDefault(); if (send.dataset.mode === 'stop') return stopGeneration(); submitMessage(input.value); });
  input.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); if (!controller) form.requestSubmit(); } });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !panel.hidden) closePanel(); });
  window.addEventListener('teachr:authchange', event => { if (event.detail?.mode !== 'signed-in') closePanel(); });

  ensureContextControl();
  refreshContextLabel();
  setBusy(false);
  window.TEACHR_CHAT_PANEL = Object.freeze({ open: openPanel, close: closePanel, reset: resetChat, stop: stopGeneration, context: currentContext, stage: 3 });
})();