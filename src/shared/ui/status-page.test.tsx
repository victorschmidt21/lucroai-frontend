import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '@/test/a11y';
import { StatusPage } from './status-page';

describe('StatusPage', () => {
  it('mostra o código, o título e a ação dentro do layout', async () => {
    const { container } = render(
      <StatusPage
        code="404"
        title="Página não encontrada"
        description="O endereço pode estar errado."
        action={<button type="button">Voltar ao início</button>}
      />,
    );

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Página não encontrada' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('main')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('fora do layout, traz o main e a logo, e anuncia o erro', () => {
    render(
      <StatusPage
        standalone
        alert
        title="Não foi possível carregar esta página"
        description="Tente novamente em instantes."
        action={<button type="button">Tentar novamente</button>}
      />,
    );

    expect(screen.getByRole('main')).toHaveTextContent('LucroAI');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Tente novamente em instantes.',
    );
  });
});
