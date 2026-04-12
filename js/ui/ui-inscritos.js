let estruturaInscritos = {};

/* =========================
   LISTAGEM
========================= */

function renderAccordionInscritos(grupos) {
	const { locaisMap, agendamentosMap, setoresMap } = estruturaInscritos;

	let html = '<div class="accordion" id="accordionInscritos">';
	let index = 0;

	Object.entries(grupos).forEach(([local, agendamentos]) => {
		const pidsValidos = Object.keys(agendamentos).filter((pid) => agendamentosMap[pid]);

		if (pidsValidos.length === 0) {
			console.warn('Nenhum agendamento válido nesse grupo:', local);
			return;
		}

		const currentIndex = index;
		const pRef = agendamentosMap[pidsValidos[0]];
		if (!pRef) return;

		const localObj = locaisMap[pRef.local_id];

		if (!localObj) {
			console.warn('Local não encontrado:', pRef.local_id);
		}

		html += `
      <div class="accordion-item border-dark">

        <h2 class="accordion-header" id="heading-${currentIndex}">
          <button class="accordion-button collapsed bg-dark text-white"
            data-bs-toggle="collapse"
            data-bs-target="#collapse-${currentIndex}"
            aria-expanded="false">
            ${local}
          </button>
        </h2>

        <div id="collapse-${currentIndex}" 
             class="accordion-collapse collapse"
             data-bs-parent="#accordionInscritos">

          <p class="link-mapa copy-text"
            data-localid="${pRef.local_id}"
            title="Copiar endereço e abrir mapa">
            <i class="bi bi-geo-alt-fill me-1"></i>
            ${localObj?.endereco ?? 'Endereço não informado'}
          </p>

          <div class="accordion-body bg-light">
    `;

		pidsValidos.forEach((pid) => {
			const inscritosLista = agendamentos[pid];
			const p = agendamentosMap[pid];
			const setorNome = setoresMap[p.setor_id]?.nome || 'Setor';

			const obsHTML = p.observacoes
				? `<div class="mt-1">
					<small class="text-primary fw-semibold">
						<strong>Observações: </strong>${p.observacoes}
					</small>
				</div>`
				: '';

			html += `
        <div class="card mb-3 border-dark">
          <div class="card-header bg-dark text-white d-flex justify-content-between align-items-center gap-2 py-3">
            <div class="text-start">
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
            </div>

            <button class="btn btn-sm btn-success flex-shrink-0"
              onclick="compartilhar(${pid})">
              <i class="bi bi-whatsapp"></i>
              <span class="d-none d-md-inline ms-1">Compartilhar</span>
            </button>
          </div>

          <ul class="list-group list-group-flush">
      `;

			inscritosLista.forEach((i) => {
				const auth = localStorageService.buscarAutorizacao(i.id);

				html += `
	<li class="list-group-item d-flex justify-content-between align-items-center gap-2 py-3">
		<span class="d-flex flex-column align-items-start">
			<span class="fw-semibold">${i.nome}</span>
			<span class="text-muted small">Confirmada em: ${formatarData(i.data)}</span>
		</span>

		${
			auth
				? `<button class="btn btn-sm btn-outline-danger excluir-btn"
					onclick="excluirInscricao(${i.id}, this)">
					<i class="bi bi-trash"></i>
					<span class="btn-text">Excluir</span>
				  </button>`
				: ''
		}
	</li>
	`;
			});

			html += `</ul></div>`;
		});

		html += `
          </div>
        </div>
      </div>
    `;

		index++;
	});

	if (index === 0) {
		conteudo.innerHTML = `
      <div class="alert alert-secondary text-center">
        Nenhum agendamento válido encontrado
      </div>`;
		return;
	}

	html += '</div>';
	conteudo.innerHTML = html;
}

/* =========================
   VISUALIZAR INSCRIÇÕES
========================= */

async function showInscritos() {
	setTitle('Inscrições');

	conteudo.innerHTML = `
    <div class="spinner-border text-dark" role="status">
      <span class="visually-hidden">Carregando...</span>
    </div>`;

	travarUI();

	try {
		const inscritos = (await inscricoesService.listar()) || [];

		dataStore.inscritos = inscritos;

		if (!inscritos.length) {
			conteudo.innerHTML = `
        <div class="alert alert-secondary text-center">
          Nenhuma inscrição encontrada
        </div>`;
			return;
		}

		estruturaInscritos = inscricoesService.montarEstrutura(
			inscritos,
			dataStore.locais,
			dataStore.agendamentos,
			dataStore.setores || [],
		);

		renderAccordionInscritos(estruturaInscritos.grupos);

		copiarTexto(conteudo);
	} catch (err) {
		console.error(err);

		conteudo.innerHTML = `
      <div class="alert alert-dark text-center">
        Erro ao carregar inscrições
      </div>`;
	} finally {
		liberarUI();
	}
}

/* =========================
   COMPARTILHAR MENSAGEM WHATSAPP
========================= */

function compartilhar(pid) {
	const { locaisMap, agendamentosMap, setoresMap, inscritosPorAgendamento } = estruturaInscritos;

	const p = agendamentosMap[pid];
	if (!p) {
		abrirModalAviso('Erro', 'Agendamento não encontrado');
		return;
	}

	const localObj = locaisMap[p.local_id];
	if (!localObj) {
		abrirModalAviso('Erro', 'Local não encontrado');
		return;
	}

	const inscritosProg = inscritosPorAgendamento[pid] || [];
	const dataFormatada = formatarData(p.data);
	const setorNome = setoresMap[p.setor_id]?.nome || 'Setor';

	let mensagem = `*${localObj.nome}*\n\n`;
	mensagem += `_${localObj.endereco}_\n`;
	mensagem += `${setorNome}\n`;
	if (p.descricao) mensagem += `${p.descricao}`;
	mensagem += `\n*${dataFormatada}*\n`;
	mensagem += `*${formatarHorario(p.horario)}*\n`;
	if (p.observacoes) mensagem += `${p.observacoes}\n`;

	mensagem += `*Inscritos (Total: ${inscritosProg.length}):*\n`;

	inscritosProg.forEach((i) => {
		mensagem += `- ${i.nome}\n`;
	});

	mensagem = encodeURIComponent(mensagem);

	window.open(`https://wa.me/?text=${mensagem}`, '_blank', 'noopener,noreferrer');
}
