'use client';

import { useState } from 'react';
import { formatNumeroEditavel, parseNumeroBR } from '@/shared/format/numero-br';
import { NumberInput } from '@/shared/ui/number-input';
import { Slider } from '@/shared/ui/slider';
import { limitarNaFaixa, type Faixa } from '../simulacao.calculos';

type Props = {
  label: string;
  /** Rótulo do campo de digitação, como "Preço de venda (R$)". */
  labelCampo: string;
  value: number;
  onValueChange: (valor: number) => void;
  faixa: Faixa;
  formatValue: (valor: number) => string;
  hint: string;
  /** Casas exibidas no campo (2 no dinheiro, 0 no volume e na variação). */
  casas: number;
  prefixo?: string;
  sufixo?: string;
  /** Aceita o sinal de menos (variação de custo). */
  aceitaNegativo?: boolean;
};

/**
 * `_SliderCard` de simulacao_page.dart: o Slider (setas, Page Up/Down, Home e
 * End) e, embaixo, o mesmo valor num campo para digitar. O valor digitado é
 * aplicado ao sair do campo ou com Enter, preso à faixa.
 */
export function ControleSimulacao({
  label,
  labelCampo,
  value,
  onValueChange,
  faixa,
  formatValue,
  hint,
  casas,
  prefixo,
  sufixo,
  aceitaNegativo = false,
}: Props) {
  const [texto, setTexto] = useState<string | null>(null);
  const recusar = aceitaNegativo ? /[^\d.,-]/g : /[^\d.,]/g;

  function aplicar() {
    if (texto === null) return;
    const numero = parseNumeroBR(texto);
    setTexto(null);
    if (numero === null) return;
    const arredondado = casas === 0 ? Math.round(numero) : numero;
    onValueChange(limitarNaFaixa(arredondado, faixa));
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4">
      <Slider
        label={label}
        value={value}
        onValueChange={onValueChange}
        min={faixa.min}
        max={faixa.max}
        step={faixa.passo}
        formatValue={formatValue}
        hint={hint}
      />
      <div className="sm:max-w-56">
        <NumberInput
          label={labelCampo}
          prefixo={prefixo}
          sufixo={sufixo}
          inputMode={aceitaNegativo ? 'text' : 'decimal'}
          value={texto ?? formatNumeroEditavel(value, casas)}
          onFocus={() => setTexto(formatNumeroEditavel(value, casas))}
          onChange={(event) =>
            setTexto(event.target.value.replace(recusar, ''))
          }
          onBlur={aplicar}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              aplicar();
            }
          }}
        />
      </div>
    </div>
  );
}
