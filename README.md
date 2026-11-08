# Jornada de Hyrule — 0.6

Leitor local de saves de OOT NS2/Lichii. Não altera os saves do emulador e não envia arquivos a serviços externos.

## Abrir e conectar

1. Com Node.js 22 ou superior instalado, execute `Iniciar.cmd`. O navegador abre o aplicativo; o servidor continua em segundo plano após o iniciador fechar. Execute `Encerrar.cmd` para encerrá-lo.
2. Em **Conectar save**, use **Escolher arquivos** para importar `progress.sav`, ZIP ou RAR, ou **Escolher pasta** para importar a pasta do jogo que contém os slots. Clique em **Importar save**. Para um save avulso, escolha o slot de destino.
3. Para acompanhar novas gravações automaticamente, conecte o caminho da pasta ativa do emulador. A importação copia os arquivos: você precisa reimportar após salvar novamente no jogo.
4. Ao monitorar uma pasta, **Mais recente (automático)** acompanha o arquivo gravado mais recentemente entre os seis slots. Também é possível fixar um slot específico. Os índices são os nomes reais dos diretórios do jogo; não se presume que todos sejam partidas distintas. Na importação de arquivos, escolha o slot desejado: a ordem de importação não garante qual era o save mais recente no emulador.

## Contadores automáticos

- **Skulltulas:** campo real `PouchData.Item_Token_Gold.StockNum`, limite 100. Mostra coletadas e restantes.
- **Pedaços de coração:** total calculado a partir de `PlayerStatus.MaxLife`, dos oito registros de recipientes de chefes e de `PouchData.Obj_Heart_Piece.StockNum`. O último campo contém somente o resto de quartos de coração; não é o total histórico de peças. Fórmula: `(capacidade de corações − 3 iniciais − recipientes de chefes coletados) × 4 + resto de quartos`. Limite 36. Valores inconsistentes ficam sem leitura.
- **Vida, quartos restantes, recipientes e rupias:** lidos do save e exibidos no resumo.
- **Baús:** contador inteiro de 64 bits do jogo, chave `4766a777`, conferido com os 206 registros booleanos da tabela de baús `ce0c4dfe`. A comparação controlada mostrou 148 antes e 149 depois de abrir o baú de 50 rupias da Cidade Goron; só uma flag mudou, `37f0e791`, correspondente ao objeto `10944569637726152230`. Todas as 18 amostras de save conferidas têm contador igual à soma das flags. O parser confere os 206 registros; o mapa apresenta 194 baús comuns, separando os 12 do minigame do Burgo.

O catálogo identifica 100 locais de Skulltulas, 36 objetivos de coração e 206 registros de baús da revisão 2982123. Os dados do leitor incluem identificadores e metadados factuais. Esta edição local também contém mapas e ícones extraídos da instalação fornecida pelo usuário; não foi publicada. O parser limita essas contagens à revisão validada.

O checklist e as regiões são preenchidos automaticamente. As regiões seguem as cenas internas; algumas agregam subáreas, como Campo de Hyrule e arredores. Os nomes numerados dos itens são identificadores de interface, não instruções de localização. O mapa panorâmico e os mapas locais mostram os registros associados às regiões.

Os seis objetivos de coração ligados a baús agora também têm estado individual, completando a identificação dos 36 objetivos. Dez registros de baús ainda não têm região identificada: ficam em “Região ainda não identificada”, com a coleta lida corretamente e incluída no total. Os 206 registros são a tabela de baús mantida pelo jogo; não se presume que isso constitua, sozinho, a definição de 100% da aventura.

Registros divergentes entre o estoque de Skulltulas e os locais persistentes geram um aviso. Totais de corações ou baús inconsistentes com os registros individuais são ocultados. Saves modificados ou de outra revisão podem não ser compatíveis.

**Não há percentual global de 100% do jogo.** As porcentagens são somente das categorias identificadas.

## Importação e dados locais

Aceita até seis `progress.sav` de 8 MB cada, ou um ZIP/RAR de até 32 MB. A pasta selecionada ignora arquivos `caption.sav`, `option.sav` e demais arquivos. ZIP/RAR utiliza o `tar` do Windows; se um formato não for compatível, extraia e importe a pasta. Não há dependências npm.

A pasta `dados` guarda configurações, cópias importadas, referências de comparação, endereço do servidor e log. Não a compartilhe: contém dados do seu save. O ZIP distribuído não inclui essa pasta.

Reimportar um slot mantém sua referência; compare sempre a mesma partida. Slots omitidos na importação conservam a cópia anterior. Trocar entre a pasta monitorada e a pasta de importação limpa as referências para evitar comparações entre origens distintas. As associações manuais adicionais do laboratório são mantidas, mas não alteram os contadores automáticos.

Projeto independente, sem vínculo com Nintendo, Zelda Notes ou Lichii.

## Skulltulas detalhadas — versão 0.5

Os painéis de região mostram os locais do catálogo, com coleta automática, filtros de pendentes/coletadas e categoria, além das condições de aparecimento. Os códigos por região (ex.: KOK-03) são referências locais estáveis e não seguem a ordem de vídeos. O índice do guia https://www.youtube.com/watch?v=TGBwn7e8oWA contém os capítulos publicados pelo autor. A associação completa dos números com os IDs do jogo ainda está pendente: somente associações verificadas recebem número e estado do save juntos. A ausência de associação nunca é tratada como coletada. Arquivos compartilhados não determinam a idade de acesso. A revisão considera também a área e o percurso necessário. Cinco locais do Templo do Espírito ainda aparecem como “Idade em conferência”; isso não significa que possam ser coletados nas duas idades. O guia confirma #54 como criança e #45 como adulto.

## Mapa panorâmico — versão 0.6

Arraste o mapa para explorar; use a roda do mouse ou os botões +/− para ampliar. Clique na faixa de uma região para abrir seu mapa local. Home enquadra o mapa; Esc volta ou fecha o painel; a tecla − retorna ao mapa mundi.

O menu lateral reúne filtros por categoria e coleta, busca de regiões, listas regionais e conexão do save. O campo discreto **Tempo de jogo** lê os segundos acumulados do campo PlayTime do save selecionado; ele acompanha as novas gravações, sem contar o tempo em que o site ficou aberto.

Os mapas de masmorras são visões gerais. Marcadores usam as coordenadas e câmeras do jogo; locais sobrepostos em andares diferentes podem se sobrepor. Dez baús sem região identificada continuam incluídos no contador global e no checklist. Porcentagens regionais consideram somente os registros do catálogo.

A antiga página de Skulltulas em grid foi substituída pelas listas dos mapas locais. Clique no ícone da Skulltula para filtrar os pendentes da região. Cada local associado ao guia mantém seu link para o trecho correspondente. “Abrir videoguia All Skulltulas” abre o vídeo completo em outra aba.

O breadcrumb fica dentro de Sua jornada, abaixo dos totais (coração, baú e Skulltula). Marcadores de Skulltulas com numeração verificada abrem um modal do YouTube no timestamp associado. Ao fechar, o player é removido e o mapa mantém a região. Locais sem associação continuam mostrando os detalhes locais.


Adicionar Savegame fica na parte inferior do drawer e abre um modal centralizado com as cores da página. Os atalhos antigos Minha jornada e Descobrir registros foram removidos. O painel Sua jornada usa raio de 15 px; os demais componentes mantêm 4 px.


## Missão do Burgo, guia de corações e sons de coleta

Os 12 baús do minigame de escolher baús no Burgo foram separados dos baús comuns. O atlas exibe 194 baús comuns; o parser continua validando os 206 registros originais antes de calcular essa apresentação. Missão Lentes da Verdade usa a flag própria de conclusão MiniGame_ChoiceTreasure_IsClear, associada à recompensa de coração. Não exige abrir os 12 baús, que incluem alternativas do minigame.

O videoguia de Heart Pieces é RZRYb4fZVds. Os 36 locais foram associados aos números e timestamps do vídeo, cruzando a wiki do autor com as flags, os alvos de baús e as coordenadas das âncoras do jogo. A idade indicada é a da coleta; algumas exigem preparação na outra idade. Não há seletor de capítulos no modal.

Sons de coleta usam os MP3 fornecidos pelo usuário, com volume de 18%. Só novas coletas detectadas na pasta monitorada geram som; abertura inicial, troca de slot/origem, cópias importadas, retorno a save anterior e leituras repetidas ficam silenciosas. A opção Sons de coleta no drawer silencia os efeitos. O navegador pode exigir uma interação com a página antes de permitir áudio.

A lista de regiões usa faixas ilustradas, degradê escuro e recortes nas bordas. Dez regiões têm cenas do jogo provenientes de capturas locais e do videoguia fornecido; as demais mantêm recortes do mapa ilustrado como fundo. Nenhum rastreamento de posição foi implementado nesta revisão.


Tipografia da lista: Almendra Regular (peso 400), distribuída localmente com a licença SIL Open Font License em assets/Almendra-OFL.txt. Fonte oficial: https://github.com/google/fonts/tree/main/ofl/almendra . O protótipo de localização offline é um aplicativo separado e não interfere no leitor principal.

Drawer: fundo #262014 com 99% de opacidade apenas no preenchimento, textos da paleta #dec685/#392a15 e bordas suavemente onduladas. O protótipo de localização separado usa somente cópias históricas e não foi integrado à sessão do emulador.

A abertura do drawer desce sem bounce; o fechamento tem uma leve antecipação e sobe. A preferência do sistema por movimento reduzido desativa as animações. Os filtros também controlam as regiões no mapa e na lista; etiquetas sem conflito permanecem visíveis mesmo com zoom afastado.

## Agradecimentos

Obrigado ao **100% Guides** pelos guias de localização usados na conferência dos coletáveis e na numeração dos videoguias deste projeto.

- [Canal 100% Guides](https://www.youtube.com/@100Guides)
- [Videoguia All 100 Gold Skulltulas](https://www.youtube.com/watch?v=TGBwn7e8oWA)
- [Videoguia All 36 Heart Pieces](https://www.youtube.com/watch?v=RZRYb4fZVds)
- [Wiki: todos os Heart Pieces](https://www.100pguides.com/guides/zelda-ocarina-of-time-remake-all-heart-pieces)

Os vídeos e o conteúdo do guia pertencem aos respectivos autores. Este projeto independente fornece links para o conteúdo original.

O drawer aberto também exibe Mapa mundi / região atual logo abaixo do título. O botão Mapa mundi volta sem recolher o menu.

## Mapas e assets nativos — revisão atual

- Os ícones de coleta, pendência, lojas, saídas e Navi foram extraídos da cópia local em C:\OcarinaRecomp. Pendentes usam arte transparente em opacidade total, sem quadrado nem check. Coletados usam a variante nativa com check e ficam esmaecidos.
- Itens próximos são separados visualmente, com uma linha até o ponto original. A separação é recalculada ao mudar o zoom para preservar áreas de clique independentes.
- Dez lojas e 55 conexões entre regiões são apenas indicações; não são botões e não entram nos contadores. Os nomes das saídas ficam fora do desenho do mapa.
- O drawer usa a textura nativa MenuBgC_00 com a paleta escura aprovada. A imagem da Navi em Por onde vamos? usa HUDNaviIcon_Body_00.
- Dez masmorras têm 35 camadas de andares e uma visão geral composta a partir das camadas Main/Back. O seletor à esquerda permite navegar entre elas. A lista e os totais continuam referentes à masmorra inteira; as posições por andar são aproximadas, baseadas nos recortes das camadas, sem confirmação de altura para cada item.
- Os 12 baús do interior do Castelo de Ganon não têm coordenadas confirmadas no mapa externo. O painel avisa essa limitação e mantém os itens na lista.

## Revisão de serviços e saídas

Os serviços agora usam o tipo numérico da âncora nativa, em vez de inferir somente pelo nome da flag. Loja de Bombchu, boliche, galeria de tiro e minigame dos baús têm ícones próprios. Há 35 serviços catalogados, exibidos conforme a era da textura do mapa; no Burgo criança aparecem sete. Saídas alternativas no mesmo ponto foram unificadas, priorizando a versão criança usada pelo mapa, corrigindo a sobreposição Castelo de Hyrule / Castelo de Ganon. Os marcadores de coletáveis também respeitam o espaço dos serviços.

Fotos das regiões: cobertura de 31/31 na lista. As novas cenas foram extraídas do videoguia de 100% Guides (https://www.youtube.com/watch?v=TGBwn7e8oWA); procedência em region-photo-sources.json. Checkboxes padronizados em 14px: marcado #fadf97 com check #402f17; desmarcado #1b170f.

