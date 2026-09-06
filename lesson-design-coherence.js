(() => {
  const form = document.getElementById('builderForm');
  const panel = document.querySelector('.lesson-design-panel');
  if (!form || !panel) return;

  const ids = [
    'lessonObjective','priorKnowledge','v2Vocabulary','lessonStyle','assessmentMethod',
    'v2Starter','v2Misconceptions','v2Challenge','supportNeeds','resourcesNeeded',
    'v2Homework','v2Sequence','successCriteria','v2Reflection'
  ];
  const fields = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
  if (ids.some(id => !fields[id])) return;

  const practicalSubjects = new Set(['Science','Art and design','Design and technology','Music','Physical education']);
  const complexSupportSubjects = new Set(['Computing','Science','Design and technology','Languages','Mathematics']);
  const coherence = document.createElement('section');
  coherence.className = 'lesson-coherence';
  coherence.setAttribute('aria-live', 'polite');
  coherence.innerHTML = `
    <div class="lesson-coherence-head">
      <div><p class="eyebrow">PHASE 3 · COHERENCE</p><strong>Lesson design review</strong><span>Checks how the teaching choices fit together. Guidance is advisory and never blocks lesson generation.</span></div>
      <span class="lesson-coherence-status" id="lessonCoherenceStatus">Ready to review</span>
    </div>
    <div class="lesson-coherence-list" id="lessonCoherenceList"></div>`;
  panel.insertAdjacentElement('afterend', coherence);

  const style = document.createElement('style');
  style.textContent = `
    .lesson-coherence{grid-column:1/-1;margin-top:14px;padding:16px;border:1px solid rgba(83,170,255,.14);border-radius:14px;background:rgba(7,23,45,.28)}
    .lesson-coherence-head{display:flex;justify-content:space-between;gap:14px;align-items:start;margin-bottom:10px}
    .lesson-coherence-head strong{display:block;font-size:13px;color:#eef5ff;margin-bottom:3px}
    .lesson-coherence-head span{display:block;font-size:10px;color:#7890ae;max-width:650px}
    .lesson-coherence-status{white-space:nowrap;padding:5px 8px;border:1px solid rgba(155,190,255,.14);border-radius:8px;color:#91b8df!important;font-size:9px!important;font-weight:700}
    .lesson-coherence-list{display:grid;gap:7px}
    .lesson-coherence-item{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:9px 10px;border-radius:9px;background:rgba(255,255,255,.025);font-size:10px;color:#a8bad0}
    .lesson-coherence-item strong{color:#dce9f8;font-size:10px}
    .lesson-coherence-item button{flex:none;border:1px solid rgba(155,190,255,.14);background:rgba(255,255,255,.04);color:#91b8df;border-radius:7px;padding:5px 7px;font-size:9px;font-weight:700}
    .lesson-coherence-item button:hover{background:rgba(255,255,255,.08);color:#fff}
    .lesson-coherence-ok{color:#9bc6a8!important}
    @media(max-width:620px){.lesson-coherence{grid-column:auto}.lesson-coherence-head{flex-direction:column}.lesson-coherence-item{align-items:flex-start;flex-direction:column}}
  `;
  document.head.appendChild(style);

  const status = document.getElementById('lessonCoherenceStatus');
  const list = document.getElementById('lessonCoherenceList');

  function value(id){ return String(fields[id].value || '').trim(); }
  function hasAny(){ return ids.some(id => value(id)); }
  function keywords(){
    return [...new Set(`${value('lessonObjective')} ${value('v2Vocabulary')}`.toLowerCase().replace(/[^a-z0-9' -]/g,' ').split(/\s+/).filter(w => w.length >= 5))].slice(0,5);
  }
  function checks(){
    const subject = value('subject') || document.getElementById('subject')?.value || '';
    const topic = value('topic') || document.getElementById('topic')?.value || '';
    const issues = [];
    const objective = value('lessonObjective');
    const success = value('successCriteria');
    const sequence = value('v2Sequence').toLowerCase();
    const assessment = value('assessmentMethod').toLowerCase();

    if (!objective) issues.push({field:'lessonObjective', title:'Learning objective', text:'Add the main intended learning so the other lesson-design choices have a clear anchor.'});
    if (objective && !success) issues.push({field:'successCriteria', title:'Success criteria', text:'Consider adding observable criteria that show what successful learning will look like.'});
    if (!value('v2Starter') && (objective || topic)) issues.push({field:'v2Starter', title:'Retrieval starter', text:'Consider a short retrieval activity linked to prerequisite knowledge or the current topic.'});
    if (!value('v2Sequence')) issues.push({field:'v2Sequence', title:'Lesson sequence', text:'Add the main teaching flow so the approach, practice and assessment form a coherent progression.'});
    if (assessment && sequence && !sequence.includes('exit') && assessment.includes('exit')) issues.push({field:'v2Sequence', title:'Assessment in sequence', text:'The selected assessment is an exit ticket, but the sequence does not mention when it happens.'});
    if (assessment && sequence && assessment.includes('quiz') && !sequence.includes('quiz')) issues.push({field:'v2Sequence', title:'Assessment in sequence', text:'The selected assessment is a quiz, but the sequence does not show where it is used.'});
    if (practicalSubjects.has(subject) && !value('resourcesNeeded')) issues.push({field:'resourcesNeeded', title:'Resources', text:'This subject often benefits from explicit resource planning; consider listing the equipment, materials or stimuli required.'});
    if (value('lessonStyle').toLowerCase().includes('practical') && !value('resourcesNeeded')) issues.push({field:'resourcesNeeded', title:'Practical resources', text:'A practical lesson approach is selected, so consider recording the equipment or materials needed.'});
    if (complexSupportSubjects.has(subject) && !value('supportNeeds')) issues.push({field:'supportNeeds', title:'Support options', text:'Consider recording accessible explanations, modelling, prompts or other support that may help pupils access the task.'});
    const terms = keywords();
    if (value('v2Starter') && terms.length && !terms.some(term => value('v2Starter').toLowerCase().includes(term))) issues.push({field:'v2Starter', title:'Retrieval alignment', text:'The starter does not visibly reuse the main objective/vocabulary terms. Consider checking that retrieval targets useful prerequisite knowledge.'});
    if (objective && value('v2Challenge') && !value('v2Challenge').toLowerCase().includes('objective')) issues.push({field:'v2Challenge', title:'Challenge alignment', text:'Check that the extension increases depth or independence while still serving the learning objective.'});
    if (objective && !value('assessmentMethod')) issues.push({field:'assessmentMethod', title:'Assessment', text:'Select an assessment method that gives evidence against the learning objective.'});
    if (!value('priorKnowledge') && objective) issues.push({field:'priorKnowledge', title:'Prior knowledge', text:'Consider identifying the knowledge or skill pupils need before starting the new learning.'});
    if (!value('v2Misconceptions') && objective) issues.push({field:'v2Misconceptions', title:'Misconceptions', text:'Consider noting the most likely error or misunderstanding to probe during the lesson.'});
    return issues;
  }

  function applySuggestion(issue){
    const field = fields[issue.field];
    if (!field || field.value.trim()) return;
    const suggestions = {
      lessonObjective:'Define one clear, pupil-centred learning outcome for the lesson.',
      successCriteria:'Success criteria: pupils can demonstrate the intended knowledge or skill accurately and explain or apply it where appropriate.',
      v2Starter:'Retrieve prerequisite knowledge or vocabulary, then use one quick check before new teaching.',
      v2Sequence:'Retrieval → explicit teaching/model → guided practice → independent application → assessment/feedback.',
      resourcesNeeded:'List the teaching materials, pupil resources, equipment or stimuli required for the planned activities.',
      supportNeeds:'Use clear modelling, chunked instructions, key vocabulary and prompts where they improve access to the task.',
      assessmentMethod:'Exit ticket'
    };
    if (!suggestions[issue.field]) return;
    field.value = suggestions[issue.field];
    field.dispatchEvent(new Event('input',{bubbles:true}));
    review();
  }

  function review(){
    if (!hasAny()) {
      status.textContent = 'Ready to review';
      list.innerHTML = '<div class="lesson-coherence-item"><span>Add lesson-design details to receive coherence guidance.</span></div>';
      return;
    }
    const issues = checks();
    status.textContent = issues.length ? `${issues.length} suggestion${issues.length === 1 ? '' : 's'}` : 'Coherent at a glance';
    if (!issues.length) {
      list.innerHTML = '<div class="lesson-coherence-item lesson-coherence-ok"><strong>No obvious coherence gaps detected.</strong><span>Review the final brief using your professional judgement.</span></div>';
      return;
    }
    list.innerHTML = issues.map((issue,index) => {
      const canApply = fields[issue.field] && !value(issue.field) && ['lessonObjective','successCriteria','v2Starter','v2Sequence','resourcesNeeded','supportNeeds','assessmentMethod'].includes(issue.field);
      return `<div class="lesson-coherence-item"><span><strong>${issue.title}:</strong> ${issue.text}</span>${canApply ? `<button type="button" data-coherence-index="${index}">Apply suggestion</button>` : ''}</div>`;
    }).join('');
    list.querySelectorAll('[data-coherence-index]').forEach(button => button.addEventListener('click', () => applySuggestion(issues[Number(button.dataset.coherenceIndex)])));
  }

  ids.forEach(id => {
    fields[id].addEventListener('input', review);
    fields[id].addEventListener('change', review);
  });
  form.addEventListener('reset', () => setTimeout(review, 0));
  const toolCards = document.querySelectorAll('.tool-card');
  function updateVisibility(){
    const active = document.querySelector('.tool-card.active')?.dataset.tool;
    coherence.style.display = active === 'lesson' ? 'block' : 'none';
  }
  toolCards.forEach(card => card.addEventListener('click', () => setTimeout(updateVisibility, 0)));
  updateVisibility();
  review();
})();