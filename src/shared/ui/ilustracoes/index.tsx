import { Ilustracao, type IlustracaoProps } from './ilustracao';

export type { IlustracaoProps };

/** Pote com tampa e um círculo Damasco no rótulo: Ingredientes e Estoque vazios. */
export function IlustracaoDespensa({ className }: IlustracaoProps) {
  return (
    <Ilustracao nome="despensa" className={className}>
      <rect
        x="14"
        y="20"
        width="36"
        height="36"
        rx="9"
        className="fill-surface-alt"
      />
      <rect
        x="18"
        y="10"
        width="28"
        height="10"
        rx="4"
        className="fill-accent-soft"
      />
      <rect
        x="20"
        y="29"
        width="24"
        height="18"
        rx="5"
        className="fill-accent-soft"
      />
      <circle cx="32" cy="38" r="5" className="fill-highlight" />
    </Ilustracao>
  );
}

/** Caderno aberto com linhas e uma fatia no canto: Receitas vazio. */
export function IlustracaoCaderno({ className }: IlustracaoProps) {
  return (
    <Ilustracao nome="caderno" className={className}>
      <path
        d="M32 17C25 12 15 12 8 14V50C15 48 25 48 32 53Z"
        className="fill-surface-alt"
      />
      <path
        d="M32 17C39 12 49 12 56 14V50C49 48 39 48 32 53Z"
        className="fill-accent-soft"
      />
      <path d="M14 23H26M14 30H26M14 37H23M38 23H50M38 30H46" />
      <path d="M40 44L51 37V46Z" className="fill-highlight" />
    </Ilustracao>
  );
}

/** Forno com porta de vidro e um bolo dentro: Fornadas vazio. */
export function IlustracaoForno({ className }: IlustracaoProps) {
  return (
    <Ilustracao nome="forno" className={className}>
      <path d="M17 54V58M47 54V58" />
      <rect
        x="8"
        y="8"
        width="48"
        height="46"
        rx="8"
        className="fill-surface-alt"
      />
      <path d="M8 21H56M36 15H48" />
      <circle cx="16" cy="15" r="2" className="fill-accent-soft" />
      <circle cx="24" cy="15" r="2" className="fill-accent-soft" />
      <rect
        x="14"
        y="27"
        width="36"
        height="21"
        rx="5"
        className="fill-accent-soft"
      />
      <rect
        x="23"
        y="35"
        width="18"
        height="9"
        rx="3"
        className="fill-highlight"
      />
      <path d="M32 35V31" />
    </Ilustracao>
  );
}

/** Sacola de entrega com coração: Vendas vazio e o painel sem receitas. */
export function IlustracaoSacola({ className }: IlustracaoProps) {
  return (
    <Ilustracao nome="sacola" className={className}>
      <path
        d="M15 22H49L53 51A5 5 0 0 1 48 56H16A5 5 0 0 1 11 51Z"
        className="fill-surface-alt"
      />
      <path d="M24 29V17A8 8 0 0 1 40 17V29" />
      <rect
        x="21"
        y="34"
        width="22"
        height="17"
        rx="6"
        className="fill-accent-soft"
      />
      <path
        d="M32 48C26 44 24.5 41.5 26 39C27.5 37 30.5 37.3 32 39.5C33.5 37.3 36.5 37 38 39C39.5 41.5 38 44 32 48Z"
        className="fill-highlight"
      />
    </Ilustracao>
  );
}

/** Papel de conta com uma lâmpada: Contas do mês vazio. */
export function IlustracaoContas({ className }: IlustracaoProps) {
  return (
    <Ilustracao nome="contas" className={className}>
      <path
        d="M10 8H38V54L33.5 50.5L29 54L24.5 50.5L20 54L15.5 50.5L10 54Z"
        className="fill-surface-alt"
      />
      <path d="M16 17H31M16 24H31M16 31H25" />
      <circle cx="46" cy="33" r="9" className="fill-highlight" />
      <rect
        x="42"
        y="42"
        width="8"
        height="7"
        rx="2"
        className="fill-accent-soft"
      />
      <path d="M46 19V16M55.5 24L58 22M36.5 24L34 22" />
    </Ilustracao>
  );
}

/** Nuvem com o fio desconectado: `ErrorState` e `StatusPage` de erro. */
export function IlustracaoSemConexao({ className }: IlustracaoProps) {
  return (
    <Ilustracao nome="sem-conexao" className={className}>
      <path
        d="M20 40H46A8 8 0 0 0 47 24A13 13 0 0 0 22 21A9.5 9.5 0 0 0 20 40Z"
        className="fill-surface-alt"
      />
      <path d="M32 40V45C32 49 26 48 23 51" />
      <rect
        x="16"
        y="50"
        width="9"
        height="8"
        rx="2"
        className="fill-accent-soft"
      />
      <rect
        x="40"
        y="49"
        width="12"
        height="10"
        rx="3"
        className="fill-accent-soft"
      />
      <path d="M44 53V55M48 53V55" />
      <path d="M30 51L34 49M30 56L35 56" className="stroke-highlight" />
    </Ilustracao>
  );
}
