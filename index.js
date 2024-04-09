const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const jsonFormatter = require('json-string-formatter');

// variáveis para controle de tempo
let startTime;
let endTime;

async function main(maxPages = 50) {

	startTime = performance.now();

	// inicializa com a primeira página que vai visitar
	const urlsToVisit = ['https://inf.passofundo.ifsul.edu.br/professores/'];
	// urls visitadas
	const visitedURLs = [];	
	let started = false;
	// total de produtos
	let totalProducts;

	// executa enquanto tiver algo na fila ou o limite seja atingido
	while (urlsToVisit.length !== 0 && visitedURLs.length <= maxPages) {

		// página atual a ser rastreada
		const paginationURL = urlsToVisit.pop();
		// recuperando o conteúdo HTML da pagina
		const pageHTML = await axios.get(paginationURL);
		// adicionar a página atual às páginas já rastreadas
		visitedURLs.push(paginationURL);
		// inicializando o cheerio na página atual
		const $ = cheerio.load(pageHTML.data);



		// acessando a div de class professor
		$('div.professor').each((index, element) => {
           // console.log(element)
			// pegando nome professor - acessando o h3 de class hidden-xs
			const professorName = $(element).find('h3.hidden-xs').text();
            console.log(`Nome do professor de indice ${index}: ` + professorName)			
		});

	}
	// finalizando função
	endTime = performance.now();
}

main()
	.then(() => {
		console.log(`FINALIZADO! Tempo gasto: ${((endTime - startTime)/1000).toFixed(2)}s`);
		process.exit(0);
	})
	.catch((e) => {
		console.error(e);
		process.exit(1);
	});