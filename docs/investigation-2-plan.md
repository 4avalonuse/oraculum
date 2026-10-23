# Oraculum — Investigação 2.0 (escopo aprovado)

## Objetivo
Transformar a análise em um fluxo híbrido, intuitivo e aprofundável de investigação quantitativa e qualitativa. Trabalhar em commits pequenos diretamente na main, com backup e testes no GitHub Pages.

## Preservar
- Gráfico principal e navegação de eventos (não alterar sem acordo).
- Timelines com instâncias independentes: o mesmo ativo pode aparecer repetidas vezes em períodos diferentes.
- Segundo gráfico de comparação: cada janela começa em base 100, usa escala logarítmica e eixo de tempo relativo.
- Recalcular estatísticas somente por ação explícita após alterações de janelas.
- Separar comparação visual de épocas diferentes de inferência estatística baseada em datas coincidentes.

## Aperfeiçoar primeiro: timelines e segundo gráfico
1. Clareza: rotular cada instância como BTC · Jan–Mar/2023, BTC · Jan–Mar/2024 etc.; destacar a janela ativa e permitir remover/reordenar instâncias sem perder outras.
2. Alinhamento visual configurável: início da janela (comportamento atual), topo, fundo ou evento escolhido. Exibir o marco, data, regra de detecção e deslocamento; permitir voltar ao modo inicial.
3. Comparação de padrões: estatísticas exploratórias de semelhança de trajetória e amplitude, com indicação de amostra, transformação, sensibilidade e limitações. Nunca chamar isso de correlação contemporânea quando os períodos não coincidirem.
4. Contexto qualitativo: sobrepor e comparar eventos, notícias, decisões de bancos centrais e acontecimentos geopolíticos com fonte, data e distinção entre fato e interpretação.
5. Feedback de interação: após edição da janela, marcar análises como desatualizadas; não recalcular automaticamente.

## Fluxo híbrido da investigação
Pergunta -> escolher ativo(s) e janela(s) -> explorar graficamente -> escolher análises -> interpretar evidências quantitativas e qualitativas -> registrar hipótese, ressalvas e próximos testes.

- Mostrar primeiro um resumo compreensível; abrir métricas, fórmulas e diagnósticos sob demanda.
- Não eliminar métricas existentes sem inventário e testes de equivalência.
- O laboratório econométrico deve permitir escolher Y, variáveis X, transformações e amostra, estimar uma equação e mostrar coeficientes, IC, R², resíduos e diagnósticos.
- Auditar regressão múltipla/OLS/HAC/VIF e lacunas (estacionariedade, cointegração, causalidade de Granger, ARCH, séries temporais) antes de adicionar métodos.
- Preços em nível não devem ser interpretados como relações válidas sem testes contra regressão espúria.

## Regras metodológicas
- Tempo relativo: compara padrões de janelas históricas distintas; eixo horizontal não representa datas comuns.
- Tempo calendário: usa observações pareadas em datas/frequências compatíveis para correlação, regressão e demais inferências.
- Topo/fundo detectado usando toda a janela é uma análise retrospectiva; nunca usar como sinal negociável sem eliminar look-ahead.
- Separar associação, predição e causalidade; expor tamanho de amostra, método, transformações, diagnósticos e limitações.
- Guardar fonte e timestamp de eventos/notícias.

## Workspace e integração futura
Persistir configurações reprodutíveis de investigação: ativos, instâncias de janela, modos de alinhamento, fontes, hipóteses, parâmetros e referências a resultados. Definir contratos versionados antes de criar tabelas ou persistir métricas transitórias. OAlgo transforma hipóteses em regras; OBacktest as valida sem look-ahead.

## Ordem e critérios de aceite
1. Inventário e testes de regressão das timelines/gráfico; preservar comportamento atual.
2. Melhorias incrementais de usabilidade, testadas no Pages.
3. Alinhamentos alternativos com testes de datas, extremos e eventos.
4. Métricas de semelhança + contexto qualitativo.
5. Reformulação dos resultados e laboratório econométrico.
6. Workspace persistente e contrato para OAlgo/OBacktest.

Aceitar cada etapa somente se: ativo repetido funciona, janelas continuam independentes, base 100/tempo relativo são explicitados, análise não dispara silenciosamente, cálculos existentes não regrediram, e a interface funciona em desktop e celular.
