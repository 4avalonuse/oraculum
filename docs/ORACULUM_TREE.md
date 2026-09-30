# ORACULUM — TREE

src/
├── app/
├── oraculum/
│   ├── market/
│   ├── variables/
│   ├── events/
│   ├── timeline/
│   ├── relations/
│   ├── workspace/
│   ├── analytics/
│   ├── hypotheses/
│   ├── oalgo/
│   └── obacktest/
├── chart/
├── drawing/
├── interaction/
├── viewport/
├── studies/
├── data/
├── storage/
├── ui/
└── styles/

## Responsabilidade

`oraculum/` contém o domínio e a lógica específica do produto.

Os módulos de chart, drawing, interaction, viewport, studies, data e storage formam a fundação técnica reutilizada.

A fundação não deve impor a identidade do produto nem receber lógica de domínio indevida.

## Regra

Primeiro contratos e responsabilidades. Depois implementação.

Não criar pastas apenas para parecer modular.
