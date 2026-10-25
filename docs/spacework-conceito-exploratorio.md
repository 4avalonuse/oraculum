# Spacework — conceito exploratório

> **Estado: ideias em exploração, não especificação aprovada nem funcionalidade implementada.** Este documento registra a conversa para preservar o raciocínio. Não iniciar implementação nem incorporar ao escopo do Oraculum sem decisão posterior.

## Identidade e relação com Oraculum

- **Oraculum:** investigação científica orientada por perguntas, ativos, hipóteses, fórmulas, estatística, econometria e testes.
- **Spacework:** exploração visual e sistêmica, partindo de um panorama amplo e de relações entre fenômenos; liberdade espacial para descobrir perguntas ainda não formuladas.
- Possível trânsito bidirecional: uma configuração exploratória pode originar investigação no Oraculum; resultados podem retornar ao panorama no Spacework. **Integração ainda não decidida.**
- Preservar independência dos produtos. Possível compartilhamento de componentes matemáticos e de dados, sem exigir que um aplicativo esteja aberto para o outro funcionar. Arquitetura não aprovada.

## Visão da interface: do simples ao complexo

1. **Começar em 2D**, numa prancheta de exploração, como uma combinação conceitual de Paint (organização espacial), Excel (dados e transformações) e os gráficos/timelines já conhecidos no Oraculum.
2. Adicionar diversos gráficos e objetos independentes: Bitcoin, Ethereum, commodities, índices, juros, inflação, eventos políticos, renda e dados de fluxos financeiros.
3. Organizar gráficos em painéis separados (inclusive empilhados verticalmente), sobrepor quando desejado, arrastar, redimensionar e reorganizar.
4. Poder exibir valores em escalas originais, séries normalizadas/indexadas ou outras transformações **reversíveis e explicitamente rotuladas**. Sobreposição espacial não implica normalização.
5. **Sincronização temporal flexível:** por padrão, gráficos podem compartilhar o mesmo calendário, com timelines alinhadas na mesma data; deslocar um gráfico individualmente pode desvinculá-lo de propósito sem mover os demais. Reassociação deve ser possível. Comportamento exato ainda a desenhar.
6. **Eventos como referências transversais:** escolher uma data/evento pode projetar uma referência temporal em todos os gráficos sincronizados pertinentes.
7. Distinguir sincronização por **data histórica comum** de alinhamento **relativo** (por início de ciclo, evento ou outra âncora), sem sugerir simultaneidade onde não existe.
8. Adicionar gradualmente camadas mais avançadas: mapas de conexões, topografia de valores, fluxos, exploração temporal e, eventualmente, visualizações 3D. Nada disso é requisito inicial fechado.

## Ideias para exploração sistêmica

- Combinar eventos de governo/política econômica, preços de ativos e commodities, indicadores macroeconômicos e possíveis relações entre eles.
- Conexões visuais podem representar hipóteses exploratórias, associações estatísticas ou fluxos efetivamente medidos — **com representações claramente distintas**.
- Uma eventual topografia deve declarar o significado e as unidades de altura, tamanho, distância, cor e tempo; evitar metáforas que impliquem precisão inexistente.
- Explorar a evolução histórica das relações, inclusive por uma navegação temporal comum.

## Salvaguardas científicas

- Não inferir causalidade de coincidência temporal ou correlação.
- Não representar transferência de dinheiro com uma seta sem dados de fluxo que a sustentem.
- Cada objeto deve preservar origem dos dados, frequência, datas, fuso/calendário, unidades, transformações, lacunas e limitações.
- Comparações visuais de períodos diferentes devem ser marcadas como alinhamento relativo, nunca como eventos contemporâneos.
- O Spacework pode priorizar liberdade exploratória, mas não deve produzir afirmações científicas automáticas a partir de mera proximidade visual.

## Questões deliberadamente abertas

- Ao arrastar um gráfico sobre outro, a fusão é automática ou exige comando explícito? **Não decidido.**
- Como organizar grupos de sincronização e o gesto de desprender/reconectar timelines?
- Quais objetos, tipos de conexão e transformações comporiam uma primeira versão mínima?
- Como intercambiar estudos com Oraculum e eventualmente outras ferramentas?
- Quais modos avançados (mapas, topografia, 3D) realmente ajudam a investigar e quais são apenas metáforas visuais?

## Fronteira de escopo

Esta nota **não substitui** o plano do laboratório científico do Oraculum. Spacework é uma ideia/produto distinto em maturação. O próximo passo, quando solicitado, é amadurecer conceito e interações antes de propor implementação.
