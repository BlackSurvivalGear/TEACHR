(() => {
  const form = document.getElementById('builderForm');
  if (!form) return;

  const fields = {
    curriculum: document.getElementById('curriculum'),
    subject: document.getElementById('subject'),
    year: document.getElementById('year'),
    topic: document.getElementById('topic'),
    objective: document.getElementById('lessonObjective'),
    priorKnowledge: document.getElementById('priorKnowledge'),
    vocabulary: document.getElementById('v2Vocabulary'),
    style: document.getElementById('lessonStyle'),
    assessment: document.getElementById('assessmentMethod'),
    sequence: document.getElementById('v2Sequence'),
    successCriteria: document.getElementById('successCriteria')
  };

  if (Object.values(fields).some(field => !field)) return;

  const state = Object.fromEntries(Object.keys(fields).map(key => [key, '']));
  const initialValues = Object.fromEntries(Object.keys(fields).map(key => [key, fields[key].value]));
  let applying = false;

  function contextKey() {
    return [fields.curriculum.value, fields.subject.value, fields.year.value, fields.topic.value, fields.objective.value]
      .map(value => value.trim().toLowerCase()).join('|');
  }

  function setGenerated(key, value) {
    if (!value || !fields[key]) return;
    applying = true;
    fields[key].value = value;
    state[key] = value;
    applying = false;
    fields[key].dispatchEvent(new Event(fields[key].tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  }

  function subjectLower() { return fields.subject.value.trim().toLowerCase(); }

  function lessonStyleDefault() {
    const subject = subjectLower();
    if (/science|physical education|pe|music|art|design|technology|computing/.test(subject)) return 'Practical / hands-on';
    if (/citizenship|history|geography|religious|languages/.test(subject)) return 'Discussion + collaborative learning';
    if (/mathematics|maths|english/.test(subject)) return 'Explicit instruction + guided practice';
    return 'Explicit instruction + guided practice';
  }

  function assessmentDefault() {
    const subject = subjectLower();
    if (/mathematics|maths|computing|science/.test(subject)) return 'Mini-whiteboard checks';
    if (/languages|english/.test(subject)) return 'Questioning throughout';
    if (/history|geography|citizenship|music|art|design|physical education|pe/.test(subject)) return 'Questioning throughout';
    return 'Exit ticket';
  }

  function cleanTopic() {
    return fields.topic.value.replace(/^__custom__$/i, '').trim() || 'this topic';
  }

  function priorKnowledgeDefault() {
    return `Pupils should be familiar with the key ideas and vocabulary introduced in previous learning on ${cleanTopic()}.`;
  }

  function vocabularyDefault() {
    const source = `${fields.topic.value} ${fields.objective.value}`;
    const words = source
      .replace(/[^A-Za-z0-9' -]/g, ' ')
      .split(/\s+/)
      .map(word => word.replace(/^['-]+|['-]+$/g, ''))
      .filter(word => word.length >= 5)
      .filter(word => !/^(pupils?|students?|should|understand|explain|describe|identify|know|able|lesson|using|about|their|these|those|which|where|when|that|with|from|into|through|will|have|this|topic)$/i.test(word));
    const unique = [...new Map(words.map(word => [word.toLowerCase(), word])).values()];
    return unique.slice(0, 6).join(' · ');
  }

  function sequenceDefault() {
    const style = fields.style.value;
    if (style === 'Practical / hands-on') return 'Retrieval → teacher demonstration → guided practice → practical task → review → assessment';
    if (style === 'Inquiry / discovery') return 'Retrieval → question → investigation → discussion → application → assessment';
    if (style === 'Discussion + collaborative learning') return 'Retrieval → stimulus → discussion → collaborative task → share and evaluate → assessment';
    if (style === 'Retrieval + deliberate practice') return 'Retrieval → explicit teaching → deliberate practice → feedback → assessment';
    return 'Retrieval → explicit teaching → modelling → guided practice → independent practice → assessment';
  }

  function successCriteriaDefault() {
    const objective = fields.objective.value.trim();
    if (!objective) return '';
    const text = objective.replace(/^pupils?\s+(will|should)\s+/i, '').replace(/[.]$/, '');
    return `I can ${text}.`;
  }

  function markTeacherEdit(key) {
    if (applying) return;
    if (state[key] && fields[key].value !== state[key]) state[key] = '';
  }

  Object.keys(state).forEach(key => {
    if (fields[key].tagName !== 'SELECT') fields[key].addEventListener('input', () => markTeacherEdit(key));
    fields[key].addEventListener('change', () => markTeacherEdit(key));
  });

  function canReplace(key) {
    return !fields[key].value.trim() || state[key] || fields[key].value === initialValues[key];
  }

  function applyDefaults() {
    const key = contextKey();
    if (!key || !fields.topic.value.trim()) return;

    if (canReplace('style')) setGenerated('style', lessonStyleDefault());
    if (canReplace('assessment')) setGenerated('assessment', assessmentDefault());
    if (canReplace('priorKnowledge')) setGenerated('priorKnowledge', priorKnowledgeDefault());
    if (canReplace('vocabulary')) setGenerated('vocabulary', vocabularyDefault());
    if (canReplace('sequence')) setGenerated('sequence', sequenceDefault());
    if (canReplace('successCriteria')) setGenerated('successCriteria', successCriteriaDefault());

    form.dataset.lessonDesignPhase1Context = key;
  }

  [fields.curriculum, fields.subject, fields.year, fields.topic, fields.objective, fields.style].forEach(input => {
    input.addEventListener('change', () => setTimeout(applyDefaults, 0));
    input.addEventListener('input', () => setTimeout(applyDefaults, 0));
  });

  setTimeout(applyDefaults, 0);
})();
