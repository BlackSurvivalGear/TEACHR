(() => {
  const form = document.getElementById('builderForm');
  if (!form) return;

  const FRAMEWORKS = {
    england: {
      label: 'England — National Curriculum',
      stages: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Post-16'],
      subjects: {
        English: ['Spoken language', 'Reading comprehension', 'Writing composition', 'Spelling', 'Grammar and punctuation', 'Vocabulary', 'English literature', 'Non-fiction', 'Shakespeare'],
        Mathematics: ['Number', 'Number and place value', 'Addition, subtraction, multiplication and division', 'Fractions', 'Decimals and percentages', 'Ratio and proportion', 'Algebra', 'Geometry', 'Measurement', 'Statistics', 'Probability', 'Graphs and coordinates', 'Problem solving'],
        Science: ['Working scientifically', 'Plants', 'Animals including humans', 'Living things and their habitats', 'Materials and their properties', 'Rocks', 'Light', 'Forces', 'Electricity', 'Sound', 'States of matter', 'Earth and space', 'Evolution and inheritance', 'Ecology', 'Energy', 'Particle model', 'Chemical reactions', 'Waves', 'Magnetism and electromagnetism', 'Atomic structure'],
        'Art and design': ['Drawing', 'Painting', 'Sculpture', 'Printmaking', 'Photography', 'Mixed media', 'Artists, craftspeople and designers', 'Composition', 'Colour and visual language'],
        Citizenship: ['Democracy and government', 'The constitution and parliament', 'Justice system', 'Rights and responsibilities', 'Law and society', 'Economy and finance', 'Identity and diversity', 'Community and participation', 'Human rights'],
        Computing: ['Algorithms', 'Programming', 'Data representation', 'Computer systems', 'Networks', 'Cyber security', 'Databases', 'Data science', 'Artificial intelligence', 'Digital literacy', 'Computational thinking'],
        'Design and technology': ['Design process', 'Design briefs and specifications', 'Materials and their properties', 'Mechanisms', 'Structures', 'Electrical and electronic systems', 'Programming and control', 'Textiles', 'Food and nutrition', 'CAD and CAM'],
        Geography: ['Locational knowledge', 'Place knowledge', 'Map skills and fieldwork', 'Human geography', 'Physical geography', 'Rivers', 'Coasts', 'Weather and climate', 'Ecosystems', 'Population and migration', 'Urbanisation', 'Natural hazards', 'Climate change'],
        History: ['Chronology and historical enquiry', 'Stone Age to Iron Age', 'Roman Britain', 'Anglo-Saxons and Scots', 'Vikings and Anglo-Saxons', 'Local history', 'Ancient civilisations', 'Medieval Britain', 'Tudors and Stuarts', 'Industrial Revolution', 'British Empire', 'World War I', 'World War II', 'Cold War', 'Civil rights'],
        Languages: ['Listening', 'Speaking', 'Reading', 'Writing', 'Phonics and pronunciation', 'Grammar', 'Vocabulary', 'Identity and culture', 'Travel and holidays'],
        Music: ['Performing', 'Composing', 'Improvising', 'Listening and appraising', 'Musical elements', 'Notation', 'Instrumental skills', 'Vocal music', 'Music technology'],
        'Physical education': ['Physical literacy', 'Health, fitness and wellbeing', 'Athletics', 'Games', 'Football', 'Basketball', 'Netball', 'Rugby', 'Badminton', 'Dance', 'Gymnastics', 'Swimming'],
        'Religious education (RE)': ['Beliefs and values', 'Christianity', 'Islam', 'Judaism', 'Hinduism', 'Buddhism', 'Other worldviews', 'Philosophy', 'Ethics', 'Religion and society']
      }
    },
    scotland: {
      label: 'Scotland — Curriculum for Excellence',
      stages: ['Early Level', 'First Level', 'Second Level', 'Third Level', 'Fourth Level', 'S4', 'S5', 'S6'],
      subjects: {
        'Expressive arts': ['Art and design', 'Dance', 'Drama', 'Music', 'Creative practice', 'Performing and presenting'],
        'Health and wellbeing': ['Mental, emotional, social and physical wellbeing', 'Food and health', 'Physical education', 'Relationships', 'Planning for choices and changes', 'Substance misuse', 'Safety'],
        Languages: ['Listening and talking', 'Reading', 'Writing', 'English language', 'Gaelic', 'Modern languages', 'Literacy across learning'],
        Mathematics: ['Number, money and measure', 'Shape, position and movement', 'Information handling', 'Numeracy', 'Algebra', 'Geometry', 'Statistics', 'Probability', 'Problem solving'],
        'Religious and moral education': ['Christianity', 'World religions', 'Development of beliefs and values', 'Values and issues', 'Religious and moral questions'],
        Sciences: ['Planet Earth', 'Forces, electricity and waves', 'Biological systems', 'Materials', 'Chemical changes and structure', 'Topical science', 'Inquiry and investigation'],
        'Social studies': ['People, past events and societies', 'People, place and environment', 'People in society, economy and business', 'History', 'Geography', 'Modern studies', 'Global citizenship'],
        Technologies: ['Technological developments', 'ICT to enhance learning', 'Business and computing science', 'Craft, design, engineering and graphics', 'Food and textiles', 'Computing science', 'Digital literacy']
      }
    },
    wales: {
      label: 'Wales — Curriculum for Wales',
      stages: ['Progression Step 1', 'Progression Step 2', 'Progression Step 3', 'Progression Step 4', 'Years 10–11'],
      subjects: {
        'Expressive Arts': ['Exploring the expressive arts', 'Creating', 'Performing and presenting', 'Responding and reflecting', 'Art', 'Dance', 'Drama', 'Music', 'Film and digital media'],
        'Health and Well-being': ['Physical health', 'Mental health and emotional wellbeing', 'Healthy relationships', 'Healthy choices', 'Safety', 'Physical activity', 'Wellbeing and resilience'],
        Humanities: ['Enquiry', 'History', 'Geography', 'Religion, values and ethics', 'Society and culture', 'Politics and citizenship', 'Business and economics'],
        'Languages, Literacy and Communication': ['Welsh', 'English', 'International languages', 'Listening', 'Speaking', 'Reading', 'Writing', 'Literature', 'Communication'],
        'Mathematics and Numeracy': ['Number', 'Algebra', 'Geometry and measurement', 'Statistics', 'Probability', 'Financial mathematics', 'Numeracy', 'Problem solving'],
        'Science and Technology': ['Enquiry and scientific method', 'Living things', 'Matter', 'Forces and energy', 'Earth and space', 'Design and engineering', 'Digital technology', 'Computing', 'Data and information']
      }
    },
    northern_ireland: {
      label: 'Northern Ireland — Northern Ireland Curriculum',
      stages: ['Foundation Stage (P1–P2)', 'Key Stage 1 (P3–P4)', 'Key Stage 2 (P5–P7)', 'Key Stage 3 (Years 8–10)', 'Key Stage 4 (Years 11–12)'],
      subjects: {
        'Language and Literacy': ['Talking and listening', 'Reading', 'Writing', 'Phonics', 'Grammar', 'Literature'],
        'Mathematics and Numeracy': ['Number', 'Shape and space', 'Measures', 'Handling data', 'Algebra', 'Financial capability', 'Problem solving'],
        Arts: ['Art and design', 'Music', 'Drama', 'Creative expression', 'Performing'],
        'The World Around Us': ['Interdependence', 'Place', 'Movement and energy', 'Change over time', 'Earth and environment', 'Science', 'Geography', 'History'],
        'Personal Development and Mutual Understanding': ['Personal understanding', 'Mutual understanding', 'Relationships', 'Citizenship', 'Rights and responsibilities', 'Health and wellbeing'],
        'Physical Education': ['Athletics', 'Games', 'Gymnastics', 'Dance', 'Swimming', 'Outdoor activities', 'Health and fitness'],
        'Modern Languages': ['Listening', 'Speaking', 'Reading', 'Writing', 'Grammar', 'Vocabulary', 'Culture'],
        'Science and Technology': ['Science', 'Technology', 'Digital skills', 'Computing', 'Materials', 'Forces and energy', 'Living things'],
        'Environment and Society': ['History', 'Geography', 'Society', 'Economy', 'Citizenship'],
        'Learning for Life and Work': ['Employability', 'Personal development', 'Local and global citizenship', 'Home economics', 'Financial capability'],
        'Religious Education': ['Christianity', 'World religions', 'Beliefs and values', 'Ethics', 'Religious understanding']
      }
    }
  };

  const curriculumInput = document.getElementById('curriculum');
  const subjectInput = document.getElementById('subject');
  const yearInput = document.getElementById('year');
  const topicInput = document.getElementById('topic');
  if (!curriculumInput || !subjectInput || !yearInput || !topicInput) return;

  function replaceSelect(input, options, current, label) {
    const select = document.createElement('select');
    select.id = input.id;
    select.name = input.name;
    select.required = input.required;
    select.setAttribute('aria-label', label);
    options.forEach(value => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
    if (options.includes(current)) select.value = current;
    input.replaceWith(select);
    return select;
  }

  const savedProfile = (() => {
    try { return JSON.parse(localStorage.getItem('teachr-teacher-profile') || '{}'); } catch { return {}; }
  })();

  const curriculumKeyFromValue = value => Object.keys(FRAMEWORKS).find(key => FRAMEWORKS[key].label === value || key === value) || 'england';
  const initialKey = curriculumKeyFromValue(curriculumInput.value || savedProfile.curriculum) || 'england';
  const curriculum = replaceSelect(curriculumInput, Object.values(FRAMEWORKS).map(item => item.label), FRAMEWORKS[initialKey].label, 'Select curriculum and nation');
  const subject = replaceSelect(subjectInput, Object.keys(FRAMEWORKS[initialKey].subjects), subjectInput.value, 'Select subject or curriculum area');
  const year = replaceSelect(yearInput, FRAMEWORKS[initialKey].stages, yearInput.value, 'Select curriculum stage');

  const topic = document.createElement('select');
  topic.id = 'topic';
  topic.name = 'topic';
  topic.required = true;
  topic.setAttribute('aria-label', 'Select curriculum topic');
  topicInput.replaceWith(topic);

  const customWrap = document.createElement('div');
  customWrap.className = 'field field-wide';
  customWrap.hidden = true;
  customWrap.innerHTML = '<label for="customTopic">Custom topic</label><input id="customTopic" type="text" placeholder="Enter a custom topic">';
  const topicField = topic.closest('.field');
  if (topicField) topicField.insertAdjacentElement('afterend', customWrap);
  else form.insertBefore(customWrap, form.querySelector('.form-actions'));
  const customTopic = customWrap.querySelector('#customTopic');

  function frameworkKey() {
    return curriculumKeyFromValue(curriculum.value);
  }

  function setCustomTopicVisibility() {
    const isCustom = topic.value === '__custom__';
    customWrap.hidden = !isCustom;
    customTopic.required = isCustom;
    if (isCustom) customTopic.focus();
  }

  function populateTopics(preferred) {
    const topics = FRAMEWORKS[frameworkKey()].subjects[subject.value] || ['Introduction and foundations', 'Core knowledge', 'Application', 'Problem solving', 'Revision', 'Assessment preparation'];
    topic.innerHTML = '';
    topics.forEach(value => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      topic.appendChild(option);
    });
    const customOption = document.createElement('option');
    customOption.value = '__custom__';
    customOption.textContent = 'Other / custom topic…';
    topic.appendChild(customOption);
    topic.value = topics.includes(preferred) ? preferred : (frameworkKey() === 'england' && subject.value === 'Mathematics' ? 'Fractions' : topics[0]);
    setCustomTopicVisibility();
  }

  function updateFramework(preferredSubject, preferredStage, preferredTopic) {
    const key = frameworkKey();
    const framework = FRAMEWORKS[key];
    const subjectOptions = Object.keys(framework.subjects);
    subject.innerHTML = '';
    subjectOptions.forEach(value => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      subject.appendChild(option);
    });
    subject.value = subjectOptions.includes(preferredSubject) ? preferredSubject : subjectOptions[0];

    year.innerHTML = '';
    framework.stages.forEach(value => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      year.appendChild(option);
    });
    year.value = framework.stages.includes(preferredStage) ? preferredStage : framework.stages[Math.min(1, framework.stages.length - 1)];
    populateTopics(preferredTopic);
    form.dataset.curriculumNation = key;
    form.dataset.curriculumFramework = framework.label;
  }

  const currentSubject = subject.value;
  const currentStage = year.value;
  const currentTopic = topicInput.value || 'Fractions';
  updateFramework(currentSubject, currentStage, currentTopic);

  curriculum.addEventListener('change', () => updateFramework(undefined, undefined, undefined));
  subject.addEventListener('change', () => populateTopics());
  topic.addEventListener('change', setCustomTopicVisibility);

  form.addEventListener('submit', event => {
    if (topic.value !== '__custom__') return;
    const value = customTopic.value.trim();
    if (!value) {
      event.preventDefault();
      customTopic.focus();
      return;
    }
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    topic.appendChild(option);
    topic.value = value;
  }, true);

  document.getElementById('clearButton')?.addEventListener('click', () => setTimeout(() => {
    curriculum.value = FRAMEWORKS.england.label;
    updateFramework('Mathematics', 'Year 8', 'Fractions');
  }, 0));
})();
