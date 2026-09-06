(() => {
  const form = document.getElementById('builderForm');
  const toolCards = document.querySelectorAll('.tool-card');
  if (!form) return;

  const style = document.createElement('style');
  style.textContent = `
    .lesson-design-panel{grid-column:1/-1;margin-top:4px;padding:20px;border:1px solid rgba(83,170,255,.18);border-radius:18px;background:linear-gradient(145deg,rgba(22,50,88,.42),rgba(7,23,45,.38))}
    .lesson-design-head{display:flex;justify-content:space-between;gap:20px;align-items:start;margin-bottom:16px}
    .lesson-design-head strong{display:block;font-size:14px;color:#eef5ff;margin-bottom:3px}
    .lesson-design-head span{display:block;font-size:11px;color:#7890ae}
    .lesson-reset{border:1px solid rgba(155,190,255,.14);background:rgba(255,255,255,.04);color:#91b8df;border-radius:9px;padding:7px 10px;font-size:10px;font-weight:700}
    .lesson-reset:hover{background:rgba(255,255,255,.08);color:#fff}
    .lesson-design-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
    .lesson-design-grid .field-wide{grid-column:1/-1}
    .lesson-design-grid textarea{min-height:72px;resize:vertical}
    @media(max-width:620px){.lesson-design-panel{grid-column:auto}.lesson-design-grid{grid-template-columns:1fr}.lesson-design-grid .field-wide{grid-column:auto}.lesson-design-head{flex-direction:column}}
  `;
  document.head.appendChild(style);

  const topic = document.getElementById('topic');
  const notes = document.getElementById('notes');
  const extra = document.getElementById('extraInstruction');
  if (!topic || !notes || !extra) return;

  const panel = document.createElement('div');
  panel.className = 'lesson-design-panel';
  panel.innerHTML = `
    <div class="lesson-design-head">
      <div><p class="eyebrow">LESSON DESIGN</p><strong>Give TEACHR the teaching context</strong><span>These controls shape the generation brief and help produce a lesson that fits your class.</span></div>
      <button type="button" class="lesson-reset" id="resetLessonDesign">Reset</button>
    </div>
    <div class="lesson-design-grid">
      <div class="field"><label for="lessonObjective">Learning objective</label><input id="lessonObjective" placeholder="What should pupils know or be able to do?"></div>
      <div class="field"><label for="priorKnowledge">Prior knowledge</label><input id="priorKnowledge" placeholder="What should pupils already know?"></div>
      <div class="field"><label for="v2Vocabulary">Key vocabulary</label><input id="v2Vocabulary" placeholder="e.g. algorithm, pseudocode, iteration, efficiency"></div>
      <div class="field"><label for="lessonStyle">Lesson approach</label><select id="lessonStyle"><option>Explicit instruction + guided practice</option><option>Inquiry / discovery</option><option>Retrieval + deliberate practice</option><option>Discussion + collaborative learning</option><option>Practical / hands-on</option></select></div>
      <div class="field"><label for="v2Starter">Retrieval starter</label><input id="v2Starter" placeholder="What should pupils retrieve at the start?"></div>
      <div class="field"><label for="assessmentMethod">Assessment method</label><select id="assessmentMethod"><option>Exit ticket</option><option>Mini-whiteboard checks</option><option>Questioning throughout</option><option>Short quiz</option><option>Self-assessment</option></select></div>
      <div class="field"><label for="v2Misconceptions">Common misconceptions</label><input id="v2Misconceptions" placeholder="What errors or misunderstandings should be addressed?"></div>
      <div class="field"><label for="v2Challenge">Stretch & challenge</label><input id="v2Challenge" placeholder="How should confident pupils be extended?"></div>
      <div class="field"><label for="supportNeeds">Support / SEND / EAL</label><input id="supportNeeds" placeholder="e.g. vocabulary support, chunking, visual prompts"></div>
      <div class="field"><label for="resourcesNeeded">Resources needed</label><input id="resourcesNeeded" placeholder="e.g. slides, cards, practical equipment"></div>
      <div class="field"><label for="v2Homework">Homework / next step</label><input id="v2Homework" placeholder="What should pupils do after the lesson?"></div>
      <div class="field"><label for="v2Sequence">Lesson sequence</label><input id="v2Sequence" placeholder="e.g. starter → modelling → guided → independent → exit ticket"></div>
      <div class="field field-wide"><label for="successCriteria">Success criteria</label><textarea id="successCriteria" rows="2" placeholder="How will pupils know they have succeeded?"></textarea></div>
      <div class="field field-wide"><label for="v2Reflection">Teacher reflection</label><textarea id="v2Reflection" rows="2" placeholder="What evidence should the teacher review after the lesson?"></textarea></div>
    </div>`;

  const actions = form.querySelector('.form-actions');
  const aiPanel = document.getElementById('aiProviderPanel');
  if (aiPanel) form.insertBefore(panel, aiPanel);
  else if (actions) form.insertBefore(panel, actions);
  else form.appendChild(panel);

  const ids = ['lessonObjective','priorKnowledge','v2Vocabulary','lessonStyle','v2Starter','assessmentMethod','v2Misconceptions','v2Challenge','supportNeeds','resourcesNeeded','v2Homework','v2Sequence','successCriteria','v2Reflection'];
  const fields = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
  const baseExtra = () => extra.value.replace(/\n?\[TEACHR LESSON DESIGN\][\s\S]*$/, '').trim();

  function syncBrief() {
    const parts = [];
    if (fields.lessonObjective.value.trim()) parts.push(`Learning objective: ${fields.lessonObjective.value.trim()}`);
    if (fields.priorKnowledge.value.trim()) parts.push(`Prior knowledge: ${fields.priorKnowledge.value.trim()}`);
    if (fields.v2Vocabulary.value.trim()) parts.push(`Key vocabulary: ${fields.v2Vocabulary.value.trim()}`);
    if (fields.lessonStyle.value) parts.push(`Lesson approach: ${fields.lessonStyle.value}`);
    if (fields.v2Starter.value.trim()) parts.push(`Retrieval starter: ${fields.v2Starter.value.trim()}`);
    if (fields.assessmentMethod.value) parts.push(`Assessment method: ${fields.assessmentMethod.value}`);
    if (fields.v2Misconceptions.value.trim()) parts.push(`Common misconceptions: ${fields.v2Misconceptions.value.trim()}`);
    if (fields.v2Challenge.value.trim()) parts.push(`Stretch and challenge: ${fields.v2Challenge.value.trim()}`);
    if (fields.supportNeeds.value.trim()) parts.push(`Support needs: ${fields.supportNeeds.value.trim()}`);
    if (fields.resourcesNeeded.value.trim()) parts.push(`Resources needed: ${fields.resourcesNeeded.value.trim()}`);
    if (fields.v2Homework.value.trim()) parts.push(`Homework / next step: ${fields.v2Homework.value.trim()}`);
    if (fields.v2Sequence.value.trim()) parts.push(`Lesson sequence: ${fields.v2Sequence.value.trim()}`);
    if (fields.successCriteria.value.trim()) parts.push(`Success criteria: ${fields.successCriteria.value.trim()}`);
    if (fields.v2Reflection.value.trim()) parts.push(`Teacher reflection: ${fields.v2Reflection.value.trim()}`);
    extra.value = [baseExtra(), parts.length ? `[TEACHR LESSON DESIGN]\n${parts.join('\n')}` : ''].filter(Boolean).join('\n\n');
  }

  ids.forEach(id => { fields[id].addEventListener('input', syncBrief); fields[id].addEventListener('change', syncBrief); });
  document.getElementById('resetLessonDesign').addEventListener('click', () => {
    ids.forEach(id => { if (fields[id].tagName === 'SELECT') fields[id].selectedIndex = 0; else fields[id].value = ''; });
    syncBrief();
  });

  function updateVisibility() {
    const active = document.querySelector('.tool-card.active')?.dataset.tool;
    panel.style.display = active === 'lesson' ? 'block' : 'none';
  }
  toolCards.forEach(card => card.addEventListener('click', () => setTimeout(updateVisibility, 0)));
  updateVisibility();
})();
