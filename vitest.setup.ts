import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Sem `globals: true` o Testing Library não registra a limpeza automática.
afterEach(() => {
  cleanup();
});

// O jsdom não implementa estas APIs de layout, que o Radix chama ao abrir menus e tooltips.
if (typeof window !== 'undefined') {
  window.HTMLElement.prototype.scrollIntoView = () => {};
  window.HTMLElement.prototype.hasPointerCapture = () => false;
  window.HTMLElement.prototype.releasePointerCapture = () => {};
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
