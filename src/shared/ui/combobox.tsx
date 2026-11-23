'use client';

/*
 * O padrão de combobox do WAI-ARIA exige `listbox` e `option` em elementos comuns:
 * `<select>` e `<datalist>` não permitem busca com teclado nem estilo. O teclado é
 * tratado no campo, que mantém o foco (`aria-activedescendant`).
 */
/* oxlint-disable jsx-a11y/prefer-tag-over-role, jsx-a11y/no-noninteractive-element-to-interactive-role, jsx-a11y/click-events-have-key-events */

import { useId, useState, type KeyboardEvent } from 'react';
import { cn } from './cn';
import { IconCheck, IconChevronBaixo } from './icons/acoes';
import {
  CONTROL_CLASSES,
  CONTROL_HEIGHT_CLASSES,
  FieldLayout,
  useFieldControl,
  type FieldProps,
} from './label';

export type ComboboxOption = { value: string; label: string };

type ComboboxProps = FieldProps & {
  options: ComboboxOption[];
  /** Valor escolhido; `null` quando nada foi escolhido. */
  value: string | null;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  /** Texto quando a busca não encontra nada. */
  emptyMessage?: string;
  disabled?: boolean;
  name?: string;
};

/** Sem acentos e sem maiúsculas: "acucar" encontra "Açúcar". */
function normalizar(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('pt-BR')
    .trim();
}

/**
 * Seleção com busca, para escolher receita ou insumo. Segue o padrão "combobox com
 * lista" do WAI-ARIA: o foco fica no campo, as setas movem a opção ativa
 * (`aria-activedescendant`), Enter escolhe e Esc fecha. O Radix não tem combobox.
 */
export function Combobox({
  label,
  error,
  hint,
  id,
  required,
  options,
  value,
  onValueChange,
  placeholder,
  emptyMessage = 'Nenhum resultado encontrado.',
  disabled,
  name,
}: ComboboxProps) {
  const { controlProps, hintId, errorId } = useFieldControl({
    label,
    error,
    hint,
    id,
    required,
  });
  const listId = useId();
  const selecionada = options.find((option) => option.value === value);
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState<string | null>(null);
  const [ativa, setAtiva] = useState(0);

  const texto = busca ?? selecionada?.label ?? '';
  const filtradas =
    busca === null
      ? options
      : options.filter((option) =>
          normalizar(option.label).includes(normalizar(busca)),
        );
  const ativaId = aberto && filtradas[ativa] ? `${listId}-${ativa}` : undefined;

  function abrir() {
    setAberto(true);
    const indice = filtradas.findIndex((option) => option.value === value);
    setAtiva(Math.max(indice, 0));
  }

  function fechar() {
    setAberto(false);
    setBusca(null);
  }

  function escolher(option: ComboboxOption) {
    onValueChange(option.value);
    fechar();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!aberto) abrir();
        else setAtiva((atual) => Math.min(atual + 1, filtradas.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!aberto) abrir();
        else setAtiva((atual) => Math.max(atual - 1, 0));
        break;
      case 'Home':
      case 'End':
        if (aberto && filtradas.length > 0) {
          event.preventDefault();
          setAtiva(event.key === 'Home' ? 0 : filtradas.length - 1);
        }
        break;
      case 'Enter': {
        const opcao = filtradas[ativa];
        if (aberto && opcao) {
          event.preventDefault();
          escolher(opcao);
        }
        break;
      }
      case 'Escape':
        if (aberto) {
          event.preventDefault();
          fechar();
        }
        break;
    }
  }

  return (
    <FieldLayout
      label={label}
      error={error}
      hint={hint}
      required={required}
      controlId={controlProps.id}
      hintId={hintId}
      errorId={errorId}
    >
      <div className="relative">
        <input
          type="text"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={aberto}
          aria-controls={listId}
          aria-activedescendant={ativaId}
          placeholder={placeholder}
          disabled={disabled}
          name={name}
          value={texto}
          onChange={(event) => {
            setBusca(event.target.value);
            setAtiva(0);
            setAberto(true);
            if (event.target.value === '') onValueChange(null);
          }}
          onClick={() => (aberto ? fechar() : abrir())}
          onKeyDown={handleKeyDown}
          onBlur={fechar}
          className={cn(
            CONTROL_CLASSES,
            CONTROL_HEIGHT_CLASSES,
            'cursor-pointer pr-11',
          )}
          {...controlProps}
        />
        <IconChevronBaixo
          className={cn(
            'pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-accent transition-transform duration-150',
            aberto && 'rotate-180',
          )}
        />
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          hidden={!aberto || filtradas.length === 0}
          className="absolute inset-x-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-md border border-border bg-surface-raised py-1 shadow-elevacao"
        >
          {filtradas.map((option, indice) => {
            const escolhida = option.value === value;

            return (
              <li
                key={option.value}
                id={`${listId}-${indice}`}
                role="option"
                aria-selected={escolhida}
                // Mantém o foco no campo: o clique não pode disparar o `blur` antes.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => escolher(option)}
                onMouseMove={() => setAtiva(indice)}
                className={cn(
                  'flex min-h-12 cursor-pointer items-center justify-between gap-2 px-4 text-body text-ink',
                  indice === ativa && 'bg-accent-soft',
                  escolhida && 'font-extrabold',
                )}
              >
                {option.label}
                {escolhida ? <IconCheck className="size-4" /> : null}
              </li>
            );
          })}
        </ul>
        {aberto && filtradas.length === 0 ? (
          <output className="absolute inset-x-0 top-full z-30 mt-1 rounded-md border border-border bg-surface-raised px-4 py-3 text-body text-ink-muted shadow-elevacao">
            {emptyMessage}
          </output>
        ) : null}
      </div>
    </FieldLayout>
  );
}
