const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const jsonFormatter = require('json-string-formatter');

// variáveis para controle de tempo
let startTime;
let endTime;

async function main(maxPages = 50) {

	startTime = performance.now();

	// contagem de quantidade de produtos
	let productsCount = 0;
	// preço total
	let totalPrice = 0;
	// preço médio dos produtos da loja
	let productMediumPrice;
	// produto mais barato
	let cheapProduct;
	// produto mais caro
	let expensiveProduct;
	// lista dos produtos
	let shop = { shop_info: {}, products: [] };
	// inicializa com a primeira página que vai visitar
	const urlsToVisit = ['https://scrapeme.live/shop/page/1/'];
	// urls visitadas
	const visitedURLs = [];
	// urls dos produtos
	const productsURLs = new Set();
	// flag auxiliar
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

		// pega info da primeira pagina
		if (!started) {
			let total = $('p.woocommerce-result-count').first().text();
			totalProducts = Number(total.substring(total.indexOf('f')).match(/\d/g).join(''));
		}

		// recuperando as URLs de paginação
		$('.page-numbers a').each((index, element) => {
			const paginationURL = $(element).attr('href');

			// adicionar o URL de paginação à fila de páginas para rastrear, se ainda não tiver sido rastreado
			if (!visitedURLs.includes(paginationURL) && !urlsToVisit.includes(paginationURL)) {
				urlsToVisit.push(paginationURL);
			}
		});

		// analisando os produtos
		$('li.product').each((index, element) => {

			// pegando URL do produto
			const productURL = $(element).find('a.woocommerce-LoopProduct-link').attr('href');
			// adicionando a lista de urls de produtos
			productsURLs.add(productURL);
			// pegando nome do produto
			const productName = $(element).find('h2.woocommerce-loop-product__title').text();
			// pegando preço do produto
			const productPrice = Number(
				$(element).find('span.woocommerce-Price-amount')
				.text().replace('£', '')
			);
			totalPrice += productPrice;
			// pegando imagem do produto
			const productPhoto = $(element).find('img.wp-post-image').attr('src');

			// produto atual
			const currentProduct = {
				name: productName,
				price: productPrice,
				photo: productPhoto,
				url: productURL,
			}

			// verificando se o produto atual é mais caro ou mais barato que os produtos mais caros e mais baratos da loja
			if (cheapProduct === undefined || expensiveProduct === undefined) {
				cheapProduct = currentProduct;
				expensiveProduct = currentProduct;
			} else {
				if (productPrice < cheapProduct.price)
					cheapProduct = currentProduct;

				if (productPrice > expensiveProduct.price)
					expensiveProduct = currentProduct;
			}

			// adicionando informações do produto na lista de produtos
			shop.products.push(currentProduct);

			// contabilizando mais um produto analisado
			productsCount++;
			console.log('\n\n\n\n\n\n\n\n\n\n\n\nCompleto: ' + (productsCount/totalProducts*100).toFixed(1) + '%');
		});

	}

	// calculando média de preço dos produtos
	productMediumPrice =  Number((totalPrice / productsCount).toFixed(2));

	// salvando informações da loja
	shop.shop_info = {
		quantity_products : productsCount,
		medium_price : productMediumPrice,
		cheap_product : cheapProduct,
		expensive_product : expensiveProduct
	}

	// salvando produtos em JSON
	const json = jsonFormatter.format(JSON.stringify(shop));
	fs.writeFileSync('shop.json', json, function(err) {
		if (err) return console.log('Erro: ' + err);
	});

	// salvando URLS em txt
	const txt = Array.from(productsURLs).join('\n');
	fs.writeFileSync('shop_inspected_urls.txt', txt, function(err) {
		if (err) return console.log('Erro: ' + err);
	});

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