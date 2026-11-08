# Jornada de Hyrule — 0.6

Tracker de save e progressão de itens para o emulador de **Ocarina of Time NS2** (Lichii).

A ideia é um projeto parecido com o Zelda Notes, só que feito para o emulador: você conecta o save e acompanha o que já coletou e o que ainda falta, com mapas e listas por região.

O programa roda localmente, não altera os saves do emulador e não envia arquivos a serviços externos.

## O que ele acompanha

- Skulltulas Douradas, pedaços de coração e baús
- Tempo de jogo, lido do save
- Mapa panorâmico e mapas locais por região, com filtros de coletados e pendentes
- Links para os videoguias do 100% Guides nos locais associados

## Abrir e conectar

1. Com Node.js 22 ou superior instalado, execute `Iniciar.cmd`. O navegador abre o aplicativo e o servidor continua em segundo plano. Execute `Encerrar.cmd` para encerrá-lo.
2. Em **Conectar save**, use **Escolher arquivos** para importar `progress.sav`, ZIP ou RAR, ou **Escolher pasta** para importar a pasta do jogo que contém os slots. Clique em **Importar save**. Para um save avulso, escolha o slot de destino.
3. Para acompanhar novas gravações automaticamente, conecte o caminho da pasta ativa do emulador. A importação copia os arquivos: é preciso reimportar depois de salvar novamente no jogo.
4. Ao monitorar uma pasta, **Mais recente (automático)** acompanha o arquivo gravado mais recentemente entre os seis slots. Também é possível fixar um slot específico.

## Importação e dados locais

Aceita até seis `progress.sav` de 8 MB cada, ou um ZIP/RAR de até 32 MB. A pasta selecionada ignora arquivos `caption.sav`, `option.sav` e demais arquivos. ZIP/RAR utiliza o `tar` do Windows; se um formato não for compatível, extraia e importe a pasta. Não há dependências npm.

A pasta `dados` guarda configurações, cópias importadas, referências de comparação, endereço do servidor e log. **Não a compartilhe**: ela contém dados do seu save e está no `.gitignore`.

Saves modificados ou de outra revisão do jogo podem não ser compatíveis.

## Aviso

Projeto independente e sem fins lucrativos, sem vínculo com a Nintendo, o Zelda Notes ou o Lichii. Imagens, ícones e sons do jogo pertencem aos seus respectivos detentores.

## Agradecimentos

Obrigado ao **100% Guides** pelos guias de localização usados na conferência dos coletáveis e na numeração dos videoguias deste projeto.

- [Canal 100% Guides](https://www.youtube.com/@100Guides)
- [Videoguia All 100 Gold Skulltulas](https://www.youtube.com/watch?v=TGBwn7e8oWA)
- [Videoguia All 36 Heart Pieces](https://www.youtube.com/watch?v=RZRYb4fZVds)
- [Wiki: todos os Heart Pieces](https://www.100pguides.com/guides/zelda-ocarina-of-time-remake-all-heart-pieces)

Os vídeos e o conteúdo do guia pertencem aos respectivos autores. Este projeto fornece links para o conteúdo original.

Tipografia: Almendra Regular, distribuída localmente sob a licença SIL Open Font License (`assets/Almendra-OFL.txt`).
