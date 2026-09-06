(() => {
  const YEAR_TO_KEY_STAGE = {
    'Year 1': 'KS1', 'Year 2': 'KS1',
    'Year 3': 'KS2', 'Year 4': 'KS2', 'Year 5': 'KS2', 'Year 6': 'KS2',
    'Year 7': 'KS3', 'Year 8': 'KS3', 'Year 9': 'KS3',
    'Year 10': 'KS4', 'Year 11': 'KS4'
  };

  const state = { registry: null, detail: null, ready: null, error: null };

  function keyStageForYear(year) { return YEAR_TO_KEY_STAGE[year] || ''; }

  const topicDomains = [
    ['fraction', ['Number']], ['decimal', ['Number']], ['percentage', ['Number', 'Ratio and proportion', 'Ratio, proportion and rates of change']],
    ['ratio', ['Ratio and proportion', 'Ratio, proportion and rates of change']], ['proportion', ['Ratio and proportion', 'Ratio, proportion and rates of change']],
    ['algebra', ['Algebra']], ['equation', ['Algebra']], ['sequence', ['Algebra']],
    ['geometry', ['Geometry', 'Geometry and measures']], ['shape', ['Geometry', 'Geometry and measures']], ['measure', ['Measurement', 'Geometry and measures']],
    ['probability', ['Probability']], ['statistic', ['Statistics']], ['data', ['Statistics']],
    ['number', ['Number', 'Number and place value']], ['place value', ['Number', 'Number and place value']],
    ['multiplication', ['Number', 'Multiplication and division', 'Addition, subtraction, multiplication and division']],
    ['division', ['Number', 'Multiplication and division', 'Addition, subtraction, multiplication and division']],
    ['addition', ['Number', 'Addition and subtraction', 'Addition, subtraction, multiplication and division']],
    ['subtraction', ['Number', 'Addition and subtraction', 'Addition, subtraction, multiplication and division']]
  ];

  function matchingDomains(topic, keyStage) {
    const text = String(topic || '').toLowerCase();
    const matches = topicDomains.filter(([term]) => text.includes(term)).flatMap(([, domains]) => domains);
    const available = state.detail?.domains?.[keyStage] || [];
    const unique = [...new Set(matches)].filter(domain => available.includes(domain));
    return unique.length ? unique : available;
  }

  function resolve(selection = {}) {
    const curriculum = String(selection.curriculum || '').trim();
    const subject = String(selection.subject || '').trim();
    const year = String(selection.year || '').trim();
    const topic = String(selection.topic || '').trim();
    const keyStage = keyStageForYear(year);

    if (!state.registry || !/^England\s*[—-]\s*National Curriculum$/i.test(curriculum)) {
      return { jurisdiction: '', framework: curriculum, subject, year, topic, keyStage, status: 'unresolved', statements: [], objectives: [], source: null };
    }

    const record = state.registry.subjects?.[subject] || state.registry.statutoryRequirements?.[subject] || null;
    if (!record) {
      return { jurisdiction: 'England', framework: 'National Curriculum', subject, year, topic, keyStage, status: 'subject-not-registered', statements: [], objectives: [], source: null };
    }

    const applicable = !keyStage || record.keyStages.includes(keyStage);
    const detailed = subject === 'Mathematics' ? state.detail : null;
    const domains = detailed && keyStage ? matchingDomains(topic, keyStage) : [];
    const objectives = detailed?.objectives?.[keyStage]?.filter(item => !domains.length || domains.includes(item.domain)) || [];

    return {
      jurisdiction: 'England', framework: 'National Curriculum', subject, year, topic, keyStage,
      status: applicable ? (detailed ? 'verified-source-structure' : 'registered') : 'not-applicable-at-key-stage',
      curriculumType: record.type, source: record.source,
      domains, objectives,
      statements: objectives.map(item => `${item.id}: ${item.summary}`)
    };
  }

  async function load() {
    try {
      const [registryResponse, mathsResponse] = await Promise.all([
        fetch('curriculum/england-national-curriculum.json', { cache: 'no-cache' }),
        fetch('curriculum/england-national-curriculum/mathematics-ks1-4.json', { cache: 'no-cache' })
      ]);
      if (!registryResponse.ok) throw new Error(`Curriculum registry returned ${registryResponse.status}`);
      if (!mathsResponse.ok) throw new Error(`Mathematics curriculum dataset returned ${mathsResponse.status}`);
      state.registry = await registryResponse.json();
      state.detail = await mathsResponse.json();
      state.error = null;
      return state.registry;
    } catch (error) {
      state.error = error;
      state.registry = null;
      state.detail = null;
      throw error;
    }
  }

  state.ready = load();
  window.TEACHR_CURRICULUM = {
    ready: state.ready,
    resolve,
    keyStageForYear,
    get data() { return state.registry; },
    get detail() { return state.detail; },
    get error() { return state.error; }
  };
})();
