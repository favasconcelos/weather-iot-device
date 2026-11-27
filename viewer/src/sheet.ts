export type Snap = 'peek' | 'half' | 'full';

const ORDER: readonly Snap[] = ['peek', 'half', 'full'];
const PEEK_HEIGHT = 180;
const HALF_RATIO = 0.5;
const FULL_RATIO = 0.75;

export interface Sheet {
  getSnap: () => Snap;
  setSnap: (snap: Snap) => void;
  isPhone: () => boolean;
}

/**
 * Phone bottom sheet with three snap heights. Dragging the header (or swiping
 * the list past its scroll edge) follows the finger and settles on the nearest
 * snap, taking the swipe speed into account.
 * Above the phone breakpoint the drawer is a side panel and snaps are inert.
 */
export function initSheet(
  drawer: HTMLElement,
  grabber: HTMLButtonElement,
  onChange: (snap: Snap) => void,
): Sheet {
  const phoneQuery = window.matchMedia('(max-width: 699px)');
  const probe = document.createElement('div');
  probe.style.cssText =
    'position:fixed;visibility:hidden;pointer-events:none;padding-bottom:env(safe-area-inset-bottom,0px)';
  document.body.appendChild(probe);

  let snap: Snap = 'peek';

  function heights(): Record<Snap, number> {
    const safeBottom = parseFloat(getComputedStyle(probe).paddingBottom) || 0;
    const viewport = window.visualViewport?.height ?? window.innerHeight;
    return {
      peek: PEEK_HEIGHT + safeBottom,
      half: Math.max(PEEK_HEIGHT + safeBottom + 80, viewport * HALF_RATIO),
      full: Math.max(PEEK_HEIGHT + safeBottom + 160, viewport * FULL_RATIO),
    };
  }

  function writeHeights(): void {
    const sizes = heights();
    for (const key of ORDER) {
      drawer.style.setProperty(`--h-${key}`, `${Math.round(sizes[key])}px`);
    }
  }

  function setSnap(next: Snap): void {
    snap = next;
    drawer.dataset.snap = next;
    grabber.setAttribute('aria-expanded', String(next !== 'peek'));
    grabber.setAttribute('aria-label', next === 'peek' ? 'Expand panel' : 'Collapse panel');
    onChange(next);
  }

  const panels = drawer.querySelector<HTMLElement>('.tab-panels');

  let dragging = false;
  let startY = 0;
  let startHeight = 0;
  let lastY = 0;
  let lastTime = 0;
  let velocity = 0;
  let moved = false;
  let suppressClick = false;
  let handoff = false;

  function beginDrag(y: number, time: number): void {
    dragging = true;
    moved = false;
    startY = y;
    lastY = y;
    lastTime = time;
    velocity = 0;
    startHeight = drawer.getBoundingClientRect().height;
  }

  function moveDrag(y: number, time: number): boolean {
    const delta = y - startY;
    if (!moved && Math.abs(delta) > 4) {
      moved = true;
      drawer.classList.add('dragging');
    }
    if (!moved) {
      return false;
    }
    const sizes = heights();
    const height = Math.min(sizes.full, Math.max(sizes.peek, startHeight - delta));
    drawer.style.height = `${height}px`;
    const elapsed = time - lastTime;
    if (elapsed > 0) {
      velocity = (y - lastY) / elapsed;
    }
    lastY = y;
    lastTime = time;
    return true;
  }

  function finishDrag(): void {
    if (!dragging) {
      return;
    }
    dragging = false;
    if (!moved) {
      return;
    }
    suppressClick = true;
    window.setTimeout(() => {
      suppressClick = false;
    }, 60);
    const sizes = heights();
    const current = drawer.getBoundingClientRect().height;
    // A fast swipe carries the sheet a little further than the finger.
    const projected = current - velocity * 160;
    let best: Snap = 'peek';
    for (const key of ORDER) {
      if (Math.abs(sizes[key] - projected) < Math.abs(sizes[best] - projected)) {
        best = key;
      }
    }
    drawer.classList.remove('dragging');
    drawer.style.removeProperty('height');
    setSnap(best);
  }

  // Everything above the scrolling list is a drag handle, not only the grabber.
  drawer.addEventListener('pointerdown', (event) => {
    if (!phoneQuery.matches || (event.target as Element).closest('.tab-panels')) {
      return;
    }
    beginDrag(event.clientY, event.timeStamp);
  });

  drawer.addEventListener('pointermove', (event) => {
    if (!dragging || handoff) {
      return;
    }
    const wasMoved = moved;
    if (moveDrag(event.clientY, event.timeStamp) && !wasMoved) {
      try {
        drawer.setPointerCapture(event.pointerId);
      } catch {
        // Capture can be refused for synthetic or already-ended pointers.
      }
    }
  });

  const endPointerDrag = (): void => {
    if (!handoff) {
      finishDrag();
    }
  };
  drawer.addEventListener('pointerup', endPointerDrag);
  drawer.addEventListener('pointercancel', endPointerDrag);

  drawer.addEventListener(
    'click',
    (event) => {
      if (suppressClick) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true,
  );

  grabber.addEventListener('click', () => {
    setSnap(snap === 'peek' ? 'half' : 'peek');
  });

  // The list scrolls natively, but at its edges a swipe hands over to the sheet:
  // swiping up grows a sheet that is not yet full, swiping down from the top shrinks it.
  let touchStartY = 0;

  panels?.addEventListener(
    'touchstart',
    (event) => {
      handoff = false;
      touchStartY = event.touches[0]?.clientY ?? 0;
    },
    { passive: true },
  );

  panels?.addEventListener(
    'touchmove',
    (event) => {
      const touch = event.touches[0];
      if (!panels || !touch || event.touches.length !== 1 || !phoneQuery.matches) {
        return;
      }
      if (!handoff) {
        const delta = touch.clientY - touchStartY;
        const grow = delta < -4 && snap !== 'full';
        const shrink = delta > 4 && panels.scrollTop <= 0 && snap !== 'peek';
        if (!event.cancelable || (!grow && !shrink)) {
          return;
        }
        handoff = true;
        beginDrag(touchStartY, event.timeStamp);
      }
      event.preventDefault();
      moveDrag(touch.clientY, event.timeStamp);
    },
    { passive: false },
  );

  const endHandoff = (): void => {
    if (handoff) {
      handoff = false;
      finishDrag();
    }
  };
  panels?.addEventListener('touchend', endHandoff);
  panels?.addEventListener('touchcancel', endHandoff);

  writeHeights();
  window.addEventListener('resize', writeHeights);
  window.visualViewport?.addEventListener('resize', writeHeights);
  setSnap('peek');

  return {
    getSnap: () => snap,
    setSnap,
    isPhone: () => phoneQuery.matches,
  };
}
