function init(){
	let cells = Array.from(document.getElementsByClassName("cell"))
	cells.forEach(cell => {
		cell.className = "cell bg-gradient-to-r hover:from-pink-400 hover:to-red-500"
	})

	let filleds = Array.from(document.getElementsByClassName("filled"))
	filleds = Array.from(document.getElementsByClassName("filled"))
	filleds.forEach(filled => {
		filled.className = "cell bg-gradient-to-r hover:from-pink-400 hover:to-red-500"
	})

	let tokens = Array.from(document.getElementsByClassName("token"))
	tokens = Array.from(document.getElementsByClassName("token"))
	tokens.forEach(token => {
		token.remove()
	})
	if (document.getElementById("winner"))
		document.getElementById("winner").remove()
	if (document.getElementById("draw"))
		document.getElementById("draw").remove()
}

function volverMenu(){
	init()
	document.getElementById("menu").style.display = 'block';
	document.getElementById("board").style.float = 'right';
	document.getElementById("board").style.pointerEvents = 'none';

	const buttom = document.getElementById("btnMn")
	buttom.remove()
}

function handle(){
	function ocultarMenu() {
		document.getElementById("menu").style.display = 'none';
		document.getElementById("board").style.float = 'none';
		document.getElementById("board").style.pointerEvents = 'auto';

		const buttom = document.createElement("button")
		buttom.className = "bg-gradient-to-r from-teal-400 to-blue-500"
		buttom.id = "btnMn"
		buttom.innerText = "Volver al menú"
		document.getElementById("board").appendChild(buttom);
	}
	
	document.getElementById("btnClasico").addEventListener("click", () => {
		ocultarMenu();
		game(false);
	});
	
	document.getElementById("btnClasIA").addEventListener("click", () => {
		ocultarMenu();
		game(true);
	});
	

	document.getElementById("btnEspecial").addEventListener("click", () => {
		ocultarMenu();
		//custom();
	});
}

handle();