class AuthService {
	async auth(password) {
		const r = await appScriptApi.auth(password);
		return r;
	}
}

const authService = new AuthService();
