(() => {
  const audienceLabels = {
    teams: 'Teams & collaborators',
    recruiters: 'Recruiters',
    nyu: 'NYU community',
    'early-career': 'Early-career professionals'
  };
  const meetingLabels = {
    online: 'Online',
    'coffee-phin': 'Coffee at Phin Coffee House, Boston (weekdays)',
    'coffee-pressed': 'Coffee at Pressed Cafe, Seaport (weekends)',
    'drinks-vermilion': 'Drinks at Vermilion Club, Boston (weekdays)',
    'drinks-bartaco': 'Drinks at bartaco, Seaport (weekends)'
  };
  const audienceSelect = document.getElementById('meeting-audience');
  const meetingSelect = document.getElementById('meeting-place');
  const copyButton = document.getElementById('copy-booking-details');
  const copyStatus = document.getElementById('booking-copy-status');
  const fallback = document.getElementById('booking-details-fallback');

  function currentContext() {
    const query = new URLSearchParams(location.search);
    const audience = query.get('audience') || '';
    const meeting = query.get('meeting') || 'online';
    return {
      audience: Object.hasOwn(audienceLabels, audience) ? audience : '',
      meeting: Object.hasOwn(meetingLabels, meeting) ? meeting : 'online'
    };
  }

  function renderContext() {
    const context = currentContext();
    if (audienceSelect) audienceSelect.value = context.audience;
    if (meetingSelect) meetingSelect.value = context.meeting;
    document.querySelectorAll('[data-audience-note]').forEach(note => {
      note.hidden = !context.audience;
      note.textContent = context.audience ? audienceLabels[context.audience] : '';
    });
    document.querySelectorAll('a[data-booking-context]').forEach(link => {
      const url = new URL(link.getAttribute('href'), location.href);
      const audience = link.dataset.bookingAudience || context.audience;
      if (audience) url.searchParams.set('audience', audience);
      else url.searchParams.delete('audience');
      if (link.dataset.bookingMeeting) url.searchParams.set('meeting', link.dataset.bookingMeeting);
      else url.searchParams.set('meeting', context.meeting);
      link.href = url.pathname + url.search + url.hash;
    });
    document.querySelectorAll('[data-venue]').forEach(venue => {
      venue.classList.toggle('is-selected', venue.dataset.venue === context.meeting);
    });
    if (copyStatus) copyStatus.textContent = '';
    if (fallback) fallback.hidden = true;
  }

  function updateContext() {
    const url = new URL(location.href);
    if (audienceSelect.value) url.searchParams.set('audience', audienceSelect.value);
    else url.searchParams.delete('audience');
    url.searchParams.set('meeting', meetingSelect.value);
    history.replaceState(null, '', url);
    renderContext();
  }

  function bookingDetails() {
    const context = currentContext();
    return [
      '30 minutes with Addy Kaveti',
      context.audience ? `Connecting as: ${audienceLabels[context.audience]}` : '',
      `Meeting: ${meetingLabels[context.meeting]}`
    ].filter(Boolean).join('\n');
  }

  if (audienceSelect && meetingSelect) {
    audienceSelect.addEventListener('change', updateContext);
    meetingSelect.addEventListener('change', updateContext);
  }
  if (copyButton) {
    copyButton.hidden = false;
    copyButton.addEventListener('click', async () => {
      const text = bookingDetails();
      try {
        if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(text);
        copyStatus.textContent = 'Copied. Choose matching answers in Calendar.';
      } catch (_) {
        fallback.textContent = text;
        fallback.hidden = false;
        copyStatus.textContent = 'Your details are below, ready to copy.';
      }
    });
  }
  window.addEventListener('popstate', renderContext);
  renderContext();
})();
