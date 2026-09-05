(() => {
  const form = document.getElementById('builderForm');
  if (!form || document.getElementById('lessonV2Panel')) return;

  const style = document.createElement('style');
  style.textContent = `
    #lessonV2Panel{grid-column:1/-1;margin-top:4px;padding:22px;border:1px solid rgba(83,170,255,.18);border-radius:18px;background:linear-gradient(145deg,rgba(22,50,88,.42),rgba(7,23,45,.38))}
    .lv2-head{margin-bottom:18px}.lv2-head strong{display:block;font-size:15px}.lv2-head span{display:block;font-size:11px;color:#7890ae;margin-top:4px}
    .lv2-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.lv2-wide{grid-column:1/-1}
    .lv2-actions{display:flex;gap:10px;margin-top:16px}.lv2-btn{border:1px solid rgba(155,190,255,.14);background:rgba(255,255,255,.04);color:#cfe0f5;border-radius:10px;padding:9px 12px;font-size:11px;font-weight:700}.lv2-btn:hover{background:rgba(255,255,255,.08);color:#fff}
    html[data-theme="light"] #lessonV2Panel{background:linear-gradient(145deg,#f8fbff,#f2f7fc);border-color:rgba(39,145,220,.18)}
    html[data-theme="light"] .lv2-head strong{color:#172b43}html[data-theme="light"] .lv2-head span{color:#5d718a}
    @media(max-width:620px){.lv2-grid{grid-template-columns:1fr}.lv2-wide{grid-column:auto}}
  `;
  document.head.appendChild(style);

  const panel = document.createElement('div');
  panel.id = 'lessonV2Panel';
  panel.innerHTML = `
    <div class="lv2-head">
      <p class="eyebrow">LESSON DESIGN</p>
      <strong>Shape the lesson before TEACHR generates it</strong>
      <span>These fields are part of the same Lesson Builder brief and give the AI the teaching context it needs.</span>
    </div>
    <div class="lv2-grid">
      <div class="field"><label for="v2Objective">Learning objective</label><input id="v2Objective" placeholder="What should pupils know or be able to do?"></div>
      <div class="field"><label for="v2Prior">Prior knowledge</label><input id="v2Prior" placeholder="What should pupils already know?"></div>
      <div class="field"><label for="v2Vocabulary">Key vocabulary</label><input id="v2Vocabulary" placeholder="e.g. ratio, proportion, equivalent"></div>
      <div class="field"><label for="v2Starter">Starter / retrieval</label><input id="v2Starter" placeholder="What should pupils retrieve or revisit?"></div>
      <div class="field"><label for="v2Misconceptions">Likely misconceptions</label><input id="v2Misconceptions" placeholder="Known errors or difficult concepts"></div>
      <div class="field"><label for="v2Support">Support / SEND / EAL</label><input id="v2Support" placeholder="Scaffolds and access strategies"></div>
      <div class="field"><label for="v2Challenge">Stretch / challenge</label><input id="v2Challenge" placeholder="Reasoning, transfer or extension task"></div>
      <div class="field"><label for="v2Resources">Resources</label><input id="v2Resources" placeholder="Slides, cards, equipment, handouts"></div>
      <div class="field"><label for="v2Assessment">Assessment strategy</label><select id="v2Assessment"><option>Questioning throughout + exit ticket</option><option>Mini-whiteboard checks</option><option>Hinge question + exit ticket</option><option>Short quiz</option><option>Self-assessment</option></select></div>
      <div class="field"><label for="v2Homework">Homework / next step</label><input id="v2Homework" placeholder="Optional follow-up"></div>
      <div class="field lv2-wide"><label for="v2Sequence">Lesson sequence</label><textarea id="v2Sequence" rows="3" placeholder="5 min starter → teaching/model → guided practice → independent practice → plenary"></textarea></div>
      <div class="field lv2-wide"><label for="v2Reflection">Teacher reflection prompt</label><input id="v2Reflection" placeholder="What evidence should guide the next lesson?"></div>
    </div>
    <div class="lv2-actions"><button type="button" class="lv2-btn" id="v2Reset">Reset lesson design</button></div>
  `;

  const actions = form.querySelector('.form-actions');
  const aiPanel = document.getElementById('aiProviderPanel');
  if (aiPanel) form.insertBefore(panel, aiPanel);
  else if (actions) form.insertBefore(panel, actions);
  else form.appendChild(panel);

  const ids = ['v2Objective','v2Prior','v2Vocabulary','v2Starter','v2Misconceptions','v2Support','v2Challenge','v2Resources','v2Assessment','v2Homework','v2Sequence','v2Reflection'];
  const sync = () => {
    const lines = ids.map(id => {
      const el = document.getElementById(id), value = el.value.trim();
      return value ? `${el.previousElementSibling.textContent}: ${value}` : '';
    }).filter(Boolean);
    const extra = document.getElementById('extraInstruction');
    if (extra) {
      const base = extra.value.replace(/\n?\[TEACHR LESSON PLAN V2\][\s\S]*$/,'').replace(/\n?\[TEACHR LESSON DESIGN\][\s\S]*$/,'').trim();
      extra.value = [base, lines.length ? `[TEACHR LESSON DESIGN]\n${lines.join('\n')}` : ''].filter(Boolean).join('\n\n');
    }
  };

  ids.forEach(id => {
    document.getElementById(id).addEventListener('input', sync);
    document.getElementById(id).addEventListener('change', sync);
  });

  document.getElementById('v2Reset').addEventListener('click', () => {
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el.tagName === 'SELECT') el.selectedIndex = 0;
      else el.value = '';
    });
    sync();
  });
})();
