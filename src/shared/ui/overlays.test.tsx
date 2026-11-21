import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { apiErrorFromResponse } from '@/shared/api/errors';
import { expectNoA11yViolations } from '@/test/a11y';
import { Button } from './button';
import { ConfirmDialog } from './confirm-dialog';
import { Dialog, DialogClose } from './dialog';
import { Drawer } from './drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { ToastProvider, useToast } from './toast';

describe.each([
  ['Dialog', Dialog],
  ['Drawer', Drawer],
] as const)('%s', (_nome, Modal) => {
  function renderModal() {
    render(
      <Modal
        title="Novo insumo"
        description="Informe a quantidade e o valor pago."
        trigger={<Button>Abrir</Button>}
        footer={
          <DialogClose asChild>
            <Button variant="secundario">Cancelar</Button>
          </DialogClose>
        }
      >
        <input aria-label="Nome" />
      </Modal>,
    );
  }

  it('abre com título e descrição acessíveis e foco dentro dele', async () => {
    renderModal();

    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }));

    const modal = screen.getByRole('dialog', { name: 'Novo insumo' });

    expect(modal).toHaveAccessibleDescription(
      'Informe a quantidade e o valor pago.',
    );
    expect(modal).toContainElement(document.activeElement as HTMLElement);
  });

  it('fecha com Esc e devolve o foco ao botão', async () => {
    renderModal();
    const abrir = screen.getByRole('button', { name: 'Abrir' });

    await userEvent.click(abrir);
    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(abrir).toHaveFocus();
  });

  it('mantém o foco preso dentro dele com Tab', async () => {
    renderModal();
    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }));
    const modal = screen.getByRole('dialog');

    for (let i = 0; i < 5; i += 1) {
      await userEvent.tab();
      expect(modal).toContainElement(document.activeElement as HTMLElement);
    }
  });

  it('fecha pelo botão Fechar e pelo rodapé', async () => {
    renderModal();
    const abrir = screen.getByRole('button', { name: 'Abrir' });

    await userEvent.click(abrir);
    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await userEvent.click(abrir);
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('não tem violações de acessibilidade quando aberto', async () => {
    renderModal();

    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }));

    await expectNoA11yViolations();
  });
});

describe('Dialog controlado', () => {
  it('avisa ao fechar e funciona sem descrição nem botão de abrir', async () => {
    const onOpenChange = vi.fn<(open: boolean) => void>();
    render(<Dialog open title="Aviso" onOpenChange={onOpenChange} />);

    expect(screen.getByRole('dialog', { name: 'Aviso' })).not.toHaveAttribute(
      'aria-describedby',
    );

    await userEvent.keyboard('{Escape}');

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('aceita o tamanho amplo', () => {
    render(<Dialog defaultOpen size="amplo" title="Detalhe da venda" />);

    expect(screen.getByRole('dialog')).toHaveClass('max-w-3xl');
  });
});

describe('Drawer', () => {
  it.each([
    ['bottom', 'bottom-0'],
    ['right', 'right-0'],
  ] as const)('abre pelo lado %s', (side, classe) => {
    render(<Drawer defaultOpen side={side} title="Filtros" />);

    expect(screen.getByRole('dialog')).toHaveClass(classe);
  });

  it('no celular abre de baixo por padrão', () => {
    render(<Drawer defaultOpen title="Registrar produção" />);

    expect(screen.getByRole('dialog')).toHaveClass(
      'bottom-0',
      'animate-gaveta-baixo',
    );
  });
});

describe('ConfirmDialog', () => {
  function renderConfirm(onConfirm: () => Promise<unknown> | void) {
    const onOpenChange = vi.fn<(open: boolean) => void>();
    render(
      <ConfirmDialog
        title="Excluir gasto"
        description='Deseja excluir "Energia Elétrica"?'
        confirmLabel="Excluir"
        trigger={<Button>Excluir Energia Elétrica</Button>}
        onConfirm={onConfirm}
        onOpenChange={onOpenChange}
      />,
    );

    return onOpenChange;
  }

  async function abrir() {
    await userEvent.click(
      screen.getByRole('button', { name: 'Excluir Energia Elétrica' }),
    );
  }

  it('confirma e fecha', async () => {
    const onConfirm = vi.fn<() => Promise<void>>(async () => {});
    const onOpenChange = renderConfirm(onConfirm);

    await abrir();
    const dialog = screen.getByRole('dialog', { name: 'Excluir gasto' });
    expect(dialog).toHaveAccessibleDescription(
      'Deseja excluir "Energia Elétrica"?',
    );
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Excluir' }),
    );

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('ao falhar, continua aberto e mostra a mensagem do ApiError', async () => {
    renderConfirm(() =>
      Promise.reject(
        apiErrorFromResponse(400, {
          statusCode: 400,
          message: 'Gasto vinculado a uma produção.',
          error: 'Bad Request',
        }),
      ),
    );

    await abrir();
    await userEvent.click(screen.getByRole('button', { name: 'Excluir' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Gasto vinculado a uma produção.',
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('não expõe a mensagem de uma exceção do JavaScript', async () => {
    renderConfirm(() => Promise.reject(new TypeError('x is undefined')));

    await abrir();
    await userEvent.click(screen.getByRole('button', { name: 'Excluir' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível concluir a ação. Tente novamente.',
    );
  });

  it('não fecha nem confirma de novo durante a confirmação', async () => {
    let concluir = () => {};
    const onConfirm = vi.fn<() => Promise<void>>(
      () =>
        new Promise<void>((resolve) => {
          concluir = resolve;
        }),
    );
    renderConfirm(onConfirm);

    await abrir();
    const excluir = screen.getByRole('button', { name: 'Excluir' });
    await userEvent.click(excluir);

    expect(excluir).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    await userEvent.keyboard('{Escape}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    concluir();
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('cancela sem confirmar e limpa o erro anterior', async () => {
    const onConfirm = vi.fn<() => Promise<void>>(() =>
      Promise.reject(new Error('Falhou.')),
    );
    renderConfirm(onConfirm);

    await abrir();
    await userEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    await screen.findByRole('alert');
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    await abrir();

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('não tem violações de acessibilidade quando aberto', async () => {
    renderConfirm(() => {});

    await abrir();

    await expectNoA11yViolations();
  });
});

describe('Tabs', () => {
  function renderTabs() {
    render(
      <Tabs defaultValue="registrar">
        <TabsList aria-label="Seções de vendas">
          <TabsTrigger value="registrar">Registrar</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="relatorios" disabled>
            Relatórios
          </TabsTrigger>
        </TabsList>
        <TabsContent value="registrar">Carrinho da venda</TabsContent>
        <TabsContent value="historico">Vendas do período</TabsContent>
      </Tabs>,
    );
  }

  it('troca de aba pelas setas e mostra só o painel ativo', async () => {
    renderTabs();

    screen.getByRole('tab', { name: 'Registrar' }).focus();
    await userEvent.keyboard('{ArrowRight}');

    expect(screen.getByRole('tab', { name: 'Histórico' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Vendas do período');
    expect(screen.queryByText('Carrinho da venda')).not.toBeInTheDocument();
  });

  it('troca de aba pelo clique e pula a desabilitada', async () => {
    renderTabs();

    await userEvent.click(screen.getByRole('tab', { name: 'Histórico' }));
    await userEvent.keyboard('{ArrowRight}');

    expect(screen.getByRole('tab', { name: 'Registrar' })).toHaveFocus();
  });

  it('não tem violações de acessibilidade', async () => {
    renderTabs();

    await expectNoA11yViolations();
  });
});

describe('Toast', () => {
  function Disparador() {
    const toast = useToast();

    return (
      <>
        <Button onClick={() => toast.success('Insumo criado com sucesso.')}>
          Sucesso
        </Button>
        <Button onClick={() => toast.error('Não foi possível salvar.')}>
          Erro
        </Button>
        <Button onClick={() => toast.info('Atualizando o estoque.')}>
          Info
        </Button>
      </>
    );
  }

  function renderToast() {
    render(
      <ToastProvider>
        <Disparador />
      </ToastProvider>,
    );
  }

  it('mostra a notificação e fecha pelo botão', async () => {
    renderToast();

    await userEvent.click(screen.getByRole('button', { name: 'Sucesso' }));

    expect(
      screen.getAllByText('Insumo criado com sucesso.')[0],
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'Fechar notificação' }),
    );

    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Fechar notificação' }),
      ).not.toBeInTheDocument(),
    );
  });

  it('empilha as três variantes', async () => {
    renderToast();

    await userEvent.click(screen.getByRole('button', { name: 'Sucesso' }));
    await userEvent.click(screen.getByRole('button', { name: 'Erro' }));
    await userEvent.click(screen.getByRole('button', { name: 'Info' }));

    expect(
      screen.getAllByRole('button', { name: 'Fechar notificação' }),
    ).toHaveLength(3);
    expect(
      screen.getAllByText('Não foi possível salvar.')[0],
    ).toBeInTheDocument();
    expect(
      screen.getAllByText('Atualizando o estoque.')[0],
    ).toBeInTheDocument();
  });

  it('some sozinha depois do tempo do SnackBar', async () => {
    vi.useFakeTimers();
    try {
      renderToast();

      screen.getByRole('button', { name: 'Sucesso' }).click();
      await vi.advanceTimersByTimeAsync(0);
      expect(
        screen.getAllByRole('button', { name: 'Fechar notificação' }),
      ).toHaveLength(1);

      await vi.advanceTimersByTimeAsync(4500);

      expect(
        screen.queryByRole('button', { name: 'Fechar notificação' }),
      ).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('exige o provider', () => {
    const silencio = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<Disparador />)).toThrow(/ToastProvider/);

    silencio.mockRestore();
  });

  it('não tem violações de acessibilidade com notificação aberta', async () => {
    renderToast();

    await userEvent.click(screen.getByRole('button', { name: 'Sucesso' }));

    await expectNoA11yViolations();
  });
});

describe('ConfirmDialog com consequência', () => {
  it('cita o item e anuncia a consequência numa linha própria', async () => {
    render(
      <ConfirmDialog
        title="Excluir gasto"
        description='Deseja excluir "Energia Elétrica"?'
        consequence="Isso afetará o custo de todas as receitas."
        confirmLabel="Excluir"
        trigger={<Button>Excluir Energia Elétrica</Button>}
        onConfirm={() => undefined}
      />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Excluir Energia Elétrica' }),
    );

    const dialog = screen.getByRole('dialog', { name: 'Excluir gasto' });
    expect(dialog).toHaveAccessibleDescription(
      'Deseja excluir "Energia Elétrica"? Isso afetará o custo de todas as receitas.',
    );
    expect(
      within(dialog).getByText('Isso afetará o custo de todas as receitas.'),
    ).toHaveClass('block');
    await expectNoA11yViolations();
  });
});
