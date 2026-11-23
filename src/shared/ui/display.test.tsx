import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '@/test/a11y';
import { Alert } from './alert';
import {
  Badge,
  TipoGastoBadge,
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
    ['MENSAL', 'Conta do mês'],
    ['POR_UNIDADE', 'Por unidade vendida'],
    ['PERCENTUAL_VENDA', '% da venda'],
  ] as const)('tipo de gasto %s mostra o rótulo', (tipo, texto) => {
    render(<TipoGastoBadge tipo={tipo} />);

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
      'rounded-lg',
    );
  });

  it('sem título, é um bloco com cantos de 20px', () => {
    render(<Card>Total vendido</Card>);

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

  it('na variante heroi, fica sobre Amora com o valor de 36px', () => {
    render(
      <StatCard
        variant="heroi"
        title="Sobrou pra você"
        value="R$ 1.234,56"
        detail="De cada R$ 100, R$ 32 ficam com você"
        detailTone="danger"
      />,
    );

    const valor = screen.getByText('R$ 1.234,56');
    expect(valor).toHaveClass('text-display-lg', 'tabular-nums');
    expect(valor.parentElement).toHaveClass('bg-accent', 'text-on-accent');
    expect(screen.getByText('Sobrou pra você')).toHaveClass('text-on-accent');
    // O tom do detalhe não vale sobre Amora: o chip fica em `accent-strong`.
    expect(
      screen.getByText('De cada R$ 100, R$ 32 ficam com você'),
    ).toHaveClass('bg-accent-strong');
  });

  it('na variante padrao, fica sobre surface com o valor em display', () => {
    render(<StatCard title="Vendas" value="12" />);

    const valor = screen.getByText('12');
    expect(valor).toHaveClass('text-display');
    expect(valor.parentElement).toHaveClass('bg-surface');
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

  it('EmptyState mostra a ilustracao no lugar do ícone, escondida do leitor', () => {
    const { container } = render(
      <EmptyState
        title="Nenhum insumo encontrado."
        icon={<svg data-testid="icone" />}
        ilustracao={<svg data-testid="ilustracao" />}
      />,
    );

    const ilustracao = screen.getByTestId('ilustracao');
    expect(ilustracao.parentElement).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByTestId('icone')).not.toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass(
      'border-dashed',
      'rounded-lg',
    );
  });

  it('EmptyState sem ilustracao mostra o ícone', () => {
    render(
      <EmptyState
        title="Nenhum insumo encontrado."
        icon={<svg data-testid="icone" />}
      />,
    );

    expect(screen.getByTestId('icone')).toBeInTheDocument();
    expect(document.querySelector('[data-ilustracao]')).not.toBeInTheDocument();
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
    ).toHaveClass('text-ink-muted');
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
  ] as const)('Logo %s é uma imagem chamada Doce Fatia', (size, classe) => {
    render(<Logo size={size} />);

    const logo = screen.getByRole('img', { name: 'Doce Fatia' });
    expect(logo).toHaveClass(classe);
    expect(logo.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('Logo completo traz o logotipo; só o símbolo, não', () => {
    const { rerender } = render(<Logo />);

    expect(screen.getByRole('img', { name: 'Doce Fatia' })).toHaveTextContent(
      'Doce Fatia',
    );
    expect(screen.getByText('Doce')).toHaveClass('text-accent', 'font-medium');
    expect(screen.getByText('Fatia')).toHaveClass('text-ink', 'font-semibold');

    rerender(<Logo variante="simbolo" />);

    expect(screen.getByRole('img', { name: 'Doce Fatia' })).toHaveTextContent(
      '',
    );
    expect(screen.queryByText('Doce')).not.toBeInTheDocument();
  });

  it.each([
    ['normal', 'fill-accent', 'fill-bg', 'text-accent'],
    ['sobre-cor', 'fill-on-accent', 'fill-accent', 'text-on-accent'],
  ] as const)('Logo no tom %s', (tom, bolo, confeitos, doce) => {
    const { container } = render(<Logo tom={tom} />);
    const parte = (nome: string) =>
      container.querySelector(`[data-parte="${nome}"]`);

    expect(parte('bolo')).toHaveClass(bolo);
    expect(parte('fatia')).toHaveClass('fill-highlight');
    expect(parte('confeitos')).toHaveClass(confeitos);
    expect(screen.getByText('Doce')).toHaveClass(doce);
  });
});

describe('ícones', () => {
  const icones = Object.entries({ ...menu, ...acoes });

  it('tem os oito ícones do menu do mobile e o das configurações', () => {
    expect(Object.keys(menu).toSorted()).toEqual([
      'IconConfiguracoes',
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

  it.each(icones)(
    '%s é decorativo, em contorno de 2px e aceita classe',
    (_nome, Icone) => {
      const { container } = render(<Icone className="text-accent" />);
      const svg = container.querySelector('svg');

      expect(svg).toHaveAttribute('aria-hidden', 'true');
      expect(svg).toHaveClass('text-accent', 'size-5');
      expect(svg).toHaveAttribute('fill', 'none');
      expect(svg).toHaveAttribute('stroke', 'currentColor');
      expect(svg).toHaveAttribute('stroke-width', '2');
      expect(svg).toHaveAttribute('stroke-linecap', 'round');
    },
  );
});

it('os componentes de exibição não têm violações de acessibilidade', async () => {
  render(
    <main>
      <PageHeader title="Painel" subtitle="Seu painel financeiro" />
      <Logo />
      <StatusEstoqueBadge status="critico" />
      <StatusVendaBadge status="CANCELADA" />
      <TipoGastoBadge tipo="MENSAL" />
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
