(() => {
  const library = document.getElementById('whitepapers');
  if (!library) return;
  const papers = Array.from(library.querySelectorAll('.whitepaper-entry'));
  const results = library.querySelector('.whitepaper-list');
  const industryLinks = Array.from(library.querySelectorAll('[data-industry-filter]'));
  const topicSelect = library.querySelector('#whitepaper-topic');
  const affiliationSelect = library.querySelector('#whitepaper-affiliation');
  const status = library.querySelector('.whitepaper-status');
  const empty = library.querySelector('.whitepaper-empty');
  const reset = library.querySelector('.whitepaper-reset');
  const validIndustries = new Set(industryLinks.map(link => link.dataset.industryFilter));
  const validTopics = new Set(Array.from(topicSelect.options, option => option.value));
  const validAffiliations = new Set(Array.from(affiliationSelect.options, option => option.value));
  let state;

  function readState() {
    const query = new URLSearchParams(location.search);
    const industry = query.get('industry') || 'all';
    const topic = query.get('topic') || 'all';
    const affiliation = location.hash === '#whitepapers-schneider-electric'
      ? 'schneider-electric' : query.get('affiliation') || 'all';
    return {
      industry: validIndustries.has(industry) ? industry : 'all',
      topic: validTopics.has(topic) ? topic : 'all',
      affiliation: validAffiliations.has(affiliation) ? affiliation : 'all'
    };
  }

  function render() {
    const nextState = readState();
    const filtersChanged = state && ['industry', 'topic', 'affiliation'].some(key => state[key] !== nextState[key]);
    state = nextState;
    industryLinks.forEach(link => {
      if (link.dataset.industryFilter === state.industry) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
    topicSelect.value = state.topic;
    affiliationSelect.value = state.affiliation;
    let count = 0;
    papers.forEach(paper => {
      const matches = ['industry', 'topic', 'affiliation'].every(key =>
        state[key] === 'all' || (paper.dataset[key] || '').split(' ').includes(state[key]));
      paper.hidden = !matches;
      if (matches) count++;
    });
    const context = [];
    if (state.industry !== 'all') context.push(industryLinks.find(link => link.dataset.industryFilter === state.industry).textContent.trim());
    if (state.topic !== 'all') context.push(topicSelect.selectedOptions[0].textContent);
    if (state.affiliation !== 'all') context.push('Developed at ' + affiliationSelect.selectedOptions[0].textContent);
    status.textContent = `${count} whitepaper${count === 1 ? '' : 's'}${context.length ? ' · ' + context.join(' · ') : ''}`;
    empty.hidden = count !== 0;
    reset.hidden = Object.values(state).every(value => value === 'all');
    if (filtersChanged) results.scrollTop = 0;
  }

  function navigate(next) {
    const url = new URL(location.href);
    ['industry', 'topic', 'affiliation'].forEach(key => {
      if (next[key] === 'all') url.searchParams.delete(key);
      else url.searchParams.set(key, next[key]);
    });
    url.hash = 'whitepapers';
    history.pushState(null, '', url);
    render();
  }

  industryLinks.forEach(link => link.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate({ ...state, industry: link.dataset.industryFilter });
  }));
  topicSelect.addEventListener('change', () => navigate({ ...state, topic: topicSelect.value }));
  affiliationSelect.addEventListener('change', () => navigate({ ...state, affiliation: affiliationSelect.value }));
  reset.addEventListener('click', () => {
    navigate({ industry: 'all', topic: 'all', affiliation: 'all' });
    industryLinks.find(link => link.dataset.industryFilter === 'all').focus({ preventScroll: true });
  });
  window.addEventListener('popstate', render);
  window.addEventListener('hashchange', render);
  render();
})();
