async function showEscolherLocal() {
	setTitle('Selecione o local');

	if (!dataStore.locais || dataStore.locais.length === 0) {
		conteudo.innerHTML = `
			<div class="alert alert-secondary text-center">
				Nenhum local encontrado
			</div>
		`;
		return;
	}

	conteudo.innerHTML = '';

	const g = document.createElement('div');
	g.className = 'grade-escolha';

	dataStore.locais.forEach((l) => {
		const btn = document.createElement('button');
		btn.className = 'btn btn-outline-dark';

		btn.innerHTML = `
        <div class="d-flex flex-column">
          <strong class="d-flex align-items-center gap-1">
            <i class="bi bi-geo-alt-fill"></i>
			<span class="ms-1">${l.nome}</span>
          </strong>

		<div class="mt-1">
			<small class="text-primary">
				${l.endereco || 'Endereço não informado'}
			</small>
		</div>
        </div>
		`;

		btn.onclick = () => selecionarLocal(l);
		g.appendChild(btn);
	});

	conteudo.appendChild(g);
}

function showEscolherData() {
	setTitle('Selecione a data');

	const agendamentosFiltrados = dataStore.agendamentos
		.filter((p) => p.local_id == escolha.local.id)
		.sort((a, b) => {
			const dataA = new Date(a.data);
			const dataB = new Date(b.data);

			if (dataA.getTime() !== dataB.getTime()) {
				return dataA - dataB;
			}

			return a.horario.localeCompare(b.horario);
		});

	if (agendamentosFiltrados.length === 0) {
		conteudo.innerHTML = `
			<div class="alert alert-secondary text-center">
				Nenhuma data disponível para este local
			</div>
		`;
		return;
	}

	const g = document.createElement('div');
	g.className = 'grade-escolha mb-4';

	const setoresMap = {};
	dataStore.setores.forEach((s) => (setoresMap[s.id] = s));

	agendamentosFiltrados.forEach((p) => {
		const btn = document.createElement('button');
		btn.className = 'btn btn-outline-dark';

		const setorNome = setoresMap[p.setor_id]?.nome || 'Setor';
		const icone = 'bi bi-calendar-event';

		// Observação (só aparece se existir)
		const obsHTML = p.observacoes
			? `<div class="mt-1">
					<small class="text-primary fw-semibold">
						Observações: ${p.observacoes}
					</small>
				</div>`
			: '';

		btn.innerHTML = `
			<i class="${icone}"></i>
			<span>
				<strong>Data: ${formatarData(p.data)} (${p.descricao})</strong>
				<div class="mt-1">
					<small class="text-muted">
						<strong>Horário: </strong>${formatarHorario(p.horario)}
					</small>
				</div>
				<div class="mt-1">
					<small class="text-muted">
						<strong>Setor: </strong>${setorNome}
					</small>
				</div>
				${obsHTML}
			</span>
		`;

		btn.onclick = () => selecionarData(p);
		g.appendChild(btn);
	});

	conteudo.innerHTML = '';
	conteudo.appendChild(g);
}

async function showConfirmar() {
	setTitle('Digite o nome');

	conteudo.innerHTML = Ui.ConfirmarPresenca();

	const nomeSalvo = localStorageService.buscarNome();

	if (nomeSalvo) {
		const cardSalvo = document.getElementById('nomeSalvoCard');
		const textoSalvo = document.getElementById('nomeSalvoTexto');
		const inputCard = document.getElementById('inputNomeCard');

		if (cardSalvo && textoSalvo) {
			textoSalvo.textContent = nomeSalvo;
			cardSalvo.classList.remove('d-none');
			inputCard.classList.add('d-none');
		}
	}
}

function usarNomeSalvo(btn) {
	const nomeSalvo = localStorageService.buscarNome();
	if (!nomeSalvo) return;

	const inputNome = document.getElementById('nome');
	if (inputNome) inputNome.value = nomeSalvo;

	salvarInscricao(btn || null);
}

function digitarNovoNome() {
	_confirmarModo = 'input';
	const cardSalvo = document.getElementById('nomeSalvoCard');
	const inputCard = document.getElementById('inputNomeCard');
	if (cardSalvo) cardSalvo.classList.add('d-none');
	if (inputCard) {
		inputCard.classList.remove('d-none');
		setTimeout(() => {
			const inputNome = document.getElementById('nome');
			if (inputNome) inputNome.focus();
		}, 100);
	}
}

async function salvarInscricao(btnEl) {
	const btn = btnEl || document.getElementById('btnConfirmar');

	let nome = '';
	const inputNome = document.getElementById('nome');
	if (inputNome) nome = inputNome.value.trim();

	if (!nome) {
		abrirModalAviso('Aviso', 'Informe o seu nome');
		return;
	}

	// Processamento padrão
	nome = localStorageService.capitalizarNome(nome);

	const nomeProcessado = await NomeCorrector.processar(nome);
	if (nomeProcessado === null) {
		if (inputNome) {
			inputNome.value = '';
			inputNome.focus();
		}
		return;
	}

	nome = nomeProcessado;
	localStorageService.salvarNome(nome);

	const originalHTML = btn ? btn.innerHTML : '';
	if (btn) {
		btn.disabled = true;
		btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Salvando...';
	}

	const payload = {
		local_id: escolha.local.id,
		agendamento_id: escolha.agendamentos.id,
		nome,
	};

	try {
		const r = await inscricoesService.criar(payload);

		if (r?.error) {
			abrirModalAviso('Aviso', r.error);
			return;
		}

		if (r?.id && r?.delete_token) {
			localStorageService.salvarAutorizacao(r.id, r.delete_token);
		}

		abrirModalAviso('Sucesso', 'Inscrição confirmada! Deus abençoe');
		resetAndGoHome();
	} catch (e) {
		console.error(e);
		abrirModalAviso('Erro', 'Erro ao salvar inscrição');
	} finally {
		if (btn) {
			btn.disabled = false;
			btn.innerHTML = originalHTML;
		}
	}
}

async function excluirInscricao(id, btn) {
	const auth = localStorageService.buscarAutorizacao(id);

	if (!auth) {
		abrirModalAviso('Erro', 'Você não tem permissão para excluir esta inscrição');
		return;
	}

	const confirmou = await abrirModalConfirmacao(
		'Deseja realmente excluir esta inscrição?',
		'Excluir',
	);
	if (!confirmou) return;

	const originalHTML = btn.innerHTML;
	const originalClass = btn.className;

	btn.disabled = true;
	btn.className = 'btn btn-sm btn-danger';
	btn.innerHTML = '<span class="spinner-border spinner-border-sm text-light"></span>';

	try {
		const r = await inscricoesService.excluir(id, auth.token);

		if (!r?.success) throw r;

		localStorageService.removerAutorizacao(id);
		abrirModalAviso('Sucesso', 'Inscrição excluída com sucesso');
		showInscritos();
	} catch (e) {
		console.error(e);
		abrirModalAviso('Erro', 'Erro ao excluir inscrição');
	} finally {
		btn.disabled = false;
		btn.innerHTML = originalHTML;
	}
}
