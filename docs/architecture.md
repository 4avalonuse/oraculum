# ORACULUM — Arquitetura

## Papel
ORACULUM é o ambiente central de investigação. Ele organiza, relaciona, visualiza e preserva o trabalho de investigação.

## Dentro
Workspace, navegação, contexto do ativo, datasets, composição de visualizações, timeline, eventos, variáveis, relações, anotações, hipóteses, persistência e contratos de integração.

## Fora
Ochama, OAlgo, OBacktest e OWin continuam produtos independentes. ORACULUM integra esses produtos; não absorve suas implementações internas.

## Modelo conceitual

- ASSET — ativo.
- DATASET — fonte/mercado/intervalo.
- VARIABLE — preço, volume, indicador ou variável externa.
- OBSERVATION — valor de uma variável em um instante.
- EVENT — notícia, decisão, anúncio ou acontecimento temporal.
- RELATION — correlação, dependência, precedência ou lead/lag.
- TIMELINE — eixo temporal compartilhado.
- FRAME — recorte temporal/contextual.
- HYPOTHESIS — afirmação investigável.
- TEST — experimento associado.
- WORKSPACE — contêiner persistente da investigação.

O gráfico é uma visualização, não a entidade central.

## Workspace
Deve permitir múltiplos ativos, séries alinhadas, comparações, sobreposições, recortes, eventos, medições, relações, hipóteses, salvamento, duplicação e histórico.

O tempo é uma estrutura fundamental: cada elemento precisa poder responder o que é, a que período pertence e com o que está relacionado.

## Investigação

Quantitativa: retornos, volatilidade, médias, correlações, regressões, distribuições, transformações, normalização/deflação, estatística, econometria, lead/lag e testes.

Qualitativa: notícias, decisões, anúncios, eventos macroeconômicos, acontecimentos específicos, classificação de impacto e observações humanas.

O sistema não assume antecipadamente um modelo causal ou estatístico único.

## Camadas técnicas

- data/ — contratos e acesso a dados
- logic/ — domínio e regras
- render/ — renderização
- ui/ — controles e interação
- storage/ — persistência
- api/ — comunicação externa
- workspace/ — composição da investigação
- integrations/ — contratos com produtos externos

app.js apenas inicializa e conecta módulos.

## Evolução inicial

1. Shell e navegação.
2. Workspace persistente e editável.
3. Catálogo de datasets.
4. Primeiro painel visual conectado ao Ochama.
5. Timeline e eventos.
6. Variáveis e relações.
7. Hipóteses.
8. Integrações com OAlgo, OBacktest e OWin.
