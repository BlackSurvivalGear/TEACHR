(() => {
  const DIRECT_FLAG = 'TEACHR_DIRECT_OPENAI_TEST';
  const isEnabled = window[DIRECT_FLAG] === true;
  if (!isEnabled) return;

  const OPENAI_API = 'https://api.openai.com/v1';

  async function openaiFetch(path, key, options = {}) {
    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${key}`);
    headers.set('Content-Type', 'application/json');
    return fetch(`${OPENAI_API}${path}`, { ...options, headers });
  }

  async function test(key, model) {
    const response = await openaiFetch('/models', key, { method: 'GET' });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error?.message || `OpenAI connection failed (${response.status})`);
    const availableModels = Array.isArray(payload.data)
      ? payload.data.map(item => item.id).filter(id => /^gpt-5\.6-/i.test(id)).sort()
      : [];
    return { model: availableModels.includes(model) ? model : (availableModels[0] || model), availableModels };
  }

  async function generate({ key, model, prompt }) {
    const response = await openaiFetch('/responses', key, {
      method: 'POST',
      body: JSON.stringify({
        model,
        instructions: 'You are TEACHR, an AI teaching assistant. Produce accurate, practical, teacher-ready educational material. Follow the requested structure. Do not invent school policy or student personal data.',
        input: prompt
      })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error?.message || `OpenAI generation failed (${response.status})`);
    const content = payload.output_text || (payload.output || [])
      .flatMap(item => item.content || [])
      .map(item => item.text || '')
      .filter(Boolean)
      .join('\n');
    if (!content) throw new Error('OpenAI returned no text content');
    return { content };
  }

  window.TEACHR_DIRECT_OPENAI = { test, generate };
  window.TEACHR_DIRECT_OPENAI_ENABLED = true;
})();
