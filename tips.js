/* Shared one-time thank-you interaction. No payment is collected on this site. */
(() => {
  // Verified one-time Ko-fi links preselect the corresponding USD amount.
  const CHECKOUT_URLS = {
    '5': 'https://ko-fi.com/adrkv/5',
    '15': 'https://ko-fi.com/adrkv/15',
    '50': 'https://ko-fi.com/adrkv/50'
  };
  const AMOUNTS_ARE_PRESELECTED = true;

  document.querySelectorAll('[data-tip-widget]').forEach((widget, index) => {
    const trigger = widget.querySelector('.tip-trigger');
    const fallback = widget.querySelector('.tip-fallback');
    const panel = widget.querySelector('.tip-panel');
    if (!trigger || !panel || !fallback) return;
    const panelId = `tip-options-${index + 1}`;
    panel.id = panelId;
    trigger.setAttribute('aria-controls', panelId);
    widget.querySelectorAll('[data-tip-amount]').forEach((link) => {
      const amount = link.dataset.tipAmount;
      link.href = CHECKOUT_URLS[amount] || 'https://ko-fi.com/adrkv';
      link.setAttribute('aria-label', AMOUNTS_ARE_PRESELECTED
        ? `Give a $${amount} one-time thank-you on Ko-fi (opens in a new tab)`
        : `Suggested $${amount} thank-you. Choose an amount on Ko-fi (opens in a new tab)`);
    });
    const checkoutNote = widget.querySelector('[data-tip-checkout-note]');
    if (checkoutNote && AMOUNTS_ARE_PRESELECTED) checkoutNote.textContent = 'Continue on Ko-fi.';
    let pinned = false;
    let dismissed = false;
    const setOpen = (open) => {
      panel.hidden = !open;
      trigger.setAttribute('aria-expanded', String(open));
    };
    const close = (restoreFocus = false) => {
      pinned = false;
      dismissed = true;
      setOpen(false);
      if (restoreFocus) trigger.focus();
    };
    trigger.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'mouse' && !dismissed) setOpen(true);
    });
    trigger.addEventListener('focus', () => {
      if (!dismissed) setOpen(true);
    });
    trigger.addEventListener('click', () => {
      if (pinned) close();
      else { pinned = true; dismissed = false; setOpen(true); }
    });
    widget.addEventListener('pointerleave', () => {
      dismissed = false;
      if (!pinned && !widget.contains(document.activeElement)) setOpen(false);
    });
    widget.addEventListener('focusout', (event) => {
      if (!widget.contains(event.relatedTarget)) {
        dismissed = false;
        if (!pinned) setOpen(false);
      }
    });
    widget.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !panel.hidden) {
        event.preventDefault();
        event.stopPropagation();
        close(true);
      }
    });
    widget.querySelector('.tip-dismiss').addEventListener('click', () => close(true));
    document.addEventListener('pointerdown', (event) => {
      if (!widget.contains(event.target) && !panel.hidden) {
        close();
        dismissed = false;
      }
    });
    setOpen(false);
    trigger.hidden = false;
    fallback.hidden = true;
  });
})();
