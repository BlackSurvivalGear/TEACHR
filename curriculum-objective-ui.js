(() => {
  const form = document.getElementById('builderForm');
  const curriculum = document.getElementById('curriculum');
  const subject = document.getElementById('subject');
  const year = document.getElementById('year');
  const topic = document.getElementById('topic');
  const objective = document.getElementById('lessonObjective');
  if (!form || !curriculum || !subject || !year || !topic || !objective) return;

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
  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  function keyStage() {
    return YEAR_TO_KEY_STAGE[year.value] || '';
  }

  function isEngland() {
    return /England\s*[—-]\s*National Curriculum/i.test(curriculum.value || '');
  }

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
          <span>${escapeHtml(item.id)} · ${escapeHtml(item.domain)}</span>
          <p>${escapeHtml(item.summary)}</p>
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
