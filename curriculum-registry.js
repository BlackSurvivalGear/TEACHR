(() => {
  const YEAR_TO_KEY_STAGE = {
    'Year 1': 'KS1', 'Year 2': 'KS1',
    'Year 3': 'KS2', 'Year 4': 'KS2', 'Year 5': 'KS2', 'Year 6': 'KS2',
    'Year 7': 'KS3', 'Year 8': 'KS3', 'Year 9': 'KS3',
    'Year 10': 'KS4', 'Year 11': 'KS4'
  };

  const state = {
    data: null,
    ready: null,
    error: null
  };

  function keyStageForYear(year) {
    return YEAR_TO_KEY_STAGE[year] || '';
  }

  function resolve(selection = {}) {
    const curriculum = String(selection.curriculum || '').trim();
    const subject = String(selection.subject || '').trim();
    const year = String(selection.year || '').trim();
    const keyStage = keyStageForYear(year);

    if (!state.data || !/^England\s*[—-]\s*National Curriculum$/i.test(curriculum)) {
      return {
        jurisdiction: '', framework: curriculum, subject, year, keyStage,
        status: 'unresolved', statements: [], source: null
      };
    }

    const record = state.data.subjects?.[subject] || state.data.statutoryRequirements?.[subject] || null;
    if (!record) {
      return {
        jurisdiction: 'England', framework: 'National Curriculum', subject, year, keyStage,
        status: 'subject-not-registered', statements: [], source: null
      };
    }

    const applicable = !keyStage || record.keyStages.includes(keyStage);
    return {
      jurisdiction: 'England',
      framework: 'National Curriculum',
      subject,
      year,
      keyStage,
      status: applicable ? 'registered' : 'not-applicable-at-key-stage',
      curriculumType: record.type,
      source: record.source,
      statements: []
    };
  }

  async function load() {
    try {
      const response = await fetch('curriculum/england-national-curriculum.json', { cache: 'no-cache' });
      if (!response.ok) throw new Error(`Curriculum registry returned ${response.status}`);
      state.data = await response.json();
      state.error = null;
      return state.data;
    } catch (error) {
      state.error = error;
      state.data = null;
      throw error;
    }
  }

  state.ready = load();

  window.TEACHR_CURRICULUM = {
    ready: state.ready,
    resolve,
    keyStageForYear,
    get data() { return state.data; },
    get error() { return state.error; }
  };
})();
