# Oraculum — Auditoria estatística e econométrica

## Objetivo

Esta camada é a base investigativa do Oraculum e deverá fornecer sinais, condições e variáveis reutilizáveis pelo OAlgo. Nenhuma métrica deve ser tratada como caixa-preta: o resultado precisa carregar fórmula, transformação, amostra, frequência, limitações e diagnóstico.

## Auditoria inicial

### Corrigidos nesta rodada

- VIF: havia um erro na soma dos quadrados dos resíduos da regressão auxiliar. O acumulador começava em zero e subtraía os erros, podendo produzir VIF infinito artificialmente. Corrigido.
- HAC/Newey-West: a inferência HAC usava uma distribuição t arbitrária com 1000 graus de liberdade. Agora o p-valor HAC usa aproximação normal bilateral e a matriz HAC recebe correção de pequena amostra n/(n-k), mantendo kernel de Bartlett.
- Saída do modelo: o modal declarava IC 95%, HAC SE e HAC p, mas não preenchia essas colunas. Agora os resultados são exibidos.
- Sortino: a explicação foi alinhada à implementação real, com downside deviation calculado por sqrt(mean(min(r-target,0)^2)) e alvo 0 na configuração atual.

### Corrigidos e validados nesta rodada

- Núcleo estatístico: amostras vazias/insuficientes retornam `NaN` em vez de um zero enganoso; correlação de séries constantes é indefinida (`NaN`).
- Estatísticas bivariadas: covariância/correlação/regressão exigem vetores de mesmo tamanho e usam apenas pares finitos; regressão informa o tamanho efetivo da amostra.
- Drawdown: `recovery` agora mede o número de observações entre o vale do drawdown máximo e a recuperação do pico anterior; retorna `null` se não houver recuperação até o fim da amostra.
- Anualização: frequência diária de cripto/testes usa 365 períodos/ano; investigações que incluem classes de mercado com pregão usam 252 períodos/ano, e 1h usa 1.638 períodos/ano como convenção de sessão. É uma convenção inicial explícita; futuros e ativos com calendários próprios ainda precisam de parametrização específica.
- Testes de referência: adicionados 10 testes automatizados para estatísticas amostrais, correlação indefinida, retornos inválidos, drawdown/recuperação, OLS, anualização por intervalo e alinhamento temporal. GitHub Actions confirmou **10/10 PASS** no commit `a823ada755030de77e50729f5170ce3ef3c1562b`.
- Alinhamento temporal: `alignSeries` agrupa por bucket UTC (hora/dia/semana/mês), sem exigir timestamp bruto idêntico. Os retornos agora usam o fechamento nativo anterior de cada série; assim, ao comparar BTC com ações, o retorno de segunda-feira do BTC não absorve artificialmente todo o fim de semana. A matriz de correlação também ignora observações não finitas de forma pareada. Ainda faltam testes amplos de feriados, fusos, frequências mistas e observações intraperíodo.

### Próximas validações necessárias

1. Lead/Lag: documentar explicitamente o sinal da defasagem e manter o resultado como diagnóstico exploratório.
2. Sharpe/Sortino: validar a convenção de sessão aplicada, o alvo e futura inclusão de taxa livre de risco temporal. Para commodities/futuros, validar uma frequência horária própria em vez de assumir a convenção de ações.
3. VaR/Expected Shortfall: validar a convenção histórica em amostras pequenas e níveis 95/99%.
4. Deflação: `deflateValues` exige timestamps exatos entre preço e CPI; deverá existir alinhamento explícito antes de usar série real.
5. OLS/inferência: comparar OLS, R², R² ajustado, t, IC e F com dados sintéticos de referência.
6. HAC: comparar contra implementação de referência em séries com heterocedasticidade/autocorrelação controladas.
7. Diagnósticos: Durbin-Watson e Ljung-Box são complementares; razão de variâncias é descritiva e não substitui testes formais.

## Critério de aceitação

- O que foi calculado?
- Qual fórmula?
- Qual transformação?
- Qual amostra efetiva?
- Qual frequência?
- Quais hipóteses?
- Quais limitações?
- Qual diagnóstico de robustez?
- O resultado é descritivo, associativo, inferencial ou preditivo?

## Contrato para o OAlgo

O OAlgo não deve consumir apenas um número. Deve consumir uma condição analítica com variável/ativo, transformação, janela, frequência, estatística/modelo, valor, sinal/direção, limiar, confiança/p-valor quando aplicável, defasagem, diagnóstico, amostra efetiva, timestamp e status de validade.

Exemplos: BTC log-return > limiar; corr(BTC,SOL,30) > 0,70; beta(BTC,SOL,90) > 1; VIF < limite; Ljung-Box p > 0,05; coeficiente HAC significativo.

## Referência metodológica

As definições foram conferidas contra documentação de referência de estatística/econometria, incluindo statsmodels para Jarque-Bera e covariância HAC/Newey-West.