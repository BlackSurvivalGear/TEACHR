(() => {
  const form = document.getElementById('builderForm');
  if (!form) return;
  const panel = document.getElementById('lessonV2Panel');
  const ids = ['lessonObjective','priorKnowledge','lessonStyle','assessmentMethod','supportNeeds','resourcesNeeded','successCriteria','v2Objective','v2Prior','v2Vocabulary','v2Starter','v2Misconceptions','v2Support','v2Challenge','v2Resources','v2Assessment','v2Homework','v2Sequence','v2Reflection'];
  const value = (...names) => names.map(id => document.getElementById(id)?.value?.trim()).find(Boolean) || '';
  const esc = value => String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const collect = () => ({
    objective:value('v2Objective','lessonObjective'), priorKnowledge:value('v2Prior','priorKnowledge'), lessonStyle:value('lessonStyle'), assessmentMethod:value('v2Assessment','assessmentMethod'),
    support:value('v2Support','supportNeeds'), resources:value('v2Resources','resourcesNeeded'), successCriteria:value('successCriteria'), vocabulary:value('v2Vocabulary'), starter:value('v2Starter'),
    misconceptions:value('v2Misconceptions'), challenge:value('v2Challenge'), homework:value('v2Homework'), sequence:value('v2Sequence'), reflection:value('v2Reflection')
  });
  window.TEACHR_LESSON_V3 = { collect };
  const original = window.demoOutput;
  if (typeof original !== 'function') return;
  window.demoOutput = function(data) {
    if (typeof activeTool !== 'undefined' && activeTool !== 'lesson') return original(data);
    const v = collect();
    const topic = esc(data.topic), year = esc(data.year), subject = esc(data.subject), duration = esc(data.duration), level = esc(data.level), q = esc(data.questionCount);
    const fallback = (text, def) => esc(text || def);
    return { title:`${topic} lesson plan`, summary:`${year} · ${subject} · ${duration} · ${level}`, sections:[
      ['Lesson overview',`A ${duration.toLowerCase()} ${subject} lesson for ${year} on ${topic}. Approach: ${fallback(v.lessonStyle,'Explicit instruction + guided practice')}.`],
      ['Learning objective',fallback(v.objective,`Students will explain, apply and check their understanding of ${data.topic}.`)],
      ['Success criteria',fallback(v.successCriteria,'Students can explain the method, complete examples accurately and check their answers.')],
      ['Prior knowledge',fallback(v.priorKnowledge,`Students should recall the key prerequisite concepts needed for ${data.topic}.`)],
      ['Key vocabulary',fallback(v.vocabulary,'Identify and use the essential subject vocabulary for this lesson.')],
      ['5 min — Retrieval starter',fallback(v.starter,`Five retrieval questions connecting prior learning to ${data.topic}, followed by rapid feedback.`)],
      ['10 min — Explicit teaching & modelling','Teacher models a worked example step-by-step, narrates the thinking, checks understanding and addresses errors before guided practice.'],
      ['10 min — Guided practice','Students complete scaffolded examples with the teacher. Use targeted questioning and a hinge question before moving on.'],
      ['20 min — Independent practice',`Students complete ${q} questions, progressing from recall to application. Teacher circulates, checks misconceptions and adjusts support.`],
      ['Support / SEND / EAL',fallback(v.support,'Chunk instructions, pre-teach vocabulary, use visual models, worked examples and sentence stems.')],
      ['Stretch & challenge',fallback(v.challenge,'Use reasoning, transfer and explanation tasks with reduced scaffolding for pupils ready to extend.')],
      ['Common misconceptions',fallback(v.misconceptions,'Watch for procedural errors, confusion between key terms and applying a remembered rule without checking whether it fits the problem.')],
      ['Resources',fallback(v.resources,'Slides, worked examples, differentiated practice sheet, mini-whiteboards and exit ticket.')],
      ['Assessment & hinge question',fallback(v.assessmentMethod,'Questioning throughout + exit ticket')],
      ['5 min — Exit ticket','Three questions: one recall, one application and one explanation. Use responses to identify pupils requiring intervention.'],
      ['Homework / next step',fallback(v.homework,`Complete a short set of ${data.topic} practice questions and correct one error using a written explanation.`)],
      ['Teacher reflection',fallback(v.reflection,'What evidence shows that pupils met the success criteria? Which misconception remains? Which pupils need intervention?')],
      ['Suggested next lesson','Use exit-ticket evidence to revisit unresolved misconceptions before introducing the next layer of the topic.'],
      ['Teacher-specified sequence',fallback(v.sequence,'Starter → explicit teaching/model → guided practice → independent practice → assessment/plenary.')]
    ]};
  };
  if (panel) panel.dataset.v3 = 'active';
})();
