(() => {
  const originalFetch = window.fetch.bind(window);

  function curriculumContext(inputs) {
    const registry = window.TEACHR_CURRICULUM;
    if (!registry) return '';
    const resolved = registry.resolve(inputs);
    if (!resolved.jurisdiction) return '';

    const source = resolved.source ? `Authoritative source: ${resolved.source}` : 'Authoritative source: registered TEACHR curriculum source';
    const statements = resolved.statements.length
      ? resolved.statements.map(item => `- ${item}`).join('\n')
      : 'No structured curriculum statements have been loaded for this subject/topic yet. Do not invent statutory wording or claim objective-level alignment.';

    return `\n\nTEACHR CURRICULUM CONTEXT\nJurisdiction: ${resolved.jurisdiction}\nFramework: ${resolved.framework}\nSubject: ${resolved.subject}\nTeacher year: ${resolved.year || 'not specified'}\nKey stage: ${resolved.keyStage || 'not resolved'}\nCurriculum status: ${resolved.status}\nCurriculum type: ${resolved.curriculumType || 'national-curriculum'}\n${source}\nCurriculum statements:\n${statements}\n\nCURRICULUM RULES\n- Treat the TEACHR curriculum registry as the curriculum authority supplied by the application.\n- Do not invent statutory requirements, objective wording, year-specific requirements or attainment claims.\n- Distinguish teacher-selected year/context from the official key-stage structure where the source does not specify a year.\n- If no structured statement is supplied, state that curriculum alignment is not yet verified rather than fabricating it.`;
  }

  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    if (!url.endsWith('/api/generate') && !url.includes('/api/generate?')) return originalFetch(input, init);

    try {
      if (window.TEACHR_CURRICULUM?.ready) await window.TEACHR_CURRICULUM.ready;
      const body = JSON.parse(init.body || '{}');
      const inputs = body.inputs || {};
      const context = curriculumContext(inputs);
      if (context) body.prompt = `${body.prompt || ''}${context}`;
      return originalFetch(input, { ...init, body: JSON.stringify(body) });
    } catch {
      return originalFetch(input, init);
    }
  };
})();
