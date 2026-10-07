# Oraculum — Auditoria estatística e econométrica

## Objetivo

Esta camada é a base investigativa do Oraculum e deverá fornecer sinais, condições e variáveis reutilizáveis pelo OAlgo. Nenhuma métrica deve ser tratada como caixa-preta: o resultado precisa carregar fórmula, transformação, amostra, frequência, limitações e diagnóstico.

## Auditoria inicial

### Corrigidos nesta rodada

- VIF: havia um erro na soma dos quadrados dos resíduos da regressão auxiliar. O acumulador começava em zero e subtraía os erros, podendo produzir VIF infinito artificialmente. Corrigido.
- HAC/Newey-West: a inferência HAC usava uma distribuição t arbitrária com 1000 graus de liberdade. Agora o p-valor HAC usa aproximação normal bilateral e a matriz HAC recebe correção de pequena amostra n/(n-k), mantendo kernel de Bartlett.
- Saída do modelo: o modal declarava IC 95%, HAC SE e HAC p, mas não preenchia essas colunas. Agora os resultados são exibidos.
- Sortino: a explicação foi alinhada à implementação real, com downside deviation calculado por sqrt(mean(min(r-target,0)^2)) e alvo 0 na configuração atual.

### Segunda bateria de testes necessária

1. Retornos e alinhamento temporal: validar gaps, timestamps ausentes e frequências diferentes. O alinhamento atual usa timestamps exatos.
2. Lead/Lag: documentar explicitamente o sinal da defasagem e manter o resultado como diagnóstico exploratório.
3. Drawdown e recuperação: o MDD está correto, mas o campo recovery atualmente mede a distância do último pico até o fim da amostra, não o tempo de recuperação do drawdown máximo.
4. Sharpe/Sortino: validar anualização, alvo e futura inclusão de taxa livre de risco temporal.
5. VaR/Expected Shortfall: validar a convenção histórica em amostras pequenas e níveis 95/99%.
6. Deflação: deflateValues exige timestamps exatos entre preço e CPI; deverá existir alinhamento explícito antes de usar série real.
7. OLS/inferência: comparar OLS, R2, R2 ajustado, t, IC e F com dados sintéticos de referência.
8. HAC: comparar contra implementação de referência em séries com heterocedasticidade/autocorrelação controladas.
9. Diagnósticos: Durbin-Watson e Ljung-Box são complementares; razão de variâncias é descritiva e não substitui testes formais.

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