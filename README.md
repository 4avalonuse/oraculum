# ORACULUM

ORACULUM é o sistema central de investigação e análise de mercado.

Ele transforma dados em contexto, contexto em investigação e investigação em hipóteses testáveis.

## Arquitetura

A especificação de arquitetura do repositório está em [docs/architecture.md](docs/architecture.md).

Ela define:
- fronteiras entre ORACULUM, Ochama, OAlgo, OBacktest e OWin;
- Workspace e modelo de domínio;
- contratos e fundação de dados;
- separação de módulos;
- arquitetura do gráfico;
- integrações externas;
- rigor experimental;
- camada matemática;
- roadmap de evolução.

## Arquitetura de produto

ORACULUM é o núcleo integrador. Os produtos abaixo são independentes:

- **Ochama** — visualização e exploração gráfica.
- **OAlgo** — criação e manutenção de regras/algoritmos.
- **OBacktest** — teste, análise e iteração de estratégias.
- **OWin** — execução/operação.

Eles não vivem dentro deste repositório. Conectam-se ao ORACULUM por contratos de dados, APIs e identificadores/versionamento.

## ORACULUM

O centro é o Workspace: um ambiente persistente e editável para investigar o mercado.

O Workspace pode reunir ativos e datasets, visualizações vindas do Ochama, indicadores e variáveis, eventos e notícias, relações e correlações, anotações, hipóteses, recortes temporais e resultados externos.

A unidade principal não é o gráfico. É a investigação.

## Fluxo

~~~
DADOS → CONTEXTO → INVESTIGAÇÃO → HIPÓTESE → TESTE → CONHECIMENTO
                                      ↑                    │
                                      └────────────────────┘
~~~

O teste pode ser executado pelo OBacktest e a execução pelo OWin, sem que esses produtos sejam incorporados ao ORACULUM.

## Fundação de dados

- Data API: https://oraculum-data-api.4avalonuse.workers.dev
- Backend: Cloudflare Worker
- Banco: Cloudflare D1
- Modelo atual: datasets, candles, api_meta
- Fontes existentes: Yahoo Finance e Binance.US

## Princípios

1. ORACULUM integra; não absorve os outros produtos.
2. O gráfico é uma capacidade, não a identidade do produto.
3. Dados, lógica, renderização, UI, storage e API permanecem separados.
4. Nenhum arquivo deve virar um depósito de funções.
5. O Workspace preserva contexto, relações e histórico.
6. Começamos simples e evoluímos sem destruir o que já funciona.
7. Hipóteses podem ser sustentadas, refutadas ou inconclusivas.
8. Transformações e métodos fazem parte da evidência e devem ser rastreáveis.

## Estado atual

O ORACULUM está em reconstrução limpa e evoluindo diretamente na main.

A implementação atual já possui uma base funcional de dados, normalização, gráfico, interação, timeline/eventos e comparação de ativos. A arquitetura investigativa descrita em docs/architecture.md é a direção de evolução do repositório.
