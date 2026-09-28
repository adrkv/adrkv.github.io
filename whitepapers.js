(() => {
  const library = document.getElementById('whitepapers');
  if (!library) return;
  const papers = Array.from(library.querySelectorAll('.whitepaper-entry'));
  const results = library.querySelector('.whitepaper-list');
  const controls = {
    industry: Array.from(library.querySelectorAll('[data-industry-filter]')),
    topic: Array.from(library.querySelectorAll('[data-topic-filter]'))
  };
  const status = library.querySelector('.whitepaper-status');
  const empty = library.querySelector('.whitepaper-empty');
  const reset = library.querySelector('.whitepaper-reset');
  const groups = ['industry', 'topic'];
  const values = Object.fromEntries(groups.map(key => [key,
    [...new Set(controls[key].map(button => button.dataset[`${key}Filter`]))]
      .filter(value => value && value !== 'all')
  ]));
  // Older partnership links keep their context until the visitor clears filters.
  const validAffiliations = new Set(['all', ...papers.flatMap(paper =>
    (paper.dataset.affiliation || '').split(/\s+/).filter(Boolean))]);
  const affiliationLabels = { 'schneider-electric': 'From my time at Schneider Electric' };
  let state;

  function readState() {
    const query = new URLSearchParams(location.search);
    const selections = Object.fromEntries(groups.map(key => {
      const requested = new Set(query.getAll(key).flatMap(value =>
        value.split(',').map(item => item.trim())));
      // DOM order keeps shared URLs and state comparisons deterministic.
      return [key, values[key].filter(value => requested.has(value))];
    }));
    const affiliation = location.hash === '#whitepapers-schneider-electric'
      ? 'schneider-electric' : query.get('affiliation') || 'all';
    return {
      ...selections,
      affiliation: validAffiliations.has(affiliation) ? affiliation : 'all'
    };
  }

  function render() {
    const nextState = readState();
    const filtersChanged = state && (state.affiliation !== nextState.affiliation ||
      groups.some(key => state[key].join(',') !== nextState[key].join(',')));
    state = nextState;
    groups.forEach(key => controls[key].forEach(button => {
      const value = button.dataset[`${key}Filter`];
      const selected = value === 'all' ? state[key].length === 0 : state[key].includes(value);
      button.setAttribute('aria-pressed', String(selected));
      button.removeAttribute('aria-current');
    }));
    let count = 0;
    papers.forEach(paper => {
      const matchesGroups = groups.every(key => {
        const paperValues = (paper.dataset[key] || '').split(/\s+/);
        return state[key].length === 0 || state[key].some(value => paperValues.includes(value));
      });
      const matchesAffiliation = state.affiliation === 'all' ||
        (paper.dataset.affiliation || '').split(/\s+/).includes(state.affiliation);
      paper.hidden = !(matchesGroups && matchesAffiliation);
      if (!paper.hidden) count++;
    });
    const context = [];
    groups.forEach(key => {
      if (state[key].length > 1) context.push(`${state[key].length} ${key === 'industry' ? 'industries' : 'topics'}`);
      else if (state[key].length === 1) context.push(controls[key]
        .find(button => button.dataset[`${key}Filter`] === state[key][0]).textContent.trim());
    });
    if (state.affiliation !== 'all') context.push(affiliationLabels[state.affiliation] || state.affiliation);
    status.textContent = `${count} whitepaper${count === 1 ? '' : 's'}${context.length ? ' · ' + context.join(' · ') : ''}`;
    empty.hidden = count !== 0;
    reset.hidden = groups.every(key => state[key].length === 0) && state.affiliation === 'all';
    if (filtersChanged) results.scrollTop = 0;
  }

  function navigate(next) {
    const url = new URL(location.href);
    groups.forEach(key => {
      url.searchParams.delete(key);
      values[key].filter(value => next[key].includes(value))
        .forEach(value => url.searchParams.append(key, value));
    });
    if (next.affiliation === 'all') url.searchParams.delete('affiliation');
    else url.searchParams.set('affiliation', next.affiliation);
    url.hash = 'whitepapers';
    if (url.href !== location.href) history.pushState(null, '', url);
    render();
  }

  groups.forEach(key => controls[key].forEach(button => button.addEventListener('click', () => {
    const value = button.dataset[`${key}Filter`];
    const selected = value === 'all' ? [] : state[key].includes(value)
      ? state[key].filter(item => item !== value) : [...state[key], value];
    navigate({ ...state, [key]: selected });
  })));
  reset.addEventListener('click', () => {
    navigate({ industry: [], topic: [], affiliation: 'all' });
    controls.industry.find(button => button.dataset.industryFilter === 'all')?.focus({ preventScroll: true });
  });
  window.addEventListener('popstate', render);
  window.addEventListener('hashchange', render);
  render();
})();
