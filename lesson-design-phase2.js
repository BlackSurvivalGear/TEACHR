(() => {
  const form = document.getElementById('builderForm');
  const subject = document.getElementById('subject');
  const topic = document.getElementById('topic');
  const objective = document.getElementById('lessonObjective');
  const starter = document.getElementById('v2Starter');
  const misconceptions = document.getElementById('v2Misconceptions');
  const challenge = document.getElementById('v2Challenge');
  const support = document.getElementById('supportNeeds');
  const resources = document.getElementById('resourcesNeeded');
  const homework = document.getElementById('v2Homework');
  const reflection = document.getElementById('v2Reflection');
  if (!form || !subject || !topic || !objective || !starter || !misconceptions || !challenge || !support || !resources || !homework || !reflection) return;

  const GUIDANCE = {
    Mathematics:['Retrieve 2–3 prerequisite facts or skills, then include one quick application question.','Check place value, operation choice and the common error pattern associated with this topic.','Ask pupils to justify a method, compare strategies or solve a less familiar problem.','Use worked examples, precise vocabulary, chunked steps and guided practice where needed.','Worked examples, practice questions, mini-whiteboards and an exit ticket.','Complete a short retrieval and application task linked to the lesson objective.','Review accuracy, strategy choice and evidence from the exit ticket.'],
    English:['Retrieve key vocabulary, a prior text/language feature or a previously taught reading/writing skill.','Check confusion over vocabulary, inference, evidence, structure or the relevant language feature.','Require pupils to justify an interpretation, select precise evidence or improve a response.','Pre-teach vocabulary; chunk the task; model an example and provide sentence stems or prompts.','Core text/extract, vocabulary prompts, model response and a reading/writing scaffold.','Complete a short reading, vocabulary or writing task that rehearses the objective.','Review evidence, explanation and pupil responses against the success criteria.'],
    Science:['Retrieve key facts, vocabulary or a prior concept needed to explain today’s phenomenon.','Probe the everyday explanation pupils may hold and contrast it with the scientific model or evidence.','Ask pupils to predict, explain evidence, evaluate a method or apply the concept in a new context.','Use visual models, vocabulary banks, chunked instructions and guided questions.','Relevant practical equipment or demonstration materials, recording sheet and safety guidance.','Complete a short retrieval or application task that revisits the scientific concept.','Review explanations, evidence and misconceptions revealed during questioning or practical work.'],
    Computing:['Retrieve the syntax, concept or computational thinking skill needed for today’s task.','Check confusion between key computing concepts and common syntax, logic or debugging errors.','Ask pupils to modify, generalise, optimise or explain their solution and justify design choices.','Use worked code, chunked instructions, visual prompts and a debugging checklist.','Devices, starter code or examples, debugging checklist and a short test task.','Complete a small coding, digital literacy or retrieval task reinforcing the objective.','Review solution quality, debugging strategies and computational thinking.'],
    'Art and design':['Retrieve a relevant technique, formal element, artist reference or vocabulary from previous work.','Check confusion about technique, material use, proportion, composition or intended visual effect.','Ask pupils to refine a technique, make deliberate stylistic choices or explain their choices.','Demonstrate the technique in small steps; provide visual exemplars, process prompts and adapted materials where appropriate.','Relevant media and tools, exemplars, sketchbook materials and cleaning/protection equipment.','Develop a sketchbook study or short practice task preparing for the next practical stage.','Review technique, decision-making and evidence of refinement against the success criteria.'],
    Citizenship:['Retrieve a key term, institution, right or prior civic concept needed for today’s enquiry.','Check oversimplified or inaccurate assumptions about rights, law, democracy, institutions or participation.','Require pupils to weigh evidence, compare viewpoints and justify a reasoned civic judgement.','Pre-teach vocabulary, provide structured evidence prompts and model claim-versus-evidence reasoning.','Reliable information sources, case-study material, discussion prompts and an evidence organiser.','Complete a short evidence or reflection task connected to the civic question.','Review evidence, reasoning and respectful engagement with different viewpoints.'],
    'Design and technology':['Retrieve relevant materials, processes, mechanisms, safety rules or design principles.','Check misunderstandings about material properties, mechanisms, processes, safety or design constraints.','Ask pupils to justify design decisions, refine a prototype or evaluate against explicit criteria.','Use annotated exemplars, process demonstrations, checklists and sequenced making instructions.','Design brief, appropriate tools/materials, exemplars, safety equipment and evaluation criteria.','Complete a design refinement, research or evaluation task preparing for the next stage.','Review function, quality, decision-making and evaluation against the design criteria.'],
    Geography:['Retrieve relevant locational knowledge, geographical vocabulary or a prior process/model.','Check inaccurate assumptions about place, scale, physical processes, human patterns or cause and effect.','Ask pupils to interpret evidence, compare places/processes or justify a geographical conclusion.','Use maps, diagrams, vocabulary banks, sentence stems and scaffolded data interpretation.','Maps/atlases, relevant data or images, vocabulary prompts and an evidence task.','Complete a short map, data, retrieval or application task linked to the enquiry.','Review interpretation of evidence, geographical vocabulary and conclusions.'],
    History:['Retrieve key chronology, vocabulary, people/events or prior causal links needed for the enquiry.','Check chronology errors, anachronism, over-simplified causation and unsupported historical claims.','Ask pupils to evaluate evidence, compare interpretations or justify a nuanced historical argument.','Provide chronology, vocabulary support, source prompts and a model for evidence-based reasoning.','Primary/secondary sources, chronology support, contextual information and an evidence organiser.','Complete a short source, chronology or explanation task rehearsing the historical enquiry.','Review use of evidence, chronology, causation and historical reasoning.'],
    Languages:['Retrieve previously taught vocabulary, structures and pronunciation needed for today’s communicative task.','Check pronunciation, gender/agreement, word order and interference from English or another known language.','Require pupils to extend responses, manipulate structures or communicate with less scaffolding.','Use model language, pronunciation rehearsal, vocabulary banks and sentence frames.','Vocabulary/phrase cards, listening or reading stimulus, model language and pronunciation support.','Rehearse vocabulary or complete a short reading, listening, speaking or writing task.','Review accuracy, pronunciation, spontaneity and target-language use.'],
    Music:['Retrieve relevant musical vocabulary, notation, technique, repertoire or listening knowledge.','Check confusion about musical elements, notation, technique, structure or stylistic conventions.','Ask pupils to refine, improvise, compose, perform or explain musical choices independently.','Model short phrases, provide notation or visual prompts and rehearse in manageable sections.','Instruments/voices, notation or listening stimulus, rehearsal space and recording/evaluation tools.','Rehearse a short passage, listening task or composition/performance element.','Review musical accuracy, expressive choices, independence and improvement.'],
    'Physical education':['Retrieve the movement pattern, technique, rule or tactical principle needed for today’s activity.','Check unsafe technique, rule misunderstandings and common movement or tactical errors.','Increase decision-making demands, tactical complexity, precision or performance independence.','Break skills into stages; use demonstrations, visual cues, adapted equipment and progressive practice.','Appropriate equipment, marked activity space, demonstration cues and safety checks.','Complete a safe individual practice, fitness or reflection task where appropriate.','Review technique, decision-making, participation and progress against performance criteria.'],
    'Religious education (RE)':['Retrieve relevant beliefs, practices, vocabulary or prior enquiry needed for today’s question.','Check stereotypes, over-generalisation and confusion between different beliefs, practices or viewpoints.','Ask pupils to compare viewpoints, evaluate evidence and construct a reasoned response.','Pre-teach vocabulary, provide structured sources and sentence stems, and model respectful comparison.','Reliable source material, vocabulary prompts, enquiry question and an evidence organiser.','Complete a short reflection, retrieval or evidence task connected to the enquiry.','Review accuracy, evidence and the quality and respectfulness of pupils’ reasoning.']
  };

  const STOP = new Set(['about','after','again','also','being','between','could','from','have','into','more','must','other','over','should','their','there','these','they','this','those','through','under','using','what','when','where','which','while','with','would','pupils','students','learn','learning','understand','explain','describe','identify','develop','know','able']);
  const state = Object.create(null);
  const initial = Object.fromEntries([starter,misconceptions,challenge,support,resources,homework,reflection].map(f => [f.id,f.value]));

  function topicText(){ return String((topic.value === '__custom__' ? document.getElementById('customTopic')?.value : topic.value) || '').replace(/\s+/g,' ').trim(); }
  function terms(){ return [...new Set(`${topicText()} ${objective.value}`.toLowerCase().replace(/[^a-z0-9' -]/g,' ').split(/\s+/).filter(w => w.length >= 5 && !STOP.has(w)))].slice(0,5); }
  function setIfUntouched(field,value){
    if(!value) return;
    const previous=state[field.id];
    if(!field.value.trim() || field.value===previous || field.value===initial[field.id]){
      field.value=value;
      field.dispatchEvent(new Event('input',{bubbles:true}));
      state[field.id]=value;
    }
  }
  function apply(){
    const data=GUIDANCE[subject.value];
    if(!data || !topicText()) return;
    const words=terms();
    setIfUntouched(starter, data[0] + (words.length ? ` Focus retrieval on: ${words.join(', ')}.` : ''));
    setIfUntouched(misconceptions,data[1]);
    setIfUntouched(challenge,data[2] + (objective.value.trim() ? ' Use the learning objective as the success benchmark.' : ''));
    setIfUntouched(support,data[3]);
    setIfUntouched(resources,data[4]);
    setIfUntouched(homework,data[5]);
    setIfUntouched(reflection,data[6]);
  }
  [subject,topic,objective].forEach(input=>{
    input.addEventListener('change',()=>setTimeout(apply,0));
    input.addEventListener('input',()=>setTimeout(apply,0));
  });
  form.addEventListener('reset',()=>{ Object.keys(state).forEach(k=>{state[k]='';}); setTimeout(apply,0); });
  apply();
})();
