# ORACULUM — TREE PLANEJADA

## Status

A tree atual é uma fundação inicial. Ela ainda não representa toda a arquitetura conceitual definida neste documento.

## Estrutura planejada

src/
├── app/
│
├── oraculum/
│   ├── market/
│   ├── variables/
│   ├── events/
│   ├── timeline/
│   ├── relations/
│   ├── asset-panel/
│   ├── workspace/
│   │   ├── objects/
│   │   ├── frames/
│   │   ├── alignment/
│   │   ├── layers/
│   │   └── persistence/
│   ├── analytics/
│   │   ├── statistics/
│   │   ├── econometrics/
│   │   ├── transformations/
│   │   ├── deflation/
│   │   ├── correlation/
│   │   ├── lead-lag/
│   │   └── event-study/
│   ├── hypotheses/
│   ├── oalgo/
│   └── obacktest/
│
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

oraculum/ contém domínio e lógica específica do produto Oraculum.

chart/, drawing/, interaction/, viewport/, studies/ e demais módulos herdados continuam sendo a fundação visual/técnica do Ochama.

Não duplicar lógica de gráfico dentro de oraculum/.

## Regra

Primeiro definir contratos e responsabilidades. Depois criar implementações.

Não criar pastas apenas para parecer modular.

## Evolução

Pastas podem ser consolidadas ou divididas conforme o primeiro caso real exigir. A arquitetura deve evitar abstração prematura.
