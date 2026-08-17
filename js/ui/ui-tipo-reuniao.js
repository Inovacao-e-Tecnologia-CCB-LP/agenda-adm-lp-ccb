/* =========================
   UI • TIPOS DE REUNIÃO
========================= */

function abrirTelaTiposReuniao() {
	setTitle('Tipos de Reunião');
	conteudo.innerHTML = Ui.PainelTipoReuniao();
	carregarTiposReuniao((firstTime = true));
}

/* =========================
   LISTAGEM
========================= */

async function carregarTiposReuniao(firstTime = false) {
	const lista = document.getElementById('listaTiposReuniao');

	travarUI();
	try {
		mostrarLoading('listaTiposReuniao');

		let tipos = firstTime ? dataStore.tiposReuniao : await tipoReuniaoService.listar();

		if (tipos?.error) {
			throw new Error(tipos.error);
		}

		tipos = tipos || [];
		dataStore.tiposReuniao = tipos;

		if (!tipos.length) {
			lista.innerHTML = `
        <div class="alert alert-secondary text-center">
          Nenhum tipo de reunião cadastrado
        </div>
      `;
			return;
		}

		tipos.sort((a, b) => a.descricao.localeCompare(b.descricao, 'pt-BR'));

		renderCardsTiposReuniao(tipos);
	} catch (err) {
		console.error(err);
		lista.innerHTML = `
      <div class="alert alert-danger text-center">
        Erro ao carregar tipos de reunião
      </div>
    `;
	} finally {
		liberarUI();
	}
}

function renderCardsTiposReuniao(tipos) {
	const lista = document.getElementById('listaTiposReuniao');

	let html = `<div class="d-flex flex-column gap-2">`;

	tipos.forEach((t) => {
		html += `
      <div class="render-item d-flex justify-content-between align-items-center p-2 border rounded">

        <div class="d-flex flex-column">
          <strong class="d-flex align-items-center gap-1">
            <i class="bi bi-people-fill"></i>
			<span class="ms-1">${t.descricao}</span>
          </strong>
        </div>

        <div class="d-flex gap-1">
          <button class="btn btn-sm btn-outline-primary editar-btn" onclick="editarTipoReuniao(${t.id}, this)">
            <i class="bi bi-pencil"></i>
            <span class="btn-text">Editar</span>
          </button>
          <button class="btn btn-sm btn-outline-danger excluir-btn" onclick="excluirTipoReuniao(${t.id}, this)">
            <i class="bi bi-trash"></i>
            <span class="btn-text">Excluir</span>
          </button>
        </div>

      </div>`;
	});

	html += `</div>`;
	lista.innerHTML = html;
}

async function reloadTiposReuniao() {
	mostrarLoading('listaTiposReuniao');
	carregarTiposReuniao();
}

/* =========================
   HELPERS DE FORMULÁRIO
========================= */

function montarPayloadTipoReuniao() {
	const id = document.getElementById('tipoReuniaoId').value;
	const descricao = document.getElementById('tipoReuniaoDescricao').value.trim();

	if (!descricao) {
		mostrarErroCampo('erroValidacaoCamposTipoReuniao', 'Informe a descrição do tipo de reunião');
		return null;
	}

	return { id: id ? Number(id) : null, descricao };
}

function preencherFormularioTipoReuniao(tipo) {
	document.getElementById('tipoReuniaoId').value = tipo.id ?? '';
	document.getElementById('tipoReuniaoDescricao').value = tipo.descricao ?? '';
}

function limparFormularioTipoReuniao() {
	document.getElementById('tipoReuniaoId').value = '';
	document.getElementById('tipoReuniaoDescricao').value = '';
}

/* =========================
   MODAL • NOVO
========================= */

function abrirModalNovoTipoReuniao() {
	limparErrosCamposTipoReuniao();
	limparFormularioTipoReuniao();

	document.getElementById('modalTipoReuniaoTitulo').innerText = 'Novo Tipo de Reunião';
	document.getElementById('btnSalvarTipoReuniao').onclick = salvarTipoReuniao;

	new bootstrap.Modal(document.getElementById('modalTipoReuniao')).show();
}

/* =========================
   SALVAR
========================= */

async function salvarTipoReuniao() {
	limparErrosCamposTipoReuniao();

	const btn = document.getElementById('btnSalvarTipoReuniao');
	const textoOriginal = btn.innerHTML;

	const payload = montarPayloadTipoReuniao();
	if (!payload) return;

	_travarModal('modalTipoReuniao');
	btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Salvando`;

	try {
		const signal = _getModalSignal('modalTipoReuniao');

		const r = payload.id
			? await tipoReuniaoService.atualizar(payload, senhaDigitada, signal)
			: await tipoReuniaoService.criar(payload, senhaDigitada, signal);

		if (signal.aborted) return;

		if (r?.error) {
			limparErrosCamposTipoReuniao();
			mostrarErroCampo('erroTipoReuniaoDescricao', r.error);
			return;
		}

		bootstrap.Modal.getInstance(document.getElementById('modalTipoReuniao')).hide();

		abrirModalAviso(
			'Sucesso',
			payload.id ? 'Tipo de reunião editado com sucesso' : 'Tipo de reunião criado com sucesso',
		);

		await reloadTiposReuniao();
	} catch (err) {
		if (err?.name === 'AbortError') return;
		console.error(err);
		abrirModalAviso('Erro', 'Erro ao salvar tipo de reunião');
	} finally {
		_liberarModal('modalTipoReuniao');
		btn.innerHTML = textoOriginal;
	}
}

/* =========================
   EDITAR
========================= */

async function editarTipoReuniao(id, btnEditar) {
	limparErrosCamposTipoReuniao();

	const textoOriginal = btnEditar.innerHTML;
	btnEditar.disabled = true;
	btnEditar.innerHTML = `<span class="spinner-border spinner-border-sm"></span>`;

	try {
		const tipos = await tipoReuniaoService.listar();
		const tipo = (tipos || []).find((i) => Number(i.id) === Number(id));

		if (!tipo) {
			abrirModalAviso('Erro', 'Tipo de reunião não encontrado');
			return;
		}

		preencherFormularioTipoReuniao(tipo);
		document.getElementById('modalTipoReuniaoTitulo').innerText = 'Editar Tipo de Reunião';
		document.getElementById('btnSalvarTipoReuniao').onclick = salvarTipoReuniao;

		new bootstrap.Modal(document.getElementById('modalTipoReuniao')).show();
	} catch (err) {
		console.error(err);
		abrirModalAviso('Erro', 'Erro ao carregar tipo de reunião');
	} finally {
		btnEditar.disabled = false;
		btnEditar.innerHTML = textoOriginal;
	}
}

/* =========================
   EXCLUIR
========================= */

function excluirTipoReuniao(id, btnTrash) {
	document.getElementById('confirmTitle').innerText = 'Excluir Tipo de Reunião';
	document.getElementById('confirmMessage').innerText = 'Deseja realmente excluir este tipo de reunião?';

	const btnOk = document.getElementById('confirmOk');
	btnOk.onclick = null;

	btnOk.onclick = async () => {
		const textoOk = btnOk.innerHTML;
		const textoTrash = btnTrash.innerHTML;

		_travarModal('confirmModal');
		try {
			btnOk.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Excluindo`;

			const signal = _getModalSignal('confirmModal');
			const r = await tipoReuniaoService.excluir(id, senhaDigitada, signal);

			if (signal.aborted) return;
			if (r?.error) {
				abrirModalAviso('Aviso', r.error);
				return;
			}

			abrirModalAviso('Sucesso', 'Tipo de reunião excluído com sucesso');
			await reloadTiposReuniao();
		} catch (err) {
			if (err?.name === 'AbortError') return;
			console.error(err);
			abrirModalAviso('Não foi possível excluir', err.message);
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

function limparErrosCamposTipoReuniao() {
	limparErroCampo('erroTipoReuniaoDescricao');
	limparErroCampo('erroValidacaoCamposTipoReuniao');
}
