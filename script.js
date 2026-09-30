/**
 * CalculaNota - Lógica do Aplicativo
 * 
 * Funcionalidades:
 * - Identificação do Aluno(a) e nome da Matéria
 * - 4 notas bimestrais com média aritmética: (N1 + N2 + N3 + N4) / 4
 * - Média de aprovação: 5,0 (maior ou igual a 5,0 é Aprovado)
 * - Mensagens motivacionais personalizadas por faixa de nota
 * - Persistência automática no localStorage para aluno e matérias
 * - Mensagem destacada informando se o aluno PASSOU DE ANO, está de RECUPERAÇÃO ou foi REPROVADO DE ANO
 *   * 0 matérias com nota vermelha: Passou de ano! 🎉
 *   * Até 2 matérias com nota vermelha (duas ou menos): Recuperação! 📚
 *   * 3 ou mais matérias diferentes com nota vermelha: Reprovado de ano! ❌
 * - Painel de controle do ano letivo com acompanhamento completo
 */

document.addEventListener('DOMContentLoaded', () => {
  // Chaves do LocalStorage
  const STORAGE_KEY = 'calculanota_materias_salvas';
  const STORAGE_ALUNO_KEY = 'calculanota_aluno_nome';

  // Elementos do Formulário
  const formNotas = document.getElementById('form-notas');
  const btnLimpar = document.getElementById('btn-limpar');
  const inputAluno = document.getElementById('aluno-nome');
  const inputMateria = document.getElementById('materia-nome');
  const inputNota1 = document.getElementById('nota1');
  const inputNota2 = document.getElementById('nota2');
  const inputNota3 = document.getElementById('nota3');
  const inputNota4 = document.getElementById('nota4');
  const inputsNotas = [inputNota1, inputNota2, inputNota3, inputNota4];

  // Elementos de Alerta
  const mensagemAlerta = document.getElementById('mensagem-alerta');
  const mensagemTexto = document.getElementById('mensagem-texto');

  // Elementos da Área de Resultado Atual
  const areaResultado = document.getElementById('area-resultado');
  const resultCard = document.getElementById('result-card');
  const resultIconWrapper = document.getElementById('result-icon-wrapper');
  const resultadoAlunoBadge = document.getElementById('resultado-aluno-badge');
  const resultadoMateriaBadge = document.getElementById('resultado-materia-badge');
  const valorMedia = document.getElementById('valor-media');
  const textoSituacao = document.getElementById('texto-situacao');
  const mensagemPersonalizada = document.getElementById('mensagem-personalizada');

  // Elementos do Painel do Ano Letivo
  const materiasContainer = document.getElementById('materias-container');
  const emptyState = document.getElementById('empty-state');
  const totalMateriasEl = document.getElementById('total-materias');
  const totalAprovadasEl = document.getElementById('total-aprovadas');
  const totalReprovadasEl = document.getElementById('total-reprovadas');
  const statusAnoTextoEl = document.getElementById('status-ano-texto');
  const btnLimparTodas = document.getElementById('btn-limpar-todas');

  // Elementos do Banner de Situação no Ano (Passou, Recuperação ou Reprovou)
  const bannerResultadoAno = document.getElementById('banner-resultado-ano');
  const yearOutcomeIcon = document.getElementById('year-outcome-icon');
  const yearOutcomeTitle = document.getElementById('year-outcome-title');
  const yearOutcomeDesc = document.getElementById('year-outcome-desc');

  // Ícones SVG
  const iconeAprovado = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  `;

  const iconeReprovado = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  `;

  const iconeTrofeu = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16"/>
      <path d="M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v1h10v-1c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34"/>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
    </svg>
  `;

  const iconeAtencao = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  `;

  const iconeLivroRecuperacao = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      <line x1="9" y1="7" x2="15" y2="7"/>
      <line x1="9" y1="11" x2="13" y2="11"/>
    </svg>
  `;

  // Estado das matérias salvas
  let materiasSalvas = [];

  /**
   * Converte valor textual para float tratando vírgula e formato estrito
   * @param {string} valor 
   * @returns {number}
   */
  function parsearNota(valor) {
    if (typeof valor !== 'string') return NaN;
    const limpo = valor.trim();
    if (!/^\d+([.,]\d+)?$/.test(limpo)) {
      return NaN;
    }
    const sanitizado = limpo.replace(',', '.');
    return parseFloat(sanitizado);
  }

  /**
   * Retorna mensagem personalizada conforme a faixa de média do estudante
   * Critério ajustado: aprovação a partir de 5,0
   * @param {number} media 
   * @returns {string}
   */
  function obterMensagemPersonalizada(media) {
    if (media >= 9.0) {
      return 'Excelente resultado! Continue assim!';
    } else if (media >= 7.0) {
      return 'Muito bom! Continue estudando!';
    } else if (media >= 5.0) {
      return 'Você foi aprovado, mas pode melhorar.';
    } else {
      return 'Você precisa estudar mais para alcançar a média.';
    }
  }

  /**
   * Exibe mensagem de alerta no formulário
   * @param {string} mensagem 
   * @param {boolean} isDanger 
   */
  function mostrarAlerta(mensagem, isDanger = false) {
    mensagemTexto.textContent = mensagem;
    mensagemAlerta.classList.remove('hidden');
    if (isDanger) {
      mensagemAlerta.classList.add('danger-style');
    } else {
      mensagemAlerta.classList.remove('danger-style');
    }
  }

  /**
   * Oculta alerta geral e limpa estilos de erro nos campos
   */
  function limparAlertasEErros() {
    mensagemAlerta.classList.add('hidden');
    mensagemTexto.textContent = '';
    
    [inputAluno, inputMateria, ...inputsNotas].forEach(input => {
      const group = input.closest('.form-group');
      const errorSmall = group ? group.querySelector('.field-error') : null;
      if (group) group.classList.remove('has-error');
      if (errorSmall) errorSmall.textContent = '';
    });
  }

  /**
   * Marca erro em um campo específico
   * @param {HTMLInputElement} input 
   * @param {string} mensagem 
   */
  function marcarErroCampo(input, mensagem) {
    const group = input.closest('.form-group');
    const errorSmall = group ? group.querySelector('.field-error') : null;
    if (group) group.classList.add('has-error');
    if (errorSmall) errorSmall.textContent = mensagem;
  }

  /**
   * Valida os campos do formulário (Aluno + Matéria + 4 Notas)
   * @returns {{ valida: boolean, aluno?: string, materia?: string, valores?: number[] }}
   */
  function validarFormulario() {
    limparAlertasEErros();

    const nomeAluno = inputAluno.value.trim();
    const nomeMateria = inputMateria.value.trim();
    let temErro = false;

    // 1. Validar nome do aluno
    if (nomeAluno === '') {
      marcarErroCampo(inputAluno, 'Informe o nome do aluno(a)');
      mostrarAlerta('Por favor, informe o nome do aluno, a matéria e todas as notas.');
      temErro = true;
    }

    // 2. Validar nome da matéria
    if (nomeMateria === '') {
      marcarErroCampo(inputMateria, 'Informe o nome da matéria');
      if (!temErro) {
        mostrarAlerta('Por favor, informe o nome da matéria e todas as notas.');
      }
      temErro = true;
    }

    // 3. Verificar campos de notas vazios
    let algumVazio = false;
    inputsNotas.forEach(input => {
      const valStr = input.value.trim();
      if (valStr === '') {
        algumVazio = true;
        marcarErroCampo(input, 'Preencha este campo');
      }
    });

    if (algumVazio) {
      mostrarAlerta('Todas as notas precisam ser preenchidas.', false);
      return { valida: false };
    }

    if (temErro) {
      return { valida: false };
    }

    // 4. Verificar intervalo de 0 a 10 e se são números válidos
    let algumForaDoIntervalo = false;
    const valores = [];

    inputsNotas.forEach(input => {
      const valNum = parsearNota(input.value);

      if (isNaN(valNum) || valNum < 0 || valNum > 10) {
        algumForaDoIntervalo = true;
        marcarErroCampo(input, 'Nota entre 0 e 10');
      } else {
        valores.push(valNum);
      }
    });

    if (algumForaDoIntervalo) {
      mostrarAlerta('A nota deve estar entre 0 e 10.', true);
      return { valida: false };
    }

    return { valida: true, aluno: nomeAluno, materia: nomeMateria, valores };
  }

  /**
   * Carrega os dados salvos do localStorage
   */
  function carregarDadosSalvos() {
    // Restaurar nome do aluno se existir
    try {
      const alunoSalvo = localStorage.getItem(STORAGE_ALUNO_KEY);
      if (alunoSalvo) {
        inputAluno.value = alunoSalvo;
      }
    } catch (e) {
      console.error('Erro ao ler nome do aluno do localStorage:', e);
    }

    // Restaurar matérias
    try {
      const dadosSalvos = localStorage.getItem(STORAGE_KEY);
      if (dadosSalvos) {
        materiasSalvas = JSON.parse(dadosSalvos);
      } else {
        materiasSalvas = [];
      }
    } catch (e) {
      console.error('Erro ao ler matérias do localStorage:', e);
      materiasSalvas = [];
    }

    renderizarPainel();
  }

  /**
   * Salva o estado das matérias no localStorage
   */
  function persistirMaterias() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(materiasSalvas));
    } catch (e) {
      console.error('Erro ao salvar no localStorage:', e);
    }
  }

  /**
   * Salva o nome do aluno no localStorage
   */
  function persistirAluno(nome) {
    try {
      localStorage.setItem(STORAGE_ALUNO_KEY, nome);
    } catch (e) {
      console.error('Erro ao salvar nome do aluno:', e);
    }
  }

  /**
   * Renderiza a lista de matérias, o resumo e a mensagem de Passou / Recuperação / Reprovou de ano
   */
  function renderizarPainel() {
    const total = materiasSalvas.length;
    const aprovadas = materiasSalvas.filter(m => m.isAprovado).length;

    // Obter matérias diferentes/únicas com nota vermelha (abaixo de 5,0)
    const mapaVermelhas = new Map();
    materiasSalvas.filter(m => !m.isAprovado).forEach(m => {
      const nomeFormatado = m.nome.trim();
      const chave = nomeFormatado.toLowerCase();
      if (!mapaVermelhas.has(chave)) {
        mapaVermelhas.set(chave, nomeFormatado);
      }
    });

    const nomesVermelhas = Array.from(mapaVermelhas.values());
    const qtdMateriasVermelhas = nomesVermelhas.length;

    totalMateriasEl.textContent = total.toString();
    totalAprovadasEl.textContent = aprovadas.toString();
    totalReprovadasEl.textContent = qtdMateriasVermelhas.toString();

    // Nome atual do aluno para exibição nas mensagens
    const nomeAlunoAtual = inputAluno.value.trim() || 
                           (materiasSalvas[0] ? materiasSalvas[0].aluno : '') || 
                           'Estudante';

    // 1. Atualizar indicador de resumo e banner de situação no ano
    statusAnoTextoEl.className = 'metric-status-text';
    const cardStatusAno = document.getElementById('card-status-ano');
    if (cardStatusAno) {
      cardStatusAno.classList.remove('status-ano-passou', 'status-ano-recuperacao', 'status-ano-reprovado');
    }

    if (total === 0) {
      statusAnoTextoEl.textContent = 'Aguardando matérias';
      bannerResultadoAno.classList.add('hidden');
    } else if (qtdMateriasVermelhas === 0) {
      statusAnoTextoEl.textContent = 'Passando de ano! 🎉';
      statusAnoTextoEl.classList.add('status-passando');
      if (cardStatusAno) cardStatusAno.classList.add('status-ano-passou');

      // Banner Celebrativo de Passou de Ano
      bannerResultadoAno.classList.remove('hidden', 'recuperacao', 'reprovou');
      bannerResultadoAno.classList.add('passou');
      yearOutcomeIcon.innerHTML = iconeTrofeu;
      yearOutcomeTitle.textContent = `🎉 Parabéns, ${escapeHtml(nomeAlunoAtual)}! Você PASSOU DE ANO!`;
      yearOutcomeDesc.textContent = `Você foi aprovado(a) em todas as ${total} matéria(s) cadastradas com média igual ou superior a 5,0!`;
    } else if (qtdMateriasVermelhas <= 2) {
      const textoPlural = qtdMateriasVermelhas === 1 ? '1 matéria' : '2 matérias';
      const nomesTexto = nomesVermelhas.join(' e ');
      statusAnoTextoEl.textContent = `Recuperação (${textoPlural})`;
      statusAnoTextoEl.classList.add('status-recuperacao');
      if (cardStatusAno) cardStatusAno.classList.add('status-ano-recuperacao');

      // Banner de Recuperação (1 ou 2 matérias com nota vermelha)
      bannerResultadoAno.classList.remove('hidden', 'passou', 'reprovou');
      bannerResultadoAno.classList.add('recuperacao');
      yearOutcomeIcon.innerHTML = iconeLivroRecuperacao;
      yearOutcomeTitle.textContent = `📚 Atenção, ${escapeHtml(nomeAlunoAtual)}: Você está de RECUPERAÇÃO!`;
      yearOutcomeDesc.textContent = `Você ficou com nota vermelha em ${textoPlural} (${escapeHtml(nomesTexto)}). Como são duas ou menos matérias, você tem o direito de fazer a prova de recuperação para passar de ano!`;
    } else {
      const textoNomes = nomesVermelhas.length > 2 
        ? nomesVermelhas.slice(0, -1).join(', ') + ' e ' + nomesVermelhas[nomesVermelhas.length - 1]
        : nomesVermelhas.join(' e ');

      statusAnoTextoEl.textContent = `Reprovado de ano (${qtdMateriasVermelhas} matérias)`;
      statusAnoTextoEl.classList.add('status-reprovado');
      if (cardStatusAno) cardStatusAno.classList.add('status-ano-reprovado');

      // Banner de Reprovação no Ano (3 ou mais matérias com nota vermelha)
      bannerResultadoAno.classList.remove('hidden', 'passou', 'recuperacao');
      bannerResultadoAno.classList.add('reprovou');
      yearOutcomeIcon.innerHTML = iconeAtencao;
      yearOutcomeTitle.textContent = `❌ Atenção, ${escapeHtml(nomeAlunoAtual)}: Você foi REPROVADO DE ANO!`;
      yearOutcomeDesc.textContent = `Você ficou com nota vermelha em ${qtdMateriasVermelhas} matérias diferentes (${escapeHtml(textoNomes)}). O regulamento permite recuperação em no máximo 2 matérias; por estar com nota vermelha em 3 ou mais matérias diferentes, você não atingiu os requisitos para passar de ano.`;
    }

    // Botão Limpar Tudo visível apenas se houver matérias
    if (total > 0) {
      btnLimparTodas.classList.remove('hidden');
    } else {
      btnLimparTodas.classList.add('hidden');
    }

    // 2. Renderizar lista de cards individuais de matérias
    materiasContainer.innerHTML = '';

    if (total === 0) {
      materiasContainer.appendChild(emptyState);
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');

    materiasSalvas.forEach((materia) => {
      const card = document.createElement('article');
      card.className = `materia-item-card ${materia.isAprovado ? 'aprovado' : 'reprovado'}`;

      const statusBadgeTexto = materia.isAprovado ? 'Aprovado' : 'Reprovado';
      const statusBadgeClasse = materia.isAprovado ? 'aprovado' : 'reprovado';

      card.innerHTML = `
        <div class="materia-main-info">
          <div class="materia-title-row">
            <h3 class="materia-name">${escapeHtml(materia.nome)}</h3>
            <span class="materia-status-badge ${statusBadgeClasse}">${statusBadgeTexto}</span>
          </div>
          <div class="materia-grades-chips">
            <span class="grade-chip">N1: <strong>${materia.notas[0].toFixed(1).replace('.', ',')}</strong></span>
            <span class="grade-chip">N2: <strong>${materia.notas[1].toFixed(1).replace('.', ',')}</strong></span>
            <span class="grade-chip">N3: <strong>${materia.notas[2].toFixed(1).replace('.', ',')}</strong></span>
            <span class="grade-chip">N4: <strong>${materia.notas[3].toFixed(1).replace('.', ',')}</strong></span>
          </div>
        </div>
        <div class="materia-side-action">
          <div class="materia-score-box">
            <span class="materia-score-label">Média</span>
            <span class="materia-score-val">${materia.mediaFormatada}</span>
          </div>
          <button type="button" class="btn-delete-materia" data-id="${materia.id}" title="Excluir matéria ${escapeHtml(materia.nome)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M3 6h18"/>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
          </button>
        </div>
      `;

      // Event listener para exclusão unitária
      const btnExcluir = card.querySelector('.btn-delete-materia');
      btnExcluir.addEventListener('click', () => {
        excluirMateria(materia.id);
      });

      materiasContainer.appendChild(card);
    });
  }

  /**
   * Sanitiza strings contra injeção de HTML
   * @param {string} str 
   * @returns {string}
   */
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Exclui matéria específica por ID
   * @param {string} id 
   */
  function excluirMateria(id) {
    materiasSalvas = materiasSalvas.filter(m => m.id !== id);
    persistirMaterias();
    renderizarPainel();
  }

  /**
   * Limpa todas as matérias salvas mediante confirmação
   */
  function limparTodasMaterias() {
    if (materiasSalvas.length === 0) return;
    const confirmou = window.confirm('Deseja realmente apagar todas as matérias salvas do seu histórico?');
    if (confirmou) {
      materiasSalvas = [];
      persistirMaterias();
      renderizarPainel();
    }
  }

  /**
   * Processa o cálculo com média 5,0, atualiza o resultado e salva no histórico
   */
  function processarCalculoESalvar() {
    const validacao = validarFormulario();

    if (!validacao.valida) {
      areaResultado.classList.add('hidden');
      return;
    }

    const [n1, n2, n3, n4] = validacao.valores;
    // Cálculo da média aritmética com 4 notas
    const media = (n1 + n2 + n3 + n4) / 4;

    const mediaArredondada = Number(media.toFixed(2));
    const mediaFormatada = mediaArredondada.toFixed(2).replace('.', ',');
    valorMedia.textContent = mediaFormatada;

    // Regra Atualizada: Média igual ou maior que 5,0 é Aprovado
    const isAprovado = mediaArredondada >= 5.0;

    // Exibir nome do aluno e matéria no resultado
    resultadoAlunoBadge.textContent = validacao.aluno;
    resultadoMateriaBadge.textContent = validacao.materia;

    // Mensagem motivacional personalizada pela faixa
    mensagemPersonalizada.textContent = obterMensagemPersonalizada(mediaArredondada);

    // Resetar classes anteriores do card
    resultCard.classList.remove('aprovado', 'reprovado', 'animate-show');

    if (isAprovado) {
      resultCard.classList.add('aprovado');
      resultIconWrapper.innerHTML = iconeAprovado;
      textoSituacao.textContent = 'Aprovado!';
    } else {
      resultCard.classList.add('reprovado');
      resultIconWrapper.innerHTML = iconeReprovado;
      textoSituacao.textContent = 'Reprovado. Continue estudando!';
    }

    // Exibir área de resultado e disparar animação suave
    areaResultado.classList.remove('hidden');
    void resultCard.offsetWidth;
    resultCard.classList.add('animate-show');

    // Salvar nome do aluno
    persistirAluno(validacao.aluno);

    // Verificar se já existe matéria com o mesmo nome para atualizar ou adicionar nova
    const indexExistente = materiasSalvas.findIndex(
      m => m.nome.trim().toLowerCase() === validacao.materia.toLowerCase()
    );

    const novaMateria = {
      id: indexExistente >= 0 ? materiasSalvas[indexExistente].id : Date.now().toString(),
      aluno: validacao.aluno,
      nome: validacao.materia,
      notas: [n1, n2, n3, n4],
      media: mediaArredondada,
      mediaFormatada: mediaFormatada,
      isAprovado: isAprovado,
      dataCriacao: new Date().toLocaleDateString('pt-BR')
    };

    if (indexExistente >= 0) {
      materiasSalvas.splice(indexExistente, 1);
    }
    materiasSalvas.unshift(novaMateria);
    persistirMaterias();
    renderizarPainel();

    // Rolar suavemente até o resultado
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /**
   * Limpa os campos de notas e matéria, preservando o nome do aluno para conveniência
   */
  function limparFormulario() {
    inputMateria.value = '';
    inputsNotas.forEach(input => {
      input.value = '';
    });

    limparAlertasEErros();

    // Ocultar área de resultado atual
    mensagemPersonalizada.textContent = '';
    areaResultado.classList.add('hidden');
    resultCard.classList.remove('aprovado', 'reprovado', 'animate-show');

    // Focar no campo de matéria
    inputMateria.focus();
  }

  // Event Listeners
  formNotas.addEventListener('submit', (event) => {
    event.preventDefault();
    processarCalculoESalvar();
  });

  btnLimpar.addEventListener('click', () => {
    limparFormulario();
  });

  btnLimparTodas.addEventListener('click', () => {
    limparTodasMaterias();
  });

  // Atualizar dinamicamente o nome no banner caso o usuário edite o campo
  inputAluno.addEventListener('input', () => {
    persistirAluno(inputAluno.value.trim());
    if (materiasSalvas.length > 0) {
      renderizarPainel();
    }
  });

  // Limpar aviso de erro do campo ao digitar
  [inputAluno, inputMateria, ...inputsNotas].forEach(input => {
    input.addEventListener('input', () => {
      const group = input.closest('.form-group');
      const errorSmall = group ? group.querySelector('.field-error') : null;
      if (group) group.classList.remove('has-error');
      if (errorSmall) errorSmall.textContent = '';
      
      const camposComErro = document.querySelectorAll('.form-group.has-error');
      if (camposComErro.length === 0) {
        mensagemAlerta.classList.add('hidden');
      }
    });
  });

  // Inicializar carregando dados
  carregarDadosSalvos();
});
