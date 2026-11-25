export type Snap = 'peek' | 'half' | 'full';

const ORDER: readonly Snap[] = ['peek', 'half', 'full'];
const PEEK_HEIGHT = 180;
const HALF_RATIO = 0.46;
const FULL_RATIO = 0.64;

export interface Sheet {
  getSnap: () => Snap;
  setSnap: (snap: Snap) => void;
  isPhone: () => boolean;
}

/**
 * Phone bottom sheet with three snap heights. The grabber follows the finger
 * and settles on the nearest snap, taking the swipe speed into account.
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

  let dragging = false;
  let startY = 0;
  let startHeight = 0;
  let lastY = 0;
  let lastTime = 0;
  let velocity = 0;
  let moved = false;

  grabber.addEventListener('pointerdown', (event) => {
    if (!phoneQuery.matches) {
      return;
    }
    dragging = true;
    moved = false;
    startY = event.clientY;
    lastY = event.clientY;
    lastTime = event.timeStamp;
    velocity = 0;
    startHeight = drawer.getBoundingClientRect().height;
    try {
      grabber.setPointerCapture(event.pointerId);
    } catch {
      // Capture can be refused for synthetic or already-ended pointers.
    }
  });

  grabber.addEventListener('pointermove', (event) => {
    if (!dragging) {
      return;
    }
    const delta = event.clientY - startY;
    if (!moved && Math.abs(delta) > 4) {
      moved = true;
      drawer.classList.add('dragging');
    }
    if (!moved) {
      return;
    }
    const sizes = heights();
    const height = Math.min(sizes.full, Math.max(sizes.peek, startHeight - delta));
    drawer.style.height = `${height}px`;
    const elapsed = event.timeStamp - lastTime;
    if (elapsed > 0) {
      velocity = (event.clientY - lastY) / elapsed;
    }
    lastY = event.clientY;
    lastTime = event.timeStamp;
  });

  function finishDrag(): void {
    if (!dragging) {
      return;
    }
    dragging = false;
    if (!moved) {
      return;
    }
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

  grabber.addEventListener('pointerup', finishDrag);
  grabber.addEventListener('pointercancel', finishDrag);

  grabber.addEventListener('click', () => {
    if (moved) {
      moved = false;
      return;
    }
    setSnap(snap === 'peek' ? 'half' : 'peek');
  });

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
