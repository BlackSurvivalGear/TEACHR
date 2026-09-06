(() => {
  const YEAR_TO_KEY_STAGE = {
    'Year 1': 'KS1', 'Year 2': 'KS1', 'Year 3': 'KS2', 'Year 4': 'KS2', 'Year 5': 'KS2', 'Year 6': 'KS2',
    'Year 7': 'KS3', 'Year 8': 'KS3', 'Year 9': 'KS3', 'Year 10': 'KS4', 'Year 11': 'KS4'
  };
  const DATASET_PATHS = {
    Mathematics: 'curriculum/england-national-curriculum/mathematics-ks1-4.json',
    English: 'curriculum/england-national-curriculum/english-ks1-4.json',
    Science: 'curriculum/england-national-curriculum/science-ks1-4.json',
    Computing: 'curriculum/england-national-curriculum/computing-ks1-4.json',
    'Art and design': 'curriculum/england-national-curriculum/art-and-design-ks1-3.json',
    Citizenship: 'curriculum/england-national-curriculum/citizenship-ks3-4.json',
    'Design and technology': 'curriculum/england-national-curriculum/design-and-technology-ks1-3.json'
  };
  const TOPIC_DOMAINS = {
    Mathematics: [
      ['fraction',['Number','Fractions, decimals and percentages']],['decimal',['Number','Fractions, decimals and percentages']],['percentage',['Number','Fractions, decimals and percentages','Ratio and proportion','Ratio, proportion and rates of change']],
      ['ratio',['Ratio and proportion','Ratio, proportion and rates of change']],['proportion',['Ratio and proportion','Ratio, proportion and rates of change']],['algebra',['Algebra']],['equation',['Algebra']],['sequence',['Algebra']],
      ['geometry',['Geometry','Geometry and measures']],['shape',['Geometry','Geometry and measures']],['measure',['Measurement','Geometry and measures']],['probability',['Probability']],['statistic',['Statistics']],['data',['Statistics']],
      ['number',['Number','Number and place value']],['place value',['Number','Number and place value']],['multiplication',['Number','Multiplication and division','Addition, subtraction, multiplication and division']],['division',['Number','Multiplication and division','Addition, subtraction, multiplication and division']],['addition',['Number','Addition and subtraction','Addition, subtraction, multiplication and division']],['subtraction',['Number','Addition and subtraction','Addition, subtraction, multiplication and division']]
    ],
    English: [
      ['reading',['Reading']],['read',['Reading']],['comprehension',['Reading']],['phonics',['Reading']],['literature',['Reading']],['writing',['Writing']],['write',['Writing']],['composition',['Writing']],['creative writing',['Writing']],
      ['grammar',['Vocabulary, grammar and punctuation']],['punctuation',['Vocabulary, grammar and punctuation']],['spelling',['Vocabulary, grammar and punctuation']],['vocabulary',['Vocabulary, grammar and punctuation']],['language',['Vocabulary, grammar and punctuation']],
      ['speaking',['Spoken language']],['speeches',['Spoken language']],['debate',['Spoken language']],['discussion',['Spoken language']],['drama',['Spoken language']],['presentation',['Spoken language']]
    ],
    Science: [
      ['plant',['Plants']],['photosynthesis',['Biology']],['cell',['Biology']],['cells',['Biology']],['animal',['Animals including humans','Biology']],['human',['Animals including humans','Biology']],['body',['Animals including humans','Biology']],['digestive',['Animals including humans','Biology']],['circulatory',['Animals including humans','Biology']],['health',['Animals including humans','Biology']],['disease',['Biology']],['habitat',['Living things and their habitats','Biology']],['ecosystem',['Living things and their habitats','Biology']],['food chain',['Living things and their habitats','Biology']],['evolution',['Evolution and inheritance','Biology']],['inheritance',['Evolution and inheritance','Biology']],['genetics',['Biology']],['adaptation',['Evolution and inheritance','Biology']],
      ['material',['Everyday materials','Uses of everyday materials','Properties and changes of materials','Chemistry']],['matter',['States of matter','Chemistry']],['particle',['Chemistry']],['atom',['Chemistry']],['element',['Chemistry']],['compound',['Chemistry']],['mixture',['Properties and changes of materials','Chemistry']],['reaction',['Properties and changes of materials','Chemistry']],['acid',['Chemistry']],['alkali',['Chemistry']],['periodic',['Chemistry']],['rock',['Rocks','Chemistry']],['earth',['Earth and space','Chemistry']],['atmosphere',['Chemistry']],
      ['light',['Light','Physics']],['sound',['Sound','Physics']],['force',['Forces and magnets','Physics']],['magnet',['Forces and magnets','Physics']],['motion',['Physics']],['energy',['Physics']],['electric',['Electricity','Physics']],['circuit',['Electricity','Physics']],['wave',['Physics']],['pressure',['Physics']],['gravity',['Physics']],['space',['Earth and space','Physics']],['solar',['Earth and space','Physics']],['planet',['Earth and space','Physics']],['working scientifically',['Working scientifically']],['scientific enquiry',['Working scientifically']],['experiment',['Working scientifically']],['investigation',['Working scientifically']]
    ],
    Computing: [
      ['algorithm',['Algorithms and programming','Algorithms and logical reasoning','Algorithms and computational thinking']],['algorithms',['Algorithms and programming','Algorithms and logical reasoning','Algorithms and computational thinking']],['program',['Algorithms and programming','Programming and decomposition','Programming and data structures','Computer science']],['programming',['Algorithms and programming','Programming and decomposition','Programming and data structures','Computer science']],['code',['Algorithms and programming','Programming and decomposition','Programming and data structures','Computer science']],['debug',['Debugging and logical reasoning','Programming and decomposition']],['debugging',['Debugging and logical reasoning','Programming and decomposition']],['decomposition',['Programming and decomposition']],['sequence',['Sequence, selection, repetition, variables, input and output']],['selection',['Sequence, selection, repetition, variables, input and output']],['repetition',['Sequence, selection, repetition, variables, input and output']],['variable',['Sequence, selection, repetition, variables, input and output']],['input',['Sequence, selection, repetition, variables, input and output']],['output',['Sequence, selection, repetition, variables, input and output']],['network',['Networks and the internet','Computer systems and communication']],['internet',['Networks and the internet']],['web',['Networks and the internet']],['search',['Search and evaluation of digital content']],['data',['Software, data and digital content','Digital data representation']],['binary',['Boolean logic and binary representation','Digital data representation']],['boolean',['Boolean logic and binary representation']],['logic',['Boolean logic and binary representation','Algorithms and computational thinking']],['hardware',['Computer systems and communication']],['software',['Software, data and digital content','Computer systems and communication','Information technology']],['digital media',['Digital media']],['information technology',['Information technology']],['cyber',['Online safety, security and privacy','Online safety and responsible use']],['online safety',['Online safety, security and privacy','Online safety and responsible use']],['privacy',['Online safety, security and privacy','Online safety and responsible use']],['security',['Online safety, security and privacy']],['digital literacy',['Digital content','Online safety and responsible use']]
    ],
    'Art and design': [
      ['drawing',['Creating and making','Techniques and formal elements','Drawing, painting and sculpture','Techniques and media']],['painting',['Creating and making','Drawing, painting and sculpture','Techniques and media']],['sculpture',['Creating and making','Drawing, painting and sculpture']],['colour',['Techniques and formal elements']],['pattern',['Techniques and formal elements']],['texture',['Techniques and formal elements']],['line',['Techniques and formal elements']],['shape',['Techniques and formal elements']],['form',['Techniques and formal elements']],['space',['Techniques and formal elements']],['material',['Developing techniques','Techniques and media']],['sketchbook',['Sketchbooks and recording','Techniques and media']],['sketchbooks',['Sketchbooks and recording','Techniques and media']],['artist',['Artists, craft makers and designers','Artists, architects and designers','History of art, craft, design and architecture']],['artists',['Artists, craft makers and designers','Artists, architects and designers','History of art, craft, design and architecture']],['designer',['Artists, architects and designers','History of art, craft, design and architecture']],['architect',['Artists, architects and designers','History of art, craft, design and architecture']],['evaluate',['Analysis and evaluation']],['analysis',['Analysis and evaluation']],['art history',['History of art, craft, design and architecture']],['craft',['History of art, craft, design and architecture']]
    ],
    Citizenship: [
      ['democracy',['Democracy, government and political participation','Parliamentary democracy and the UK constitution']],['government',['Democracy, government and political participation','Forms of government and international governance']],['parliament',['Parliament, elections and political parties','Parliamentary democracy and the UK constitution']],['election',['Parliament, elections and political parties','Elections and democratic participation']],['electoral',['Elections and democratic participation']],['political party',['Parliament, elections and political parties']],['rights',['Rights, liberties and responsibilities','Human rights and international law']],['liberties',['Rights, liberties and responsibilities']],['law',['Law, justice and the legal system','UK law and the justice system']],['justice',['Law, justice and the legal system','UK law and the justice system']],['court',['Law, justice and the legal system','UK law and the justice system']],['police',['Law, justice and the legal system']],['community',['Public institutions, voluntary groups and community participation','Community participation and responsible activity']],['volunteer',['Public institutions, voluntary groups and community participation','Community participation and responsible activity']],['money',['Money, budgeting and financial decision-making','Personal finance and public money']],['budget',['Money, budgeting and financial decision-making']],['finance',['Personal finance and public money']],['credit',['Personal finance and public money']],['debt',['Personal finance and public money']],['insurance',['Personal finance and public money']],['pension',['Personal finance and public money']],['human rights',['Human rights and international law']],['constitution',['Parliamentary democracy and the UK constitution']],['diversity',['Identity, diversity, mutual respect and understanding']],['identity',['Identity, diversity, mutual respect and understanding']],['international',['Forms of government and international governance']],['united nations',['Forms of government and international governance']],['evidence',['Research, evidence, debate and informed action','Research, evidence, persuasion and civic action']],['debate',['Research, evidence, debate and informed action','Research, evidence, persuasion and civic action']],['argument',['Research, evidence, debate and informed action','Research, evidence, persuasion and civic action']],['campaign',['Research, evidence, persuasion and civic action']],['participation',['Democracy, government and political participation','Community participation and responsible activity','Elections and democratic participation']]
    ],
    'Design and technology': [
      ['design',['Design']],['design criteria',['Design','Evaluate']],['prototype',['Design','Make']],['sketch',['Design']],['specification',['Design','Evaluate']],['user',['Design','Evaluate']],['make',['Make']],['manufacture',['Make']],['tool',['Make']],['equipment',['Make']],['machinery',['Make']],['computer-aided manufacture',['Make']],['cam',['Make','Technical knowledge']],['material',['Make','Technical knowledge']],['textile',['Make']],['ingredient',['Make','Cooking and nutrition']],['structure',['Technical knowledge']],['mechanism',['Technical knowledge']],['gear',['Technical knowledge']],['pulley',['Technical knowledge']],['lever',['Technical knowledge']],['linkage',['Technical knowledge']],['electrical',['Technical knowledge']],['circuit',['Technical knowledge']],['sensor',['Technical knowledge']],['actuator',['Technical knowledge']],['microcontroller',['Technical knowledge']],['program',['Technical knowledge']],['control',['Technical knowledge']],['nutrition',['Cooking and nutrition']],['healthy eating',['Cooking and nutrition']],['cook',['Cooking and nutrition']],['cooking',['Cooking and nutrition']],['seasonality',['Cooking and nutrition']],['food',['Cooking and nutrition']],['evaluate',['Evaluate']],['test',['Evaluate']],['refine',['Evaluate']],['technology',['Evaluate','Technical knowledge']],['designer',['Evaluate']],['engineer',['Evaluate']],['environment',['Evaluate']]
    ]
  };
  const state = { registry: null, datasets: {}, ready: null, error: null };
  function keyStageForYear(year) { return YEAR_TO_KEY_STAGE[year] || ''; }
  function matchingDomains(subject, topic, keyStage) {
    const text = String(topic || '').toLowerCase();
    const matches = (TOPIC_DOMAINS[subject] || []).filter(([term]) => text.includes(term)).flatMap(([, domains]) => domains);
    const available = state.datasets[subject]?.domains?.[keyStage] || [];
    const unique = [...new Set(matches)].filter(domain => available.includes(domain));
    return unique.length ? unique : available;
  }
  function resolve(selection = {}) {
    const curriculum = String(selection.curriculum || '').trim();
    const subject = String(selection.subject || '').trim();
    const year = String(selection.year || '').trim();
    const topic = String(selection.topic || '').trim();
    const keyStage = keyStageForYear(year);
    if (!state.registry || !/^England\s*[—-]\s*National Curriculum$/i.test(curriculum)) return { jurisdiction:'',framework:curriculum,subject,year,topic,keyStage,status:'unresolved',statements:[],objectives:[],source:null };
    const record = state.registry.subjects?.[subject] || state.registry.statutoryRequirements?.[subject] || null;
    if (!record) return { jurisdiction:'England',framework:'National Curriculum',subject,year,topic,keyStage,status:'subject-not-registered',statements:[],objectives:[],source:null };
    const applicable = !keyStage || record.keyStages.includes(keyStage);
    const detailed = state.datasets[subject] || null;
    const domains = detailed && keyStage ? matchingDomains(subject, topic, keyStage) : [];
    const objectives = detailed?.objectives?.[keyStage]?.filter(item => !domains.length || domains.includes(item.domain)) || [];
    return { jurisdiction:'England',framework:'National Curriculum',subject,year,topic,keyStage,status:applicable ? (detailed ? 'verified-source-structure' : 'registered') : 'not-applicable-at-key-stage',curriculumType:record.type,source:record.source,domains,objectives,statements:objectives.map(item => `${item.id}: ${item.summary}`) };
  }
  async function load() {
    try {
      const registryResponse = await fetch('curriculum/england-national-curriculum.json',{cache:'no-cache'});
      if (!registryResponse.ok) throw new Error(`Curriculum registry returned ${registryResponse.status}`);
      state.registry = await registryResponse.json();
      const entries = await Promise.all(Object.entries(DATASET_PATHS).map(async ([subject,path]) => {
        const response = await fetch(path,{cache:'no-cache'});
        if (!response.ok) throw new Error(`${subject} curriculum dataset returned ${response.status}`);
        return [subject,await response.json()];
      }));
      state.datasets = Object.fromEntries(entries);
      state.error = null;
      return state.registry;
    } catch (error) {
      state.error = error; state.registry = null; state.datasets = {}; throw error;
    }
  }
  state.ready = load();
  window.TEACHR_CURRICULUM = { ready:state.ready, resolve, keyStageForYear, get data(){return state.registry;}, get detail(){return state.datasets;}, get error(){return state.error;} };
})();
