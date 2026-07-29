class AgendamentosService {
	entity = 'agendamentos';

	async listar() {
		return await appScriptApi.view(this.entity);
	}

	async criar(dados, password = null) {
		return await appScriptApi.create(this.entity, dados, 1);
	}

	async editar(dados, password = null, delete_token = null) {
		return await appScriptApi.update(this.entity, dados, 1, delete_token);
	}

	async excluirComToken(id, delete_token) {
		return await appScriptApi.deleteWithToken(this.entity, id, delete_token);
	}

	async excluirComSenha(id, password) {
		return await appScriptApi.deleteWithPassword(this.entity, id, 1);
	}
}

const agendamentosService = new AgendamentosService();
