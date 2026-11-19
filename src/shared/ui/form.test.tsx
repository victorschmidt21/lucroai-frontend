import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { unidadeMedidaSchema } from '@/shared/api/contracts/enums';
import { apiErrorFromResponse } from '@/shared/api/errors';
import { percentualParaFracao } from '@/shared/format/numero';
import { inteiroBR, numeroBR } from '@/shared/format/numero-br';
import { expectNoA11yViolations } from '@/test/a11y';
import { Button } from './button';
import {
  Form,
  FormCombobox,
  FormDecimalInput,
  FormDialog,
  FormInput,
  FormIntegerInput,
  FormMoneyInput,
  FormPercentInput,
  FormSelect,
  FormTextarea,
  FormUnidadeSelect,
} from './form';

const QUANTIDADE = 'Informe uma quantidade maior que zero';
const VALOR = 'Informe um valor maior que zero';
const MARGEM = 'Informe uma margem maior ou igual a zero';
const LOTES = 'Informe um número de lotes maior que zero';

const schema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome'),
  quantidade: numeroBR(z.number({ error: QUANTIDADE }).positive(QUANTIDADE)),
  unidade: unidadeMedidaSchema,
  valorPago: numeroBR(z.number({ error: VALOR }).positive(VALOR)),
  margem: numeroBR(z.number({ error: MARGEM }).min(0, MARGEM)),
  lotes: inteiroBR(z.number({ error: LOTES }).int().positive(LOTES)),
});

type Values = z.output<typeof schema>;

const vazio: z.input<typeof schema> = {
  nome: '',
  quantidade: '',
  unidade: 'KG',
  valorPago: '',
  margem: '',
  lotes: '',
};

/** Como uma função `to...Body`: a margem vai em fração, com o nome do contrato. */
function toBody({ margem, ...resto }: Values) {
  return { ...resto, margem_lucro: percentualParaFracao(margem) };
}

function Campos() {
  return (
    <>
      <FormInput name="nome" label="Nome" />
      <FormDecimalInput name="quantidade" label="Quantidade" unidade="kg" />
      <FormUnidadeSelect name="unidade" label="Unidade" />
      <FormMoneyInput name="valorPago" label="Valor pago" />
      <FormPercentInput name="margem" label="Margem de lucro" />
      <FormIntegerInput name="lotes" label="Lotes" />
    </>
  );
}

function renderDialog(
  onSubmit: (values: Values) => Promise<unknown> | void = () => undefined,
) {
  const onOpenChange = vi.fn<(open: boolean) => void>();

  function Exemplo() {
    const [aberto, setAberto] = useState(false);

    return (
      <>
        <Button onClick={() => setAberto(true)}>Novo insumo</Button>
        <FormDialog
          open={aberto}
          onOpenChange={(next) => {
            onOpenChange(next);
            setAberto(next);
          }}
          title="Novo insumo"
          description="Informe a quantidade e o valor pago."
          schema={schema}
          defaultValues={vazio}
          onSubmit={onSubmit}
        >
          <Campos />
        </FormDialog>
      </>
    );
  }

  render(<Exemplo />);

  return onOpenChange;
}

async function abrir() {
  await userEvent.click(screen.getByRole('button', { name: 'Novo insumo' }));

  return screen.getByRole('dialog', { name: 'Novo insumo' });
}

async function preencherValidos() {
  await userEvent.type(screen.getByLabelText('Nome'), 'Farinha de Trigo');
  await userEvent.type(screen.getByLabelText('Quantidade'), '5');
  await userEvent.type(screen.getByLabelText('Valor pago'), '1.234,56');
  await userEvent.type(screen.getByLabelText('Margem de lucro'), '30');
  await userEvent.type(screen.getByLabelText('Lotes'), '2');
}

describe('FormDialog', () => {
  it('abre com o título, a descrição e os botões', async () => {
    renderDialog();

    const dialog = await abrir();

    expect(dialog).toHaveAccessibleDescription(
      'Informe a quantidade e o valor pago.',
    );
    expect(
      within(dialog).getByRole('button', { name: 'Cancelar' }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: 'Salvar' }),
    ).toHaveAttribute('type', 'submit');
  });

  it('valida, liga o erro ao campo e foca o primeiro campo inválido', async () => {
    const onSubmit = vi.fn<(values: Values) => void>();
    renderDialog(onSubmit);
    await abrir();

    await userEvent.type(screen.getByLabelText('Nome'), 'Farinha');
    await userEvent.type(screen.getByLabelText('Valor pago'), 'abc0');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    const quantidade = screen.getByLabelText('Quantidade');
    await waitFor(() => expect(quantidade).toHaveFocus());
    expect(quantidade).toHaveAttribute('aria-invalid', 'true');
    expect(quantidade).toHaveAccessibleDescription(QUANTIDADE);
    expect(screen.getByLabelText('Valor pago')).toHaveAccessibleDescription(
      VALOR,
    );
    expect(screen.getByLabelText('Nome')).not.toHaveAttribute('aria-invalid');
    expect(
      screen.getAllByRole('alert').map((alerta) => alerta.textContent),
    ).toEqual([QUANTIDADE, VALOR, MARGEM, LOTES]);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('envia os números lidos no padrão brasileiro e a margem em fração', async () => {
    const corpos: unknown[] = [];
    const onOpenChange = renderDialog(async (values) => {
      corpos.push(toBody(values));
    });
    await abrir();

    await preencherValidos();
    await userEvent.selectOptions(screen.getByLabelText('Unidade'), 'g');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(corpos).toHaveLength(1));
    expect(corpos[0]).toEqual({
      nome: 'Farinha de Trigo',
      quantidade: 5,
      unidade: 'G',
      valorPago: 1234.56,
      margem_lucro: 0.3,
      lotes: 2,
    });
    // Quem fecha é o `onSubmit`, depois do Toast.
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it.each(['1.234,56', '1234,56', '1234.56'])(
    'lê "%s" como 1234.56 e mostra 1.234,56 ao sair do campo',
    async (digitado) => {
      const valores: number[] = [];
      renderDialog((values) => {
        valores.push(values.valorPago);
      });
      await abrir();
      await preencherValidos();
      const valorPago = screen.getByLabelText('Valor pago');

      await userEvent.clear(valorPago);
      await userEvent.type(valorPago, digitado);
      await userEvent.tab();

      expect(valorPago).toHaveValue('1.234,56');
      await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
      await waitFor(() => expect(valores).toEqual([1234.56]));
    },
  );

  it('durante o envio, desabilita os botões e não fecha', async () => {
    let concluir: () => void = () => undefined;
    const onOpenChange = renderDialog(
      () =>
        new Promise<void>((resolve) => {
          concluir = resolve;
        }),
    );
    await abrir();
    await preencherValidos();

    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    const salvar = screen.getByRole('button', { name: 'Salvar' });
    await waitFor(() => expect(salvar).toBeDisabled());
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    await userEvent.keyboard('{Escape}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();

    concluir();
    await waitFor(() => expect(salvar).toBeEnabled());
  });

  it('mostra o erro da API no topo e mantém os valores', async () => {
    renderDialog(() =>
      Promise.reject(
        apiErrorFromResponse('catalog', 400, {
          statusCode: 400,
          message: 'Já existe um insumo com esse nome.',
          error: 'Bad Request',
        }),
      ),
    );
    await abrir();
    await preencherValidos();

    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Já existe um insumo com esse nome.',
    );
    expect(screen.getByLabelText('Nome')).toHaveValue('Farinha de Trigo');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('cancela, fecha e reabre com o formulário limpo', async () => {
    const onOpenChange = renderDialog();
    await abrir();
    await userEvent.type(screen.getByLabelText('Nome'), 'Rascunho');

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    await abrir();
    expect(screen.getByLabelText('Nome')).toHaveValue('');
  });

  it('funciona só com o teclado', async () => {
    const valores: Values[] = [];
    renderDialog((values) => {
      valores.push(values);
    });
    screen.getByRole('button', { name: 'Novo insumo' }).focus();

    await userEvent.keyboard('{Enter}');
    // O Radix foca o primeiro controle do diálogo, o Fechar; o Tab leva ao Nome.
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Fechar' })).toHaveFocus(),
    );
    await userEvent.tab();
    expect(screen.getByLabelText('Nome')).toHaveFocus();
    await userEvent.keyboard('Sal{Tab}1{Tab}{Tab}2,5{Tab}0{Tab}1{Enter}');

    await waitFor(() => expect(valores).toHaveLength(1));
    expect(valores[0]).toMatchObject({
      nome: 'Sal',
      quantidade: 1,
      valorPago: 2.5,
      margem: 0,
      lotes: 1,
    });
  });

  it('não tem violações de acessibilidade, aberto e com erros', async () => {
    renderDialog();
    await abrir();

    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    await screen.findAllByRole('alert');

    await expectNoA11yViolations();
  });
});

describe('campos numéricos', () => {
  it('o inteiro só aceita dígitos', async () => {
    renderDialog();
    await abrir();
    const lotes = screen.getByLabelText('Lotes');

    await userEvent.type(lotes, '1a2,5');

    expect(lotes).toHaveValue('125');
    expect(lotes).toHaveAttribute('inputmode', 'numeric');
  });

  it('os decimais recusam letras e abrem o teclado decimal', async () => {
    renderDialog();
    await abrir();
    const quantidade = screen.getByLabelText('Quantidade');

    await userEvent.type(quantidade, 'x1,5kg');

    expect(quantidade).toHaveValue('1,5');
    expect(quantidade).toHaveAttribute('inputmode', 'decimal');
  });

  it('mostra R$, a unidade e o % ao lado dos campos', async () => {
    renderDialog();
    const dialog = await abrir();

    expect(within(dialog).getByText('R$')).toBeInTheDocument();
    expect(
      within(dialog).getByText('kg', { selector: 'span' }),
    ).toBeInTheDocument();
    expect(within(dialog).getByText('%')).toBeInTheDocument();
  });

  it('a quantidade e a margem não arredondam ao sair do campo', async () => {
    renderDialog();
    await abrir();
    const quantidade = screen.getByLabelText('Quantidade');
    const margem = screen.getByLabelText('Margem de lucro');

    await userEvent.type(quantidade, '1234.5678');
    await userEvent.type(margem, '12.5');
    await userEvent.tab();

    expect(quantidade).toHaveValue('1.234,5678');
    expect(margem).toHaveValue('12,5');
  });

  it('mantém o texto inválido ao sair, para o erro apontar o que foi digitado', async () => {
    renderDialog();
    await abrir();
    const valorPago = screen.getByLabelText('Valor pago');

    await userEvent.type(valorPago, '1,2,3');
    await userEvent.tab();

    expect(valorPago).toHaveValue('1,2,3');
  });

  it('a unidade mostra os rótulos e guarda o valor do contrato', async () => {
    renderDialog();
    await abrir();

    const unidade = screen.getByLabelText('Unidade');

    expect(
      within(unidade)
        .getAllByRole('option')
        .map((opcao) => [
          opcao.textContent,
          (opcao as HTMLOptionElement).value,
        ]),
    ).toEqual([
      ['g', 'G'],
      ['kg', 'KG'],
      ['ml', 'ML'],
      ['L', 'L'],
      ['un', 'UN'],
    ]);
  });
});

describe('Form', () => {
  const receitaSchema = z.object({
    nome: z.string().trim().min(1, 'Informe o nome'),
    observacao: z.string(),
    categoria: z.string().min(1, 'Escolha a categoria'),
    receitaId: z.string({ error: 'Escolha a receita' }),
  });

  function renderForm(props: {
    onSubmit?: (values: z.output<typeof receitaSchema>) => void;
    onCancel?: () => void;
    cancelHref?: string;
  }) {
    render(
      <Form
        schema={receitaSchema}
        defaultValues={{ nome: '', observacao: '', categoria: '' }}
        submitLabel="Atualizar"
        onSubmit={props.onSubmit ?? (() => undefined)}
        onCancel={props.onCancel}
        cancelHref={props.cancelHref}
      >
        <FormInput name="nome" label="Nome" />
        <FormTextarea name="observacao" label="Observação" />
        <FormSelect name="categoria" label="Categoria">
          <option value="">Escolha</option>
          <option value="paes">Pães</option>
        </FormSelect>
        <FormCombobox
          name="receitaId"
          label="Receita"
          options={[
            { value: '1', label: 'Pão Francês' },
            { value: '2', label: 'Bolo de Chocolate' },
          ]}
        />
      </Form>,
    );
  }

  it('usa o texto de envio pedido e o link de cancelar', () => {
    renderForm({ cancelHref: '/receitas' });

    expect(screen.getByRole('button', { name: 'Atualizar' })).toHaveAttribute(
      'type',
      'submit',
    );
    expect(screen.getByRole('link', { name: 'Cancelar' })).toHaveAttribute(
      'href',
      '/receitas',
    );
  });

  it('chama onCancel no botão de cancelar', async () => {
    const onCancel = vi.fn<() => void>();
    renderForm({ onCancel });

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('sem cancelar, só mostra o envio', () => {
    renderForm({});

    expect(
      screen.queryByRole('button', { name: 'Cancelar' }),
    ).not.toBeInTheDocument();
  });

  it('foca o combobox quando ele é o primeiro campo inválido', async () => {
    renderForm({});
    await userEvent.type(screen.getByLabelText('Nome'), 'Pão');
    await userEvent.selectOptions(screen.getByLabelText('Categoria'), 'Pães');

    await userEvent.click(screen.getByRole('button', { name: 'Atualizar' }));

    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: 'Receita' })).toHaveFocus(),
    );
    expect(screen.getByText('Escolha a receita')).toBeInTheDocument();
  });

  it('envia os campos de texto, a seleção e o combobox', async () => {
    const onSubmit = vi.fn<(values: unknown) => void>();
    renderForm({ onSubmit });

    await userEvent.type(screen.getByLabelText('Nome'), 'Pão');
    await userEvent.type(screen.getByLabelText('Observação'), 'Crocante');
    await userEvent.selectOptions(screen.getByLabelText('Categoria'), 'Pães');
    await userEvent.type(
      screen.getByRole('combobox', { name: 'Receita' }),
      'bolo{Enter}',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Atualizar' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        nome: 'Pão',
        observacao: 'Crocante',
        categoria: 'paes',
        receitaId: '2',
      }),
    );
  });
});
