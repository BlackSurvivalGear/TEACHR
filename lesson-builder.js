(() => {
  const form = document.getElementById('builderForm');
  const toolCards = document.querySelectorAll('.tool-card');
  if (!form) return;

  const topic = document.getElementById('topic');
  const notes = document.getElementById('notes');
  const extra = document.getElementById('extraInstruction');
  if (!topic || !notes || !extra) return;

  const panel = document.createElement('div');
  panel.className = 'lesson-design-panel';
  panel.innerHTML = `
    <div class="lesson-design-head">
      <div><p class="eyebrow">LESSON DESIGN</p><strong>Give TEACHR the teaching context</strong><span>These controls shape the lesson brief without needing a backend.</span></div>
      <button type="button" class="lesson-reset" id="resetLessonDesign">Reset</button>
    </div>
    <div class="lesson-design-grid">
      <div class="field"><label for="lessonObjective">Learning objective</label><input id="lessonObjective" placeholder="What should pupils know or be able to do?"></div>
      <div class="field"><label for="priorKnowledge">Prior knowledge</label><input id="priorKnowledge" placeholder="What should pupils already know?"></div>
      <div class="field"><label for="lessonStyle">Lesson approach</label><select id="lessonStyle"><option>Explicit instruction + guided practice</option><option>Inquiry / discovery</option><option>Retrieval + deliberate practice</option><option>Discussion + collaborative learning</option><option>Practical / hands-on</option></select></div>
      <div class="field"><label for="assessmentMethod">Assessment method</label><select id="assessmentMethod"><option>Exit ticket</option><option>Mini-whiteboard checks</option><option>Questioning throughout</option><option>Short quiz</option><option>Self-assessment</option></select></div>
      <div class="field"><label for="supportNeeds">Support / SEND / EAL</label><input id="supportNeeds" placeholder="e.g. vocabulary support, chunking, visual prompts"></div>
      <div class="field"><label for="resourcesNeeded">Resources needed</label><input id="resourcesNeeded" placeholder="e.g. slides, cards, practical equipment"></div>
      <div class="field field-wide"><label for="successCriteria">Success criteria</label><input id="successCriteria" placeholder="How will pupils know they have succeeded?"></div>
    </div>`;
  const actions = form.querySelector('.form-actions');
  form.insertBefore(panel, actions);

  const ids = ['lessonObjective','priorKnowledge','lessonStyle','assessmentMethod','supportNeeds','resourcesNeeded','successCriteria'];
  const fields = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
  const baseExtra = () => extra.value.replace(/\n?\[TEACHR LESSON DESIGN\][\s\S]*$/, '').trim();

  function syncBrief() {
    const parts = [];
    if (fields.lessonObjective.value.trim()) parts.push(`Learning objective: ${fields.lessonObjective.value.trim()}`);
    if (fields.priorKnowledge.value.trim()) parts.push(`Prior knowledge: ${fields.priorKnowledge.value.trim()}`);
    if (fields.lessonStyle.value) parts.push(`Lesson approach: ${fields.lessonStyle.value}`);
    if (fields.assessmentMethod.value) parts.push(`Assessment method: ${fields.assessmentMethod.value}`);
    if (fields.supportNeeds.value.trim()) parts.push(`Support needs: ${fields.supportNeeds.value.trim()}`);
    if (fields.resourcesNeeded.value.trim()) parts.push(`Resources needed: ${fields.resourcesNeeded.value.trim()}`);
    if (fields.successCriteria.value.trim()) parts.push(`Success criteria: ${fields.successCriteria.value.trim()}`);
    extra.value = [baseExtra(), parts.length ? `[TEACHR LESSON DESIGN]\n${parts.join('\n')}` : ''].filter(Boolean).join('\n\n');
  }

  ids.forEach(id => fields[id].addEventListener('input', syncBrief));
  ids.forEach(id => fields[id].addEventListener('change', syncBrief));

  document.getElementById('resetLessonDesign').addEventListener('click', () => {
    ids.forEach(id => { if (fields[id].tagName === 'SELECT') fields[id].selectedIndex = 0; else fields[id].value = ''; });
    syncBrief();
  });

  function setLessonDefaults() {
    panel.style.display = 'block';
  }
  function updateVisibility() {
    const active = document.querySelector('.tool-card.active')?.dataset.tool;
    panel.style.display = active === 'lesson' ? 'block' : 'none';
  }
  toolCards.forEach(card => card.addEventListener('click', () => setTimeout(updateVisibility, 0)));
  setLessonDefaults();
})();
