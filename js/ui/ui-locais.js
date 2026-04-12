/* =========================
   UI • LOCAIS
========================= */

async function abrirTelaLocais() {
	setTitle('Locais');
	conteudo.innerHTML = Ui.PainelLocais();
	carregarLocais((firstTime = true));
}

/* =========================
   LISTAGEM
========================= */

async function carregarLocais(firstTime = false) {
	const lista = document.getElementById('listaLocais');

	travarUI();
	try {
		mostrarLoading('listaLocais');

		let locais = firstTime ? dataStore.locais : await locaisService.listar();
		if (locais?.error) throw new Error(locais.error);

		locais = locais || [];
		dataStore.locais = locais;

		if (!locais.length) {
			lista.innerHTML = `<div class="alert alert-secondary text-center">Nenhum local cadastrado</div>`;
			return;
		}

		renderCardsLocais(locais);
	} catch (err) {
		console.error(err);
		lista.innerHTML = `<div class="alert alert-danger text-center">Erro ao carregar locais</div>`;
	} finally {
		liberarUI();
	}
}

function renderTabelaLocais(locais) {
	renderCardsLocais(locais);
}

function renderCardsLocais(locais) {
	let html = `<div class="d-flex flex-column gap-2">`;

	locais.forEach((l) => {
		html += `
      <div class="render-item d-flex justify-content-between align-items-center p-2 border rounded">

        <div class="d-flex flex-column">
          <strong class="d-flex align-items-center gap-1">
            <i class="bi bi-geo-alt-fill"></i>
			<span class="ms-1">${l.nome}</span>
          </strong>
          <small class="text-muted alinhar-texto-esquerda">
            ${l.endereco || 'Endereço não informado'}
          </small>
        </div>

        <div class="d-flex gap-1">
          <button class="btn btn-sm btn-outline-primary editar-btn" onclick="editarLocal(${l.id}, this)">
              	<i class="bi bi-pencil"></i>
  				<span class="btn-text">Editar</span>
          </button>
          <button class="btn btn-sm btn-outline-danger excluir-btn" onclick="excluirLocal(${l.id}, this)">
              	<i class="bi bi-trash"></i>
  				<span class="btn-text">Excluir</span>
          </button>
        </div>

      </div>`;
	});

	html += `</div>`;
	document.getElementById('listaLocais').innerHTML = html;
}

/* =========================
   HELPERS — PAYLOAD
========================= */

function montarPayloadLocal() {
	const id = document.getElementById('localId').value;
	const nome = document.getElementById('localNome').value.trim();
	const endereco = document.getElementById('localEndereco').value.trim();

	if (!nome || !endereco) {
		mostrarErroCampo('erroValidacaoCamposLocal', 'Nome e endereço são obrigatórios');
		return null;
	}

	return {
		id: id ? Number(id) : null,
		nome,
		endereco,
	};
}

function preencherFormularioLocal(local) {
	document.getElementById('localId').value = local.id;
	document.getElementById('localNome').value = local.nome;
	document.getElementById('localEndereco').value = local.endereco || '';
}

async function reloadLocais() {
	mostrarLoading('listaLocais');
	await carregarLocais();
}

/* =========================
   MODAL • NOVO / EDITAR
========================= */

function abrirModalNovoLocal() {
	limparErrosCamposLocal();
	document.getElementById('modalLocalTitulo').innerText = 'Novo Local';
	limparFormularioLocal();
	document.getElementById('btnSalvarLocal').onclick = salvarLocal;
	new bootstrap.Modal(document.getElementById('modalLocal')).show();
}

function limparFormularioLocal() {
	document.getElementById('localId').value = '';
	document.getElementById('localNome').value = '';
	document.getElementById('localEndereco').value = '';
}

/* =========================
   SALVAR
========================= */

async function salvarLocal() {
	limparErrosCamposLocal();

	const btn = document.getElementById('btnSalvarLocal');
	const textoOriginal = btn.innerHTML;
	const payload = montarPayloadLocal();

	if (!payload) return;

	_travarModal('modalLocal');
	btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Salvando`;

	try {
		const signal = _getModalSignal('modalLocal');

		let r;
		if (payload.id) {
			r = await locaisService.atualizar(payload, senhaDigitada, signal);
		} else {
			r = await locaisService.criar(payload, senhaDigitada, signal);
			// Atribui cor aleatória ao novo local imediatamente
			if (r && !r.error && r.id && typeof _getCorLocal === 'function') {
				_getCorLocal(r.id);
			}
		}

		if (signal.aborted) return;

		if (r?.error) {
			mostrarErroCampo('erroLocalNome', r.error);
			return;
		}

		bootstrap.Modal.getInstance(document.getElementById('modalLocal')).hide();
		abrirModalAviso(
			'Sucesso',
			payload.id ? 'Local editado com sucesso' : 'Local criado com sucesso',
		);
		await reloadLocais();
	} catch (err) {
		if (err?.name === 'AbortError') return;
		console.error(err);
		abrirModalAviso('Erro', 'Erro ao salvar local');
	} finally {
		_liberarModal('modalLocal');
		btn.innerHTML = textoOriginal;
	}
}

/* =========================
   EDITAR
========================= */

async function editarLocal(id, btn) {
	limparErrosCamposLocal();
	let salvou = false;
	const textoOriginal = btn.innerHTML;

	try {
		btn.disabled = true;
		btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span>`;

		const locais = await locaisService.listar();
		const local = (locais || []).find((l) => Number(l.id) === Number(id));

		if (!local) {
			abrirModalAviso('Erro', 'Local não encontrado');
			return;
		}

		preencherFormularioLocal(local);
		document.getElementById('modalLocalTitulo').innerText = 'Editar Local';
		document.getElementById('btnSalvarLocal').onclick = async () => {
			salvou = true;
			await salvarLocal();
		};

		const modalEl = document.getElementById('modalLocal');
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
		abrirModalAviso('Erro', 'Erro ao carregar local');
	} finally {
		btn.disabled = false;
		btn.innerHTML = textoOriginal;
	}
}

/* =========================
   EXCLUIR
========================= */

function excluirLocal(id, btnTrash) {
	document.getElementById('confirmTitle').innerText = 'Excluir Local';
	document.getElementById('confirmMessage').innerText = 'Deseja realmente excluir este local?';

	const btnOk = document.getElementById('confirmOk');
	btnOk.onclick = async () => {
		const textoOk = btnOk.innerHTML;
		const textoTrash = btnTrash.innerHTML;

		_travarModal('confirmModal');
		try {
			btnOk.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Excluindo`;

			const signal = _getModalSignal('confirmModal');
			const r = await locaisService.excluir(id, senhaDigitada, signal);

			if (signal.aborted) return;
			if (r?.error) {
				abrirModalAviso('Aviso', r.error);
				return;
			}

			abrirModalAviso('Sucesso', 'Local excluído com sucesso');
			await reloadLocais();
		} catch (err) {
			if (err?.name === 'AbortError') return;
			console.error(err);
			abrirModalAviso('Erro', 'Erro ao excluir local');
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

// Delegados ao sistema central travarUI/liberarUI
function desabilitarBotaoLocal() {
	travarUI();
}

function habilitarBotaoLocal() {
	liberarUI();
}

function limparErrosCamposLocal() {
	limparErroCampo('erroLocalNome');
	limparErroCampo('erroValidacaoCamposLocal');
}
