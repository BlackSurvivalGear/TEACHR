const STORAGE_KEY = 'teachr-v1-resources';

const toolConfig = {
  lesson: { title: 'Lesson Builder', label: 'Generate lesson', type: 'LESSON PLAN' },
  worksheet: { title: 'Worksheet Generator', label: 'Generate worksheet', type: 'WORKSHEET' },
  quiz: { title: 'Quiz Generator', label: 'Generate quiz', type: 'QUIZ' },
  library: { title: 'Resource Library', label: 'Refresh library', type: 'RESOURCE' }
};

const els = {
  form: document.getElementById('builderForm'),
  result: document.getElementById('result'),
  title: document.getElementById('builderTitle'),
  label: document.getElementById('generateLabel'),
  resourceList: document.getElementById('resourceList'),
  toast: document.getElementById('toast'),
  clear: document.getElementById('clearButton'),
  clearLibrary: document.getElementById('clearLibrary'),
  demo: document.getElementById('demoButton')
};

let activeTool = 'lesson';

function getResources() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

function saveResource(resource) {
  const resources = [resource, ...getResources()].slice(0, 12);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(resources));
  renderLibrary();
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add('show');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => els.toast.classList.remove('show'), 2200);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
}

function setTool(tool) {
  activeTool = tool;
  document.querySelectorAll('.tool-card').forEach(card => card.classList.toggle('active', card.dataset.tool === tool));
  const config = toolConfig[tool];
  els.title.textContent = config.title;
  els.label.textContent = config.label;
  if (tool === 'library') document.getElementById('library').scrollIntoView({ behavior: 'smooth' });
  else document.getElementById('builderPanel').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

document.querySelectorAll('.tool-card').forEach(card => card.addEventListener('click', () => setTool(card.dataset.tool)));

function buildOutput(data) {
  const subject = escapeHtml(data.subject);
  const year = escapeHtml(data.year);
  const topic = escapeHtml(data.topic);
  const duration = escapeHtml(data.duration);
  const level = escapeHtml(data.level);
  const notes = escapeHtml(data.notes || 'No additional notes.');

  if (activeTool === 'worksheet') return {
    title: `${topic} worksheet`,
    summary: `${year} · ${subject} · ${level}`,
    items: [
      ['Starter', `5 retrieval questions to activate prior knowledge on ${topic}.`],
      ['Core practice', `12 scaffolded questions moving from recall to application.`],
      ['Challenge', `3 extension problems requiring explanation and reasoning.`],
      ['Answer key', 'Teacher answer sheet with concise model responses.']
    ]
  };
  if (activeTool === 'quiz') return {
    title: `${topic} quiz`,
    summary: `${year} · ${subject} · 10 questions`,
    items: [
      ['Recall', '4 short questions covering essential vocabulary and concepts.'],
      ['Application', '4 questions using realistic classroom scenarios.'],
      ['Challenge', '2 higher-order questions requiring reasoning.'],
      ['Answer key', 'Answers with brief explanations for teacher review.']
    ]
  };
  return {
    title: `${topic} lesson plan`,
    summary: `${year} · ${subject} · ${duration} · ${level}`,
    items: [
      ['Learning objectives', `Students will explain, apply and check their understanding of ${topic}.`],
      ['Starter', `5-minute retrieval activity connecting prior learning to ${topic}.`],
      ['Main learning', `Teacher modelling followed by guided practice and independent application.`],
      ['Differentiation', `${level} pathway with scaffolded prompts and an extension challenge.`],
      ['Assessment', 'Exit ticket with 3 questions to identify misconceptions and next steps.'],
      ['Teacher notes', notes]
    ]
  };
}

function renderResult(output) {
  els.result.hidden = false;
  els.result.innerHTML = `<div class="result-head"><div><p class="eyebrow">GENERATED RESOURCE</p><h4>${output.title}</h4><span class="result-sub">${output.summary}</span></div><button class="btn btn-ghost" id="saveResult" type="button">Save to library</button></div><div class="result-grid">${output.items.map(([heading, body]) => `<div class="result-item"><b>${heading}</b><p>${body}</p></div>`).join('')}</div>`;
  document.getElementById('saveResult').addEventListener('click', () => {
    saveResource({ id: Date.now(), type: toolConfig[activeTool].type, title: output.title, summary: output.summary });
    showToast('Saved to your resource library.');
  });
}

els.form.addEventListener('submit', event => {
  event.preventDefault();
  if (activeTool === 'library') { renderLibrary(); return; }
  const data = Object.fromEntries(new FormData(els.form).entries());
  renderResult(buildOutput(data));
  showToast(`${toolConfig[activeTool].title} generated.`);
});

els.clear.addEventListener('click', () => {
  els.form.reset();
  els.result.hidden = true;
  showToast('Workspace cleared.');
});

function renderLibrary() {
  const resources = getResources();
  if (!resources.length) {
    els.resourceList.innerHTML = '<div class="empty">No saved resources yet. Generate a lesson, worksheet or quiz and save it here.</div>';
    return;
  }
  els.resourceList.innerHTML = resources.map(resource => `<article class="resource-card"><span class="type">${escapeHtml(resource.type)}</span><h4>${escapeHtml(resource.title)}</h4><p>${escapeHtml(resource.summary)}</p></article>`).join('');
}

els.clearLibrary.addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEY);
  renderLibrary();
  showToast('Library cleared.');
});

els.demo.addEventListener('click', () => {
  document.getElementById('subject').value = 'Science';
  document.getElementById('year').value = 'Year 7';
  document.getElementById('topic').value = 'Cells';
  document.getElementById('duration').value = '60 minutes';
  document.getElementById('level').value = 'Mixed ability';
  setTool('lesson');
  els.form.requestSubmit();
});

renderLibrary();
