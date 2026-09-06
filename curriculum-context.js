(() => {
  const originalFetch = window.fetch.bind(window);
  const registry = window.TEACHR_CURRICULUM;

  const SUBJECT_DATASETS = {
    History: 'curriculum/england-national-curriculum/history-ks1-3.json',
    Languages: 'curriculum/england-national-curriculum/languages-ks2-3.json'
  };
  const TOPIC_DOMAINS = {
    History: [
      ['chronology',['Chronology and historical concepts']],['chronological',['Chronology and historical concepts']],['change',['Chronology and historical concepts','Changes and events','British history beyond 1066','British history themes']],['continuity',['Chronology and historical concepts','British history themes']],['cause',['Chronology and historical concepts']],['consequence',['Chronology and historical concepts']],['similarity',['Chronology and historical concepts']],['difference',['Chronology and historical concepts']],['significance',['Chronology and historical concepts']],
      ['source',['Historical enquiry and sources','Historical enquiry, evidence and interpretations']],['sources',['Historical enquiry and sources','Historical enquiry, evidence and interpretations']],['evidence',['Historical enquiry and sources','Historical enquiry, evidence and interpretations']],['interpretation',['Historical enquiry, evidence and interpretations']],['enquiry',['Historical enquiry and sources','Historical enquiry, evidence and interpretations']],['living memory',['Changes and events']],['significant individual',['Significant individuals']],['individual',['Significant individuals']],['local history',['Local history']],['stone age',['Stone Age to Iron Age']],['iron age',['Stone Age to Iron Age']],['roman',['Roman Britain']],['roman empire',['Roman Britain']],['anglo-saxon',['Anglo-Saxons and Scots','Viking and Anglo-Saxon struggle']],['anglo saxon',['Anglo-Saxons and Scots','Viking and Anglo-Saxon struggle']],['scots',['Anglo-Saxons and Scots']],['viking',['Viking and Anglo-Saxon struggle']],['vikings',['Viking and Anglo-Saxon struggle']],['ancient civilisation',['Ancient civilisations']],['ancient civilizations',['Ancient civilisations']],['ancient egypt',['Ancient civilisations']],['sumer',['Ancient civilisations']],['indus valley',['Ancient civilisations']],['shang',['Ancient civilisations']],['ancient greece',['Ancient Greece']],['greek',['Ancient Greece']],['islamic civilisation',['Non-European societies']],['mayan',['Non-European societies']],['benin',['Non-European societies']],['medieval',['Medieval Britain 1066-1509']],['norman',['Medieval Britain 1066-1509']],['magna carta',['Medieval Britain 1066-1509']],['black death',['Medieval Britain 1066-1509']],['wars of the roses',['Medieval Britain 1066-1509']],['reformation',['Britain 1509-1745']],['renaissance',['Britain 1509-1745']],['civil war',['Britain 1509-1745']],['restoration',['Britain 1509-1745']],['glorious revolution',['Britain 1509-1745']],['industrial',['Ideas, political power, industry and empire 1745-1901']],['industry',['Ideas, political power, industry and empire 1745-1901']],['empire',['Ideas, political power, industry and empire 1745-1901']],['slave trade',['Ideas, political power, industry and empire 1745-1901']],['abolition',['Ideas, political power, industry and empire 1745-1901']],['franchise',['Ideas, political power, industry and empire 1745-1901']],['world war',['Britain, Europe and wider world 1901-present']],['first world war',['Britain, Europe and wider world 1901-present']],['second world war',['Britain, Europe and wider world 1901-present']],['holocaust',['Britain, Europe and wider world 1901-present']],['welfare state',['Britain, Europe and wider world 1901-present']],['migration',['British history themes']],['political power',['British history themes']],['turning point',['British history themes']],['world history',['World history and interconnections']],['society',['World history and interconnections']]
    ],
    Languages: [
      ['listening',['Listening and responding','Listening']],['listen',['Listening and responding','Listening']],['speaking',['Speaking and presentation','Speaking and interaction']],['speak',['Speaking and presentation','Speaking and interaction']],['conversation',['Spoken interaction','Speaking and interaction']],['communicat',['Spoken interaction','Speaking and interaction']],['pronunciation',['Phonology, spelling and sound','Speaking and interaction']],['intonation',['Phonology, spelling and sound','Speaking and interaction']],['phonology',['Phonology, spelling and sound']],['sound',['Phonology, spelling and sound']],['spelling',['Phonology, spelling and sound','Writing']],['reading',['Reading and comprehension','Reading']],['read',['Reading and comprehension','Reading']],['writing',['Writing and adaptation','Writing']],['write',['Writing and adaptation','Writing']],['vocabulary',['Vocabulary and dictionaries','Grammar and vocabulary']],['dictionary',['Vocabulary and dictionaries']],['grammar',['Grammar and language structures','Grammar and vocabulary']],['tense',['Grammar and language structures','Grammar and vocabulary']],['verb',['Grammar and language structures','Grammar and vocabulary']],['translation',['Translation']],['translate',['Translation']],['literature',['Literary texts']],['literary',['Literary texts']],['story',['Cultural texts','Literary texts']],['song',['Cultural texts']],['poem',['Cultural texts']],['poetry',['Cultural texts','Literary texts']],['culture',['Culture and wider understanding']],['opinion',['Spoken interaction','Speaking and interaction']],['question',['Spoken interaction','Speaking and interaction']],['describe',['Description','Writing']],['description',['Description','Writing']],['dictionary skills',['Vocabulary and dictionaries','Language learning strategies']],['language learning',['Language learning strategies']]
    ]
  };

  const datasetReady = Object.entries(SUBJECT_DATASETS).map(([subject,path]) => fetch(path,{cache:'no-cache'}).then(async response => {
    if (!response.ok) throw new Error(`${subject} curriculum dataset returned ${response.status}`);
    return [subject,await response.json()];
  }));

  if (registry) {
    const originalResolve = registry.resolve.bind(registry);
    const originalReady = registry.ready;
    registry.ready = Promise.all([originalReady, ...datasetReady]).then(([loadedRegistry, ...datasets]) => {
      if (registry.detail) datasets.forEach(([subject,dataset]) => { registry.detail[subject] = dataset; });
      return loadedRegistry;
    });
    registry.resolve = (selection = {}) => {
      const subject = String(selection.subject || '').trim();
      const resolved = originalResolve(selection);
      if (!SUBJECT_DATASETS[subject] || !resolved.jurisdiction) return resolved;
      const dataset = registry.detail?.[subject];
      if (!dataset) return resolved;
      const text = String(selection.topic || '').toLowerCase();
      const keyStage = resolved.keyStage;
      const available = dataset.domains?.[keyStage] || [];
      const matches = (TOPIC_DOMAINS[subject] || []).filter(([term]) => text.includes(term)).flatMap(([,domains]) => domains);
      const domains = [...new Set(matches)].filter(domain => available.includes(domain));
      const objectives = dataset.objectives?.[keyStage]?.filter(item => !domains.length || domains.includes(item.domain)) || [];
      return { ...resolved, status: resolved.status === 'not-applicable-at-key-stage' ? resolved.status : 'verified-source-structure', domains, objectives, statements: objectives.map(item => `${item.id}: ${item.summary}`) };
    };
  }

  function curriculumContext(inputs) {
    const currentRegistry = window.TEACHR_CURRICULUM;
    if (!currentRegistry) return '';
    const resolved = currentRegistry.resolve(inputs);
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
