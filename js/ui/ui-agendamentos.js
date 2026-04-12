/* =========================
   UI • AGENDAMENTOS
========================= */

let _calMeses = [];
let _calIdx = 0;
let _calDados = [];
let _calModoSomenteLeitura = false;

/* =========================
   PALETA DE CORES DO CALENDÁRIO
========================= */

const _CAL_PALETA = [
	// Azul
	{
		bg: '#e3f2fd',
		border: '#1565c0',
		dot: '#1565c0',
		text: '#0d47a1',
		bgCard: '#eef6fd',
	},

	// Verde
	{
		bg: '#e8f5e9',
		border: '#2e7d32',
		dot: '#2e7d32',
		text: '#1b5e20',
		bgCard: '#f1fbf2',
	},

	// Roxo
	{
		bg: '#f3e5f5',
		border: '#7b1fa2',
		dot: '#7b1fa2',
		text: '#4a148c',
		bgCard: '#faf0fc',
	},

	// Laranja
	{
		bg: '#fff3e0',
		border: '#ef6c00',
		dot: '#ef6c00',
		text: '#e65100',
		bgCard: '#fff8f2',
	},

	// Amarelo
	{
		bg: '#fff8e1',
		border: '#fbc02d',
		dot: '#fbc02d',
		text: '#e65100',
		bgCard: '#fffdf4',
	},

	// Ciano
	{
		bg: '#e0f7fa',
		border: '#00838f',
		dot: '#00838f',
		text: '#006064',
		bgCard: '#f0fcfd',
	},

	// Marrom
	{
		bg: '#efebe9',
		border: '#6d4c41',
		dot: '#6d4c41',
		text: '#3e2723',
		bgCard: '#f7f4f2',
	},

	// Cinza
	{
		bg: '#eceff1',
		border: '#455a64',
		dot: '#455a64',
		text: '#263238',
		bgCard: '#f4f6f7',
	},

	// Rosa
	{
		bg: '#fce4ec',
		border: '#d81b60',
		dot: '#d81b60',
		text: '#880e4f',
		bgCard: '#fff0f5',
	},

	// Verde oliva
	{
		bg: '#f1f8e9',
		border: '#827717',
		dot: '#827717',
		text: '#4e342e',
		bgCard: '#f9fbf4',
	},
];

let _calCoresLocais = {};

function _carregarCoresSalvas() {
	try {
		const raw = localStorage.getItem('agenda_cores_locais');
		if (raw) _calCoresLocais = JSON.parse(raw);
	} catch {
		_calCoresLocais = {};
	}
}

function _salvarCores() {
	try {
		localStorage.setItem('agenda_cores_locais', JSON.stringify(_calCoresLocais));
	} catch {}
}

function _getCorLocal(localId) {
	const key = String(localId);

	if (!_calCoresLocais[key]) {
		const index = _hashId(localId) % _CAL_PALETA.length;

		_calCoresLocais[key] = {
			..._CAL_PALETA[index],
		};

		_salvarCores();
	}

	return _calCoresLocais[key];
}

/* =========================
   ABRIR TELA AGENDAMENTOS
========================= */
async function abrirTelaAgendamentos() {
	_calModoSomenteLeitura = false;
	setTitle('Agendamentos');
	conteudo.innerHTML = Ui.PainelAgendamentos();
	carregarAgendamentos(true);
}

async function abrirTelaCalendarioPublico() {
	setTitle('Calendário');
	conteudo.innerHTML = Ui.PainelAgendamentos();
	_calModoSomenteLeitura = true;
	await carregarAgendamentos(true);
	const btnNova = document.getElementById('novoAgendamentoBtn');
	if (btnNova) btnNova.remove();
}

/* =========================
   LISTAGEM
========================= */
async function carregarAgendamentos(firstTime = false) {
	const btnNova = document.getElementById('novoAgendamentoBtn');
	if (btnNova) btnNova.style.display = 'none';
	travarUI();
	try {
		mostrarLoading('listaAgendamentos');

		let agendamentos = firstTime ? dataStore.agendamentos : await agendamentosService.listar();

		if (agendamentos?.error) throw new Error(agendamentos.error);

		if (_calModoSomenteLeitura) {
			dataStore.inscricoes = await inscricoesService.listar();
		}

		agendamentos = agendamentos || [];
		dataStore.agendamentos = agendamentos;
		_calDados = agendamentos;

		if (!agendamentos.length) {
			document.getElementById('listaAgendamentos').innerHTML = `
        <div class="alert alert-secondary text-center mt-3">
          Nenhum agendamento cadastrado
        </div>`;
			return;
		}

		_carregarCoresSalvas();
		// Garante que todos os locais conhecidos tenham cor atribuída
		(dataStore.locais || []).forEach((l) => _getCorLocal(l.id));
		agendamentos.forEach((p) => _getCorLocal(p.local_id));

		_construirMeses(agendamentos);
		_calIdx = 0;
		_renderCalendario();
	} catch (err) {
		console.error(err);
		document.getElementById('listaAgendamentos').innerHTML = `
      <div class="alert alert-danger text-center mt-3">
        Erro ao carregar agendamentos
      </div>`;
	} finally {
		liberarUI();

		const btnNova = document.getElementById('novoAgendamentoBtn');
		if (btnNova && !_calModoSomenteLeitura) {
			btnNova.style.display = '';
		}
	}
}

function _construirMeses(agendamentos) {
	const map = new Map();
	agendamentos.forEach((p) => {
		if (!p.data) return;
		const d = _parseDataAgendamento(p.data);
		const key = `${d.getFullYear()}-${d.getMonth()}`;
		if (!map.has(key)) map.set(key, { ano: d.getFullYear(), mes: d.getMonth() });
	});
	_calMeses = Array.from(map.values()).sort((a, b) =>
		a.ano !== b.ano ? a.ano - b.ano : a.mes - b.mes,
	);
}

/* =========================
    RENDERS
========================= */
function _renderCalendario() {
	const container = document.getElementById('listaAgendamentos');
	if (!_calMeses.length) return;

	const { ano, mes } = _calMeses[_calIdx];
	const temAnterior = _calIdx > 0;
	const temProximo = _calIdx < _calMeses.length - 1;

	const pgMes = _calDados.filter((p) => _eventoEhDoMes(p, ano, mes));

	const porDia = {};
	pgMes.forEach((p) => {
		const dia = parseInt(p.data.split('-')[2], 10);
		if (!porDia[dia]) porDia[dia] = [];
		porDia[dia].push(p);
	});

	const nomeMes = new Date(ano, mes, 1).toLocaleDateString('pt-BR', {
		month: 'long',
		year: 'numeric',
	});

	container.innerHTML = `
    <div class="cal-wrapper">

      <div class="cal-nav">
        <button class="cal-nav-btn" ${!temAnterior ? 'disabled' : ''} onclick="_calNavegar(-1)">
          <i class="bi bi-chevron-left"></i>
        </button>
        <div class="cal-mes-titulo">
          <span class="cal-mes-nome">${_capitalizar(nomeMes)}</span>
          <span class="cal-mes-badge">${pgMes.length} evento${pgMes.length !== 1 ? 's' : ''}</span>
        </div>
        <button class="cal-nav-btn" ${!temProximo ? 'disabled' : ''} onclick="_calNavegar(1)">
          <i class="bi bi-chevron-right"></i>
        </button>
      </div>

      ${_renderMiniNav()}

      <div class="cal-grid-wrapper" id="calGridWrapper">
        ${_renderGrade(ano, mes, porDia)}
      </div>

      ${_renderLegenda()}

      ${_calModoSomenteLeitura ? _renderAcoesPublico() : ''}

    </div>
  `;
}

function _renderGrade(ano, mes, porDia) {
	const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
	const primeiroDia = new Date(ano, mes, 1).getDay();
	const totalDias = new Date(ano, mes + 1, 0).getDate();
	const hoje = new Date();
	const ehHoje = (d) =>
		hoje.getFullYear() === ano && hoje.getMonth() === mes && hoje.getDate() === d;

	let html = `<div class="cal-grid">`;

	diasSemana.forEach((d, i) => {
		const fds = i === 0 || i === 6 ? 'cal-fds' : '';
		html += `<div class="cal-header-dia ${fds}">${d}</div>`;
	});

	for (let i = 0; i < primeiroDia; i++) {
		html += `<div class="cal-cell cal-vazia"></div>`;
	}

	for (let dia = 1; dia <= totalDias; dia++) {
		const eventos = porDia[dia] || [];
		const temEvento = eventos.length > 0;
		const diaSemana = (primeiroDia + dia - 1) % 7;
		const fds = diaSemana === 0 || diaSemana === 6 ? 'cal-fds' : '';
		const hojeClass = ehHoje(dia) ? 'cal-hoje' : '';
		let cursor = '';

		if (temEvento) {
			cursor = 'cal-clicavel';
		} else if (!_calModoSomenteLeitura) {
			cursor = 'cal-clicavel';
		}

		// Cor da célula: cor do primeiro local do dia;
		// se tiver múltiplos locais distintos, fundo neutro
		let estiloCelula = '';
		if (temEvento) {
			const locaisUnicos = [...new Set(eventos.map((e) => e.local_id))];
			if (locaisUnicos.length === 1) {
				const cor = _getCorLocal(locaisUnicos[0]);
				estiloCelula = `background:${cor.bg}; border-color:${cor.border};`;
			} else {
				estiloCelula = `background:#f8f9fa; border-color:#6c757d;`;
			}
		}

		// Pílulas: bolinhas no mobile, barras com nome no desktop
		let pilulasHtml = '';

		if (temEvento) {
			const MAX = 3;

			eventos.slice(0, MAX).forEach((ev) => {
				const cor = _getCorLocal(ev.local_id);
				const local = _getLocalById(ev.local_id);
				const nome = local?.nome || 'Local';
				const horario = ev.horario ? formatarHorario(ev.horario) : '-';
				const setorObj = _getSetorById(ev.setor_id);
				const setor = setorObj?.nome || '-';

				if (_calModoSomenteLeitura) {
					// Público
					pilulasHtml += `
    <div class="cal-ev-publico-wrapper">
      <span class="cal-ev-pill"
        style="background:${cor.dot}">
      </span>

      <div class="cal-ev-publico">
        <div class="cal-ev-nome">${nome}</div>
        <div class="cal-ev-info">
          ${horario} - ${setor}
        </div>
      </div>
    </div>
  `;
				} else {
					// Admin
					pilulasHtml += `
        <span class="cal-ev-pill"
          style="background:${cor.dot}"
          data-nome="${nome}">
        </span>
      `;
				}
			});

			if (eventos.length > MAX) {
				pilulasHtml += `<span class="cal-ev-mais">+${eventos.length - MAX}</span>`;
			}
		}

		const enc = encodeURIComponent(JSON.stringify(eventos)).replace(/'/g, '%27');
		let click = '';

		if (temEvento) {
			click = `onclick="_abrirDetalhesDia(${dia}, decodeURIComponent('${enc}'))"`;
		} else if (!_calModoSomenteLeitura) {
			click = `onclick="_novoAgendamentoDoCalendario(${dia})"`;
		}

		html += `
      <div class="cal-cell ${fds} ${hojeClass} ${temEvento ? 'cal-tem-evento' : ''} ${cursor}"
        style="${estiloCelula}" ${click}>
        <span class="cal-num">${dia}</span>
        <div class="cal-ev-pills">${pilulasHtml}</div>
      </div>`;
	}

	html += `</div>`;
	return html;
}

function _renderLegenda() {
	// Pega apenas os locais que têm agendamento no mês atual
	const { ano, mes } = _calMeses[_calIdx];
	const locaisNoMes = new Set(
		_calDados.filter((p) => _eventoEhDoMes(p, ano, mes)).map((p) => p.local_id),
	);

	if (!locaisNoMes.size) return '';

	const items = Array.from(locaisNoMes)
		.map((localId) => {
			const local = _getLocalById(localId);
			const cor = _getCorLocal(localId);
			const nome = local?.nome || `Local ${localId}`;
			return `<span class="cal-leg-item">
      <span class="cal-leg-dot" style="background:${cor.dot}"></span>${nome}
    </span>`;
		})
		.join('');

	return `<div class="cal-legenda">${items}</div>`;
}

function _renderMiniNav() {
	if (_calMeses.length <= 1) return '';
	const pills = _calMeses
		.map((m, i) => {
			const nome = new Date(m.ano, m.mes, 1).toLocaleDateString('pt-BR', {
				month: 'short',
			});
			const ativo = i === _calIdx ? 'cal-pill-ativo' : '';
			return `<button class="cal-pill ${ativo}" onclick="_calIrPara(${i})">${_capitalizar(nome)}</button>`;
		})
		.join('');
	return `<div class="cal-pills">${pills}</div>`;
}

function _renderAcoesPublico() {
	return `
    <div class="mt-4 cal-acoes-publico no-print">
      <div class="d-flex flex-column flex-md-row gap-2 justify-content-md-end">

        <button class="btn btn-primary w-100 w-md-auto"
          onclick="_baixarImagemCalendario()">
          <i class="bi bi-image me-1"></i>
          Gerar imagem
        </button>

        <button class="btn btn-secondary w-100 w-md-auto"
          onclick="_baixarPdfCalendario()">
          <i class="bi bi-file-earmark-pdf me-1"></i>
          Gerar PDF
        </button>

        <button class="btn btn-success w-100 w-md-auto"
          onclick="_compartilharWhatsapp()">
          <i class="bi bi-whatsapp me-1"></i>
          Compartilhar
        </button>

      </div>
    </div>
  `;
}

/* =========================
    NAVEGAÇÃO
========================= */
function _calNavegar(delta) {
	const novo = _calIdx + delta;
	if (novo < 0 || novo >= _calMeses.length) return;
	_calIdx = novo;
	_renderCalendario();
	_animarCalendario(delta);
}

function _calIrPara(idx) {
	if (idx === _calIdx) return;
	const delta = idx > _calIdx ? 1 : -1;
	_calIdx = idx;
	_renderCalendario();
	_animarCalendario(delta);
}

/* =========================
   AÇÕES NO CALENDÁRIO
========================= */
function _novoAgendamentoDoCalendario(dia) {
	const { ano, mes } = _calMeses[_calIdx];

	// Monta data no formato yyyy-MM-dd
	const dataSelecionada = new Date(ano, mes, dia);
	const dataStr = dataSelecionada.toISOString().split('T')[0];

	_abrirModalAgendamentos(); // abre como NOVO

	// Pequeno delay para garantir que modal já abriu
	setTimeout(() => {
		const inputData = document.getElementById('progData');
		inputData.value = dataStr;
		_atualizarDiaSemanaAgendamento();
	}, 50);
}

function _editarDoCalendario(id) {
	const p = _calDados.find((x) => Number(x.id) === Number(id));
	if (!p) return;

	_fecharModalEExecutar('modalCalDetalhe', () => {
		_abrirModalAgendamentos(p);
	});
}

function _excluirDoCalendario(id, btn) {
	_fecharModalEExecutar('modalCalDetalhe', () => {
		excluirAgendamento(id, btn);
	});
}

function _abrirDetalhesDia(dia, eventosJson) {
	const eventos = JSON.parse(eventosJson);
	const { ano, mes } = _calMeses[_calIdx];

	const dataFmt = new Date(ano, mes, dia).toLocaleDateString('pt-BR', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	});

	const cards = eventos
		.map((p) => {
			const inscricoes = _calModoSomenteLeitura ? _getInscricoesPorAgendamento(p.id) : [];

			const local = _getLocalById(p.local_id);
			const setorObj = _getSetorById(p.setor_id);
			const setor = setorObj?.nome || '-';
			const cor = _getCorLocal(p.local_id);

			// ===== INSCRIÇÕES =====
			const inscricoesHtml = _calModoSomenteLeitura
				? inscricoes.length
					? `
<div class="cal-det-row align-items-start mt-2" style="color:${cor.text}; border-top:1px solid ${cor.border}55;">
	<div class="w-100 mt-2">
		<i class="bi bi-people-fill mt-1" style="color:${cor.dot}"></i>
		<span class="fw-semibold">Inscrições</span>
		<ul class="list-unstyled mb-0">
			${inscricoes
				.map(
					(i) => `
<li class="d-flex justify-content-between py-1">
	<span> • ${i.nome} | Confirmada em: ${formatarData(i.data)}</span>
</li>
`,
				)
				.join('')}
		</ul>
	</div>
</div>
`
					: `
<div class="cal-det-row">
	<i class="bi bi-people" style="color:${cor.dot}"></i>
	<span class="text-muted">Nenhuma inscrição</span>
</div>
`
				: '';

			return `
      <div class="cal-det-card" style="background:${cor.bgCard}; border:1.5px solid ${cor.border};">
        <div class="cal-det-tipo" style="color:${cor.text}; border-bottom:1px solid ${cor.border}55;">
          <span class="cal-det-local-dot" style="background:${cor.dot}"></span>
          <strong>${local?.nome || 'Local não identificado'}</strong>
        </div>

        <!-- INFOS -->
        <div class="cal-det-infos">

          <!-- ENDEREÇO -->
          <div class="cal-det-row">
            <p class="cal-link-mapa copy-text mb-0"
              data-localid="${p.local_id}"
              title="Copiar endereço e abrir mapa"
              style="cursor:pointer;">
              <i class="bi bi-geo-alt-fill me-1" style="color:${cor.dot}"></i>
              ${local?.endereco ?? 'Endereço não informado'}
            </p>
          </div>

          <!-- HORÁRIO -->
          <div class="cal-det-row">
            <i class="bi bi-clock-fill" style="color:${cor.dot}"></i>
            <span>${formatarHorario(p.horario) || '-'}</span>
          </div>

          <!-- SETOR -->
          <div class="cal-det-row">
            <i class="bi bi-diagram-3" style="color:${cor.dot}"></i>
            <span>${setor}</span>
          </div>

          <!-- OBSERVAÇÕES -->
          ${
				p.observacoes
					? `
<div class="cal-det-row align-items-start">
	<i class="bi bi-chat-left-text mt-1" style="color:${cor.dot}"></i>
		<span>${p.observacoes}</span>
</div>
`
					: ''
			}

          <!-- INSCRIÇÕES -->
          ${inscricoesHtml}

        </div>

        ${
			!_calModoSomenteLeitura
				? `
        <button class="btn btn-outline-primary btn-sm w-100 mt-2"
          onclick="_editarDoCalendario(${p.id})">
          <i class="bi bi-pencil me-1"></i>Editar
        </button>

        <button class="btn btn-outline-danger btn-sm w-100 mt-3"
          onclick="_excluirDoCalendario(${p.id}, this)">
          <i class="bi bi-trash me-1"></i>Excluir
        </button>
        `
				: ''
		}

      </div>`;
		})
		.join('');

	const botaoNovo = !_calModoSomenteLeitura
		? `
  <div class="text-center mt-3">
    <button class="btn btn-dark btn-sm w-100 mt-2"
      onclick="_novoAgendamentoDoDetalhe(${dia})">
      <i class="bi bi-plus-circle"></i>
      Novo Agendamento
    </button>
  </div>`
		: '';

	const eventosHtml = cards + botaoNovo;

	document.getElementById('calDetData').innerHTML = `${_capitalizar(dataFmt)}`;
	document.getElementById('calDetBody').innerHTML = eventosHtml;

	const modal = new bootstrap.Modal(document.getElementById('modalCalDetalhe'));
	modal.show();

	// EVENTO MAPA
	document.querySelectorAll('.cal-link-mapa').forEach((el) => {
		el.addEventListener('click', function () {
			const localId = this.dataset.localid;
			const localObj = _getLocalById(localId);

			if (localObj?.endereco) {
				navigator.clipboard.writeText(localObj.endereco);
			}

			abrirModalMapa(localId);
		});
	});

	setTimeout(() => {
		document.activeElement?.blur();
	}, 100);
}

function _novoAgendamentoDoDetalhe(dia) {
	_fecharModalEExecutar('modalCalDetalhe', () => {
		_novoAgendamentoDoCalendario(dia);
	});
}

async function _baixarImagemCalendario() {
	const elemento = document.querySelector('.cal-wrapper');

	elemento.classList.add('exportando');

	const canvas = await _capturarCalendario();

	elemento.classList.remove('exportando');

	const link = document.createElement('a');
	link.download = 'calendarioMensalAgendaADM.png';
	link.href = canvas.toDataURL('image/png');
	link.click();
}

async function _baixarPdfCalendario() {
	const elemento = document.querySelector('.cal-wrapper');

	elemento.classList.add('exportando');

	const canvas = await _capturarCalendario();

	elemento.classList.remove('exportando');

	const imgData = canvas.toDataURL('image/png');

	const { jsPDF } = window.jspdf;
	const pdf = new jsPDF('p', 'mm', 'a4');

	const largura = 210;
	const altura = (canvas.height * largura) / canvas.width;

	pdf.addImage(imgData, 'PNG', 0, 10, largura, altura);
	pdf.save('calendarioMensalAgendaADM.pdf');
}

function _compartilharWhatsapp() {
	if (!_calMeses.length) return;

	const { ano, mes } = _calMeses[_calIdx];

	const nomeMes = new Date(ano, mes, 1).toLocaleDateString('pt-BR', {
		month: 'long',
		year: 'numeric',
	});

	const mensagem = `Agenda de ${_capitalizar(nomeMes)} da Administração (Lençóis Paulista)`;

	const url = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;

	window.open(url, '_blank');
}

/* =========================
   ABRIR MODAL NOVO AGENDAMENTO
========================= */
function _abrirModalAgendamentos(agendamentos = null) {
	limparErroCampo('erroValidacaoCamposAgendamento');

	const selectLocal = document.getElementById('progLocal');
	const selectSetor = document.getElementById('progSetor');
	const btnSalvar = document.getElementById('btnSalvarAgendamento');

	btnSalvar.onclick = salvarAgendamento;

	// ===== POPULA LOCAIS =====
	selectLocal.innerHTML = '<option value="">Selecione o local</option>';
	(dataStore.locais || []).forEach((l) => {
		const opt = document.createElement('option');
		opt.value = l.id;
		opt.text = l.nome;
		selectLocal.appendChild(opt);
	});

	// ===== POPULA SETORES =====
	selectSetor.innerHTML = '<option value="">Selecione o setor</option>';
	(dataStore.setores || []).forEach((s) => {
		const opt = document.createElement('option');
		opt.value = s.id;
		opt.text = s.nome;
		selectSetor.appendChild(opt);
	});

	const inputData = document.getElementById('progData');
	const hoje = new Date();
	const hojeStr = hoje.toISOString().split('T')[0];

	// ===== LIMPA CAMPOS =====
	document.getElementById('progId').value = '';
	document.getElementById('progLocal').value = '';
	document.getElementById('progSetor').value = '';
	inputData.value = '';
	document.getElementById('progDiaSemana').value = '';
	document.getElementById('progHorario').value = '';
	document.getElementById('progObs').value = '';

	if (agendamentos) {
		// ===== EDITAR =====
		document.getElementById('progModalTitulo').innerText = 'Editar Agendamento';

		document.getElementById('progId').value = agendamentos.id ?? '';
		document.getElementById('progLocal').value = agendamentos.local_id ?? '';
		document.getElementById('progSetor').value = agendamentos.setor_id ?? '';

		inputData.value = agendamentos.data || '';

		document.getElementById('progHorario').value = (agendamentos.horario || '').replace(
			"'",
			'',
		);

		document.getElementById('progObs').value = agendamentos.observacoes ?? '';

		inputData.setAttribute('min', hojeStr);
	} else {
		// ===== NOVO =====
		document.getElementById('progModalTitulo').innerText = 'Nova Agendamento';

		inputData.value = hojeStr;
		inputData.setAttribute('min', hojeStr);
	}

	_atualizarDiaSemanaAgendamento();

	inputData.removeEventListener('change', _atualizarDiaSemanaAgendamento);
	inputData.addEventListener('change', _atualizarDiaSemanaAgendamento);

	new bootstrap.Modal(document.getElementById('modalAgendamentos')).show();
}

/* =========================
   SALVAR
========================= */
async function salvarAgendamento() {
	limparErroCampo('erroValidacaoCamposAgendamento');

	const btn = document.getElementById('btnSalvarAgendamento');
	const textoOriginal = btn.innerHTML;

	const payload = montarPayloadAgendamento();
	if (!payload) return;

	_travarModal('modalAgendamentos');
	btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Salvando`;

	try {
		const signal = _getModalSignal('modalAgendamentos');

		let r;

		if (payload.id) {
			r = await agendamentosService.editar(payload, senhaDigitada, signal);
		} else {
			r = await agendamentosService.criar(payload, senhaDigitada, signal);
		}

		if (signal.aborted) return;

		if (r?.error) {
			mostrarErroCampo('erroValidacaoCamposAgendamento', r.error);
			return;
		}

		bootstrap.Modal.getInstance(document.getElementById('modalAgendamentos')).hide();

		abrirModalAviso(
			'Sucesso',
			payload.id ? 'Agendamento editado com sucesso' : 'Agendamento criado com sucesso',
		);

		await carregarAgendamentos();
	} catch (err) {
		if (err?.name === 'AbortError') return;

		console.error(err);
		abrirModalAviso('Erro', 'Erro ao salvar agendamento');
	} finally {
		_liberarModal('modalAgendamentos');
		btn.innerHTML = textoOriginal;
	}
}

/* =========================
   EXCLUIR
========================= */
function excluirAgendamento(id, btnTrash) {
	document.getElementById('confirmTitle').innerText = 'Excluir Agendamento';
	document.getElementById('confirmMessage').innerText =
		'Deseja realmente excluir este agendamento?';

	const btnOk = document.getElementById('confirmOk');
	btnOk.onclick = async () => {
		const textoOk = btnOk.innerHTML;
		const textoTrash = btnTrash.innerHTML;
		_travarModal('confirmModal');
		try {
			btnOk.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Excluindo`;
			const signal = _getModalSignal('confirmModal');
			const r = await agendamentosService.excluir(id, senhaDigitada, signal);
			if (signal.aborted) return;
			if (r?.error) {
				abrirModalAviso('Aviso', r.error);
				return;
			}
			abrirModalAviso('Sucesso', 'Agendamento excluído com sucesso');
			await carregarAgendamentos();
		} catch (err) {
			if (err?.name === 'AbortError') return;
			abrirModalAviso('Erro', 'Erro ao excluir agendamento');
		} finally {
			_liberarModal('confirmModal');
			btnOk.innerHTML = textoOk;
			btnTrash.innerHTML = textoTrash;
			bootstrap.Modal.getInstance(document.getElementById('confirmModal')).hide();
		}
	};
	new bootstrap.Modal(document.getElementById('confirmModal')).show();
}

/* =========================
   HELPERS
========================= */
function montarPayloadAgendamento() {
	const id = document.getElementById('progId').value;
	const local_id = document.getElementById('progLocal').value;
	const setor_id = document.getElementById('progSetor').value;
	const descricao = document.getElementById('progDiaSemana').value;
	const data = document.getElementById('progData').value;
	const horario = document.getElementById('progHorario').value;
	const observacoes = document.getElementById('progObs').value;

	if (!local_id || !setor_id || !data || !horario) {
		mostrarErroCampo('erroValidacaoCamposAgendamento', 'Preencha todos os campos corretamente');

		return null;
	}

	const hoje = new Date();
	hoje.setHours(0, 0, 0, 0);

	const dataSelecionada = new Date(data + 'T00:00:00');

	if (dataSelecionada < hoje) {
		mostrarErroCampo(
			'erroValidacaoCamposAgendamento',
			'Não é permitido cadastrar agendamento em data anterior à atual',
		);
		return null;
	}

	return {
		id: id ? Number(id) : null,
		local_id: Number(local_id),
		setor_id: Number(setor_id),
		descricao,
		data_agendamento: data,
		horario,
		observacoes,
	};
}

function _atualizarDiaSemanaAgendamento() {
	const data = document.getElementById('progData').value;
	const inputDia = document.getElementById('progDiaSemana');

	if (!data) {
		inputDia.value = '';
		return;
	}

	const d = new Date(data + 'T00:00:00');
	const dias = [
		'Domingo',
		'Segunda-feira',
		'Terça-feira',
		'Quarta-feira',
		'Quinta-feira',
		'Sexta-feira',
		'Sábado',
	];

	inputDia.value = dias[d.getDay()];
}

function _animarCalendario(delta) {
	requestAnimationFrame(() => {
		const w = document.getElementById('calGridWrapper');
		if (!w) return;

		const classe = delta > 0 ? 'cal-anim-esq' : 'cal-anim-dir';
		w.classList.add(classe);
		setTimeout(() => w.classList.remove('cal-anim-esq', 'cal-anim-dir'), 380);
	});
}

function _eventoEhDoMes(p, ano, mes) {
	if (!p.data) return false;
	const d = _parseDataAgendamento(p.data);
	return d.getFullYear() === ano && d.getMonth() === mes;
}

function _getLocalById(id) {
	return (dataStore.locais || []).find((l) => String(l.id) === String(id));
}

function _fecharModalEExecutar(modalId, callback) {
	const el = document.getElementById(modalId);
	if (!el) return callback();
	const modal = bootstrap.Modal.getInstance(el);
	if (modal) modal.hide();

	el.addEventListener(
		'hidden.bs.modal',
		function once() {
			el.removeEventListener('hidden.bs.modal', once);
			callback();
		},
		{ once: true },
	);
}

function _parseDataAgendamento(data) {
	return new Date(data + 'T12:00:00');
}

async function _capturarCalendario() {
	const elemento = document.querySelector('.cal-wrapper');

	elemento.classList.add('exportando');

	const canvas = await html2canvas(elemento, {
		scale: 2,
		backgroundColor: '#ffffff',
		ignoreElements: (el) => el.classList?.contains('no-print'),
	});

	elemento.classList.remove('exportando');
	return canvas;
}

function _hashId(id) {
	let hash = 0;
	const str = String(id);

	for (let i = 0; i < str.length; i++) {
		hash = (hash << 5) - hash + str.charCodeAt(i);
		hash |= 0; // força 32 bits
	}

	return Math.abs(hash);
}

function _getSetorById(id) {
	return (dataStore.setores || []).find((s) => String(s.id) === String(id));
}

function _getInscricoesPorAgendamento(agendamentoId) {
	return (dataStore.inscricoes || []).filter(
		(i) => String(i.agendamento_id) === String(agendamentoId),
	);
}
