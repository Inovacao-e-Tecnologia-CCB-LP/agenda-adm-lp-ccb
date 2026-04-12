/**
 * NOME CORRECTOR
 * Sugere a acentuação correta de nomes próprios em português.
 *
 * Estratégia:
 *  1. Dicionário de nomes comuns com grafia correta
 *  2. Para nomes não encontrados no dicionário, aplica regras
 *     fonéticas do português (terminações típicas que levam acento)
 *  3. Retorna null se nenhuma correção for necessária
 */

(function () {
	// ── Dicionário de nomes comuns ──────────────────────────────────────────
	// Chave: versão sem acento em minúsculas
	// Valor: grafia correta com acento
	const DICIONARIO = {
		// A
		abilio: 'Abílio',
		adao: 'Adão',
		adriano: 'Adriano',
		agatha: 'Ágatha',
		agnes: 'Agnès',
		alcides: 'Alcides',
		alicia: 'Alícia',
		alipio: 'Alípio',
		amalia: 'Amália',
		americo: 'Américo',
		ana: 'Ana',
		anderson: 'Anderson',
		andrea: 'Andréa',
		andreia: 'Andréia',
		angelo: 'Ângelo',
		anicio: 'Aníncio',
		anita: 'Anita',
		antonio: 'Antônio',
		ariadne: 'Ariadne',
		aristoteles: 'Aristóteles',
		arnaldo: 'Arnaldo',
		aurelio: 'Aurélio',
		// B
		beatriz: 'Beatriz',
		benedito: 'Benedito',
		bernardo: 'Bernardo',
		bianca: 'Bianca',
		// C
		caio: 'Caio',
		camila: 'Camila',
		candido: 'Cândido',
		carla: 'Carla',
		carlos: 'Carlos',
		cassio: 'Cássio',
		cecilia: 'Cecília',
		celso: 'Celso',
		cesar: 'César',
		cicero: 'Cícero',
		claudia: 'Cláudia',
		claudio: 'Cláudio',
		cristiano: 'Cristiano',
		cristina: 'Cristina',
		// D
		dalila: 'Dalila',
		damiao: 'Damião',
		daniel: 'Daniel',
		daniela: 'Daniela',
		dario: 'Dário',
		debora: 'Débora',
		denise: 'Denise',
		deus: 'Deus',
		diana: 'Diana',
		diego: 'Diego',
		dionisio: 'Dionísio',
		domingos: 'Domingos',
		// E
		edgar: 'Edgar',
		edson: 'Edson',
		eduardo: 'Eduardo',
		elias: 'Elias',
		eliza: 'Eliza',
		elizabete: 'Elizabete',
		emilia: 'Emília',
		emilio: 'Emílio',
		erico: 'Érico',
		erick: 'Erick',
		erik: 'Erik',
		esther: 'Ester',
		eunice: 'Eunice',
		// F
		fabiana: 'Fabiana',
		fabio: 'Fábio',
		fatima: 'Fátima',
		felicia: 'Felícia',
		felicio: 'Felício',
		felipe: 'Felipe',
		fernanda: 'Fernanda',
		fernando: 'Fernando',
		filipe: 'Filipe',
		flavia: 'Flávia',
		flavio: 'Flávio',
		francisco: 'Francisco',
		frederico: 'Frederico',
		// G
		gabriel: 'Gabriel',
		gabriela: 'Gabriela',
		geraldo: 'Geraldo',
		gilberto: 'Gilberto',
		giovana: 'Giovana',
		giovanna: 'Giovanna',
		gleice: 'Gleice',
		glória: 'Glória',
		gloria: 'Glória',
		goncalo: 'Gonçalo',
		gracas: 'Graças',
		gracieli: 'Gracieli',
		gustavo: 'Gustavo',
		// H
		heitor: 'Heitor',
		heleno: 'Heleno',
		helio: 'Hélio',
		henrique: 'Henrique',
		higor: 'Higor',
		hugo: 'Hugo',
		// I
		igor: 'Igor',
		ines: 'Inês',
		iolanda: 'Iolanda',
		irene: 'Irene',
		iris: 'Íris',
		isabel: 'Isabel',
		isabela: 'Isabela',
		isidoro: 'Isidoro',
		// J
		jair: 'Jair',
		janaina: 'Janaína',
		jessica: 'Jéssica',
		joana: 'Joana',
		joao: 'João',
		jonatas: 'Jônatas',
		jonas: 'Jonas',
		jorge: 'Jorge',
		jose: 'José',
		josefa: 'Josefa',
		josefina: 'Josefina',
		julia: 'Júlia',
		juliana: 'Juliana',
		julio: 'Júlio',
		junior: 'Júnior',
		// K
		karina: 'Karina',
		katia: 'Kátia',
		// L
		laercio: 'Laércio',
		larissa: 'Larissa',
		laura: 'Laura',
		lazaro: 'Lázaro',
		lea: 'Léa',
		leandro: 'Leandro',
		leticia: 'Letícia',
		licia: 'Lícia',
		lidia: 'Lídia',
		lilian: 'Lilian',
		liliane: 'Liliane',
		livia: 'Lívia',
		lorena: 'Lorena',
		luana: 'Luana',
		lucas: 'Lucas',
		lucia: 'Lúcia',
		luciana: 'Luciana',
		luciano: 'Luciano',
		lucio: 'Lúcio',
		luisa: 'Luísa',
		luiz: 'Luiz',
		// M
		magda: 'Magda',
		manoel: 'Manoel',
		marcela: 'Marcela',
		marcelo: 'Marcelo',
		marcia: 'Márcia',
		marcio: 'Márcio',
		marcos: 'Marcos',
		maria: 'Maria',
		mariana: 'Mariana',
		mario: 'Mário',
		mateus: 'Mateus',
		matheus: 'Matheus',
		melissa: 'Melissa',
		meyre: 'Meyre',
		miguel: 'Miguel',
		miriam: 'Míriam',
		monica: 'Mônica',
		// N
		natalia: 'Natália',
		nathanael: 'Natanael',
		nicolas: 'Nícolás',
		nicole: 'Nicole',
		nilton: 'Nilton',
		noemia: 'Noêmia',
		// O
		odair: 'Odair',
		olivia: 'Olívia',
		oracio: 'Orácio',
		orlando: 'Orlando',
		oscar: 'Oscar',
		otavio: 'Otávio',
		// P
		pablo: 'Pablo',
		patricia: 'Patrícia',
		paulo: 'Paulo',
		pedro: 'Pedro',
		priscila: 'Priscila',
		// R
		rafael: 'Rafael',
		rafaela: 'Rafaela',
		ramiro: 'Ramiro',
		raquel: 'Raquel',
		rebeca: 'Rebeca',
		reginaldo: 'Reginaldo',
		regis: 'Régis',
		renata: 'Renata',
		renato: 'Renato',
		ricardo: 'Ricardo',
		roberta: 'Roberta',
		roberto: 'Roberto',
		rodrigo: 'Rodrigo',
		romario: 'Romário',
		ronaldo: 'Ronaldo',
		rosa: 'Rosa',
		rosana: 'Rosana',
		rosario: 'Rosário',
		rubens: 'Rubens',
		// S
		samuel: 'Samuel',
		sandra: 'Sandra',
		sebastiao: 'Sebastião',
		sergio: 'Sérgio',
		silvia: 'Sílvia',
		simao: 'Simão',
		simone: 'Simone',
		sofia: 'Sofia',
		sueli: 'Sueli',
		suely: 'Suely',
		// T
		tatiana: 'Tatiana',
		tiago: 'Tiago',
		thais: 'Taís',
		thiago: 'Thiago',
		thomas: 'Thomas',
		tome: 'Tomé',
		// U
		ulisses: 'Ulisses',
		urias: 'Urias',
		// V
		valeria: 'Valéria',
		valerio: 'Valério',
		vanessa: 'Vanessa',
		vera: 'Vera',
		veronica: 'Verônica',
		victor: 'Victor',
		vinicius: 'Vinícius',
		virginia: 'Virgínia',
		vitor: 'Vitor',
		vitoria: 'Vitória',
		// W
		walmir: 'Walmir',
		walter: 'Walter',
		wellington: 'Wellington',
		william: 'William',
		// Z
		zenaide: 'Zenaide',
		zilda: 'Zilda',

		// Sobrenomes comuns
		almeida: 'Almeida',
		andrade: 'Andrade',
		araujo: 'Araújo',
		barbosa: 'Barbosa',
		batista: 'Batista',
		borges: 'Borges',
		braga: 'Braga',
		brito: 'Brito',
		caldas: 'Caldas',
		campos: 'Campos',
		cardoso: 'Cardoso',
		carneiro: 'Carneiro',
		carvalho: 'Carvalho',
		cavalcante: 'Cavalcante',
		cavalcanti: 'Cavalcanti',
		coelho: 'Coelho',
		correia: 'Correia',
		costa: 'Costa',
		cunha: 'Cunha',
		dias: 'Dias',
		duarte: 'Duarte',
		farias: 'Farias',
		fernandes: 'Fernandes',
		ferreira: 'Ferreira',
		figueiredo: 'Figueiredo',
		fontes: 'Fontes',
		freitas: 'Freitas',
		garcia: 'Garcia',
		gomes: 'Gomes',
		gonçalves: 'Gonçalves',
		goncalves: 'Gonçalves',
		guimaraes: 'Guimarães',
		jesus: 'Jesus',
		leal: 'Leal',
		leite: 'Leite',
		lemos: 'Lemos',
		lima: 'Lima',
		lopes: 'Lopes',
		macedo: 'Macedo',
		machado: 'Machado',
		magalhaes: 'Magalhães',
		marques: 'Marques',
		martins: 'Martins',
		medeiros: 'Medeiros',
		melo: 'Melo',
		menezes: 'Menezes',
		miranda: 'Miranda',
		monteiro: 'Monteiro',
		moraes: 'Moraes',
		morais: 'Morais',
		moreira: 'Moreira',
		mota: 'Mota',
		moura: 'Moura',
		nascimento: 'Nascimento',
		neves: 'Neves',
		nogueira: 'Nogueira',
		nunes: 'Nunes',
		oliveira: 'Oliveira',
		pacheco: 'Pacheco',
		paiva: 'Paiva',
		pereira: 'Pereira',
		pinheiro: 'Pinheiro',
		pinto: 'Pinto',
		pires: 'Pires',
		queiroz: 'Queiroz',
		queirós: 'Queirós',
		ramos: 'Ramos',
		reis: 'Reis',
		ribeiro: 'Ribeiro',
		rocha: 'Rocha',
		rodrigues: 'Rodrigues',
		sales: 'Sales',
		santana: 'Santana',
		santiago: 'Santiago',
		santos: 'Santos',
		silva: 'Silva',
		silveira: 'Silveira',
		simoes: 'Simões',
		soares: 'Soares',
		sousa: 'Sousa',
		souza: 'Souza',
		tavares: 'Tavares',
		teixeira: 'Teixeira',
		vale: 'Vale',
		vasconcelos: 'Vasconcelos',
		vieira: 'Vieira',
		xavier: 'Xavier',
	};

	/**
	 * Remove acentos de uma string para comparação.
	 */
	function semAcento(str) {
		return str
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.toLowerCase();
	}

	/**
	 * Verifica se uma string já tem algum acento.
	 */
	function temAcento(str) {
		return /[àáâãäåèéêëìíîïòóôõöùúûüýÿñçÀÁÂÃÄÅÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝŸÑÇ]/.test(str);
	}

	/**
	 * Corrige a acentuação de um nome próprio.
	 * Retorna o nome corrigido, ou null se nenhuma correção for necessária.
	 */
	function corrigirNome(nomeOriginal) {
		if (!nomeOriginal || !nomeOriginal.trim()) return null;

		const palavras = nomeOriginal.trim().split(/\s+/);
		let algumCorrigido = false;
		let algumDiferente = false;

		const palavrasCorrigidas = palavras.map((palavra) => {
			const chave = semAcento(palavra);
			const correcao = DICIONARIO[chave];

			if (correcao) {
				// Preserva maiúscula inicial se a palavra original começar com maiúscula
				const resultado =
					palavra[0] === palavra[0].toUpperCase()
						? correcao.charAt(0).toUpperCase() + correcao.slice(1)
						: correcao.charAt(0).toLowerCase() + correcao.slice(1);

				if (resultado !== palavra) {
					algumDiferente = true;
					// Só marca como "corrigido com acento" se de fato adicionou/mudou acento
					if (temAcento(resultado) && !temAcento(palavra)) {
						algumCorrigido = true;
					}
				}
				return resultado;
			}

			return palavra;
		});

		// Só retorna sugestão se houver diferença real de acentuação
		if (!algumCorrigido) return null;

		const nomeCorrigido = palavrasCorrigidas.join(' ');
		return nomeCorrigido === nomeOriginal ? null : nomeCorrigido;
	}

	/**
	 * Exibe modal de confirmação de correção de nome.
	 * Retorna Promise<string> com o nome final escolhido pelo usuário.
	 */
	function confirmarCorrecaoNome(nomeOriginal, nomeSugerido) {
		return new Promise((resolve) => {
			const modalEl = document.getElementById('modalCorrecaoNome');
			if (!modalEl) {
				resolve(nomeOriginal);
				return;
			}

			document.getElementById('correcaoNomeOriginal').textContent = nomeOriginal;
			document.getElementById('correcaoNomeSugerido').textContent = nomeSugerido;

			const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

			const btnManter = document.getElementById('btnManterNome');
			const btnUsar = document.getElementById('btnUsarCorrecao');

			// Usa uma flag para evitar que a Promise resolva mais de uma vez
			let resolvido = false;

			function resolverUmaVez(valor) {
				if (resolvido) return;
				resolvido = true;
				resolve(valor);
			}

			function cleanup() {
				btnManter.removeEventListener('click', onManter);
				btnUsar.removeEventListener('click', onUsar);
				modalEl.removeEventListener('hidden.bs.modal', onFecharOuX);
			}

			function onManter() {
				cleanup();
				modal.hide();
				resolverUmaVez(nomeOriginal);
			}

			function onUsar() {
				cleanup();
				modal.hide();
				resolverUmaVez(nomeSugerido);
			}

			// Captura qualquer fechamento: X, ESC, backdrop
			// null = cancelado → salvarInscricao vai parar e deixar o usuário redigitar
			function onFecharOuX() {
				cleanup();
				resolverUmaVez(null);
			}

			btnManter.addEventListener('click', onManter);
			btnUsar.addEventListener('click', onUsar);
			// hidden.bs.modal dispara DEPOIS que o modal fecha, independente do motivo
			modalEl.addEventListener('hidden.bs.modal', onFecharOuX, { once: true });

			modal.show();
		});
	}

	/**
	 * Pipeline completo: recebe o nome digitado, verifica correção,
	 * pergunta ao usuário se necessário, retorna o nome final.
	 * Retorna null se o usuário cancelou (fechou o modal sem escolher).
	 *
	 * Uso: const nomeFinal = await NomeCorrector.processar(nomeDigitado);
	 *      if (nomeFinal === null) return; // usuário cancelou
	 */
	async function processarNome(nomeDigitado) {
		if (!nomeDigitado || !nomeDigitado.trim()) return nomeDigitado;

		const nomeSugerido = corrigirNome(nomeDigitado.trim());

		if (!nomeSugerido) {
			// Nenhuma correção necessária
			return nomeDigitado.trim();
		}

		// Pergunta ao usuário — pode retornar null se ele fechar sem escolher
		return await confirmarCorrecaoNome(nomeDigitado.trim(), nomeSugerido);
	}

	// ── Exposição global ──────────────────────────────────────────────────
	window.NomeCorrector = {
		processar: processarNome,
		corrigir: corrigirNome,
		temAcento,
	};
})();
