import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '@/test/a11y';
import { Button, buttonClasses, IconButton } from './button';
import { Checkbox } from './checkbox';
import {
  DateRangePicker,
  isPeriodoValido,
  PERIODO_INVALIDO,
  type Periodo,
} from './date-picker';
import { IconEditar } from './icons/acoes';
import { Input } from './input';
import { FieldError, Label } from './label';
import { NumberInput } from './number-input';
import { Select } from './select';
import { Textarea } from './textarea';

describe('Button', () => {
  it('não envia formulário por padrão', () => {
    render(<Button>Salvar</Button>);

    expect(screen.getByRole('button', { name: 'Salvar' })).toHaveAttribute(
      'type',
      'button',
    );
  });

  it('não dispara clique quando desabilitado', async () => {
    const onClick = vi.fn<() => void>();
    render(
      <Button disabled onClick={onClick}>
        Salvar
      </Button>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it.each([
    ['primario', 'bg-accent'],
    ['secundario', 'bg-transparent'],
    ['perigo', 'bg-danger-strong'],
    ['fantasma', 'bg-accent-soft'],
  ] as const)('aplica a variante %s', (variant, classe) => {
    render(<Button variant={variant}>Ação</Button>);

    expect(screen.getByRole('button')).toHaveClass(classe);
  });

  it('em andamento, fica inativo e mantém o nome', async () => {
    const onClick = vi.fn<() => void>();
    render(
      <Button loading onClick={onClick}>
        Salvar
      </Button>,
    );

    const botao = screen.getByRole('button', { name: 'Salvar' });

    expect(botao).toBeDisabled();
    expect(botao).toHaveAttribute('aria-busy', 'true');

    await userEvent.click(botao);

    expect(onClick).not.toHaveBeenCalled();
  });

  it('fora de andamento, não se anuncia como ocupado', () => {
    render(<Button>Salvar</Button>);

    expect(screen.getByRole('button')).not.toHaveAttribute('aria-busy');
  });

  it('dá aparência de botão a um link, com hover', () => {
    expect(buttonClasses()).toContain('not-disabled:hover:');
    expect(buttonClasses('secundario', 'w-full', 'compacto')).toContain(
      'w-full',
    );
  });

  it('IconButton é um círculo de 48px nomeado pelo aria-label', async () => {
    const onClick = vi.fn<() => void>();
    render(
      <IconButton aria-label="Editar Farinha de Trigo" onClick={onClick}>
        <IconEditar />
      </IconButton>,
    );
    const botao = screen.getByRole('button', {
      name: 'Editar Farinha de Trigo',
    });

    expect(botao).toHaveClass('rounded-full', 'size-12', 'bg-surface-alt');
    botao.focus();
    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe.each([
  ['Input', Input],
  ['Textarea', Textarea],
  ['NumberInput', NumberInput],
] as const)('%s', (_nome, Campo) => {
  it('liga rótulo, dica e erro ao campo', () => {
    render(<Campo label="Nome" hint="Como aparece" error="Informe o nome" />);

    const campo = screen.getByRole('textbox', { name: 'Nome' });

    expect(campo).toHaveAttribute('aria-invalid', 'true');
    expect(campo).toHaveAccessibleDescription('Como aparece Informe o nome');
    expect(screen.getByRole('alert')).toHaveTextContent('Informe o nome');
  });

  it('não marca como inválido sem erro', () => {
    render(<Campo label="Nome" required />);

    const campo = screen.getByRole('textbox', { name: /Nome/ });

    expect(campo).not.toHaveAttribute('aria-invalid');
    expect(campo).toBeRequired();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('usa o id informado e aceita digitação', async () => {
    render(<Campo id="nome" label="Nome" />);

    await userEvent.type(screen.getByLabelText('Nome'), 'Farinha');

    expect(screen.getByLabelText('Nome')).toHaveAttribute('id', 'nome');
    expect(screen.getByLabelText('Nome')).toHaveValue('Farinha');
  });
});

describe('Input com ícone', () => {
  it('mostra o ícone e abre espaço para ele', () => {
    render(<Input label="Buscar" icon={<svg data-testid="lupa" />} />);

    expect(screen.getByTestId('lupa')).toBeInTheDocument();
    expect(screen.getByLabelText('Buscar')).toHaveClass('pl-11');
  });
});

describe('Input com controle à direita', () => {
  it('mostra o controle e abre espaço para ele', () => {
    render(
      <Input
        label="Senha"
        trailing={<button type="button">Mostrar senha</button>}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Mostrar senha' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toHaveClass('pr-13');
  });
});

describe('NumberInput', () => {
  it('guarda o texto com vírgula e abre o teclado numérico', async () => {
    render(<NumberInput label="Valor pago" prefixo="R$" />);
    const campo = screen.getByRole('textbox', { name: 'Valor pago' });

    await userEvent.type(campo, '1.234,56');

    expect(campo).toHaveValue('1.234,56');
    expect(campo).toHaveAttribute('inputmode', 'decimal');
    expect(campo).toHaveAttribute('type', 'text');
    expect(screen.getByText('R$')).toHaveAttribute('aria-hidden', 'true');
  });

  it('mostra o sufixo e aceita teclado só de dígitos', () => {
    render(<NumberInput label="Rendimento" sufixo="un" inputMode="numeric" />);

    expect(screen.getByLabelText('Rendimento')).toHaveAttribute(
      'inputmode',
      'numeric',
    );
    expect(screen.getByText('un')).toBeInTheDocument();
  });
});

describe('Select', () => {
  function renderSelect(error?: string) {
    render(
      <Select label="Unidade" hint="Unidade da compra" error={error} required>
        <option value="G">g</option>
        <option value="KG">kg</option>
      </Select>,
    );
  }

  it('troca a opção pelo teclado', async () => {
    renderSelect();

    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: /Unidade/ }),
      'KG',
    );

    expect(screen.getByRole('combobox')).toHaveValue('KG');
    expect(screen.getByRole('combobox')).toHaveAccessibleDescription(
      'Unidade da compra',
    );
  });

  it('mostra o erro no campo', () => {
    renderSelect('Escolha a unidade');

    expect(screen.getByRole('combobox')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Escolha a unidade');
  });
});

describe('Checkbox', () => {
  it('alterna pelo teclado', async () => {
    render(<Checkbox label="Usar todos os gastos" />);

    screen.getByRole('checkbox', { name: 'Usar todos os gastos' }).focus();
    await userEvent.keyboard(' ');

    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('liga dica e erro', () => {
    render(
      <Checkbox label="Aceito" required hint="Obrigatório" error="Aceite" />,
    );

    const campo = screen.getByRole('checkbox', { name: /Aceito/ });

    expect(campo).toHaveAttribute('aria-invalid', 'true');
    expect(campo).toHaveAccessibleDescription('Obrigatório Aceite');
  });
});

describe('Label e FieldError', () => {
  it('marca o obrigatório sem mudar o nome acessível', () => {
    render(
      <>
        <Label htmlFor="campo" required>
          Descrição
        </Label>
        <input id="campo" />
        <FieldError>Informe a descrição</FieldError>
      </>,
    );

    expect(screen.getByRole('textbox', { name: 'Descrição' })).toBeVisible();
    expect(screen.getByRole('alert')).toHaveTextContent('Informe a descrição');
  });
});

describe('DateRangePicker', () => {
  function renderPeriodo(inicial: Periodo) {
    const onChange = vi.fn<(value: Periodo) => void>();

    function Exemplo() {
      const [value, setValue] = useState(inicial);

      return (
        <DateRangePicker
          legend="Período"
          value={value}
          onChange={(next) => {
            setValue(next);
            onChange(next);
          }}
        />
      );
    }

    render(<Exemplo />);

    return onChange;
  }

  it('agrupa as duas datas e devolve YYYY-MM-DD', async () => {
    const onChange = renderPeriodo({ inicio: '2026-11-01', fim: '2026-11-30' });

    expect(screen.getByRole('group', { name: 'Período' })).toBeInTheDocument();
    const inicio = screen.getByLabelText('Data inicial');
    expect(inicio).toHaveAttribute('max', '2026-11-30');
    expect(screen.getByLabelText('Data final')).toHaveAttribute(
      'min',
      '2026-11-01',
    );

    await userEvent.clear(inicio);
    await userEvent.type(inicio, '2026-11-10');

    expect(onChange).toHaveBeenLastCalledWith({
      inicio: '2026-11-10',
      fim: '2026-11-30',
    });
  });

  it('mostra o erro quando a data inicial é depois da final', () => {
    renderPeriodo({ inicio: '2026-12-01', fim: '2026-11-30' });

    expect(screen.getByRole('alert')).toHaveTextContent(PERIODO_INVALIDO);
    expect(screen.getByLabelText('Data inicial')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByLabelText('Data final')).toHaveAccessibleDescription(
      PERIODO_INVALIDO,
    );
  });

  it('muda a data final', async () => {
    const onChange = renderPeriodo({ inicio: '', fim: '' });

    await userEvent.type(screen.getByLabelText('Data final'), '2026-11-30');

    expect(onChange).toHaveBeenLastCalledWith({
      inicio: '',
      fim: '2026-11-30',
    });
  });

  it.each([
    [{ inicio: '', fim: '' }, true],
    [{ inicio: '2026-11-01', fim: '' }, true],
    [{ inicio: '2026-11-30', fim: '2026-11-30' }, true],
    [{ inicio: '2026-12-01', fim: '2026-11-30' }, false],
    [{ inicio: '2025-12-31', fim: '2026-01-01' }, true],
  ])('isPeriodoValido(%o) é %s', (periodo, esperado) => {
    expect(isPeriodoValido(periodo)).toBe(esperado);
  });
});

it('os campos não têm violações de acessibilidade', async () => {
  render(
    <form>
      <Input label="Nome" required hint="Como aparece" />
      <Input label="Documento" error="Informe o documento" />
      <NumberInput label="Valor pago" prefixo="R$" />
      <Textarea label="Observações" />
      <Select label="Unidade">
        <option>kg</option>
      </Select>
      <Checkbox label="Usar todos os gastos" />
      <DateRangePicker
        legend="Período"
        value={{ inicio: '2026-12-01', fim: '2026-11-30' }}
        onChange={() => {}}
      />
      <Button>Salvar</Button>
      <IconButton aria-label="Excluir Ovos">
        <IconEditar />
      </IconButton>
    </form>,
  );

  await expectNoA11yViolations();
});
