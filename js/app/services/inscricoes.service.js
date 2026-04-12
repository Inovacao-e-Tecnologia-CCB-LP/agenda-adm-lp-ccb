class InscricoesService {
	entity = 'inscricoes';

	async listar() {
		return await appScriptApi.view(this.entity);
	}

	async criar(payload) {
		return await appScriptApi.create(this.entity, payload);
	}

	async excluir(id, delete_token) {
		return await appScriptApi.deleteWithToken(this.entity, id, delete_token);
	}

	/* =========================
     ESTRUTURA
  ========================= */

	montarEstrutura(inscritos, locais, agendamentos, setores) {
		const locaisMap = {};
		const agendamentosMap = {};
		const setoresMap = {};
		const inscritosPorAgendamento = {};
		const grupos = {};

		locais.forEach((l) => (locaisMap[l.id] = l));
		agendamentos.forEach((a) => (agendamentosMap[a.id] = a));
		setores.forEach((s) => (setoresMap[s.id] = s));

		inscritos.forEach((i) => {
			const agendamento = agendamentosMap[i.agendamento_id];

			if (!agendamento) {
				console.warn('Inscrição com agendamento inválido:', i);
				return;
			}

			(inscritosPorAgendamento[i.agendamento_id] ??= []).push(i);

			const local = locaisMap[i.local_id];

			if (!local) {
				console.warn('Inscrição sem local válido:', i);
				return;
			}

			const localNome = local.nome;

			grupos[localNome] ??= {};
			(grupos[localNome][i.agendamento_id] ??= []).push(i);
		});

		return {
			grupos,
			locaisMap,
			agendamentosMap,
			setoresMap,
			inscritosPorAgendamento,
		};
	}
}

const inscricoesService = new InscricoesService();
