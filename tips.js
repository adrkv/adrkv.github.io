/* Shared one-time thank-you interaction. No payment is collected on this site. */
(() => {
  // Preselect USD amounts and use Ko-fi's tip-panel option to hide the public feed.
  const CHECKOUT_URLS = {
    '5': 'https://ko-fi.com/adrkv/5?hidefeed=true',
    '15': 'https://ko-fi.com/adrkv/15?hidefeed=true',
    '50': 'https://ko-fi.com/adrkv/50?hidefeed=true'
  };
  const AMOUNTS_ARE_PRESELECTED = true;

  document.querySelectorAll('[data-tip-widget]').forEach((widget, index) => {
    const trigger = widget.querySelector('.tip-trigger');
    const fallback = widget.querySelector('.tip-fallback');
    const panel = widget.querySelector('.tip-panel');
    if (!trigger || !panel || !fallback) return;
    const dock = widget.classList.contains('tip-widget--dock');
    const handle = dock ? widget.querySelector('.tip-move') : null;
    const slot = dock ? widget.closest('.tip-dock-slot') : null;
    const resetButton = dock ? widget.querySelector('.tip-reset') : null;
    const panelId = `tip-options-${index + 1}`;
    panel.id = panelId;
    trigger.setAttribute('aria-controls', panelId);
    if (handle) handle.setAttribute('aria-controls', panelId);
    widget.querySelectorAll('[data-tip-amount]').forEach((link) => {
      const amount = link.dataset.tipAmount;
      link.href = CHECKOUT_URLS[amount] || 'https://ko-fi.com/adrkv/5?hidefeed=true';
      link.setAttribute('aria-label', AMOUNTS_ARE_PRESELECTED
        ? `Give a $${amount} one-time thank-you on Ko-fi (opens in a new tab)`
        : `Suggested $${amount} thank-you. Choose an amount on Ko-fi (opens in a new tab)`);
    });
    const checkoutNote = widget.querySelector('[data-tip-checkout-note]');
    if (checkoutNote && AMOUNTS_ARE_PRESELECTED) checkoutNote.textContent = 'Continue on Ko-fi.';
    let pinned = false;
    let dismissed = false;
    let opener = trigger;
    let hoverTimer = 0;
    let positionFrame = 0;
    let detached = false;
    let detachedWidth = 0;
    let drag = null;
    let suppressDragClick = false;
    const margin = 12;
    const viewport = () => ({
      width: document.documentElement.clientWidth || window.innerWidth,
      height: window.innerHeight
    });
    const clamp = (value, min, max) => Math.max(min, Math.min(value, Math.max(min, max)));
    const cancelHoverClose = () => {
      window.clearTimeout(hoverTimer);
      hoverTimer = 0;
    };
    const positionPanel = () => {
      if (!dock || panel.hidden) return;
      const view = viewport();
      const anchor = widget.getBoundingClientRect();
      const width = Math.max(1, Math.min(340, view.width - margin * 2));
      Object.assign(panel.style, {
        position: 'fixed', width: `${width}px`, maxWidth: `${width}px`,
        maxHeight: `${Math.max(1, view.height - margin * 2)}px`,
        overflowY: 'auto', margin: '0', zIndex: '1001'
      });
      const height = panel.getBoundingClientRect().height;
      const below = anchor.bottom + 10;
      const above = anchor.top - height - 10;
      const top = below + height <= view.height - margin
        ? below
        : above >= margin ? above : clamp(below, margin, view.height - height - margin);
      panel.style.left = `${clamp(anchor.left, margin, view.width - width - margin)}px`;
      panel.style.top = `${clamp(top, margin, view.height - height - margin)}px`;
    };
    const setOpen = (open) => {
      cancelHoverClose();
      panel.hidden = !open;
      trigger.setAttribute('aria-expanded', String(open));
      if (handle) handle.setAttribute('aria-expanded', String(open));
      if (open) positionPanel();
    };
    const close = (restoreFocus = false) => {
      pinned = false;
      dismissed = true;
      setOpen(false);
      if (restoreFocus) opener.focus();
    };
    const toggle = (control) => {
      opener = control;
      if (!panel.hidden && pinned) close();
      else { pinned = true; dismissed = false; setOpen(true); }
    };
    const moveTo = (left, top) => {
      const view = viewport();
      widget.style.width = `${Math.min(detachedWidth, Math.max(1, view.width - margin * 2))}px`;
      const bounds = widget.getBoundingClientRect();
      widget.style.left = `${clamp(left, margin, view.width - bounds.width - margin)}px`;
      widget.style.top = `${clamp(top, margin, view.height - bounds.height - margin)}px`;
      positionPanel();
    };
    const detach = () => {
      if (detached) return;
      const bounds = widget.getBoundingClientRect();
      if (slot) {
        const reserved = slot.getBoundingClientRect();
        slot.style.width = `${reserved.width}px`;
        slot.style.height = `${reserved.height}px`;
        slot.style.flexShrink = '0';
      }
      detachedWidth = bounds.width;
      detached = true;
      widget.classList.add('is-moved');
      Object.assign(widget.style, {
        position: 'fixed', left: `${bounds.left}px`, top: `${bounds.top}px`,
        width: `${bounds.width}px`, zIndex: '1000'
      });
      if (resetButton) resetButton.hidden = false;
      moveTo(bounds.left, bounds.top);
    };
    const resetPosition = () => {
      drag = null;
      detached = false;
      widget.classList.remove('is-moved', 'is-dragging');
      ['position', 'left', 'top', 'width', 'zIndex'].forEach(property => { widget.style[property] = ''; });
      if (slot) ['width', 'height', 'flexShrink'].forEach(property => { slot.style[property] = ''; });
      if (resetButton) resetButton.hidden = true;
      if (handle) handle.focus();
      positionPanel();
    };
    const updatePosition = () => {
      if (positionFrame) return;
      positionFrame = window.requestAnimationFrame(() => {
        positionFrame = 0;
        if (detached) {
          const bounds = widget.getBoundingClientRect();
          moveTo(bounds.left, bounds.top);
        } else positionPanel();
      });
    };

    trigger.addEventListener('pointerenter', (event) => {
      cancelHoverClose();
      if (event.pointerType === 'mouse' && !dismissed && !drag) {
        opener = trigger;
        setOpen(true);
      }
    });
    trigger.addEventListener('click', () => toggle(trigger));
    widget.addEventListener('pointerenter', cancelHoverClose);
    panel.addEventListener('pointerenter', cancelHoverClose);
    widget.addEventListener('pointerleave', () => {
      dismissed = false;
      if (pinned || drag || widget.contains(document.activeElement)) return;
      if (dock) {
        // Keep the fixed popup reachable while crossing the small gap beneath the cup.
        hoverTimer = window.setTimeout(() => {
          if (!pinned && !drag && !widget.contains(document.activeElement)) setOpen(false);
        }, 240);
      } else setOpen(false);
    });
    widget.addEventListener('focusout', (event) => {
      if (!widget.contains(event.relatedTarget)) {
        dismissed = false;
        if (!pinned && !drag) setOpen(false);
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

    if (dock && handle) {
      handle.style.touchAction = 'none';
      if (resetButton) {
        resetButton.hidden = true;
        resetButton.addEventListener('click', resetPosition);
      }
      handle.addEventListener('pointerdown', (event) => {
        if (!event.isPrimary || event.button !== 0) return;
        cancelHoverClose();
        suppressDragClick = false;
        const bounds = widget.getBoundingClientRect();
        drag = {
          pointerId: event.pointerId, startX: event.clientX, startY: event.clientY,
          left: bounds.left, top: bounds.top, moved: false
        };
        try { handle.setPointerCapture(event.pointerId); } catch { /* Synthetic QA pointers have no active capture. */ }
      });
      handle.addEventListener('pointermove', (event) => {
        if (!drag || event.pointerId !== drag.pointerId) return;
        const dx = event.clientX - drag.startX;
        const dy = event.clientY - drag.startY;
        if (!drag.moved && Math.hypot(dx, dy) < 6) return;
        if (!drag.moved) {
          drag.moved = true;
          suppressDragClick = true;
          detach();
          widget.classList.add('is-dragging');
        }
        event.preventDefault();
        moveTo(drag.left + dx, drag.top + dy);
      });
      const finishDrag = (event) => {
        if (!drag || event.pointerId !== drag.pointerId) return;
        if (drag.moved) suppressDragClick = true;
        drag = null;
        widget.classList.remove('is-dragging');
        try {
          if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
        } catch { /* Capture may already have ended after a cancelled gesture. */ }
        positionPanel();
      };
      handle.addEventListener('pointerup', finishDrag);
      handle.addEventListener('pointercancel', finishDrag);
      handle.addEventListener('lostpointercapture', (event) => {
        if (drag && event.pointerId === drag.pointerId) finishDrag(event);
      });
      handle.addEventListener('click', (event) => {
        // A completed pointer drag generates a click; keyboard clicks remain usable.
        if (suppressDragClick && event.detail !== 0) {
          suppressDragClick = false;
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        suppressDragClick = false;
        toggle(handle);
      });
      handle.addEventListener('keydown', (event) => {
        if (event.key === 'Home') {
          event.preventDefault();
          resetPosition();
          return;
        }
        const directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
        const direction = directions[event.key];
        if (!direction) return;
        event.preventDefault();
        const step = event.shiftKey ? 40 : 16;
        const bounds = widget.getBoundingClientRect();
        detach();
        moveTo(bounds.left + direction[0] * step, bounds.top + direction[1] * step);
      });
      window.addEventListener('resize', updatePosition, { passive: true });
      window.addEventListener('scroll', updatePosition, { passive: true, capture: true });
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', updatePosition, { passive: true });
      }
    }
    setOpen(false);
    trigger.hidden = false;
    fallback.hidden = true;
  });
})();
