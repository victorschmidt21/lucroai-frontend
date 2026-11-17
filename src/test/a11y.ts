import axe from 'axe-core';
import { expect } from 'vitest';

/**
 * O jsdom não calcula layout nem cores: o contraste é verificado em
 * `src/shared/ui/tokens.test.ts` e, no navegador real, em `e2e/design-system.spec.ts`.
 */
export async function expectNoA11yViolations(context: Element = document.body) {
  const { violations } = await axe.run(context, {
    rules: {
      'color-contrast': { enabled: false },
      region: { enabled: false },
    },
  });

  expect(violations.map(({ id, nodes }) => `${id}: ${nodes[0]?.html}`)).toEqual(
    [],
  );
}
