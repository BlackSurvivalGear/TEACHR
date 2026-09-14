/* Firebase token travels in the POST body because Apps Script web apps do not
   expose Authorization headers and cannot handle a browser CORS preflight. */
(function (root) {
  function currentInputs() {
    const value = id => root.document?.getElementById(id)?.value || '';
    return {
      curriculum: value('curriculum'),
      subject: value('subject'),
      year: value('year'),
      topic: value('topic') === '__custom__' ? value('customTopic') : value('topic')
    };
  }

  function teacherObjective() {
    return root.document?.getElementById('lessonObjective')?.value?.trim() || '';
  }

  function curriculumContext(inputs) {
    const registry = root.TEACHR_CURRICULUM;
    if (!registry) return '';
    const resolved = registry.resolve(inputs);
    if (!resolved?.jurisdiction) return '';

    const verifiedObjectives = resolved.objectives?.length
      ? resolved.objectives.map(item => `- ${item.id} [controlled paraphrase] ${item.domain}: ${item.summary}`).join('\n')
      : 'None for this exact topic/stage selection.';
    const domains = resolved.domains?.length ? resolved.domains.join(', ') : 'not resolved';
    const alignment = resolved.alignmentLabel || resolved.status || 'Not resolved';
    const reason = resolved.alignmentReason || 'No additional precision metadata available.';
    const lessonObjective = teacherObjective();

    return `\n\nTEACHR CURRICULUM CONTEXT\nJurisdiction: ${resolved.jurisdiction}\nFramework: ${resolved.framework}\nSubject: ${resolved.subject}\nTeacher year: ${resolved.year || 'not specified'}\nKey stage: ${resolved.keyStage || 'not resolved'}\nTopic: ${resolved.topic || 'not specified'}\nAlignment status: ${alignment}\nAlignment reason: ${reason}\nRelevant curriculum domains: ${domains}\n\nVERIFIED CURRICULUM OBJECTIVES\n${verifiedObjectives}\n\nTEACHER LESSON OBJECTIVE\n${lessonObjective || 'No teacher lesson objective supplied.'}\n\nCURRICULUM PRECISION RULES\n- Keep verified curriculum objectives and the teacher lesson objective conceptually separate.\n- A TEACHR controlled paraphrase is not statutory wording and must not be presented as a quotation from the curriculum.\n- Only claim objective-level curriculum alignment when VERIFIED CURRICULUM OBJECTIVES contains an objective.\n- If alignment is Key-stage aligned, say the material is appropriate to the registered subject/key stage but do not claim a topic-specific statutory objective.\n- If alignment is Not applicable at this key stage, do not describe the lesson as National Curriculum objective-aligned for that subject/stage.\n- The selected subject, year and topic override unrelated profile defaults or stale form context.\n- Do not carry objectives, vocabulary or subject content from a previous selection.\n- Do not invent statutory requirements, programme-of-study wording, attainment claims or source quotations.\n- Keep all generated content relevant to the selected subject and topic.`;
  }

  function toolPrompt(prompt, tool) {
    if (tool === 'lesson' || tool === 'chat') return String(prompt || '').trim();
    return String(prompt || '').replace(/\n?\[TEACHR LESSON DESIGN\][\s\S]*?(?=\n\nTEACHR CURRICULUM CONTEXT|$)/, '').trim();
  }

  function diagnosticError(message, details = {}) {
    return Object.assign(new Error(message), { diagnostic: details, ...details });
  }

  root.TEACHR_AI = Object.freeze({
    async generate({ token, prompt, tool, signal, includeCurriculum = tool !== 'chat' }) {
      if (!token) throw Object.assign(new Error('Sign in to generate resources.'), { code: 'AUTH_REQUIRED' });
      if (includeCurriculum && root.TEACHR_CURRICULUM?.ready) {
        try { await root.TEACHR_CURRICULUM.ready; } catch { /* generation can continue without registry detail */ }
      }
      const context = includeCurriculum ? curriculumContext(currentInputs()) : '';
      const cleanPrompt = toolPrompt(prompt, tool);
      const finalPrompt = context ? `${cleanPrompt}${context}` : cleanPrompt;
      const local = ['localhost', '127.0.0.1', '[::1]'].includes(root.location.hostname);
      const url = local ? '/api/generate' : root.TEACHR_PAYMENT?.appsScriptUrl;
      if (!local && !/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url || '')) {
        throw diagnosticError('The generation service is not configured.', { code: 'TRANSPORT_CONFIG', stage: 'configuration' });
      }
      let response;
      try {
        response = await root.fetch(url, {
          method: 'POST', credentials: 'omit', redirect: 'follow', signal,
          headers: local ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'text/plain;charset=UTF-8' },
          body: JSON.stringify(local ? { prompt: finalPrompt, tool } : { action: 'generate', idToken: token, prompt: finalPrompt, tool })
        });
      } catch (error) {
        if (error?.name === 'AbortError') throw error;
        throw diagnosticError('Generation transport failed before a response was received.', {
          code: 'TRANSPORT_FETCH_FAILED', stage: 'fetch', cause: error?.message || String(error)
        });
      }
      const raw = await response.text().catch(error => {
        throw diagnosticError('Generation response could not be read.', {
          code: 'TRANSPORT_READ_FAILED', stage: 'response-read', status: response.status, cause: error?.message || String(error)
        });
      });
      let payload;
      try {
        payload = JSON.parse(raw);
      } catch (_) {
        throw diagnosticError('The generation service returned an invalid response.', {
          code: 'TRANSPORT_INVALID_JSON', stage: 'response-json', status: response.status,
          responsePreview: raw.slice(0, 240)
        });
      }
      if (!response.ok || payload?.ok === false) {
        throw Object.assign(new Error(payload?.error || 'Generation failed.'), {
          code: payload?.code || 'GENERATION_FAILED', status: payload?.status || response.status,
          diagnostic: { stage: 'apps-script', httpStatus: response.status, backendCode: payload?.code || null }
        });
      }
      if (!payload || typeof payload.content !== 'string' || !payload.content.trim() || (!local && payload.ok !== true)) {
        throw diagnosticError('AI service returned no content.', { code: 'EMPTY_CONTENT', stage: 'response-validation', status: response.status });
      }
      return payload;
    }
  });
})(window);
