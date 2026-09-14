(() => {
  const nation = document.getElementById('vleNation');
  const keyStage = document.getElementById('vleKeyStage');
  const year = document.getElementById('vleYear');
  const subject = document.getElementById('vleSubject');
  const topic = document.getElementById('vleTopic');

  const yearsByStage = {
    eyfs: ['Reception'],
    ks1: ['Year 1', 'Year 2'],
    ks2: ['Year 3', 'Year 4', 'Year 5', 'Year 6'],
    ks3: ['Year 7', 'Year 8', 'Year 9'],
    ks4: ['Year 10', 'Year 11']
  };

  const topicsBySubject = {
    mathematics: ['Number', 'Fractions', 'Ratio & Proportion', 'Algebra', 'Measurement', 'Geometry', 'Statistics'],
    english: ['Reading', 'Writing', 'Spoken Language', 'Vocabulary', 'Grammar & Punctuation', 'Spelling'],
    science: ['Working Scientifically', 'Biology', 'Chemistry', 'Physics'],
    geography: ['Locational Knowledge', 'Place Knowledge', 'Human & Physical Geography', 'Geographical Skills'],
    history: ['Chronology', 'British History', 'Wider World History', 'Historical Enquiry'],
    computing: ['Computer Science', 'Information Technology', 'Digital Literacy']
  };

  function fill(select, values) {
    select.innerHTML = values.map(value => `<option value="${value}">${value}</option>`).join('');
  }

  function updateYears() {
    fill(year, yearsByStage[keyStage.value] || []);
  }

  function updateTopics() {
    fill(topic, topicsBySubject[subject.value] || []);
  }

  nation.addEventListener('change', () => {
    if (nation.value !== 'england') nation.value = 'england';
  });
  keyStage.addEventListener('change', updateYears);
  subject.addEventListener('change', updateTopics);
  updateYears();
  updateTopics();
})();