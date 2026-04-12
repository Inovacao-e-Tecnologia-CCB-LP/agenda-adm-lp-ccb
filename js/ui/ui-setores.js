/* =========================
   UI • SETORES
========================= */

function abrirTelaSetores() {
	setTitle('Setores');
	conteudo.innerHTML = Ui.PainelSetores();
	carregarSetores((firstTime = true));
}

/* =========================
   LISTAGEM
========================= */

async function carregarSetores(firstTime = false) {
	const lista = document.getElementById('listaSetores');

	travarUI();
	try {
		mostrarLoading('listaSetores');

		let setores = firstTime ? dataStore.setores : await setoresService.listar();

		if (setores?.error) {
			throw new Error(setores.error);
		}

		setores = setores || [];
		dataStore.setores = setores;

		if (!setores.length) {
			lista.innerHTML = `
        <div class="alert alert-secondary text-center">
          Nenhum setor cadastrado
        </div>
      `;
			return;
		}

		// ORDENAÇÃO: tipo → alfabética
		setores.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

		renderCardsSetores(setores);
	} catch (err) {
		console.error(err);
		lista.innerHTML = `
      <div class="alert alert-danger text-center">
        Erro ao carregar setores
      </div>
    `;
	} finally {
		liberarUI();
	}
}

function renderTabelaSetores(setores) {
	renderCardsSetores(setores);
}

function renderCardsSetores(setores) {
	const lista = document.getElementById('listaSetores');

	let html = `<div class="d-flex flex-column gap-2">`;

	setores.forEach((s) => {
		html += `
      <div class="render-item d-flex justify-content-between align-items-center p-2 border rounded">

        <div class="d-flex flex-column">
          <strong class="d-flex align-items-center gap-1">
            <i class="bi bi-diagram-3-fill"></i>
			<span class="ms-1">${s.nome}</span>
          </strong>
        </div>

        <div class="d-flex gap-1">
          <button class="btn btn-sm btn-outline-primary editar-btn" onclick="editarSetor(${s.id}, this)">
            <i class="bi bi-pencil"></i>
            <span class="btn-text">Editar</span>
          </button>
          <button class="btn btn-sm btn-outline-danger excluir-btn" onclick="excluirSetor(${s.id}, this)">
            <i class="bi bi-trash"></i>
            <span class="btn-text">Excluir</span>
          </button>
        </div>

      </div>`;
	});

	html += `</div>`;
	lista.innerHTML = html;
}

async function reloadSetores() {
	mostrarLoading('listaSetores');
	carregarSetores();
}

/* =========================
   HELPERS DE FORMULÁRIO
========================= */

function montarPayloadSetor() {
	const id = document.getElementById('setorId').value;
	const nome = document.getElementById('setorNome').value.trim();

	if (!nome) {
		mostrarErroCampo('erroValidacaoCamposSetor', 'Informe o nome do setor');
		return null;
	}

	return { id: id ? Number(id) : null, nome };
}

function preencherFormularioSetor(setor) {
	document.getElementById('setorId').value = setor.id ?? '';
	document.getElementById('setorNome').value = setor.nome ?? '';
}

function limparFormularioSetor() {
	document.getElementById('setorId').value = '';
	document.getElementById('setorNome').value = '';
}

/* =========================
   MODAL • NOVO
========================= */

function abrirModalNovoSetor() {
	limparErrosCamposSetor();
	limparFormularioSetor();

	document.getElementById('modalSetorTitulo').innerText = 'Novo Setor';
	document.getElementById('btnSalvarSetor').onclick = salvarSetor;

	new bootstrap.Modal(document.getElementById('modalSetor')).show();
}

/* =========================
   SALVAR
========================= */

async function salvarSetor() {
	limparErrosCamposSetor();

	const btn = document.getElementById('btnSalvarSetor');
	const textoOriginal = btn.innerHTML;

	const payload = montarPayloadSetor();
	if (!payload) return;

	_travarModal('modalSetor');
	btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Salvando`;

	try {
		const signal = _getModalSignal('modalSetor');

		const r = payload.id
			? await setoresService.atualizar(payload, senhaDigitada, signal)
			: await setoresService.criar(payload, senhaDigitada, signal);

		if (signal.aborted) return;

		if (r?.error) {
			limparErrosCamposSetor();
			mostrarErroCampo('erroSetorNome', r.error);
			return;
		}

		bootstrap.Modal.getInstance(document.getElementById('modalSetor')).hide();

		abrirModalAviso(
			'Sucesso',
			payload.id ? 'Setor editado com sucesso' : 'Setor criado com sucesso',
		);

		await reloadSetores();
	} catch (err) {
		if (err?.name === 'AbortError') return;
		console.error(err);
		abrirModalAviso('Erro', 'Erro ao salvar setor');
	} finally {
		_liberarModal('modalSetor');
		btn.innerHTML = textoOriginal;
	}
}

/* =========================
   EDITAR
========================= */

async function editarSetor(id, btnEditar) {
	limparErrosCamposSetor();

	const textoOriginal = btnEditar.innerHTML;
	btnEditar.disabled = true;
	btnEditar.innerHTML = `<span class="spinner-border spinner-border-sm"></span>`;

	try {
		const setores = await setoresService.listar();
		const setor = (setores || []).find((i) => Number(i.id) === Number(id));

		if (!setor) {
			abrirModalAviso('Erro', 'Setor não encontrado');
			return;
		}

		preencherFormularioSetor(setor);
		document.getElementById('modalSetorTitulo').innerText = 'Editar Setor';
		document.getElementById('btnSalvarSetor').onclick = salvarSetor;

		new bootstrap.Modal(document.getElementById('modalSetor')).show();
	} catch (err) {
		console.error(err);
		abrirModalAviso('Erro', 'Erro ao carregar setor');
	} finally {
		btnEditar.disabled = false;
		btnEditar.innerHTML = textoOriginal;
	}
}

/* =========================
   EXCLUIR
========================= */

function excluirSetor(id, btnTrash) {
	document.getElementById('confirmTitle').innerText = 'Excluir Setor';
	document.getElementById('confirmMessage').innerText = 'Deseja realmente excluir este setor?';

	const btnOk = document.getElementById('confirmOk');
	btnOk.onclick = null;

	btnOk.onclick = async () => {
		const textoOk = btnOk.innerHTML;
		const textoTrash = btnTrash.innerHTML;

		_travarModal('confirmModal');
		try {
			btnOk.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Excluindo`;

			const signal = _getModalSignal('confirmModal');
			const r = await setoresService.excluir(id, senhaDigitada, signal);

			if (signal.aborted) return;
			if (r?.error) {
				abrirModalAviso('Aviso', r.error);
				return;
			}

			abrirModalAviso('Sucesso', 'Setor excluído com sucesso');
			await reloadSetores();
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

// Mantidos para compatibilidade com ui-locais.js (filtro de tipos)
function desabilitarBotaoSetores() {
	travarUI();
}
function habilitarBotaoSetores() {
	liberarUI();
}

function limparErrosCamposSetor() {
	limparErroCampo('erroSetorNome');
	limparErroCampo('erroValidacaoCamposSetor');
}
