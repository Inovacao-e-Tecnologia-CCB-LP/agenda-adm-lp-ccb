/* =========================
   UI • REGRAS DE DATAS
========================= */

async function abrirTelaRegrasDatas() {
	setTitle('Regras de Datas');
	conteudo.innerHTML = Ui.PainelRegrasDatas();
	carregarRegrasDatas((firstTime = true));
}

/* =========================
   LISTAGEM
========================= */
async function carregarRegrasDatas(firstTime = false) {
	const lista = document.getElementById('listaRegrasDatas');

	travarUI();
	try {
		mostrarLoading('listaRegrasDatas');

		const data = firstTime ? dataStore.regrasData : await regrasDatasService.listar();
		let regras = data || [];
		dataStore.regrasData = regras;

		if (!regras.length) {
			lista.innerHTML = `
        <div class="alert alert-secondary text-center">
          Nenhuma regra cadastrada
        </div>
      `;
			return;
		}

		// Ordenação: Local (A-Z) e depois Dia da Semana
		regras.sort((a, b) => {
			const localA = dataStore.locais.find((l) => l.id == a.local_id)?.nome || '';
			const localB = dataStore.locais.find((l) => l.id == b.local_id)?.nome || '';
			return localA.localeCompare(localB) || a.dia_semana - b.dia_semana;
		});

		renderCardsRegrasDatas(regras);
	} catch (err) {
		console.error(err);
		lista.innerHTML = `
      <div class="alert alert-danger text-center">
        Erro ao carregar regras
      </div>
    `;
	} finally {
		liberarUI();
	}
}

function renderTabelaRegrasDatas(regras) {
	renderCardsRegrasDatas(regras);
}

function renderCardsRegrasDatas(regras) {
	// Agrupar por local para visual mais limpo
	const porLocal = {};
	regras.forEach((r) => {
		const local = dataStore.locais.find((l) => l.id == r.local_id);
		const nomeLocal = local ? local.nome : 'Local excluído';
		if (!porLocal[nomeLocal]) porLocal[nomeLocal] = [];
		porLocal[nomeLocal].push(r);
	});

	let html = '<div class="d-flex flex-column gap-4">';

	Object.entries(porLocal).forEach(([nomeLocal, itens]) => {
		html += `
      <div class="grupo-secao">
        <div class="grupo-secao-header">
          <i class="bi bi-geo-alt-fill"></i>
          <span>${nomeLocal}</span>
          <span class="grupo-secao-count">Total: ${itens.length}</span>
        </div>
        <div class="d-flex flex-column gap-2">`;

		itens.forEach((r) => {
			const ativoEl = r.ativo
				? `<span class="status-dot status-dot-ok"></span>`
				: `<span class="status-dot status-dot-no"></span>`;

			html += `
          <div class="item-card">
            <div class="item-card-body">
              <div class="d-flex align-items-start justify-content-between gap-2 mb-2">
                <div class="d-flex align-items-center gap-2">
                  ${ativoEl}
                  	<span class="fw-semibold">
  					${dataStore.setores.find((s) => s.id == r.setor_id)?.nome || 'Setor'}
					</span>
                </div>
                <div class="d-flex gap-2 flex-shrink-0">
					<button class="btn btn-sm btn-outline-primary editar-btn" onclick="editarRegra(${r.id}, this)">
  						<i class="bi bi-pencil"></i>
  						<span class="btn-text">Editar</span>
					</button>

					<button class="btn btn-sm btn-outline-danger excluir-btn" onclick="excluirRegra(${r.id}, this)">
  						<i class="bi bi-trash"></i>
  						<span class="btn-text">Excluir</span>
					</button>
                </div>
              </div>
              <div class="card-info-grid">
                <div class="card-info-cell">
                  <i class="bi bi-calendar-week"></i>
                  <span>${formatarQuando(r.dia_semana, r.ordinal)}</span>
                </div>
                <div class="card-info-cell">
                  <i class="bi bi-clock"></i>
                  <span>${formatarHorario(r.horario)}</span>
                </div>
              </div>
            </div>
          </div>`;
		});

		html += '</div></div>';
	});

	html += '</div>';
	document.getElementById('listaRegrasDatas').innerHTML = html;
}

/* =========================
   HELPERS
========================= */

function montarPayloadRegra() {
	const id = document.getElementById('regraId').value;
	const localId = document.getElementById('regraLocal').value;
	const setorId = document.getElementById('regraSetor').value;
	const ordinal = document.getElementById('regraOrdinal').value;
	const dia = document.getElementById('regraDiaSemana').value;
	const horario = document.getElementById('regraHorario').value;
	const elObs = document.getElementById('regraObservacoes');
	const observacoes = elObs && elObs.offsetParent !== null ? elObs.value : null;
	const ativo = document.getElementById('regraAtivo').checked;

	if (!localId || !setorId || !horario) {
		mostrarErroCampo('erroValidacaoCamposRegra', 'Preencha todos os campos corretamente');
		return null;
	}

	return {
		id: id ? Number(id) : null,
		local_id: Number(localId),
		setor_id: Number(setorId),
		ordinal: Number(ordinal),
		dia_semana: Number(dia),
		horario: String(horario),
		observacoes: observacoes ? String(observacoes).trim() : null,
		ativo: ativo,
	};
}

function preencherFormularioRegra(regra) {
	document.getElementById('regraId').value = regra.id;
	document.getElementById('regraOrdinal').value = regra.ordinal;
	document.getElementById('regraDiaSemana').value = regra.dia_semana;
	document.getElementById('regraHorario').value = formatarHorario(regra.horario);
	document.getElementById('regraObservacoes').value = regra.observacoes || '';
	document.getElementById('regraAtivo').checked = regra.ativo;

	// LOCAL
	const selectLocal = document.getElementById('regraLocal');
	selectLocal.innerHTML = '<option value="">Selecione o local</option>';
	dataStore.locais.forEach((l) => {
		const opt = document.createElement('option');
		opt.value = l.id;
		opt.text = l.nome;
		if (Number(l.id) === Number(regra.local_id)) opt.selected = true;
		selectLocal.appendChild(opt);
	});

	// SETOR
	const selectSetor = document.getElementById('regraSetor');
	selectSetor.innerHTML = '<option value="">Selecione o setor</option>';
	dataStore.setores.forEach((s) => {
		const opt = document.createElement('option');
		opt.value = s.id;
		opt.text = s.nome;
		if (Number(s.id) === Number(regra.setor_id)) opt.selected = true;
		selectSetor.appendChild(opt);
	});
}

function formatarQuando(dia, ordinal) {
	const dias = ['', 'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
	const nomeDia = dias[dia] || 'Dia?';
	if (Number(ordinal) === 0) return `Todas(os): ${nomeDia}`;
	if (Number(ordinal) === -1) return `Última(o) ${nomeDia}`;
	return `${ordinal}ª ${nomeDia}`;
}

async function reloadRegras() {
	mostrarLoading('listaRegrasDatas');

	// Só atualiza regras
	await carregarRegrasDatas();

	// Atualiza agendamentos SOMENTE se o calendário existir
	if (document.getElementById('calendario')) {
		await carregarAgendamentos();
	}
}

function toggleObservacoes(show) {
	const el = document.getElementById('regraObservacoes')?.closest('.mb-3');
	if (el) el.style.display = show ? 'block' : 'none';
}

/* =========================
   MODAL • NOVO / EDITAR
========================= */

function abrirModalNovaRegra() {
	limparErroCampo('erroValidacaoCamposRegra');

	document.getElementById('modalRegraTitulo').innerText = 'Nova Regra';
	limparFormularioRegra();

	toggleObservacoes(true);

	// LOCAL
	const selectLocal = document.getElementById('regraLocal');
	selectLocal.innerHTML = '<option value="">Selecione o local</option>';
	dataStore.locais.forEach((l) => {
		const opt = document.createElement('option');
		opt.value = l.id;
		opt.text = l.nome;
		selectLocal.appendChild(opt);
	});

	// SETOR
	const selectSetor = document.getElementById('regraSetor');
	selectSetor.innerHTML = '<option value="">Selecione o setor</option>';
	dataStore.setores.forEach((s) => {
		const opt = document.createElement('option');
		opt.value = s.id;
		opt.text = s.nome;
		selectSetor.appendChild(opt);
	});

	document.getElementById('btnSalvarRegra').onclick = salvarRegra;
	new bootstrap.Modal(document.getElementById('modalRegra')).show();
}

function limparFormularioRegra() {
	document.getElementById('regraId').value = '';
	document.getElementById('regraLocal').value = '';
	document.getElementById('regraSetor').value = '';
	document.getElementById('regraOrdinal').value = '0';
	document.getElementById('regraDiaSemana').value = '1';
	document.getElementById('regraHorario').value = '';
	document.getElementById('regraObservacoes').value = '';
	document.getElementById('regraAtivo').checked = true;
}

/* =========================
   SALVAR
========================= */

async function salvarRegra() {
	limparErroCampo('erroValidacaoCamposRegra');

	const btn = document.getElementById('btnSalvarRegra');
	const textoOriginal = btn.innerHTML;

	const payload = montarPayloadRegra();
	if (!payload) return;

	_travarModal('modalRegra');
	btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Salvando`;

	try {
		const signal = _getModalSignal('modalRegra');

		let r;
		if (payload.id) {
			r = await regrasDatasService.atualizar(payload, senhaDigitada, signal);
		} else {
			r = await regrasDatasService.criar(payload, senhaDigitada, signal);
		}

		if (signal.aborted) return;

		if (r?.error) {
			mostrarErroCampo('erroValidacaoCamposRegra', r.error);
			return;
		}

		bootstrap.Modal.getInstance(document.getElementById('modalRegra')).hide();

		const msg = payload.id ? 'Regra editada com sucesso' : 'Regra criada com sucesso';
		abrirModalAviso('Sucesso', msg);
		await reloadRegras();
	} catch (err) {
		if (err?.name === 'AbortError') return;
		console.error(err);
		abrirModalAviso('Erro', 'Erro ao salvar regra');
	} finally {
		_liberarModal('modalRegra');
		btn.innerHTML = textoOriginal;
	}
}

/* =========================
   EDITAR
========================= */

async function editarRegra(id, btn) {
	limparErroCampo('erroValidacaoCamposRegra');

	let salvou = false;
	const textoOriginal = btn.innerHTML;

	try {
		btn.disabled = true;
		btn.innerHTML = `
      <span class="spinner-border spinner-border-sm"></span>
    `;

		const regras = await regrasDatasService.listar();
		const regra = (regras || []).find((r) => Number(r.id) === Number(id));

		if (!regra) {
			abrirModalAviso('Erro', 'Regra não encontrada');
			return;
		}

		limparFormularioRegra();
		preencherFormularioRegra(regra);

		toggleObservacoes(false);

		document.getElementById('modalRegraTitulo').innerText = 'Editar Regra';
		document.getElementById('btnSalvarRegra').onclick = async () => {
			salvou = true;
			await salvarRegra();
		};

		const modalEl = document.getElementById('modalRegra');
		const modal = new bootstrap.Modal(modalEl);

		modalEl.addEventListener(
			'hidden.bs.modal',
			() => {
				if (!salvou) {
					btn.disabled = false;
					btn.innerHTML = textoOriginal;
				}
			},
			{ once: true },
		);

		modal.show();
	} catch (err) {
		console.error(err);
		abrirModalAviso('Erro', 'Erro ao carregar regra');
	} finally {
		btn.disabled = false;
		btn.innerHTML = textoOriginal;
	}
}

/* =========================
   EXCLUIR
========================= */

function excluirRegra(id, btnTrash) {
	document.getElementById('confirmTitle').innerText = 'Excluir Regra';
	document.getElementById('confirmMessage').innerText = 'Deseja realmente excluir esta regra?';

	const btnOk = document.getElementById('confirmOk');

	btnOk.onclick = async () => {
		const textoOk = btnOk.innerHTML;
		const textoTrash = btnTrash.innerHTML;

		_travarModal('confirmModal');
		try {
			btnOk.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Excluindo`;

			const signal = _getModalSignal('confirmModal');
			const r = await regrasDatasService.excluir(id, senhaDigitada, signal);

			if (signal.aborted) return;
			if (r?.error) {
				abrirModalAviso('Aviso', r.error);
				return;
			}

			abrirModalAviso('Sucesso', 'Regra excluída com sucesso');
			await reloadRegras();
		} catch (err) {
			if (err?.name === 'AbortError') return;
			console.error(err);
			abrirModalAviso('Erro', 'Erro ao excluir regra');
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
   ESTADOS DE INTERFACE
========================= */

async function carregarAgendamentos() {
	try {
		let agendamentos = await agendamentosService.listar();

		if (agendamentos?.error) {
			throw new Error(agendamentos.error);
		}

		agendamentos = agendamentos || [];
		dataStore.agendamentos = agendamentos;
	} catch (err) {
		console.error(err);
	}
}
