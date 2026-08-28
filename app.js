const RESOURCE_KEY = 'teachr-v1-1-resources';
const PROFILE_KEY = 'teachr-teacher-profile';

const toolConfig = {
  lesson: { title: 'Lesson Builder', label: 'Generate with AI', type: 'LESSON PLAN' },
  worksheet: { title: 'Worksheet Generator', label: 'Generate worksheet', type: 'WORKSHEET' },
  quiz: { title: 'Assessment Generator', label: 'Generate assessment', type: 'ASSESSMENT' },
  library: { title: 'Resource Library', label: 'Refresh library', type: 'RESOURCE' }
};

const els = {
  form: document.getElementById('builderForm'), result: document.getElementById('result'),
  title: document.getElementById('builderTitle'), label: document.getElementById('generateLabel'),
  resourceList: document.getElementById('resourceList'), toast: document.getElementById('toast'),
  clear: document.getElementById('clearButton'), clearLibrary: document.getElementById('clearLibrary'),
  demo: document.getElementById('demoButton'), search: document.getElementById('librarySearch'),
  profileButton: document.getElementById('profileButton'), profileDialog: document.getElementById('profileDialog'),
  saveProfile: document.getElementById('saveProfile'), engineStatus: document.getElementById('engineStatus')
};

let activeTool = 'lesson';

function getJSON(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } }
function getProfile() { return getJSON(PROFILE_KEY, { name: 'Teacher', subject: 'Mathematics', year: 'Year 8', curriculum: 'UK National Curriculum', style: '' }); }
function getResources() { return getJSON(RESOURCE_KEY, []); }
function showToast(message) { els.toast.textContent = message; els.toast.classList.add('show'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => els.toast.classList.remove('show'), 2400); }
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char])); }

function setTool(tool) {
  activeTool = tool;
  document.querySelectorAll('.tool-card').forEach(card => card.classList.toggle('active', card.dataset.tool === tool));
  const config = toolConfig[tool]; els.title.textContent = config.title; els.label.textContent = config.label;
  if (tool === 'library') document.getElementById('library').scrollIntoView({ behavior: 'smooth' });
  else document.getElementById('builderPanel').scrollIntoView({ behavior: 'smooth', block: 'center' });
}
document.querySelectorAll('.tool-card').forEach(card => card.addEventListener('click', () => setTool(card.dataset.tool)));

function profilePrompt(profile) {
  return `Teacher profile: subject=${profile.subject}; typical year=${profile.year}; curriculum=${profile.curriculum}; teaching preferences=${profile.style || 'clear explanations, retrieval practice and useful differentiation'}.`;
}

function buildPrompt(data) {
  const tool = activeTool === 'lesson' ? 'a complete lesson plan' : activeTool === 'worksheet' ? 'a printable worksheet with answer key' : 'an assessment with answer key and topic coverage';
  return `Create ${tool} for ${data.year} ${data.subject} on ${data.topic}. Duration: ${data.duration}. Class profile: ${data.level}. Curriculum: ${data.curriculum}. Questions: ${data.questionCount}. Notes: ${data.notes || 'none'}. ${profilePrompt(getProfile())} Return concise, teacher-ready sections with headings. Do not invent school policy or student personal data.`;
}

function demoOutput(data) {
  const subject = escapeHtml(data.subject), year = escapeHtml(data.year), topic = escapeHtml(data.topic), duration = escapeHtml(data.duration), level = escapeHtml(data.level);
  if (activeTool === 'worksheet') return { title: `${topic} worksheet`, summary: `${year} · ${subject} · ${level}`, sections: [['Starter', `5 retrieval questions on ${topic}.`], ['Core practice', `12 scaffolded questions progressing from recall to application.`], ['Challenge', '3 extension problems requiring reasoning and explanation.'], ['Answer key', 'Teacher answers with concise model responses.']] };
  if (activeTool === 'quiz') return { title: `${topic} assessment`, summary: `${year} · ${subject} · ${data.questionCount} questions`, sections: [['Recall', 'Questions checking essential vocabulary and concepts.'], ['Application', 'Questions using realistic classroom scenarios.'], ['Higher order', 'Questions requiring reasoning, justification or transfer.'], ['Coverage', `Map questions across the key concepts in ${topic}.`], ['Answer key', 'Answers with brief explanations for teacher review.']] };
  return { title: `${topic} lesson plan`, summary: `${year} · ${subject} · ${duration} · ${level}`, sections: [['Learning objectives', `Students will explain, apply and check their understanding of ${topic}.`], ['Starter', '5-minute retrieval activity linking prior learning to the new topic.'], ['Teacher modelling', 'Explicit explanation followed by a worked example and checks for understanding.'], ['Guided practice', 'Pairs or small groups complete scaffolded examples with teacher questioning.'], ['Differentiation', `${level} pathway with vocabulary support, prompts and an extension challenge.`], ['Assessment', 'Exit ticket with three questions to identify misconceptions and next steps.']] };
}

async function generateWithAI(data) {
  const response = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: buildPrompt(data), tool: activeTool, profile: getProfile(), inputs: data }) });
  if (!response.ok) throw new Error(`AI service returned ${response.status}`);
  const payload = await response.json();
  if (!payload.content) throw new Error('AI service returned no content');
  return { title: `${data.topic} ${activeTool === 'lesson' ? 'lesson plan' : activeTool === 'worksheet' ? 'worksheet' : 'assessment'}`, summary: `${data.year} · ${data.subject} · AI generated`, sections: parseAISections(payload.content) };
}

function parseAISections(content) {
  const lines = String(content).split(/\n+/).map(line => line.trim()).filter(Boolean);
  const sections = []; let current = null;
  lines.forEach(line => {
    const heading = line.match(/^#{1,4}\s+(.+)|^\*\*(.+?)\*\*:?$/);
    if (heading) { current = [heading[1] || heading[2], '']; sections.push(current); }
    else if (current) current[1] += `${current[1] ? ' ' : ''}${line.replace(/^[-*]\s+/, '')}`;
    else sections.push(['AI output', line]);
  });
  return sections.length ? sections : [['AI output', content]];
}

function renderResult(output, source) {
  els.result.hidden = false;
  const badge = source === 'ai' ? 'AI GENERATED' : 'DEMO MODE';
  els.result.innerHTML = `<div class="result-head"><div><p class="eyebrow">${badge}</p><h4>${escapeHtml(output.title)}</h4><span class="result-sub">${escapeHtml(output.summary)}</span></div><div class="result-actions"><button class="btn btn-ghost" id="printResult" type="button">Print / PDF</button><button class="btn btn-primary" id="saveResult" type="button">Save to library</button></div></div><div class="result-grid">${output.sections.map(([heading, body]) => `<div class="result-item"><b>${escapeHtml(heading)}</b><p>${escapeHtml(body)}</p></div>`).join('')}</div>`;
  document.getElementById('saveResult').addEventListener('click', () => { saveResource({ id: Date.now(), type: toolConfig[activeTool].type, title: output.title, summary: output.summary, sections: output.sections, createdAt: new Date().toISOString() }); showToast('Saved to your resource library.'); });
  document.getElementById('printResult').addEventListener('click', () => window.print());
}

async function handleSubmit(event) {
  event.preventDefault(); if (activeTool === 'library') { renderLibrary(); return; }
  const data = Object.fromEntries(new FormData(els.form).entries());
  const submit = els.form.querySelector('button[type="submit"]'); submit.disabled = true; submit.classList.add('loading');
  try {
    els.engineStatus.textContent = 'Connecting to AI…';
    const output = await generateWithAI(data); els.engineStatus.textContent = 'AI connected'; renderResult(output, 'ai'); showToast('AI resource generated.');
  } catch (error) {
    els.engineStatus.textContent = 'Demo fallback'; renderResult(demoOutput(data), 'demo'); showToast('AI backend unavailable — demo generated locally.');
  } finally { submit.disabled = false; submit.classList.remove('loading'); }
}
els.form.addEventListener('submit', handleSubmit);
els.clear.addEventListener('click', () => { els.form.reset(); els.result.hidden = true; showToast('Workspace cleared.'); });

function saveResource(resource) { localStorage.setItem(RESOURCE_KEY, JSON.stringify([resource, ...getResources()].slice(0, 30))); renderLibrary(); }
function renderLibrary() {
  const query = (els.search.value || '').trim().toLowerCase();
  const resources = getResources().filter(item => `${item.title} ${item.summary} ${item.type}`.toLowerCase().includes(query));
  if (!resources.length) { els.resourceList.innerHTML = '<div class="empty">No matching resources. Generate a lesson, worksheet or assessment and save it here.</div>'; return; }
  els.resourceList.innerHTML = resources.map(resource => `<article class="resource-card"><span class="type">${escapeHtml(resource.type)}</span><h4>${escapeHtml(resource.title)}</h4><p>${escapeHtml(resource.summary)}</p><div class="resource-actions"><button type="button" data-action="edit" data-id="${resource.id}">Edit</button><button type="button" data-action="duplicate" data-id="${resource.id}">Duplicate</button><button type="button" data-action="delete" data-id="${resource.id}">Delete</button></div></article>`).join('');
}
els.search.addEventListener('input', renderLibrary);
els.resourceList.addEventListener('click', event => {
  const button = event.target.closest('[data-action]'); if (!button) return;
  const id = Number(button.dataset.id), resources = getResources(), index = resources.findIndex(item => item.id === id); if (index < 0) return;
  if (button.dataset.action === 'delete') resources.splice(index, 1);
  if (button.dataset.action === 'duplicate') resources.splice(index, 0, { ...resources[index], id: Date.now(), title: `${resources[index].title} copy`, createdAt: new Date().toISOString() });
  if (button.dataset.action === 'edit') { const resource = resources[index]; setTool(resource.type === 'LESSON PLAN' ? 'lesson' : resource.type === 'WORKSHEET' ? 'worksheet' : 'quiz'); document.getElementById('topic').value = resource.title.replace(/ (lesson plan|worksheet|assessment)$/i, ''); showToast('Resource loaded into the workspace.'); return; }
  localStorage.setItem(RESOURCE_KEY, JSON.stringify(resources)); renderLibrary(); showToast(button.dataset.action === 'delete' ? 'Resource deleted.' : 'Resource duplicated.');
});
els.clearLibrary.addEventListener('click', () => { localStorage.removeItem(RESOURCE_KEY); renderLibrary(); showToast('Library cleared.'); });

function openProfile() {
  const profile = getProfile(); document.getElementById('teacherName').value = profile.name; document.getElementById('profileSubject').value = profile.subject; document.getElementById('profileYear').value = profile.year; document.getElementById('profileCurriculum').value = profile.curriculum; document.getElementById('profileStyle').value = profile.style; els.profileDialog.showModal();
}
els.profileButton.addEventListener('click', openProfile);
els.saveProfile.addEventListener('click', event => {
  event.preventDefault(); const profile = { name: document.getElementById('teacherName').value.trim() || 'Teacher', subject: document.getElementById('profileSubject').value.trim(), year: document.getElementById('profileYear').value.trim(), curriculum: document.getElementById('profileCurriculum').value.trim(), style: document.getElementById('profileStyle').value.trim() };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); document.getElementById('profileName').textContent = profile.name; document.getElementById('avatar').textContent = profile.name.charAt(0).toUpperCase(); els.profileDialog.close(); showToast('Teacher profile saved.');
});

els.demo.addEventListener('click', () => { document.getElementById('subject').value = 'Science'; document.getElementById('year').value = 'Year 7'; document.getElementById('topic').value = 'Cells'; document.getElementById('duration').value = '60 minutes'; document.getElementById('level').value = 'Mixed ability'; document.getElementById('curriculum').value = 'UK National Curriculum'; setTool('lesson'); els.form.requestSubmit(); });

const initialProfile = getProfile(); document.getElementById('profileName').textContent = initialProfile.name; document.getElementById('avatar').textContent = initialProfile.name.charAt(0).toUpperCase();
renderLibrary();