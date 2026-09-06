(() => {
  const originalFetch = window.fetch.bind(window);

  function curriculumContext(inputs) {
    const registry = window.TEACHR_CURRICULUM;
    if (!registry) return '';
    const resolved = registry.resolve(inputs);
    if (!resolved.jurisdiction) return '';

    const source = resolved.source ? `Authoritative source: ${resolved.source}` : 'Authoritative source: registered TEACHR curriculum source';
    const objectives = resolved.objectives?.length
      ? resolved.objectives.map(item => `- ${item.id} [${item.status}] ${item.domain}: ${item.summary}`).join('\n')
      : 'No structured objectives have been loaded for this selection. Do not invent statutory wording or claim objective-level alignment.';
    const domains = resolved.domains?.length ? resolved.domains.join(', ') : 'not resolved';

    return `\n\nTEACHR CURRICULUM CONTEXT\nJurisdiction: ${resolved.jurisdiction}\nFramework: ${resolved.framework}\nSubject: ${resolved.subject}\nTeacher year: ${resolved.year || 'not specified'}\nKey stage: ${resolved.keyStage || 'not resolved'}\nTopic: ${resolved.topic || 'not specified'}\nCurriculum status: ${resolved.status}\nCurriculum type: ${resolved.curriculumType || 'national-curriculum'}\nRelevant curriculum domains: ${domains}\n${source}\nTEACHR curriculum objectives:\n${objectives}\n\nCURRICULUM RULES\n- Treat the TEACHR curriculum registry as the curriculum authority supplied by the application.\n- Treat the GOV.UK/DfE source recorded by TEACHR as the authoritative source behind the registry.\n- Treat TEACHR objective summaries as controlled paraphrases, not replacement statutory wording.\n- Do not invent statutory requirements, objective wording, year-specific requirements or attainment claims.\n- Distinguish teacher-selected year/context from the official key-stage structure where the source does not specify a year.\n- Do not represent example content or non-statutory material as a statutory requirement.\n- If no structured objective is supplied, state that curriculum alignment is not yet verified rather than fabricating it.\n- Design the lesson so the supplied curriculum objective is explicitly addressed and assessable.`;
  }

  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    if (!url.endsWith('/api/generate') && !url.includes('/api/generate?')) return originalFetch(input, init);

    try {
      if (window.TEACHR_CURRICULUM?.ready) await window.TEACHR_CURRICULUM.ready;
      const body = JSON.parse(init.body || '{}');
      const context = curriculumContext(body.inputs || {});
      if (context) body.prompt = `${body.prompt || ''}${context}`;
      return originalFetch(input, { ...init, body: JSON.stringify(body) });
    } catch {
      return originalFetch(input, init);
    }
  };
})();
