(() => {
  const form = document.getElementById('builderForm');
  const curriculum = document.getElementById('curriculum');
  const subject = document.getElementById('subject');
  const year = document.getElementById('year');
  const topic = document.getElementById('topic');
  const objective = document.getElementById('lessonObjective');
  if (!form || !curriculum || !subject || !year || !topic || !objective) return;

  const style = document.createElement('style');
  style.textContent = `
    .key-stage-indicator{display:block;margin-top:6px;color:#6fbfff;font-size:10px;font-weight:700;letter-spacing:.02em}
    .curriculum-alignment{grid-column:1/-1;padding:16px 18px;border:1px solid rgba(83,170,255,.18);border-radius:16px;background:rgba(39,184,255,.035)}
    .curriculum-alignment[hidden]{display:none}
    .curriculum-alignment-head{display:flex;justify-content:space-between;align-items:start;gap:16px;margin-bottom:12px}
    .curriculum-alignment-label{display:block;color:#70bfff;font-size:9px;font-weight:800;letter-spacing:.12em;margin-bottom:4px}
    .curriculum-alignment-head strong{display:block;color:#eaf3ff;font-size:13px}
    .curriculum-alignment-status{font-size:9px;color:#7f98b6;border:1px solid rgba(155,190,255,.14);border-radius:999px;padding:5px 8px;white-space:nowrap}
    .curriculum-objective-list{display:grid;gap:8px}
    .curriculum-objective{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:11px 12px;border:1px solid rgba(155,190,255,.1);border-radius:11px;background:rgba(255,255,255,.025)}
    .curriculum-objective-copy{min-width:0}
    .curriculum-objective-copy span{display:block;color:#6f87a5;font-size:9px;font-weight:800;letter-spacing:.04em;margin-bottom:3px}
    .curriculum-objective-copy p{margin:0;color:#a7b9d0;font-size:11px;line-height:1.5}
    .use-curriculum-objective{flex:0 0 auto;border:1px solid rgba(83,170,255,.22);background:rgba(39,184,255,.08);color:#82c8ff;border-radius:9px;padding:7px 9px;font-size:9px;font-weight:800}
    .use-curriculum-objective:hover{background:rgba(39,184,255,.14);color:#fff}
    .curriculum-empty{margin:0;color:#7e94b0;font-size:11px}
    @media(max-width:620px){.curriculum-alignment{grid-column:auto}.curriculum-objective{align-items:start;flex-direction:column}.use-curriculum-objective{width:100%}.curriculum-alignment-head{flex-direction:column}}
  `;
  document.head.appendChild(style);

  const YEAR_TO_KEY_STAGE = {
    'Year 1': 'KS1', 'Year 2': 'KS1',
    'Year 3': 'KS2', 'Year 4': 'KS2', 'Year 5': 'KS2', 'Year 6': 'KS2',
    'Year 7': 'KS3', 'Year 8': 'KS3', 'Year 9': 'KS3',
    'Year 10': 'KS4', 'Year 11': 'KS4'
  };

  const stageLabel = document.createElement('small');
  stageLabel.className = 'key-stage-indicator';
  stageLabel.setAttribute('aria-live', 'polite');
  const yearField = year.closest('.field');
  if (yearField) yearField.appendChild(stageLabel);

  const alignment = document.createElement('div');
  alignment.className = 'curriculum-alignment';
  alignment.innerHTML = `
    <div class="curriculum-alignment-head">
      <div>
        <span class="curriculum-alignment-label">CURRICULUM ALIGNMENT</span>
        <strong id="curriculumAlignmentTitle">Select a subject and topic</strong>
      </div>
      <span id="curriculumAlignmentStatus" class="curriculum-alignment-status">Waiting for selection</span>
    </div>
    <div id="curriculumObjectiveList" class="curriculum-objective-list"></div>`;
  const topicField = topic.closest('.field');
  if (topicField) topicField.insertAdjacentElement('afterend', alignment);

  const title = alignment.querySelector('#curriculumAlignmentTitle');
  const status = alignment.querySelector('#curriculumAlignmentStatus');
  const list = alignment.querySelector('#curriculumObjectiveList');

  function keyStage() { return YEAR_TO_KEY_STAGE[year.value] || ''; }
  function isEngland() { return /England\s*[—-]\s*National Curriculum/i.test(curriculum.value || ''); }

  function renderKeyStage() {
    const ks = isEngland() ? keyStage() : '';
    stageLabel.textContent = ks ? `${ks} · National Curriculum key stage` : '';
    stageLabel.hidden = !ks;
  }

  function clearAlignment(message = 'Select a subject and topic') {
    title.textContent = message;
    status.textContent = 'Not resolved';
    list.innerHTML = '';
    alignment.hidden = !isEngland();
  }

  async function resolveCurriculum() {
    renderKeyStage();
    if (!isEngland()) {
      clearAlignment('Curriculum alignment is available for England — National Curriculum');
      return;
    }
    const registry = window.TEACHR_CURRICULUM;
    if (!registry) {
      clearAlignment('Curriculum registry unavailable');
      return;
    }
    try {
      if (registry.ready) await registry.ready;
      const resolved = registry.resolve({
        curriculum: curriculum.value,
        subject: subject.value,
        year: year.value,
        topic: topic.value === '__custom__' ? (document.getElementById('customTopic')?.value || '') : topic.value
      });
      renderAlignment(resolved);
    } catch {
      clearAlignment('Curriculum alignment could not be resolved');
    }
  }

  function renderAlignment(resolved) {
    const objectives = resolved?.objectives || [];
    const ks = resolved?.keyStage || keyStage();
    title.textContent = `${resolved.subject} · ${ks}`;
    status.textContent = resolved.status === 'verified-source-structure' ? 'DfE structure matched' : resolved.status || 'Not resolved';
    if (!objectives.length) {
      list.innerHTML = `<p class="curriculum-empty">No structured objective is available for this selection. TEACHR will not invent curriculum alignment.</p>`;
      return;
    }
    list.innerHTML = objectives.map((item, index) => `
      <div class="curriculum-objective">
        <div class="curriculum-objective-copy">
          <span>${item.id} · ${item.domain}</span>
          <p>${item.summary}</p>
        </div>
        <button type="button" class="use-curriculum-objective" data-objective-index="${index}">Use for learning objective</button>
      </div>`).join('');
    list.querySelectorAll('.use-curriculum-objective').forEach(button => {
      button.addEventListener('click', () => {
        const item = objectives[Number(button.dataset.objectiveIndex)];
        if (!item) return;
        objective.value = item.summary;
        objective.dispatchEvent(new Event('input', { bubbles: true }));
        objective.focus();
      });
    });
    if (!objective.value.trim()) {
      objective.value = objectives[0].summary;
      objective.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  [curriculum, subject, year, topic].forEach(input => {
    input.addEventListener('change', resolveCurriculum);
    input.addEventListener('input', resolveCurriculum);
  });
  form.addEventListener('submit', () => renderKeyStage(), true);
  renderKeyStage();
  resolveCurriculum();
})();
