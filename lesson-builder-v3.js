(() => {
  const form = document.getElementById('builderForm');
  if (!form) return;
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const value = (...ids) => ids.map(id => document.getElementById(id)?.value?.trim()).find(Boolean) || '';
  const collect = () => ({ objective:value('v2Objective','lessonObjective'), priorKnowledge:value('v2Prior','priorKnowledge'), lessonStyle:value('lessonStyle'), assessmentMethod:value('v2Assessment','assessmentMethod'), support:value('v2Support','supportNeeds'), resources:value('v2Resources','resourcesNeeded'), successCriteria:value('successCriteria'), vocabulary:value('v2Vocabulary'), starter:value('v2Starter'), misconceptions:value('v2Misconceptions'), challenge:value('v2Challenge'), homework:value('v2Homework'), sequence:value('v2Sequence'), reflection:value('v2Reflection') });
  const build = data => { const v=collect(), topic=esc(data.topic), year=esc(data.year), subject=esc(data.subject), duration=esc(data.duration), level=esc(data.level), q=esc(data.questionCount); const f=(x,d)=>esc(x||d); return { title:`${topic} lesson plan`, summary:`${year} · ${subject} · ${duration} · ${level}`, sections:[
    ['Lesson overview',`A ${duration.toLowerCase()} ${subject} lesson for ${year} on ${topic}. Approach: ${f(v.lessonStyle,'Explicit instruction + guided practice')}.`],
    ['Learning objective',f(v.objective,`Students will explain, apply and check their understanding of ${data.topic}.`)],
    ['Success criteria',f(v.successCriteria,'Students can explain the method, complete examples accurately and check their answers.')],
    ['Prior knowledge',f(v.priorKnowledge,`Students should recall the key prerequisite concepts needed for ${data.topic}.`)],
    ['Key vocabulary',f(v.vocabulary,'Identify and use the essential subject vocabulary for this lesson.')],
    ['5 min — Retrieval starter',f(v.starter,`Five retrieval questions connecting prior learning to ${data.topic}, followed by rapid feedback.`)],
    ['10 min — Explicit teaching & modelling','Teacher models a worked example step-by-step, narrates the thinking, checks understanding and addresses errors before guided practice.'],
    ['10 min — Guided practice','Students complete scaffolded examples with the teacher. Use targeted questioning and a hinge question before moving on.'],
    ['20 min — Independent practice',`Students complete ${q} questions, progressing from recall to application. Teacher circulates, checks misconceptions and adjusts support.`],
    ['Support / SEND / EAL',f(v.support,'Chunk instructions, pre-teach vocabulary, use visual models, worked examples and sentence stems.')],
    ['Stretch & challenge',f(v.challenge,'Use reasoning, transfer and explanation tasks with reduced scaffolding for pupils ready to extend.')],
    ['Common misconceptions',f(v.misconceptions,'Watch for procedural errors, confusion between key terms and applying a remembered rule without checking whether it fits the problem.')],
    ['Resources',f(v.resources,'Slides, worked examples, differentiated practice sheet, mini-whiteboards and exit ticket.')],
    ['Assessment & hinge question',f(v.assessmentMethod,'Questioning throughout + exit ticket')],
    ['5 min — Exit ticket','Three questions: one recall, one application and one explanation. Use responses to identify pupils requiring intervention.'],
    ['Homework / next step',f(v.homework,`Complete a short set of ${data.topic} practice questions and correct one error using a written explanation.`)],
    ['Teacher reflection',f(v.reflection,'What evidence shows that pupils met the success criteria? Which misconception remains? Which pupils need intervention?')],
    ['Suggested next lesson','Use exit-ticket evidence to revisit unresolved misconceptions before introducing the next layer of the topic.'],
    ['Teacher-specified sequence',f(v.sequence,'Starter → explicit teaching/model → guided practice → independent practice → assessment/plenary.')]
  ]}; };
  form.addEventListener('submit', event => {
    if (window.TEACHR_DIRECT_OPENAI_ENABLED) return;
    if (document.querySelector('.tool-card.active')?.dataset.tool !== 'lesson') return;
    event.preventDefault(); event.stopImmediatePropagation();
    const data=Object.fromEntries(new FormData(form).entries());
    const result=document.getElementById('result');
    const output=build(data);
    result.hidden=false;
    result.innerHTML=`<div class="result-head"><div><p class="eyebrow">DEMO MODE · LESSON BUILDER V3</p><h4>${esc(output.title)}</h4><span class="result-sub">${esc(output.summary)}</span></div><div class="result-actions"><button class="btn btn-ghost" id="printV3" type="button">Print / PDF</button><button class="btn btn-primary" id="saveV3" type="button">Save to library</button></div></div><div class="result-grid">${output.sections.map(([h,b])=>`<div class="result-item"><b>${esc(h)}</b><p>${esc(b)}</p></div>`).join('')}</div>`;
    document.getElementById('printV3').onclick=()=>window.print();
    document.getElementById('saveV3').onclick=()=>{const key='teachr-v1-2-resources';let resources=[];try{resources=JSON.parse(localStorage.getItem(key)||'[]')}catch{};resources=[{id:Date.now(),type:'LESSON PLAN',title:output.title,summary:output.summary,sections:output.sections,createdAt:new Date().toISOString()},...resources].slice(0,50);localStorage.setItem(key,JSON.stringify(resources));document.getElementById('saveV3').textContent='Saved';};
  }, true);
})();
