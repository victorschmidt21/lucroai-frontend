'use client';

import { SegmentedControl } from './segmented-control';
import { Select } from './select';
import { isTema, OPCOES_TEMA, type Tema } from './tema';
import { useTema } from './tema-provider';
import { useToast } from './toast';

/**
 * Escolha da aparência (FE-52): "Claro", "Noite" ou "Igual ao celular". Aplica na
 * hora e avisa com o toast "Aparência alterada". `segmentado` fica em
 * `/configuracoes`; `lista` é o atalho compacto do menu da conta.
 */
export function SeletorAparencia({
  variante = 'segmentado',
}: {
  variante?: 'segmentado' | 'lista';
}) {
  const { tema, setTema } = useTema();
  const toast = useToast();

  function escolher(novo: Tema) {
    if (novo === tema) return;
    setTema(novo);
    toast.success('Aparência alterada');
  }

  if (variante === 'lista') {
    return (
      <Select
        label="Aparência"
        value={tema}
        onChange={(evento) => {
          if (isTema(evento.target.value)) escolher(evento.target.value);
        }}
      >
        {OPCOES_TEMA.map((opcao) => (
          <option key={opcao.value} value={opcao.value}>
            {opcao.label}
          </option>
        ))}
      </Select>
    );
  }

  return (
    <SegmentedControl
      aria-label="Aparência"
      options={OPCOES_TEMA}
      value={tema}
      onValueChange={escolher}
      className="w-full sm:w-auto"
    />
  );
}
