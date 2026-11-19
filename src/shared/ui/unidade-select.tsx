import type { ComponentProps } from 'react';
import {
  UNIDADE_MEDIDA_ROTULOS,
  UNIDADES_MEDIDA,
} from '@/shared/api/contracts/enums';
import { Select } from './select';

type UnidadeSelectProps = Omit<ComponentProps<typeof Select>, 'children'>;

/**
 * Unidade do insumo e do rendimento: mostra os rótulos (`g`, `kg`, `ml`, `L`, `un`)
 * e guarda o valor do contrato (`G | KG | ML | L | UN`). Aceita `{...register('unidade')}`.
 */
export function UnidadeSelect(props: UnidadeSelectProps) {
  return (
    <Select {...props}>
      {UNIDADES_MEDIDA.map((unidade) => (
        <option key={unidade} value={unidade}>
          {UNIDADE_MEDIDA_ROTULOS[unidade]}
        </option>
      ))}
    </Select>
  );
}
