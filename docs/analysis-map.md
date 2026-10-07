# Oraculum — Mapa da camada de análises

A camada de análises é uma linha de produção investigativa. O resultado final não é apenas um indicador: é uma variável analítica auditável que pode alimentar o OAlgo.

```mermaid
flowchart TD
    D["DADOS BRUTOS<br/>Yahoo / Binance / D1"] --> Q["QUALIDADE DOS DADOS"]
    Q --> A["ALINHAMENTO TEMPORAL"]
    A --> T["TRANSFORMAÇÕES"]
    T --> P["PREÇOS / ÍNDICES"]
    T --> R["RETORNOS"]
    T --> RR["RETORNOS REAIS / DEFLACIONADOS"]
    T --> W["JANELAS / LAGS / ROLLING"]
    R --> S["ESTATÍSTICA DESCRITIVA"]
    R --> RK["RISCO E PERFORMANCE"]
    R --> C["RELAÇÕES ENTRE VARIÁVEIS"]
    R --> E["ECONOMETRIA"]
    S --> SD["média · mediana · variância<br/>desvio-padrão · quantis<br/>assimetria · curtose · JB"]
    RK --> RD["volatilidade · drawdown<br/>Sharpe · Sortino · VaR · ES · Calmar"]
    C --> RC["correlação · covariância<br/>beta · alpha · R²<br/>rolling · lead/lag"]
    E --> OLS["OLS / REGRESSÃO"]
    OLS --> INF["INFERÊNCIA"]
    INF --> CI["erro-padrão · t · p · IC"]
    OLS --> HAC["HAC / Newey-West"]
    OLS --> VIF["VIF / MULTICOLINEARIDADE"]
    OLS --> RES["RESÍDUOS"]
    RES --> DG["DIAGNÓSTICOS"]
    DG --> DW["Durbin-Watson"]
    DG --> LB["Ljung-Box"]
    DG --> VR["razão de variâncias"]
    C --> M["MODELO MULTIVARIADO"]
    E --> M
    M --> INF
    M --> DG
    SD --> I["INTERPRETAÇÃO"]
    RK --> I
    RC --> I
    DG --> I
    I --> V["VARIÁVEIS ANALÍTICAS AUDITÁVEIS"]
    V --> OA["ORACULUM<br/>INVESTIGAÇÃO"]
    V --> ALG["OALGO<br/>CONDIÇÕES / REGRAS / BLOCOS"]
    ALG --> BT["OBACKTEST<br/>TESTAR CONDIÇÕES E ALGORITMOS"]
```

## Camadas

1. Dados — origem, timestamp, frequência, qualidade e cobertura.
2. Transformações — preço, retorno simples/log, deflação, janelas e defasagens.
3. Estatística — descrição da distribuição e comportamento.
4. Risco — retorno, volatilidade, drawdown e cauda.
5. Relações — associação entre ativos e variáveis.
6. Econometria — regressões, inferência, HAC e modelos multivariados.
7. Diagnóstico — verificar se o modelo deixou padrões sistemáticos nos resíduos.
8. Interpretação — explicar o resultado sem confundir associação com causalidade.
9. Condições analíticas — transformar resultados em objetos reutilizáveis pelo OAlgo.

## Princípio central

Oraculum descobre e mede. OAlgo combina condições. OBacktest testa se essas condições funcionam em diferentes contextos.

Isso mantém a matemática e a investigação no Oraculum, o desenho visual/algorítmico no OAlgo e a avaliação histórica no OBacktest.

## Evolução planejada

- correlação → correlação móvel → lead/lag;
- OLS → HAC → diagnósticos;
- regressão multivariada → modelos dinâmicos;
- séries reais → comparação nominal/real;
- associação → testes de causalidade;
- modelo histórico → walk-forward/out-of-sample;
- condições simples → combinações complexas no OAlgo.

Cada expansão deve manter o mesmo contrato de auditabilidade.