(() => {
  const registry = window.TEACHR_CURRICULUM;
  if (!registry) return;

  const STOP_WORDS = new Set([
    'a','an','and','are','as','at','be','by','for','from','how','in','into','is','it','of','on','or','the','their','to','use','using','with',
    'understand','understanding','develop','describe','identify','explain','apply','analyse','analyze','interpret','study','including','include','key'
  ]);

  const SUBJECTS = [
    'English','Mathematics','Science','Art and design','Citizenship','Computing','Design and technology',
    'Geography','History','Languages','Music','Physical education','Religious education (RE)'
  ];

  function normalise(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function tokens(value) {
    return normalise(value).split(' ').filter(token => token.length > 2 && !STOP_WORDS.has(token));
  }

  function scoreObjective(topic, objective) {
    const topicText = normalise(topic);
    const summaryText = normalise(objective?.summary);
    const domainText = normalise(objective?.domain);
    if (!topicText || !summaryText) return 0;

    let score = summaryText.includes(topicText) ? 100 : 0;
    const topicTokens = [...new Set(tokens(topicText))];
    const summaryTokens = new Set(tokens(summaryText));
    const domainTokens = new Set(tokens(domainText));
    topicTokens.forEach(token => {
      if (summaryTokens.has(token)) score += 18;
      else if (domainTokens.has(token)) score += 6;
    });
    return score;
  }

  function precisionStatus(resolved, ranked) {
    if (!resolved?.jurisdiction) return { level: 'unresolved', label: 'Not resolved', reason: 'No supported curriculum registry was resolved.' };
    if (resolved.status === 'not-applicable-at-key-stage') {
      return { level: 'not-applicable', label: 'Not applicable at this key stage', reason: `${resolved.subject} is not registered in the England National Curriculum for ${resolved.keyStage || 'this stage'}.` };
    }
    if (!resolved.keyStage) return { level: 'framework-only', label: 'Framework only', reason: 'No National Curriculum key stage was resolved for this selection.' };
    if (!Array.isArray(resolved.objectives) || !resolved.objectives.length) {
      return { level: 'key-stage-aligned', label: 'Key-stage aligned', reason: 'The subject and key stage are registered, but TEACHR has no topic-specific structured objective for this selection.' };
    }
    if (!ranked.length || ranked[0].precisionScore < 18) {
      return { level: 'key-stage-aligned', label: 'Key-stage aligned', reason: 'The curriculum source structure is available, but no sufficiently specific topic-to-objective match was found.' };
    }
    return { level: 'verified-objective', label: 'Verified curriculum objective', reason: 'A topic-specific objective was matched from TEACHR’s structured curriculum dataset.' };
  }

  const originalResolve = registry.resolve.bind(registry);
  registry.resolve = (selection = {}) => {
    const resolved = originalResolve(selection);
    if (!resolved?.jurisdiction || !SUBJECTS.includes(String(resolved.subject || ''))) return resolved;

    const ranked = (resolved.objectives || [])
      .map(item => ({ ...item, precisionScore: scoreObjective(resolved.topic, item) }))
      .sort((a, b) => b.precisionScore - a.precisionScore || String(a.id).localeCompare(String(b.id)));

    const precision = precisionStatus(resolved, ranked);
    const verified = precision.level === 'verified-objective'
      ? ranked.filter(item => item.precisionScore >= Math.max(18, ranked[0].precisionScore - 18)).slice(0, 3)
      : [];

    return {
      ...resolved,
      status: precision.level === 'verified-objective' ? 'verified-objective' : resolved.status,
      alignmentLevel: precision.level,
      alignmentLabel: precision.label,
      alignmentReason: precision.reason,
      objectives: verified,
      statements: verified.map(item => `${item.id}: ${item.summary}`),
      curriculumPrecisionVersion: 2
    };
  };

  window.TEACHR_CURRICULUM_PRECISION = Object.freeze({
    version: 2,
    subjects: SUBJECTS.slice(),
    scoreObjective
  });
})();
