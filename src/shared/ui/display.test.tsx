import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '@/test/a11y';
import { Alert } from './alert';
import {
  Badge,
  MetodoRateioBadge,
  StatusEstoqueBadge,
  StatusVendaBadge,
} from './badge';
import { Card } from './card';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import * as acoes from './icons/acoes';
import * as menu from './icons/menu';
import { Logo } from './logo';
import { PageHeader } from './page-header';
import { ProgressBar } from './progress-bar';
import { Skeleton } from './skeleton';
import { Spinner } from './spinner';
import { StatCard } from './stat-card';

describe('Badge', () => {
  it.each([
    ['critico', 'Crítico', 'text-status-critico'],
    ['baixo', 'Baixo', 'text-status-baixo'],
    ['adequado', 'Adequado', 'text-status-adequado'],
  ] as const)('estoque %s tem cor e texto', (status, texto, classe) => {
    render(<StatusEstoqueBadge status={status} />);

    expect(screen.getByText(texto)).toHaveClass(classe);
  });

  it.each([
    ['PENDENTE', 'Pendente', 'text-status-pendente'],
    ['CONCLUIDA', 'Concluída', 'text-status-concluida'],
    ['CANCELADA', 'Cancelada', 'text-status-cancelada'],
  ] as const)('venda %s tem cor e texto', (status, texto, classe) => {
    render(<StatusVendaBadge status={status} />);

    expect(screen.getByText(texto)).toHaveClass(classe);
  });

  it.each([
    ['PROPORCIONAL', 'Proporcional à qtd. de lotes'],
    ['POR_UNIDADE', 'Proporcional ao total de unidades'],
    ['FIXO', 'Valor fixo por produção'],
  ] as const)('método de rateio %s mostra o rótulo', (metodo, texto) => {
    render(<MetodoRateioBadge metodo={metodo} />);

    expect(screen.getByText(texto)).toBeInTheDocument();
  });

  it('é neutro por padrão', () => {
    render(<Badge>Novo</Badge>);

    expect(screen.getByText('Novo')).toHaveClass('text-ink-muted');
  });
});

describe('Card', () => {
  it('com título, vira uma seção nomeada', () => {
    render(
      <Card title="Rendimento">
        <p>12 unidades</p>
      </Card>,
    );

    expect(screen.getByRole('region', { name: 'Rendimento' })).toHaveClass(
      'rounded-md',
    );
  });

  it('sem título, é um bloco; o resumo tem cantos de 14px', () => {
    render(<Card variant="resumo">Total vendido</Card>);

    expect(screen.queryByRole('region')).not.toBeInTheDocument();
    expect(screen.getByText('Total vendido')).toHaveClass('rounded-lg');
  });
});

describe('StatCard', () => {
  it('mostra título, valor e detalhe com a cor pedida', () => {
    render(
      <StatCard
        title="Lucro líquido"
        value="-R$ 12,30"
        detail="Margem -1,0%"
        detailTone="danger"
        icon={<svg data-testid="icone" />}
      />,
    );

    expect(screen.getByText('Lucro líquido')).toBeInTheDocument();
    expect(screen.getByText('-R$ 12,30')).toHaveClass('text-display');
    expect(screen.getByText('Margem -1,0%')).toHaveClass('text-danger');
    expect(screen.getByTestId('icone')).toBeInTheDocument();
  });

  it('sem detalhe nem ícone', () => {
    render(<StatCard title="Vendas" value="12" />);

    expect(screen.getByText('12')).toBeInTheDocument();
  });
});

describe('ProgressBar', () => {
  it.each([
    [0.86, 0.86],
    [1.5, 1],
    [-1, 0],
  ])('limita %s ao intervalo de 0 a 1', (valor, esperado) => {
    render(<ProgressBar aria-label="Estoque de Ovos" value={valor} />);

    expect(
      screen.getByRole('progressbar', { name: 'Estoque de Ovos' }),
    ).toHaveAttribute('value', String(esperado));
  });

  it('anuncia o texto do valor e usa a cor do status', () => {
    render(
      <ProgressBar
        aria-label="Estoque de Sal"
        value={0.3}
        valueText="30%"
        tone="critico"
      />,
    );

    const barra = screen.getByRole('progressbar');

    expect(barra).toHaveAttribute('aria-valuetext', '30%');
    expect(barra.className).toContain('bg-status-critico');
  });
});

describe('estados', () => {
  it('Skeleton e Spinner têm nome acessível', () => {
    render(
      <>
        <Skeleton aria-label="Carregando insumos" />
        <Spinner />
        <Spinner label="Salvando" />
      </>,
    );

    expect(
      screen.getByRole('status', { name: 'Carregando insumos' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Carregando' })).toBeVisible();
    expect(screen.getByRole('status', { name: 'Salvando' })).toBeVisible();
  });

  it('EmptyState mostra título, descrição e ação', () => {
    render(
      <EmptyState
        title="Nenhum insumo encontrado."
        description="Cadastre o primeiro insumo."
        action={<button type="button">Novo insumo</button>}
      />,
    );

    expect(screen.getByText('Nenhum insumo encontrado.')).toBeInTheDocument();
    expect(screen.getByText('Cadastre o primeiro insumo.')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Novo insumo' }),
    ).toBeInTheDocument();
  });

  it('EmptyState funciona só com o título', () => {
    render(<EmptyState title="Nenhuma venda encontrada no período." />);

    expect(
      screen.getByText('Nenhuma venda encontrada no período.'),
    ).toBeInTheDocument();
  });

  it('ErrorState anuncia o erro e tenta de novo', async () => {
    const onRetry = vi.fn<() => void>();
    render(
      <ErrorState
        title="Não foi possível carregar os insumos."
        message="Sem conexão."
        onRetry={onRetry}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Não foi possível carregar os insumos.Sem conexão.',
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Tentar novamente' }),
    );

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('ErrorState fica ocupado durante a nova tentativa', () => {
    render(
      <ErrorState
        title="Erro ao carregar estoques"
        onRetry={() => {}}
        retrying
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Tentar novamente' }),
    ).toBeDisabled();
  });

  it('Alert anuncia o erro', () => {
    render(<Alert>Não foi possível salvar.</Alert>);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Não foi possível salvar.',
    );
  });
});

describe('PageHeader e Logo', () => {
  it('o título é o h1, com subtítulo e ações', () => {
    render(
      <PageHeader
        title="Insumos"
        subtitle="Gerencie quantidade, valor pago e custo unitário"
        actions={<button type="button">Novo insumo</button>}
      />,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Insumos' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Gerencie quantidade, valor pago e custo unitário'),
    ).toHaveClass('text-ink-subtle');
    expect(
      screen.getByRole('button', { name: 'Novo insumo' }),
    ).toBeInTheDocument();
  });

  it('PageHeader funciona só com o título', () => {
    render(<PageHeader title="Estoque" />);

    expect(screen.getByRole('heading', { name: 'Estoque' })).toBeVisible();
  });

  it.each([
    ['padrao', 'text-heading'],
    ['compacto', 'text-title'],
  ] as const)('Logo %s escreve LucroAI', (size, classe) => {
    render(<Logo size={size} />);

    expect(screen.getByText('LucroAI')).toHaveClass(classe);
  });
});

describe('ícones', () => {
  const icones = Object.entries({ ...menu, ...acoes });

  it('tem os oito ícones do menu do mobile', () => {
    expect(Object.keys(menu).toSorted()).toEqual([
      'IconCustos',
      'IconEstoque',
      'IconGastos',
      'IconHome',
      'IconInsumos',
      'IconProducao',
      'IconReceitas',
      'IconVendas',
    ]);
  });

  it.each(icones)('%s é decorativo e aceita classe', (_nome, Icone) => {
    const { container } = render(<Icone className="text-accent" />);
    const svg = container.querySelector('svg');

    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveClass('text-accent', 'size-5');
    expect(svg?.querySelector('path')?.getAttribute('d')).toMatch(/^M/);
  });
});

it('os componentes de exibição não têm violações de acessibilidade', async () => {
  render(
    <main>
      <PageHeader title="Painel" subtitle="Seu painel financeiro" />
      <Logo />
      <StatusEstoqueBadge status="critico" />
      <StatusVendaBadge status="CANCELADA" />
      <MetodoRateioBadge metodo="FIXO" />
      <Card title="Resumo">
        <StatCard title="Faturamento" value="R$ 10,00" detail="Período atual" />
      </Card>
      <ProgressBar aria-label="Estoque de Ovos" value={0.5} valueText="50%" />
      <Skeleton aria-label="Carregando vendas" />
      <Spinner />
      <EmptyState title="Nenhum insumo encontrado." />
      <ErrorState title="Erro ao carregar estoques" onRetry={() => {}} />
      <Alert>Falhou.</Alert>
    </main>,
  );

  await expectNoA11yViolations();
});
