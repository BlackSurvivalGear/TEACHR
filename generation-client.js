/* Firebase token travels in the POST body because Apps Script web apps do not
   expose Authorization headers and cannot handle a browser CORS preflight. */
(function (root) {
  root.TEACHR_AI = Object.freeze({
    async generate({ token, prompt, tool }) {
      if (!token) throw Object.assign(new Error('Sign in to generate resources.'), { code: 'AUTH_REQUIRED' });
      const local = ['localhost', '127.0.0.1', '[::1]'].includes(root.location.hostname);
      const url = local ? '/api/generate' : root.TEACHR_PAYMENT?.appsScriptUrl;
      if (!local && !/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url || '')) {
        throw new Error('The generation service is not configured.');
      }
      const response = await root.fetch(url, {
        method: 'POST', credentials: 'omit', redirect: 'follow',
        headers: local ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify(local ? { prompt, tool } : { action: 'generate', idToken: token, prompt, tool })
      });
      const payload = await response.json().catch(() => { throw new Error('The generation service returned an invalid response.'); });
      if (!response.ok || payload?.ok === false) {
        throw Object.assign(new Error(payload?.error || 'Generation failed.'), { code: payload?.code, status: payload?.status || response.status });
      }
      if (!payload || typeof payload.content !== 'string' || !payload.content.trim() || (!local && payload.ok !== true)) throw new Error('AI service returned no content.');
      return payload;
    }
  });
})(window);
