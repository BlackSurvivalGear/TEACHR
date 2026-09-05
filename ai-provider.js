(() => {
  const form = document.getElementById('builderForm');
  if (!form || document.getElementById('aiProviderPanel')) return;

  const style = document.createElement('style');
  style.textContent = `
    #aiProviderPanel{grid-column:1/-1;margin-top:4px;padding:20px;border:1px solid rgba(83,170,255,.18);border-radius:18px;background:linear-gradient(145deg,rgba(22,50,88,.42),rgba(7,23,45,.38))}
    .aip-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:16px}
    .aip-head strong{display:block;font-size:15px}.aip-head span{display:block;font-size:11px;color:#7890ae;margin-top:4px}
    .aip-status{font-size:11px;font-weight:700;color:#91a7c1;white-space:nowrap}.aip-status.ready{color:#7ee2ad}.aip-status.error{color:#ff9d9d}
    .aip-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
    .aip-wide{grid-column:1/-1}.aip-key-wrap{position:relative}.aip-key-wrap input{padding-right:78px;width:100%}
    .aip-toggle{position:absolute;right:7px;top:50%;transform:translateY(-50%);border:0;background:transparent;color:#8fa6c2;font-size:10px;font-weight:800;cursor:pointer}
    .aip-actions{display:flex;align-items:center;gap:10px;margin-top:14px}.aip-note{font-size:10px;color:#7187a2;line-height:1.45}
    .aip-test{border:1px solid rgba(155,190,255,.14);background:rgba(255,255,255,.04);color:#cfe0f5;border-radius:10px;padding:9px 12px;font-size:11px;font-weight:700;cursor:pointer}.aip-test:hover{background:rgba(255,255,255,.08);color:#fff}.aip-test:disabled{opacity:.55;cursor:wait}
    @media(max-width:620px){.aip-grid{grid-template-columns:1fr}.aip-wide{grid-column:auto}.aip-head{display:block}.aip-status{margin-top:8px}}
  `;
  document.head.appendChild(style);

  const panel = document.createElement('section');
  panel.id = 'aiProviderPanel';
  panel.innerHTML = `
    <div class="aip-head">
      <div><p class="eyebrow">AI ENGINE</p><strong>Choose your AI provider</strong><span>Temporary browser-direct proof-of-concept: your key is used only from this browser session and is not committed to the repository.</span></div>
      <span class="aip-status" id="aiProviderStatus">Not configured</span>
    </div>
    <div class="aip-grid">
      <div class="field">
        <label for="aiProvider">AI provider</label>
        <select id="aiProvider" name="aiProvider">
          <option value="openai" selected>OpenAI</option>
          <option value="google">Google Gemini — coming next</option>
          <option value="anthropic">Anthropic Claude — coming next</option>
        </select>
      </div>
      <div class="field">
        <label for="aiModel">Model</label>
        <select id="aiModel" name="aiModel">
          <option value="gpt-5.6-luna" selected>GPT-5.6 Luna — cost-sensitive</option>
          <option value="gpt-5.6-terra">GPT-5.6 Terra — balanced</option>
          <option value="gpt-5.6-sol">GPT-5.6 Sol — frontier</option>
        </select>
      </div>
      <div class="field aip-wide">
        <label for="aiApiKey">API key</label>
        <div class="aip-key-wrap"><input id="aiApiKey" type="password" autocomplete="off" spellcheck="false" placeholder="Paste your provider API key for this session"><button class="aip-toggle" id="aiKeyToggle" type="button">SHOW</button></div>
      </div>
    </div>
    <div class="aip-actions"><button class="aip-test" id="testAiConnection" type="button">Test connection</button><span class="aip-note">Temporary direct browser test. Do not commit or share the key; rotate it after this proof-of-concept if you are finished testing.</span></div>
  `;

  const actions = form.querySelector('.form-actions');
  if (actions) form.insertBefore(panel, actions);
  else form.appendChild(panel);

  const provider = document.getElementById('aiProvider');
  const model = document.getElementById('aiModel');
  const apiKey = document.getElementById('aiApiKey');
  const status = document.getElementById('aiProviderStatus');
  const testButton = document.getElementById('testAiConnection');
  const toggle = document.getElementById('aiKeyToggle');
  const sessionKey = 'teachr-ai-api-key';
  const sessionProvider = 'teachr-ai-provider';
  const sessionModel = 'teachr-ai-model';
  const apiBase = typeof window.TEACHR_API_BASE === 'string' ? window.TEACHR_API_BASE.replace(/\/$/, '') : '';

  const setStatus = (text, state = '') => {
    status.textContent = text;
    status.className = `aip-status ${state}`;
  };

  const setModelOptions = (models) => {
    if (!Array.isArray(models) || !models.length) return;
    const current = model.value;
    model.replaceChildren(...models.map(id => {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = id;
      return option;
    }));
    model.value = models.includes(current) ? current : models[0];
    try { sessionStorage.setItem(sessionModel, model.value); } catch {}
  };

  try {
    apiKey.value = sessionStorage.getItem(sessionKey) || '';
    provider.value = sessionStorage.getItem(sessionProvider) || 'openai';
    model.value = sessionStorage.getItem(sessionModel) || 'gpt-5.6-luna';
    if (apiKey.value) setStatus('Key loaded for this session');
  } catch {}

  const updateProvider = () => {
    const isOpenAI = provider.value === 'openai';
    model.disabled = !isOpenAI;
    testButton.disabled = !isOpenAI;
    if (!isOpenAI) setStatus('Provider adapter coming next');
    else if (!apiKey.value) setStatus('Not configured');
  };

  provider.addEventListener('change', () => {
    try { sessionStorage.setItem(sessionProvider, provider.value); } catch {}
    updateProvider();
  });
  model.addEventListener('change', () => { try { sessionStorage.setItem(sessionModel, model.value); } catch {} });
  apiKey.addEventListener('input', () => {
    try {
      if (apiKey.value.trim()) sessionStorage.setItem(sessionKey, apiKey.value.trim());
      else sessionStorage.removeItem(sessionKey);
    } catch {}
    if (apiKey.value.trim()) setStatus('Ready to test'); else setStatus('Not configured');
  });
  toggle.addEventListener('click', () => {
    const visible = apiKey.type === 'text';
    apiKey.type = visible ? 'password' : 'text';
    toggle.textContent = visible ? 'SHOW' : 'HIDE';
  });

  testButton.addEventListener('click', async () => {
    const key = apiKey.value.trim();
    if (!key) return setStatus('Enter an API key first', 'error');
    testButton.disabled = true;
    setStatus('Testing…');
    try {
      let result;
      if (window.TEACHR_DIRECT_OPENAI_ENABLED && window.TEACHR_DIRECT_OPENAI) {
        result = await window.TEACHR_DIRECT_OPENAI.test(key, model.value);
        setModelOptions(result.availableModels);
        setStatus(`Connected · ${result.model}`, 'ready');
        return;
      }
      const response = await fetch(`${apiBase}/api/ai/test`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ provider: provider.value, model: model.value, apiKey: key })
      });
      const contentType = response.headers.get('content-type') || '';
      const payload = contentType.includes('application/json') ? await response.json().catch(() => ({})) : {};
      if (!response.ok) {
        if (response.status === 404 || !contentType.includes('application/json')) throw new Error('TEACHR AI backend is not running. Start the local server with npm start.');
        throw new Error(payload.error || 'Connection test failed');
      }
      setModelOptions(payload.availableModels);
      setStatus(`Connected · ${payload.model || model.value}`, 'ready');
    } catch (error) {
      setStatus(error.message || 'Connection test failed', 'error');
    } finally {
      testButton.disabled = provider.value !== 'openai';
    }
  });

  updateProvider();
})();
