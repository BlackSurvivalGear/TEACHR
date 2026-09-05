(() => {
  const form = document.getElementById('builderForm');
  if (!form) return;

  // England National Curriculum structure: KS1 (Years 1–2), KS2 (Years 3–6),
  // KS3 (Years 7–9) and KS4 (Years 10–11). The subject catalogue below follows
  // the Department for Education subject names rather than generic AI categories.
  const CURRICULUM = {
    English: {
      groups: ['core'],
      topics: ['Spoken language', 'Word reading and phonics', 'Reading comprehension', 'Writing composition', 'Spelling', 'Grammar and punctuation', 'Vocabulary', 'English literature', 'Non-fiction', 'Shakespeare']
    },
    Mathematics: {
      groups: ['core'],
      topics: ['Number', 'Number and place value', 'Addition, subtraction, multiplication and division', 'Fractions', 'Decimals and percentages', 'Fractions, decimals and percentages', 'Ratio and proportion', 'Algebra', 'Geometry', 'Measurement', 'Statistics', 'Probability', 'Graphs and coordinates', 'Problem solving']
    },
    Science: {
      groups: ['core'],
      topics: ['Working scientifically', 'Plants', 'Animals including humans', 'Living things and their habitats', 'Materials and their properties', 'Rocks', 'Light', 'Forces', 'Electricity', 'Sound', 'States of matter', 'Earth and space', 'Evolution and inheritance', 'Ecology', 'Energy', 'Particle model', 'Chemical reactions', 'Waves', 'Magnetism and electromagnetism', 'Atomic structure']
    },
    'Art and design': {
      groups: ['foundation'],
      topics: ['Drawing', 'Painting', 'Sculpture', 'Printmaking', 'Photography', 'Mixed media', 'Collage', 'Digital art', 'Artists, craftspeople and designers', 'Composition', 'Colour and visual language', 'Portfolio development']
    },
    Citizenship: {
      groups: ['foundation', 'ks3-4'],
      topics: ['Democracy and government', 'The constitution and parliament', 'The justice system', 'Rights and responsibilities', 'Law and society', 'The economy and finance', 'Identity and diversity', 'Community and participation', 'Human rights', 'Media and digital citizenship']
    },
    Computing: {
      groups: ['foundation'],
      topics: ['Algorithms', 'Programming', 'Data representation', 'Computer systems', 'Networks', 'Cyber security', 'Databases', 'Data science', 'Artificial intelligence', 'Digital literacy', 'Computational thinking', 'Web development']
    },
    'Design and technology': {
      groups: ['foundation'],
      topics: ['Design process', 'Design briefs and specifications', 'Materials and their properties', 'Mechanisms', 'Structures', 'Electrical and electronic systems', 'Programming and control', 'Textiles', 'Food and nutrition', 'CAD and CAM', 'Making and evaluating']
    },
    Geography: {
      groups: ['foundation'],
      topics: ['Locational knowledge', 'Place knowledge', 'Map skills and fieldwork', 'Human geography', 'Physical geography', 'Rivers', 'Coasts', 'Weather and climate', 'Ecosystems', 'Population and migration', 'Urbanisation', 'Natural hazards', 'Climate change', 'Resources and sustainability']
    },
    History: {
      groups: ['foundation'],
      topics: ['Chronology and historical enquiry', 'Changes in Britain from the Stone Age to the Iron Age', 'Roman Britain', 'Anglo-Saxons and Scots', 'Vikings and Anglo-Saxons', 'Local history', 'Ancient civilisations', 'Medieval Britain', 'Tudors and Stuarts', 'Industrial Revolution', 'British Empire', 'World War I', 'World War II', 'Cold War', 'Civil rights', 'Historical interpretation and evidence']
    },
    Languages: {
      groups: ['foundation'],
      topics: ['Listening', 'Speaking', 'Reading', 'Writing', 'Phonics and pronunciation', 'Grammar', 'Vocabulary', 'Identity and culture', 'Local and global areas of interest', 'School and future study', 'Jobs and careers', 'Travel and holidays']
    },
    Music: {
      groups: ['foundation'],
      topics: ['Performing', 'Composing', 'Improvising', 'Listening and appraising', 'Musical elements', 'Notation', 'Keyboard and instrumental skills', 'Vocal music', 'Music technology', 'Musical traditions and cultures']
    },
    'Physical education': {
      groups: ['foundation'],
      topics: ['Physical literacy', 'Health, fitness and wellbeing', 'Athletics', 'Games', 'Football', 'Basketball', 'Netball', 'Rugby', 'Badminton', 'Dance', 'Gymnastics', 'Swimming', 'Outdoor and adventurous activities', 'Sports leadership']
    },
    'Religious education (RE)': {
      groups: ['statutory-other'],
      topics: ['Beliefs and values', 'Christianity', 'Islam', 'Judaism', 'Hinduism', 'Buddhism', 'Other religious and non-religious worldviews', 'Philosophy', 'Ethics', 'Religion and society', 'Religion and science', 'Religious literacy']
    }
  };

  const YEARS = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12', 'Year 13'];
  const FALLBACK_TOPICS = ['Introduction and foundations', 'Key concepts', 'Core knowledge', 'Application', 'Problem solving', 'Revision', 'Assessment preparation'];

  function replaceWithSelect(input, options, currentValue, ariaLabel) {
    const select = document.createElement('select');
    select.id = input.id;
    select.name = input.name;
    select.required = input.required;
    select.setAttribute('aria-label', ariaLabel || input.id);
    options.forEach(option => {
      const item = document.createElement('option');
      item.value = option;
      item.textContent = option;
      select.appendChild(item);
    });
    select.value = options.includes(currentValue) ? currentValue : options[0];
    input.replaceWith(select);
    return select;
  }

  const subjectInput = document.getElementById('subject');
  const yearInput = document.getElementById('year');
  const topicInput = document.getElementById('topic');
  if (!subjectInput || !yearInput || !topicInput) return;

  const currentSubject = subjectInput.value || 'Mathematics';
  const currentYear = yearInput.value || 'Year 8';
  const currentTopic = topicInput.value || 'Fractions';

  const subject = replaceWithSelect(subjectInput, Object.keys(CURRICULUM), currentSubject, 'Select National Curriculum subject');
  const year = replaceWithSelect(yearInput, YEARS, currentYear, 'Select year or grade');
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
  form.insertBefore(customWrap, form.querySelector('.form-actions'));
  const customTopic = customWrap.querySelector('#customTopic');

  function keyStageForYear(yearValue) {
    const number = Number(String(yearValue).replace(/\D/g, ''));
    if (number <= 2) return 'KS1';
    if (number <= 6) return 'KS2';
    if (number <= 9) return 'KS3';
    if (number <= 11) return 'KS4';
    return 'POST16';
  }

  function subjectLabel(subjectName) {
    if (subjectName === 'Religious education (RE)') return 'Religious education (RE) — statutory, outside National Curriculum';
    return subjectName;
  }

  function refreshSubjectLabels() {
    Array.from(subject.options).forEach(option => {
      option.textContent = subjectLabel(option.value);
    });
  }

  function populateTopics(preferred) {
    const topics = CURRICULUM[subject.value]?.topics || FALLBACK_TOPICS;
    topic.innerHTML = '';
    topics.forEach(item => {
      const option = document.createElement('option');
      option.value = item;
      option.textContent = item;
      topic.appendChild(option);
    });
    const customOption = document.createElement('option');
    customOption.value = '__custom__';
    customOption.textContent = 'Other / custom topic…';
    topic.appendChild(customOption);
    topic.value = topics.includes(preferred) ? preferred : (subject.value === 'Mathematics' && topics.includes('Fractions') ? 'Fractions' : topics[0]);
    customWrap.hidden = topic.value !== '__custom__';
    if (!customWrap.hidden && preferred && preferred !== '__custom__') customTopic.value = preferred;
  }

  function resetWorkspaceSelectors() {
    const profile = (() => {
      try { return JSON.parse(localStorage.getItem('teachr-teacher-profile') || '{}'); } catch { return {}; }
    })();
    subject.value = Object.keys(CURRICULUM).includes(profile.subject) ? profile.subject : 'Mathematics';
    year.value = YEARS.includes(profile.year) ? profile.year : 'Year 8';
    populateTopics(subject.value === 'Mathematics' ? 'Fractions' : undefined);
  }

  refreshSubjectLabels();
  populateTopics(currentTopic);
  subject.addEventListener('change', () => populateTopics());
  year.addEventListener('change', () => {
    // Keep the selected year available to downstream generation while exposing
    // the key stage for future curriculum-specific validation and UX.
    form.dataset.keyStage = keyStageForYear(year.value);
  });
  topic.addEventListener('change', () => {
    customWrap.hidden = topic.value !== '__custom__';
    if (!customWrap.hidden) customTopic.focus();
  });

  form.dataset.keyStage = keyStageForYear(year.value);

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

  document.getElementById('clearButton')?.addEventListener('click', () => setTimeout(resetWorkspaceSelectors, 0));
})();
