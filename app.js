const RESOURCE_KEY = 'teachr-v1-2-resources';
const PROFILE_KEY = 'teachr-teacher-profile';
const FILTER_KEY = 'teachr-library-filter';

const toolConfig = {
  lesson: { title: 'Lesson Builder', label: 'Generate lesson', type: 'LESSON PLAN', description: 'Build a structured lesson with objectives, activities, differentiation and assessment.' },
  worksheet: { title: 'Worksheet Generator', label: 'Generate worksheet', type: 'WORKSHEET', description: 'Create student practice with scaffolding, challenge and an answer key.' },
  quiz: { title: 'Assessment Generator', label: 'Generate assessment', type: 'ASSESSMENT', description: 'Create questions, answers and a simple topic-coverage plan.' },
  differentiate: { title: 'Differentiation Engine', label: 'Differentiate activity', type: 'DIFFERENTIATION', description: 'Turn one classroom activity into support, core and stretch pathways.' },
  curriculum: { title: 'Curriculum Planner', label: 'Build curriculum map', type: 'CURRICULUM', description: 'Turn a topic into a sequence of units, weeks and lessons.' },
  revision: { title: 'Revision Pack', label: 'Build revision pack', type: 'REVISION PACK', description: 'Create a compact revision guide, flashcards and exam practice.' },
  parent: { title: 'Parent Message', label: 'Draft message', type: 'PARENT MESSAGE', description: 'Draft clear, professional communication from a teacher brief.' },
  library: { title: 'Resource Library', label: 'Refresh library', type: 'RESOURCE', description: 'Search and reuse the teaching materials you have saved.' }
};

const els = {
  form: document.getElementById('builderForm'), result: document.getElementById('result'), title: document.getElementById('builderTitle'),
  description: document.getElementById('builderDescription'), label: document.getElementById('generateLabel'), resourceList: document.getElementById('resourceList'),
  toast: document.getElementById('toast'), clear: document.getElementById('clearButton'), clearLibrary: document.getElementById('clearLibrary'), demo: document.getElementById('demoButton'),
  search: document.getElementById('librarySearch'), profileButton: document.getElementById('profileButton'), profileDialog: document.getElementById('profileDialog'),
  saveProfile: document.getElementById('saveProfile'), engineStatus: document.getElementById('engineStatus'), heroResourceCount: document.getElementById('heroResourceCount'), heroTopic: document.getElementById('heroTopic'),
  statResources: document.getElementById('statResources'), statLessons: document.getElementById('statLessons'), statAssessments: document.getElementById('statAssessments')
};
let activeTool = 'lesson';
let activeFilter = localStorage.getItem(FILTER_KEY) || 'all';

function getJSON(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } }
function getProfile() { return getJSON(PROFILE_KEY, { name: 'Teacher', subject: 'Mathematics', year: 'Year 8', curriculum: 'UK National Curriculum', style: '' }); }
function getResources() { return getJSON(RESOURCE_KEY, []); }
function showToast(message) { els.toast.textContent = message; els.toast.classList.add('show'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => els.toast.classList.remove('show'), 2400); }
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char])); }
function profilePrompt(profile) { return `Teacher profile: subject=${profile.subject}; typical year=${profile.year}; curriculum=${profile.curriculum}; preferences=${profile.style || 'clear explanations, retrieval practice and useful differentiation'}.`; }

function setTool(tool) {
  activeTool = tool;
  document.querySelectorAll('.tool-card').forEach(card => card.classList.toggle('active', card.dataset.tool === tool));
  const config = toolConfig[tool]; els.title.textContent = config.title; els.label.textContent = config.label; els.description.textContent = config.description;
  els.form.querySelectorAll('.field').forEach(field => field.classList.remove('context-highlight'));
  if (tool === 'library') document.getElementById('library').scrollIntoView({ behavior: 'smooth' });
  else document.getElementById('builderPanel').scrollIntoView({ behavior: 'smooth', block: 'center' });
  updateHeroTopic();
}
document.querySelectorAll('.tool-card').forEach(card => card.addEventListener('click', () => setTool(card.dataset.tool)));

document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => { activeFilter = button.dataset.filter; localStorage.setItem(FILTER_KEY, activeFilter); document.querySelectorAll('.filter').forEach(b => b.classList.toggle('active', b === button)); renderLibrary(); }));

function buildPrompt(data) {
  const profile = getProfile();
  const descriptions = {
    lesson: 'a complete lesson plan with objectives, starter, modelling, guided practice, independent practice, differentiation and assessment',
    worksheet: 'a printable worksheet with scaffolded practice, challenge questions and answer key',
    quiz: 'an assessment with a balanced mix of recall, application and higher-order questions, plus an answer key',
    differentiate: 'three differentiated versions of the activity: support, core and stretch, with teacher guidance',
    curriculum: 'a curriculum sequence with units, weekly objectives, lesson sequence and assessments',
    revision: 'a revision pack containing a concise guide, key vocabulary, flashcards and exam-style practice',
    parent: 'a professional parent message that is clear, constructive, warm and specific'
  };
  return `Create ${descriptions[activeTool]} for ${data.year} ${data.subject} on ${data.topic}. Duration: ${data.duration}. Class profile: ${data.level}. Curriculum: ${data.curriculum}. Questions: ${data.questionCount}. Notes: ${data.notes || 'none'}. Additional instruction: ${data.extraInstruction || 'none'}. ${profilePrompt(profile)} Return concise, teacher-ready sections with headings. Do not invent school policy or student personal data.`;
}

function demoOutput(data) {
  const subject = escapeHtml(data.subject), year = escapeHtml(data.year), topic = escapeHtml(data.topic), duration = escapeHtml(data.duration), level = escapeHtml(data.level);
  const q = escapeHtml(data.questionCount);
  const outputs = {
    lesson: { title: `${topic} lesson plan`, summary: `${year} · ${subject} · ${duration} · ${level}`, sections: [['Learning objectives', `Students will explain, apply and check their understanding of ${topic}.`], ['Starter', `5-minute retrieval activity connecting prior learning to ${topic}.`], ['Teacher modelling', 'Explicit explanation, worked example and checks for understanding.'], ['Guided practice', 'Pairs or small groups complete scaffolded examples with teacher questioning.'], ['Independent practice', `Students complete ${q} questions, moving from confidence-building recall to application.`], ['Differentiation', `${level} pathway with vocabulary support, prompts and an extension challenge.`], ['Assessment', 'Exit ticket with three questions to identify misconceptions and next steps.']] },
    worksheet: { title: `${topic} worksheet`, summary: `${year} · ${subject} · ${level}`, sections: [['Starter', `5 retrieval questions on ${topic}.`], ['Core practice', `A sequence of ${q} questions progressing from recall to application.`], ['Support', 'Worked example, vocabulary bank and sentence starters.'], ['Challenge', 'Extension problems requiring reasoning and explanation.'], ['Answer key', 'Teacher answers with concise model responses.']] },
    quiz: { title: `${topic} assessment`, summary: `${year} · ${subject} · ${q} questions`, sections: [['Recall', 'Questions checking essential vocabulary and concepts.'], ['Application', 'Questions using realistic classroom scenarios.'], ['Higher order', 'Questions requiring reasoning, justification or transfer.'], ['Coverage', `Map ${q} questions across the key concepts in ${topic}.`], ['Answer key', 'Answers with brief explanations for teacher review.']] },
    differentiate: { title: `${topic} differentiated activity`, summary: `${year} · ${subject} · Support / Core / Stretch`, sections: [['Support', 'Chunk instructions, model the first example, provide a vocabulary bank and sentence starters.'], ['Core', 'Complete the standard activity with a worked example followed by independent practice.'], ['Stretch', 'Add reasoning, transfer and justification questions with reduced scaffolding.'], ['Teacher moves', 'Use questioning to move pupils between pathways as confidence changes.']] },
    curriculum: { title: `${topic} curriculum map`, summary: `${year} · ${subject} · ${data.curriculum}`, sections: [['Unit 1 · Foundations', `Prior knowledge, vocabulary and core concepts for ${topic}.`], ['Unit 2 · Develop', 'Modelled examples, guided practice and common misconceptions.'], ['Unit 3 · Apply', 'Independent application, problem solving and retrieval.'], ['Unit 4 · Assess', 'Low-stakes assessment followed by targeted intervention.'], ['Sequence', 'Each unit can be split into weekly lessons and saved as individual resources.']] },
    revision: { title: `${topic} revision pack`, summary: `${year} · ${subject} · Exam preparation`, sections: [['Quick guide', `One-page summary of the essential knowledge for ${topic}.`], ['Key vocabulary', 'Definitions and must-remember terminology.'], ['Flashcards', 'Prompt-and-answer cards for retrieval practice.'], ['Exam practice', `${q} exam-style questions progressing in difficulty.`], ['Self-check', 'Traffic-light checklist for confidence and topics needing further revision.']] },
    parent: { title: `${topic} parent message`, summary: `${year} · ${subject} · Draft communication`, sections: [['Opening', 'A concise, positive introduction explaining why you are getting in touch.'], ['What is going well', `Highlight a specific strength or positive development related to ${topic}.`], ['Next step', 'Explain one clear improvement target and how the pupil can work on it.'], ['Support at home', 'Offer one practical, realistic suggestion without creating unnecessary pressure.'], ['Close', 'Invite questions and close professionally.']] }
  };
  return outputs[activeTool] || outputs.lesson;
}

function parseAISections(content) {
  const lines = String(content).split(/\n+/).map(line => line.trim()).filter(Boolean); const sections = []; let current = null;
  lines.forEach(line => { const heading = line.match(/^#{1,4}\s+(.+)|^\*\*(.+?)\*\*:?$/); if (heading) { current = [heading[1] || heading[2], '']; sections.push(current); } else if (current) current[1] += `${current[1] ? ' ' : ''}${line.replace(/^[-*]\s+/, '')}`; else sections.push(['AI output', line]); });
  return sections.length ? sections : [['AI output', content]];
}
async function generateWithAI(data) {
  const response = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: buildPrompt(data), tool: activeTool, profile: getProfile(), inputs: data }) });
  if (!response.ok) throw new Error(`AI service returned ${response.status}`); const payload = await response.json(); if (!payload.content) throw new Error('AI service returned no content');
  return { title: `${data.topic} ${toolConfig[activeTool].type.toLowerCase()}`, summary: `${data.year} · ${data.subject} · AI generated`, sections: parseAISections(payload.content) };
}

function renderResult(output, source) {
  els.result.hidden = false; const badge = source === 'ai' ? 'AI GENERATED' : 'DEMO MODE';
  els.result.innerHTML = `<div class="result-head"><div><p class="eyebrow">${badge}</p><h4>${escapeHtml(output.title)}</h4><span class="result-sub">${escapeHtml(output.summary)}</span></div><div class="result-actions"><button class="btn btn-ghost" id="printResult" type="button">Print / PDF</button><button class="btn btn-primary" id="saveResult" type="button">Save to library</button></div></div><div class="result-grid">${output.sections.map(([heading, body]) => `<div class="result-item"><b>${escapeHtml(heading)}</b><p>${escapeHtml(body)}</p></div>`).join('')}</div>`;
  document.getElementById('saveResult').addEventListener('click', () => { saveResource({ id: Date.now(), type: toolConfig[activeTool].type, title: output.title, summary: output.summary, sections: output.sections, createdAt: new Date().toISOString() }); showToast('Saved to your resource library.'); });
  document.getElementById('printResult').addEventListener('click', () => window.print());
}

async function handleSubmit(event) {
  event.preventDefault(); if (activeTool === 'library') { renderLibrary(); return; }
  const data = Object.fromEntries(new FormData(els.form).entries()); const submit = els.form.querySelector('button[type="submit"]'); submit.disabled = true; submit.classList.add('loading');
  try { els.engineStatus.textContent = 'Trying AI…'; const output = await generateWithAI(data); els.engineStatus.textContent = 'AI connected'; renderResult(output, 'ai'); showToast('AI resource generated.'); }
  catch { els.engineStatus.textContent = 'Local demo engine'; renderResult(demoOutput(data), 'demo'); showToast('Demo generated locally — backend can be connected later.'); }
  finally { submit.disabled = false; submit.classList.remove('loading'); }
}
els.form.addEventListener('submit', handleSubmit);
els.clear.addEventListener('click', () => { els.form.reset(); els.result.hidden = true; setDefaults(); showToast('Workspace cleared.'); });

function setDefaults() { const p = getProfile(); document.getElementById('subject').value = p.subject || 'Mathematics'; document.getElementById('year').value = p.year || 'Year 8'; document.getElementById('curriculum').value = p.curriculum || 'UK National Curriculum'; }
function saveResource(resource) { localStorage.setItem(RESOURCE_KEY, JSON.stringify([resource, ...getResources()].slice(0, 50))); renderLibrary(); updateStats(); }
function renderLibrary() {
  const query = (els.search.value || '').trim().toLowerCase(); const resources = getResources().filter(item => (activeFilter === 'all' || item.type === activeFilter) && `${item.title} ${item.summary} ${item.type}`.toLowerCase().includes(query));
  document.querySelectorAll('.filter').forEach(b => b.classList.toggle('active', b.dataset.filter === activeFilter));
  if (!resources.length) { els.resourceList.innerHTML = '<div class="empty"><strong>Your library is empty.</strong><span>Generate something above and save it here. Your resources stay in this browser for now.</span></div>'; return; }
  els.resourceList.innerHTML = resources.map(resource => `<article class="resource-card"><div class="resource-top"><span class="type">${escapeHtml(resource.type)}</span><span class="resource-date">${new Date(resource.createdAt).toLocaleDateString()}</span></div><h4>${escapeHtml(resource.title)}</h4><p>${escapeHtml(resource.summary)}</p><div class="resource-preview">${(resource.sections || []).slice(0,2).map(s => `<span>${escapeHtml(s[0])}</span>`).join('')}</div><div class="resource-actions"><button type="button" data-action="load" data-id="${resource.id}">Load</button><button type="button" data-action="duplicate" data-id="${resource.id}">Duplicate</button><button type="button" data-action="delete" data-id="${resource.id}">Delete</button></div></article>`).join('');
}
els.search.addEventListener('input', renderLibrary);
els.resourceList.addEventListener('click', event => { const button = event.target.closest('[data-action]'); if (!button) return; const id = Number(button.dataset.id), resources = getResources(), index = resources.findIndex(item => item.id === id); if (index < 0) return;
  const resource = resources[index];
  if (button.dataset.action === 'delete') resources.splice(index, 1);
  if (button.dataset.action === 'duplicate') resources.splice(index, 0, { ...resource, id: Date.now(), title: `${resource.title} copy`, createdAt: new Date().toISOString() });
  if (button.dataset.action === 'load') { const typeMap = { 'LESSON PLAN':'lesson','WORKSHEET':'worksheet','ASSESSMENT':'quiz','DIFFERENTIATION':'differentiate','CURRICULUM':'curriculum','REVISION PACK':'revision','PARENT MESSAGE':'parent' }; setTool(typeMap[resource.type] || 'lesson'); document.getElementById('topic').value = resource.title.replace(/ (lesson plan|worksheet|assessment|differentiated activity|curriculum map|revision pack|parent message|copy)$/i, ''); document.getElementById('builderPanel').scrollIntoView({ behavior:'smooth', block:'center' }); showToast('Resource loaded into the workspace.'); return; }
  localStorage.setItem(RESOURCE_KEY, JSON.stringify(resources)); renderLibrary(); updateStats(); showToast(button.dataset.action === 'delete' ? 'Resource deleted.' : 'Resource duplicated.');
});
els.clearLibrary.addEventListener('click', () => { if (!getResources().length) return; if (confirm('Clear all saved resources from this browser?')) { localStorage.removeItem(RESOURCE_KEY); renderLibrary(); updateStats(); showToast('Library cleared.'); } });

function updateStats() { const resources = getResources(); els.statResources.textContent = resources.length; els.statLessons.textContent = resources.filter(r => r.type === 'LESSON PLAN').length; els.statAssessments.textContent = resources.filter(r => r.type === 'ASSESSMENT').length; els.heroResourceCount.textContent = resources.length; }
function updateHeroTopic() { els.heroTopic.textContent = `${document.getElementById('year').value || 'Year 8'} · ${document.getElementById('topic').value || 'Fractions'}`; }
['year','topic'].forEach(id => document.getElementById(id).addEventListener('input', updateHeroTopic));

function openProfile() { const p = getProfile(); document.getElementById('teacherName').value = p.name; document.getElementById('profileSubject').value = p.subject; document.getElementById('profileYear').value = p.year; document.getElementById('profileCurriculum').value = p.curriculum; document.getElementById('profileStyle').value = p.style; els.profileDialog.showModal(); }
els.profileButton.addEventListener('click', openProfile);
els.saveProfile.addEventListener('click', event => { event.preventDefault(); const profile = { name: document.getElementById('teacherName').value.trim() || 'Teacher', subject: document.getElementById('profileSubject').value.trim() || 'Mathematics', year: document.getElementById('profileYear').value.trim() || 'Year 8', curriculum: document.getElementById('profileCurriculum').value.trim() || 'UK National Curriculum', style: document.getElementById('profileStyle').value.trim() }; localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); document.getElementById('profileName').textContent = profile.name; document.getElementById('avatar').textContent = profile.name.charAt(0).toUpperCase(); setDefaults(); els.profileDialog.close(); showToast('Teacher profile saved.'); });

els.demo.addEventListener('click', () => { document.getElementById('subject').value = 'Science'; document.getElementById('year').value = 'Year 7'; document.getElementById('topic').value = 'Cells'; document.getElementById('duration').value = '60 minutes'; document.getElementById('level').value = 'Mixed ability'; document.getElementById('curriculum').value = 'UK National Curriculum'; setTool('lesson'); els.form.requestSubmit(); });

const initialProfile = getProfile(); document.getElementById('profileName').textContent = initialProfile.name; document.getElementById('avatar').textContent = initialProfile.name.charAt(0).toUpperCase(); setDefaults(); renderLibrary(); updateStats(); updateHeroTopic();