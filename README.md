# ORACULUM

ORACULUM é o sistema central de investigação e análise de mercado.

Ele transforma dados em contexto, contexto em investigação e investigação em hipóteses testáveis.

## Arquitetura de produto

ORACULUM é o núcleo integrador. Os produtos abaixo são independentes:

- Ochama — visualização e exploração gráfica.
- OAlgo — criação e manutenção de regras/algoritmos.
- OBacktest — teste, análise e iteração de estratégias.
- OWin — execução/operação.

Eles não vivem dentro deste repositório. Conectam-se ao ORACULUM por contratos de dados, APIs e identificadores/versionamento.

## ORACULUM

O centro é o Workspace: um ambiente persistente e editável para investigar o mercado.

O Workspace pode reunir ativos e datasets, visualizações vindas do Ochama, indicadores e variáveis, eventos e notícias, relações e correlações, anotações, hipóteses, recortes temporais e resultados externos.

A unidade principal não é o gráfico. É a investigação.

## Fluxo

DADOS → VISUALIZAÇÃO → INVESTIGAÇÃO → HIPÓTESE → TESTE → EVOLUÇÃO

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

## Estado atual

Esta é a reconstrução limpa do ORACULUM. O código antigo foi removido deliberadamente.

Próxima etapa: fundação da navegação e do Workspace.
