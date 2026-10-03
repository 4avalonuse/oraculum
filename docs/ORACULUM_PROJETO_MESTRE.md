# ORACULUM — Projeto Mestre

**Visão de Produto, Filosofia e Experiência**  
Versão 1.0 • 2 de outubro de 2026

> Documento conceitual e descritivo. Não define tecnologia, arquitetura de software ou implementação.

## 1. A ideia central

Oraculum é um laboratório para investigar o movimento dos mercados. Não nasce como um simples terminal de gráficos, nem como um robô de operações. Seu propósito é permitir que uma pessoa observe, compare, formule perguntas, construa hipóteses, experimente, teste e, quando houver evidência suficiente, transforme uma descoberta em uma estratégia que possa ser validada e eventualmente operada.

A filosofia é simples: uma ideia deve poder nascer como uma pergunta, ganhar forma como uma hipótese, tornar-se uma experiência, sobreviver ao teste e deixar um registro de como e quando funcionou — ou não funcionou.

O sistema deve ser profundo por dentro e simples por fora. A primeira camada precisa ser compreensível em poucos segundos. As camadas seguintes aparecem conforme o pesquisador deseja aprofundar.

## 2. O Oraculum como laboratório

O Oraculum é o núcleo que dá continuidade à investigação. Ele conecta observação, contexto, hipóteses, experimentos e estratégias sem obrigar todas as descobertas a virar operações.

- Investigações podem terminar em uma conclusão sem gerar estratégia.
- Uma hipótese pode ser confirmada, refutada ou permanecer inconclusiva.
- Uma estratégia pode ser testada muitas vezes e continuar sendo apenas experimental.
- Uma versão aprovada para operação deve manter sua origem, contexto e histórico.
- Cada alteração importante cria uma nova versão, sem apagar o que foi aprendido anteriormente.

## 3. O ecossistema

### Ochama — exploração visual

Ochama é o ambiente especializado de mercado: dados, gráficos, navegação, estudos e interação visual. Ele deve continuar existindo como produto e repositório independente, preservando sua identidade.

No Oraculum, Ochama pode ser aberto como uma janela especializada de investigação visual. O Oraculum não precisa transformar Ochama em outra coisa.

### Spacework — investigação

Spacework é o espaço onde o pesquisador coloca ativos, períodos, eventos, transformações e perguntas lado a lado. É onde a observação se transforma em investigação.

### OAlgo — construção de algoritmos

OAlgo transforma hipóteses em algoritmos. Seu princípio é permitir que uma pessoa construa lógica complexa de maneira visual, progressiva e compreensível.

### OBacktest — laboratório experimental

OBacktest recebe algoritmos e permite experimentá-los em diferentes ativos, períodos, contextos e condições. Deve ser simples para o primeiro teste e poderoso para investigações profundas.

### OWin — observação e operação

OWin representa a passagem da estratégia validada para a simulação ao vivo e, quando houver autorização, para a operação controlada. A operação nunca deve apagar a história que levou até ela.

## 4. O caminho natural

1. Observar — o que aconteceu?
2. Perguntar — existe alguma relação interessante?
3. Comparar — isso acontece em outros períodos, ativos ou contextos?
4. Investigar — qual variável parece explicar ou anteceder o movimento?
5. Formular — consigo transformar essa hipótese em uma regra?
6. Construir — como essa regra pode ser representada?
7. Experimentar — em quais condições ela funciona?
8. Confrontar — onde ela falha?
9. Validar — o comportamento permanece em dados novos?
10. Simular — como ela se comporta diante do mercado em movimento?
11. Operar — somente uma versão explicitamente autorizada chega à execução.

## 5. A experiência por camadas

O Oraculum deve evitar o erro de mostrar toda a complexidade de uma vez.

- **Camada 1 — resposta rápida:** gráfico, comparação ou resultado essencial.
- **Camada 2 — contexto:** período, ativo, evento, indicador e condições.
- **Camada 3 — investigação:** transformações, relações, defasagens e evidências.
- **Camada 4 — construção:** algoritmo, regras, variáveis e parâmetros.
- **Camada 5 — experimento:** múltiplos testes, cenários e comparação.
- **Camada 6 — diagnóstico:** por que funcionou, onde falhou e em quais condições.
- **Camada 7 — reprodução:** replay visual, frame a frame, para observar as decisões.
- **Camada 8 — operação:** simulação ao vivo, limites e execução autorizada.

## 6. OAlgo — o laboratório visual de algoritmos

OAlgo deve ter duas portas de entrada: visual e textual. O usuário pode montar um algoritmo como quem monta peças, ou escrever sua lógica em uma linguagem simplificada inspirada em Python. As duas representações devem descrever a mesma ideia.

O objetivo não é obrigar o pesquisador a aprender programação. A programação existe para quem quiser precisão, liberdade e profundidade.

### 6.1 Construção visual

O algoritmo nasce de blocos conectáveis. Cada bloco representa uma ideia compreensível: uma variável, uma transformação, uma condição, uma comparação, uma janela de tempo, uma entrada, uma saída, um filtro ou uma regra de risco.

Podem participar:

- Variáveis de preço, volume e retorno.
- Indicadores e medidas estatísticas.
- Variáveis de outros ativos.
- Eventos e contexto de mercado.
- Defasagens e relações temporais.
- Transformações e normalizações.
- Condições combinadas.
- Filtros de regime.
- Entradas, saídas e condições de não operar.
- Regras de tamanho, exposição e risco.

A linguagem visual deve permitir começar com dois ou três blocos e terminar, se desejado, em uma construção sofisticada. Complexidade deve ser consequência da investigação, nunca uma barreira de entrada.

### 6.2 Linguagem simplificada

OAlgo pode oferecer uma linguagem própria, deliberadamente simples, com aparência familiar para quem conhece Python. A linguagem deve privilegiar leitura humana: uma pessoa deve conseguir olhar para uma regra e entender o que ela está dizendo.

A linguagem visual e a textual são duas formas de representar a mesma lógica.

### 6.3 Sincronização desenho ↔ linguagem

Quando o usuário altera o desenho, a representação textual acompanha. Quando edita a representação textual, o desenho acompanha quando a estrutura puder ser representada visualmente.

O pesquisador pode começar visualmente, aprofundar em texto e voltar ao visual. A construção continua sendo uma única entidade, com uma única identidade e uma única versão.

### 6.4 Algoritmos como objetos vivos

Cada algoritmo deve possuir identidade, versão, origem e contexto. Deve ser possível saber de qual hipótese nasceu, quais variáveis utiliza, quais condições exige e quais experimentos já foram realizados.

Uma alteração não deve destruir a versão anterior. O aprendizado do laboratório está justamente na comparação entre versões.

## 7. OBacktest — o laboratório de experimentação

OBacktest não deve ser uma tela que devolve apenas lucro, drawdown e número de operações. Ele é um laboratório onde perguntas diferentes podem ser feitas ao mesmo algoritmo.

### 7.1 Liberdade de experimentação

O pesquisador deve poder testar um algoritmo em um ativo ou em vários ativos; em um período ou em vários períodos; em uma condição específica ou em diferentes contextos. Deve poder comparar algoritmos entre si e também comparar diferentes versões do mesmo algoritmo.

- Vários algoritmos em um mesmo experimento.
- Vários ativos em um mesmo experimento.
- Vários períodos e janelas.
- Vários timeframes.
- Diferentes condições de mercado.
- Variações de parâmetros.
- Comparações lado a lado.
- Testes individuais ou em lote.
- Resultado resumido ou investigação detalhada.

### 7.2 A porta de entrada continua simples

Apesar de toda essa liberdade, o primeiro uso deve ser quase trivial: escolher algoritmo, ativo, período e executar.

Quem quiser aprofundar pode abrir as camadas seguintes. A ferramenta nunca deve exigir que o pesquisador configure vinte coisas para responder uma pergunta simples.

### 7.3 Resultado e replay

OBacktest terá dois modos complementares.

**Resultado:** mostra a visão consolidada do experimento, suas métricas, operações, períodos e condições.

**Replay:** reproduz a história como uma animação. O mercado avança candle a candle e o algoritmo reage apenas ao que estaria disponível naquele momento.

O replay não é apenas visual. É uma forma de compreender a lógica do algoritmo e enxergar decisões, entradas, saídas, períodos de espera, erros e mudanças de comportamento.

### 7.4 Experimentos simultâneos

Um dos poderes centrais do OBacktest será colocar experiências em paralelo. O pesquisador poderá perguntar: o mesmo algoritmo funciona em BTC e ETH? Funciona em períodos diferentes? Uma versão mais simples sobrevive melhor que uma versão mais complexa? O comportamento muda quando o mercado entra em outra condição?

A ferramenta deve permitir essas perguntas sem transformar o pesquisador em operador de planilhas.

## 8. O conceito de contexto

O Oraculum não deve registrar apenas se um algoritmo ganhou ou perdeu. Deve registrar o ambiente em que o comportamento ocorreu.

- Ativo.
- Período.
- Timeframe.
- Regime ou condição observada.
- Volatilidade.
- Tendência ou ausência dela.
- Eventos relevantes.
- Variáveis utilizadas.
- Condições de entrada e saída.
- Custos e premissas do experimento.

A conclusão desejada é contextual: determinado algoritmo apresentou determinado comportamento sob determinadas condições. Isso é mais informativo do que declarar simplesmente que um algoritmo funciona.

## 9. O registro do conhecimento

Cada investigação deve deixar um rastro compreensível:

**Pergunta → contexto → hipótese → algoritmo → experimento → resultado → interpretação → conclusão.**

Resultados negativos também são conhecimento. Um algoritmo que falhou em determinado contexto deve continuar registrado, porque a falha pode explicar quando ele não deve ser utilizado.

O sistema deve preservar evidências favoráveis e contrárias, sem forçar uma conclusão.

## 10. Visualização

A linguagem visual do Oraculum deve ser limpa, elegante e silenciosa. A interface não deve competir com a investigação.

- Gráficos claros e navegáveis.
- Comparações que respeitem diferenças de escala.
- Contexto disponível sem poluir o gráfico.
- Eventos organizados por tipo.
- Estatísticas acessíveis em camadas.
- Anotações ligadas ao estudo.
- Replay que mostre o raciocínio acontecendo.
- Controles simples na superfície e profundidade sob demanda.

O gráfico continua sendo uma ferramenta de pensamento, não uma decoração.

## 11. Filosofia de profundidade

O projeto deve funcionar como uma lente. Na superfície, vemos pouco e entendemos rápido. Conforme aprofundamos, encontramos mais instrumentos.

Um iniciante pode comparar dois ativos. Um pesquisador pode transformar essa comparação em uma hipótese. Um usuário avançado pode construir um algoritmo com dezenas de variáveis. Outro pode escrever a mesma lógica em texto. OBacktest pode então experimentar centenas de combinações sem mudar a natureza da ferramenta.

A profundidade existe para quem precisa dela; ela não deve ser imposta a quem está apenas começando.

## 12. Exemplo de uma investigação completa

Um pesquisador observa que movimentos do ETH parecem anteceder movimentos do BTC em determinados períodos.

No Spacework, ele compara os ativos e investiga retornos e defasagens. Registra evidências favoráveis e contrárias.

No OAlgo, transforma a hipótese em uma construção visual: uma variável do ETH, uma defasagem, uma condição de mercado e uma regra de entrada no BTC. Se desejar, abre a representação textual e ajusta a lógica.

No OBacktest, testa a mesma versão em BTC e ETH, em períodos diferentes, com múltiplos contextos. Primeiro observa o resultado. Depois abre o replay e acompanha as decisões frame a frame.

O sistema registra onde o algoritmo apresentou determinado comportamento e onde deixou de fazê-lo.

Se a hipótese não sobreviver, a investigação continua sendo válida. Se sobreviver, uma nova versão pode ser criada e submetida a testes adicionais.

Somente depois de validação e autorização a estratégia pode seguir para simulação e eventual operação.

## 13. O que o Oraculum não deve se tornar

- Não deve ser um painel abarrotado de indicadores.
- Não deve exigir programação para uma investigação simples.
- Não deve esconder a lógica por trás de uma caixa-preta.
- Não deve declarar que uma estratégia funciona apenas porque apresentou lucro histórico.
- Não deve misturar pesquisa e execução de forma que um erro de pesquisa possa afetar diretamente uma conta real.
- Não deve apagar experimentos negativos.
- Não deve sacrificar simplicidade para demonstrar quantidade de recursos.

## 14. Princípio mestre

O Oraculum deve permitir que uma pessoa vá da curiosidade à evidência, da evidência à regra, da regra ao experimento e, quando merecido, do experimento à operação.

O sistema não deve decidir pelo pesquisador. Deve tornar o pensamento mais claro, os experimentos mais rigorosos e o conhecimento acumulado mais reutilizável.

## 15. Visão final

Oraculum é um laboratório de investigação de mercados.

**Ochama permite ver.**  
**Spacework permite investigar.**  
**OAlgo permite construir.**  
**OBacktest permite experimentar.**  
**OWin permite observar e operar.**

E o Oraculum conecta tudo isso em uma história única de conhecimento.

A ambição não é criar uma ferramenta que diga ao usuário o que fazer. É criar um ambiente no qual uma boa pergunta possa ser investigada profundamente, uma hipótese possa ser transformada em algo testável, um algoritmo possa ser experimentado sob diferentes condições e cada conclusão — positiva, negativa ou inconclusiva — permaneça como parte do conhecimento do laboratório.

## Princípios de produto

- Simples na entrada, profundo na saída.
- Visual primeiro, textual quando necessário.
- Uma lógica, duas representações: desenho e linguagem.
- Experimentos reproduzíveis e contextualizados.
- Vários algoritmos e ativos sem limitar a liberdade do pesquisador.
- Replay para compreender decisões, não apenas resultados.
- Versões preservam aprendizado.
- Resultados negativos também são resultados.
- Investigação independente de operação.
- Complexidade sob demanda.
- Clareza antes de quantidade.
- Contexto antes de conclusão.
