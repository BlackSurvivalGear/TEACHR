(() => {
  const form = document.getElementById('builderForm');
  if (!form) return;

  const SUBJECTS = {
    Mathematics: ['Number and place value', 'Fractions', 'Decimals and percentages', 'Ratio and proportion', 'Algebra', 'Geometry', 'Statistics', 'Probability', 'Graphs and coordinates', 'Problem solving'],
    English: ['Reading comprehension', 'Creative writing', 'Descriptive writing', 'Persuasive writing', 'Poetry', 'Shakespeare', 'Grammar and punctuation', 'Vocabulary', 'Non-fiction', 'Speaking and listening'],
    Science: ['Cells', 'Forces', 'Energy', 'Particles and matter', 'Chemical reactions', 'Electricity', 'Waves', 'Earth and space', 'Genetics and inheritance', 'Ecology'],
    Biology: ['Cells', 'Organisation', 'Bioenergetics', 'Infection and response', 'Homeostasis', 'Inheritance', 'Ecology', 'Evolution', 'Human biology', 'Practical skills'],
    Chemistry: ['Atomic structure', 'The periodic table', 'Bonding', 'Quantitative chemistry', 'Chemical changes', 'Energy changes', 'Organic chemistry', 'Rates of reaction', 'Chemical analysis', 'Practical skills'],
    Physics: ['Energy', 'Electricity', 'Particle model', 'Atomic structure', 'Forces', 'Waves', 'Magnetism', 'Space physics', 'Motion', 'Practical skills'],
    History: ['Medieval Britain', 'Tudors', 'Industrial Revolution', 'British Empire', 'World War I', 'World War II', 'Cold War', 'Civil rights', 'Ancient civilisations', 'Historical skills'],
    Geography: ['Map skills', 'Rivers', 'Coasts', 'Weather and climate', 'Ecosystems', 'Population', 'Urbanisation', 'Development', 'Natural hazards', 'Climate change'],
    Computing: ['Algorithms', 'Programming', 'Data representation', 'Computer systems', 'Networks', 'Cyber security', 'Databases', 'Artificial intelligence', 'Web development', 'Computational thinking'],
    'Art & Design': ['Drawing', 'Painting', 'Sculpture', 'Photography', 'Printmaking', 'Mixed media', 'Artists and movements', 'Composition', 'Colour theory', 'Portfolio development'],
    'Religious Education': ['Beliefs and values', 'Christianity', 'Islam', 'Judaism', 'Hinduism', 'Buddhism', 'Ethics', 'Philosophy', 'Religion and society', 'Religion and science'],
    'Physical Education': ['Fitness', 'Athletics', 'Football', 'Basketball', 'Netball', 'Rugby', 'Badminton', 'Dance', 'Health and wellbeing', 'Sports leadership'],
    'Modern Languages': ['Greetings and introductions', 'Family', 'School', 'Home and town', 'Food and drink', 'Holidays', 'Hobbies', 'Daily routine', 'Travel', 'Grammar and vocabulary'],
    'PSHE / Citizenship': ['Relationships', 'Health and wellbeing', 'Online safety', 'Financial education', 'Careers', 'Democracy', 'Rights and responsibilities', 'Identity', 'Community', 'Life skills'],
    Economics: ['Supply and demand', 'Markets', 'Inflation', 'Unemployment', 'Economic growth', 'Fiscal policy', 'Monetary policy', 'International trade', 'Globalisation', 'Market failure'],
    'Business Studies': ['Business ownership', 'Entrepreneurship', 'Marketing', 'Finance', 'Operations', 'Human resources', 'Business strategy', 'Sales and revenue', 'Business growth', 'Global business']
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

  const subject = replaceWithSelect(subjectInput, Object.keys(SUBJECTS), currentSubject, 'Select subject');
  const year = replaceWithSelect(yearInput, YEARS, currentYear, 'Select year or grade');
  const topic = document.createElement('select');
  topic.id = 'topic';
  topic.name = 'topic';
  topic.required = true;
  topic.setAttribute('aria-label', 'Select topic');
  topicInput.replaceWith(topic);

  const customWrap = document.createElement('div');
  customWrap.className = 'field field-wide';
  customWrap.hidden = true;
  customWrap.innerHTML = '<label for="customTopic">Custom topic</label><input id="customTopic" type="text" placeholder="Enter a custom topic">';
  form.insertBefore(customWrap, form.querySelector('.form-actions'));
  const customTopic = customWrap.querySelector('#customTopic');

  function populateTopics(preferred) {
    const topics = SUBJECTS[subject.value] || FALLBACK_TOPICS;
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
    topic.value = topics.includes(preferred) ? preferred : (topics.includes('Fractions') && subject.value === 'Mathematics' ? 'Fractions' : topics[0]);
    customWrap.hidden = topic.value !== '__custom__';
    if (!customWrap.hidden && preferred && preferred !== '__custom__') customTopic.value = preferred;
  }

  function resetWorkspaceSelectors() {
    const profile = (() => {
      try { return JSON.parse(localStorage.getItem('teachr-teacher-profile') || '{}'); } catch { return {}; }
    })();
    subject.value = Object.keys(SUBJECTS).includes(profile.subject) ? profile.subject : 'Mathematics';
    year.value = YEARS.includes(profile.year) ? profile.year : 'Year 8';
    populateTopics(subject.value === 'Mathematics' ? 'Fractions' : undefined);
  }

  populateTopics(currentTopic);
  subject.addEventListener('change', () => populateTopics());
  topic.addEventListener('change', () => {
    customWrap.hidden = topic.value !== '__custom__';
    if (!customWrap.hidden) customTopic.focus();
  });

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
