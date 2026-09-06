(() => {
  const form = document.getElementById('builderForm');
  const curriculum = document.getElementById('curriculum');
  const subject = document.getElementById('subject');
  const year = document.getElementById('year');
  const topic = document.getElementById('topic');
  const objective = document.getElementById('lessonObjective');
  const priorKnowledge = document.getElementById('priorKnowledge');
  const vocabulary = document.getElementById('v2Vocabulary');
  const lessonStyle = document.getElementById('lessonStyle');
  const assessment = document.getElementById('assessmentMethod');
  const sequence = document.getElementById('v2Sequence');
  const successCriteria = document.getElementById('successCriteria');
  if (!form || !curriculum || !subject || !year || !topic || !objective || !priorKnowledge || !vocabulary || !lessonStyle || !assessment || !sequence || !successCriteria) return;

  const defaults = {
    Mathematics: {
      style: 'Explicit instruction + guided practice',
      assessment: 'Mini-whiteboard checks',
      sequence: 'Retrieval starter → explicit teaching → modelling → guided practice → independent practice → assessment → exit ticket'
    },
    English: {
      style: 'Explicit instruction + guided practice',
      assessment: 'Questioning throughout',
      sequence: 'Retrieval starter → explicit teaching → modelling → guided practice → independent application → review'
    },
    Science: {
      style: 'Practical / hands-on',
      assessment: 'Questioning throughout',
      sequence: 'Retrieval starter → explanation → demonstration/investigation → guided analysis → independent application → review'
    },
    Computing: {
      style: 'Explicit instruction + guided practice',
      assessment: 'Mini-whiteboard checks',
      sequence: 'Retrieval starter → explanation → live modelling → guided coding → independent practice → debugging/check → review'
    },
    'Art and design': {
      style: 'Practical / hands-on',
      assessment: 'Questioning throughout',
      sequence: 'Retrieval starter → demonstration → guided making → independent making → review and evaluation'
    },
    Citizenship: {
      style: 'Discussion + collaborative learning',
      assessment: 'Questioning throughout',
      sequence: 'Retrieval starter → knowledge input → discussion → evidence task → collaborative/application task → review'
    },
    'Design and technology': {
      style: 'Practical / hands-on',
      assessment: 'Questioning throughout',
      sequence: 'Retrieval starter → design brief → demonstration → guided making → independent making → evaluation'
    },
    Geography: {
      style: 'Inquiry / discovery',
      assessment: 'Questioning throughout',
      sequence: 'Retrieval starter → geographical enquiry → teacher modelling → guided analysis → independent application → review'
    },
    History: {
      style: 'Inquiry / discovery',
      assessment: 'Questioning throughout',
      sequence: 'Retrieval starter → historical enquiry → source/evidence analysis → guided reasoning → independent application → review'
    },
    Languages: {
      style: 'Explicit instruction + guided practice',
      assessment: 'Questioning throughout',
      sequence: 'Retrieval starter → model language → pronunciation practice → guided interaction → independent application → review'
    },
    Music: {
      style: 'Practical / hands-on',
      assessment: 'Questioning throughout',
      sequence: 'Retrieval starter → listening/model → demonstration → guided rehearsal/creation → independent performance/creation → review'
    },
    'Physical education': {
      style: 'Practical / hands-on',
      assessment: 'Questioning throughout',
      sequence: 'Retrieval starter → demonstration → guided practice → progressive practice → competitive/application task → review'
    },
    'Religious education (RE)': {
      style: 'Discussion + collaborative learning',
      assessment: 'Questioning throughout',
      sequence: 'Retrieval starter → knowledge input → discussion/enquiry → evidence task → independent reflection → review'
    }
  };

  const STOP_WORDS = new Set(['about','after','again','also','being','between','could','from','have','into','more','must','other','over','should','their','there','these','they','this','those','through','under','using','what','when','where','which','while','with','would','pupils','students','learn','learning','understand','explain','describe','identify','develop','know','able']);
  const state = { values: Object.create(null), applying: false };

  function contextTopic() {
    return (topic.value === '__custom__' ? document.getElementById('customTopic')?.value : topic.value) || '';
  }

  function cleanTopic(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function contextKey() {
    return [curriculum.value, subject.value, year.value, cleanTopic(contextTopic()), objective.value.trim()].join('|');
  }

  function setIfUntouched(field, value, key) {
    if (!field || !value) return;
    const previous = state.values[field.id];
    if (!field.value.trim() || field.value === previous) {
      state.applying = true;
      field.value = value;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      state.applying = false;
      state.values[field.id] = value;
    }
  }

  function deriveVocabulary() {
    const text = `${cleanTopic(contextTopic())} ${objective.value}`
      .toLowerCase()
      .replace(/[^a-z0-9' -]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length >= 5 && !STOP_WORDS.has(word));
    return [...new Set(text)].slice(0, 8).join(' · ');
  }

  function derivePriorKnowledge() {
    const data = defaults[subject.value];
    const topicText = cleanTopic(contextTopic());
    if (!topicText) return '';
    if (subject.value === 'Languages') return `Relevant language already introduced in earlier lessons for ${topicText}.`;
    if (subject.value === 'Physical education') return `Previously taught movement, technique or tactical skills relevant to ${topicText}.`;
    if (subject.value === 'Music') return `Previously taught musical vocabulary and practical skills relevant to ${topicText}.`;
    if (data) return `Relevant knowledge and vocabulary from earlier lessons on ${topicText}.`;
    return '';
  }

  function deriveSuccessCriteria() {
    const text = objective.value.trim();
    if (!text) return '';
    const normalised = text.replace(/^pupils\s+(will|should)\s+/i, '').replace(/[.]+$/, '');
    if (!normalised) return '';
    return `I can ${normalised.charAt(0).toLowerCase()}${normalised.slice(1)}.`;
  }

  function applyDefaults() {
    const data = defaults[subject.value];
    if (!data) return;
    const key = contextKey();
    setIfUntouched(lessonStyle, data.style, key);
    setIfUntouched(assessment, data.assessment, key);
    setIfUntouched(sequence, data.sequence, key);
    setIfUntouched(priorKnowledge, derivePriorKnowledge(), key);
    setIfUntouched(vocabulary, deriveVocabulary(), key);
    setIfUntouched(successCriteria, deriveSuccessCriteria(), key);
  }

  [curriculum, subject, year, topic, objective].forEach(input => {
    input.addEventListener('change', () => setTimeout(applyDefaults, 0));
    input.addEventListener('input', () => setTimeout(applyDefaults, 0));
  });

  form.addEventListener('reset', () => {
    Object.keys(state.values).forEach(key => { state.values[key] = ''; });
    setTimeout(applyDefaults, 0);
  });

  applyDefaults();
})();
