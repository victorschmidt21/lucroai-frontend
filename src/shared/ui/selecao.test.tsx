import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '@/test/a11y';
import { Chip, ToggleChip } from './chip';
import { Combobox, type ComboboxOption } from './combobox';
import { SegmentedControl } from './segmented-control';
import { Slider } from './slider';

const RECEITAS: ComboboxOption[] = [
  { value: '1', label: 'Pão Francês' },
  { value: '2', label: 'Bolo de Chocolate' },
  { value: '3', label: 'Brigadeiro Gourmet' },
  { value: '4', label: 'Quindim' },
];

describe('Combobox', () => {
  function renderCombobox(inicial: string | null = null) {
    const onValueChange = vi.fn<(value: string | null) => void>();

    function Exemplo() {
      const [value, setValue] = useState(inicial);

      return (
        <Combobox
          label="Receita"
          hint="Busque pelo nome"
          options={RECEITAS}
          value={value}
          onValueChange={(next) => {
            setValue(next);
            onValueChange(next);
          }}
        />
      );
    }

    render(<Exemplo />);

    return {
      campo: screen.getByRole('combobox', { name: 'Receita' }),
      onValueChange,
    };
  }

  it('filtra sem diferenciar acentos e escolhe pelo teclado', async () => {
    const { campo, onValueChange } = renderCombobox();

    await userEvent.type(campo, 'pao');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(campo).toHaveAttribute('aria-expanded', 'true');

    await userEvent.keyboard('{Enter}');

    expect(onValueChange).toHaveBeenLastCalledWith('1');
    expect(campo).toHaveValue('Pão Francês');
    expect(campo).toHaveAttribute('aria-expanded', 'false');
  });

  it('move a opção ativa com as setas, Home e End', async () => {
    const { campo, onValueChange } = renderCombobox();

    campo.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('listbox')).toBeVisible();
    expect(campo).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: 'Pão Francês' }).id,
    );

    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowUp}');
    expect(campo).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: 'Bolo de Chocolate' }).id,
    );

    await userEvent.keyboard('{End}');
    expect(campo).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: 'Quindim' }).id,
    );

    await userEvent.keyboard('{Home}{Enter}');
    expect(onValueChange).toHaveBeenLastCalledWith('1');
  });

  it('abre com ArrowUp na opção escolhida', async () => {
    const { campo } = renderCombobox('3');

    expect(campo).toHaveValue('Brigadeiro Gourmet');
    campo.focus();
    await userEvent.keyboard('{ArrowUp}');

    expect(
      screen.getByRole('option', { name: 'Brigadeiro Gourmet' }),
    ).toHaveAttribute('aria-selected', 'true');
    expect(campo).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: 'Brigadeiro Gourmet' }).id,
    );
  });

  it('escolhe pelo clique e fecha com Esc, mantendo a escolha', async () => {
    const { campo, onValueChange } = renderCombobox();

    await userEvent.click(campo);
    await userEvent.click(screen.getByRole('option', { name: 'Quindim' }));

    expect(onValueChange).toHaveBeenLastCalledWith('4');
    expect(campo).toHaveFocus();

    await userEvent.type(campo, 'x');
    await userEvent.keyboard('{Escape}');

    expect(campo).toHaveAttribute('aria-expanded', 'false');
    expect(campo).toHaveValue('Quindim');
  });

  it('avisa quando a busca não encontra nada', async () => {
    const { campo } = renderCombobox();

    await userEvent.type(campo, 'pizza');

    expect(screen.getByRole('status')).toHaveTextContent(
      'Nenhum resultado encontrado.',
    );
    await userEvent.keyboard('{Enter}{Home}');
    expect(campo).toHaveValue('pizza');
  });

  it('limpa a escolha ao apagar o texto e fecha ao sair do campo', async () => {
    const { campo, onValueChange } = renderCombobox('2');

    await userEvent.clear(campo);
    expect(onValueChange).toHaveBeenLastCalledWith(null);

    await userEvent.tab();
    expect(campo).toHaveAttribute('aria-expanded', 'false');
  });

  it('abre e fecha pelo clique', async () => {
    const { campo } = renderCombobox();

    await userEvent.click(campo);
    expect(campo).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(campo);
    expect(campo).toHaveAttribute('aria-expanded', 'false');
  });

  it('não tem violações de acessibilidade aberto', async () => {
    const { campo } = renderCombobox();

    await userEvent.click(campo);

    await expectNoA11yViolations();
  });
});

describe('Slider', () => {
  function renderSlider() {
    const onValueChange = vi.fn<(value: number) => void>();

    function Exemplo() {
      const [value, setValue] = useState(150);

      return (
        <Slider
          label="Preço de venda"
          hint="+25,0% em relação ao preço atual"
          value={value}
          min={50}
          max={300}
          step={5}
          formatValue={(centavos) => `${centavos} centavos`}
          onValueChange={(next) => {
            setValue(next);
            onValueChange(next);
          }}
        />
      );
    }

    render(<Exemplo />);

    return {
      thumb: screen.getByRole('slider', { name: 'Preço de venda' }),
      onValueChange,
    };
  }

  it('anuncia o valor formatado, os limites e a dica', () => {
    const { thumb } = renderSlider();

    expect(thumb).toHaveAttribute('aria-valuenow', '150');
    expect(thumb).toHaveAttribute('aria-valuemin', '50');
    expect(thumb).toHaveAttribute('aria-valuemax', '300');
    expect(thumb).toHaveAttribute('aria-valuetext', '150 centavos');
    expect(thumb).toHaveAccessibleDescription(
      '+25,0% em relação ao preço atual',
    );
  });

  it('muda pelas setas, Home e End', async () => {
    const { thumb, onValueChange } = renderSlider();

    thumb.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onValueChange).toHaveBeenLastCalledWith(155);
    expect(thumb).toHaveAttribute('aria-valuetext', '155 centavos');

    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(onValueChange).toHaveBeenLastCalledWith(145);

    await userEvent.keyboard('{End}');
    expect(onValueChange).toHaveBeenLastCalledWith(300);

    await userEvent.keyboard('{Home}');
    expect(onValueChange).toHaveBeenLastCalledWith(50);
  });

  it('não tem violações de acessibilidade', async () => {
    renderSlider();

    await expectNoA11yViolations();
  });
});

describe('SegmentedControl', () => {
  function renderSegmented() {
    const onValueChange = vi.fn<(value: 'todos' | 'baixo') => void>();

    function Exemplo() {
      const [value, setValue] = useState<'todos' | 'baixo'>('todos');

      return (
        <SegmentedControl
          aria-label="Status"
          options={[
            { value: 'todos', label: 'Todos' },
            { value: 'baixo', label: 'Baixo' },
          ]}
          value={value}
          onValueChange={(next) => {
            setValue(next);
            onValueChange(next);
          }}
        />
      );
    }

    render(<Exemplo />);

    return onValueChange;
  }

  function opcao(nome: string) {
    return screen.getByRole('radio', { name: nome });
  }

  it('marca a opção escolhida', () => {
    renderSegmented();

    expect(
      screen.getByRole('radiogroup', { name: 'Status' }),
    ).toBeInTheDocument();
    expect(opcao('Todos')).toHaveAttribute('aria-checked', 'true');
    expect(opcao('Baixo')).toHaveAttribute('aria-checked', 'false');
  });

  it('troca pelo clique e não desmarca a opção atual', async () => {
    const onValueChange = renderSegmented();

    await userEvent.click(opcao('Baixo'));
    expect(onValueChange).toHaveBeenLastCalledWith('baixo');
    expect(opcao('Baixo')).toHaveAttribute('aria-checked', 'true');

    await userEvent.click(opcao('Baixo'));
    expect(onValueChange).toHaveBeenCalledOnce();
    expect(opcao('Baixo')).toHaveAttribute('aria-checked', 'true');
  });

  it('move o foco com as setas e escolhe com Espaço', async () => {
    const onValueChange = renderSegmented();

    await userEvent.tab();
    expect(opcao('Todos')).toHaveFocus();

    await userEvent.keyboard('{ArrowRight}');
    expect(opcao('Baixo')).toHaveFocus();

    await userEvent.keyboard(' ');
    expect(onValueChange).toHaveBeenLastCalledWith('baixo');
  });

  it('não tem violações de acessibilidade', async () => {
    renderSegmented();

    await expectNoA11yViolations();
  });
});

describe('Chip e ToggleChip', () => {
  it('ToggleChip alterna pelo teclado e anuncia o estado', async () => {
    const onSelectedChange = vi.fn<(selected: boolean) => void>();
    render(
      <ToggleChip onSelectedChange={onSelectedChange}>
        Energia Elétrica
      </ToggleChip>,
    );
    const chip = screen.getByRole('button', { name: 'Energia Elétrica' });

    expect(chip).toHaveAttribute('aria-pressed', 'false');
    chip.focus();
    await userEvent.keyboard(' ');

    expect(chip).toHaveAttribute('aria-pressed', 'true');
    expect(onSelectedChange).toHaveBeenCalledWith(true);
  });

  it('ToggleChip aceita o estado controlado', () => {
    render(<ToggleChip selected>Aluguel do Espaço</ToggleChip>);

    expect(
      screen.getByRole('button', { name: 'Aluguel do Espaço' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('Chip é só texto', () => {
    render(<Chip>Matéria-prima</Chip>);

    expect(screen.getByText('Matéria-prima')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('não tem violações de acessibilidade', async () => {
    render(
      <div>
        <ToggleChip defaultSelected>Energia Elétrica</ToggleChip>
        <Chip>Matéria-prima</Chip>
      </div>,
    );

    await expectNoA11yViolations();
  });
});
