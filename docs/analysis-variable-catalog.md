# Auditoria do catálogo de variáveis analíticas

**Estado:** primeira versão implementada; metadados e testes adicionados.  
**Escopo:** análise estatística existente em `src/analysis/`. Não cria tabelas no D1, não muda a API e não altera Ochama.

## Resultado

O catálogo canônico está em `src/analysis/variable-catalog.js`. Cada variável recebe um ID estável, rótulo, domínio, unidade, definição, fórmula, origem no módulo e requisitos/limitações. Os IDs são a chave recomendada para referências futuras; rótulos podem mudar com a interface.

O catálogo é descritivo: não calcula valores, não salva amostras e ainda não está conectado aos componentes visuais. Isso é intencional para não misturar o registro de uma métrica com sua execução ou persistência.

## Achados relevantes

1. **Erro real nas métricas de risco — corrigido nesta auditoria.** As séries de retorno alinhadas incluem `NaN` intencional na primeira observação e em intervalos inválidos. `risk.js` calculava média, desvio-padrão e quantis sem filtrar esses valores. Assim, Sharpe, Sortino e VaR podiam resultar em `NaN` mesmo com retornos válidos. As funções agora filtram valores não finitos e validam níveis/parâmetros.
2. **Cálculo Sharpe duplicado — sombra removida do pipeline.** `engine.js` calculava Sharpe diretamente e depois sobrescrevia o mesmo campo com o valor de `riskMetrics`. O campo duplicado foi removido; o valor final continua vindo do módulo de risco.
3. **Responsabilidades parcialmente sobrepostas.** `engine.js`, `descriptive.js` e `risk.js` mantêm utilitários de média/desvio-padrão/quantis em paralelo. Alguns precisam de políticas diferentes para amostras inválidas, portanto a consolidação deve ser feita com testes e contrato explícito, não por substituição automática.
4. **Núcleo ainda concentra áreas diferentes.** `engine.js` reúne estatística básica, alinhamento temporal, pipeline da análise, métricas de performance e deflação por CPI. É um candidato para extrações graduais, preservando a API pública.
5. **Econometria ainda é um módulo denso.** `explanatory-model.js` inclui álgebra matricial, distribuições de referência, OLS, HAC/Newey–West e VIF. Futuramente, esses blocos podem ser separados, com fixtures numéricas independentes.
6. **A camada de apresentação não é a fonte dos cálculos.** O modal apresenta várias métricas e explicações; o catálogo deve ajudar a padronizar metadados, mas os componentes não devem recalcular fórmulas.
7. **Persistência ainda não deve ser criada.** Primeiro precisamos estabilizar IDs, definições, unidades, período/amostra e método. Só depois vale definir contratos de snapshots e tabelas.

## Política recomendada para reutilização

- **Dados de origem:** armazenar/consultar séries normalizadas uma única vez; não duplicar candles por cada métrica.
- **Catálogo:** guardar definições e metadados estáveis em código/versionamento.
- **Execução:** receber séries, intervalo, janela, convenção de retornos e opções explicitamente.
- **Resultado:** quando for implementado, cada resultado deve carregar pelo menos `variableId`, valor, ativo/alvo, intervalo, início/fim, quantidade de observações, modo de retorno, parâmetros, versão do método e estado de validade.
- **Investigações:** salvar a configuração que reproduz o estudo e referências a resultados; não transformar todo cálculo transitório em registro persistente.
- **OBacktest:** exigir dados disponíveis na data de decisão, para evitar look-ahead bias; resultado histórico não pode usar revisões/dados futuros silenciosamente.
- **Ausência de resultado:** distinguir valor indefinido, amostra insuficiente e falha de execução. Não converter nenhum desses estados em zero.

## Próximos passos seguros

1. Confirmar a bateria de testes no CI após os novos testes de catálogo e risco.
2. Adicionar testes de integração para a saída de `analyzeSeries` (incluindo Sharpe, Sortino, VaR e ES com a primeira linha `NaN`).
3. Extrair contratos de amostra/alinhamento do `engine.js` sem mudar resultados.
4. Conectar o catálogo à ajuda contextual e à tabela de resultados usando IDs, sem reescrever as fórmulas no front-end.
5. Definir o envelope versionado de resultados antes de qualquer persistência no backend.
