function returnToMenu(){
	function resetDivs(){
		let cells = Array.from(document.getElementsByClassName("cell"))
		cells.forEach(cell => {
			cell.className = "cell bg-gradient-to-r hover:from-pink-400 hover:to-red-500"
		})
	
		let filleds = Array.from(document.getElementsByClassName("filled"))
		filleds.forEach(filled => {
			filled.className = "cell bg-gradient-to-r hover:from-pink-400 hover:to-red-500"
		})
	
		let tokens = Array.from(document.getElementsByClassName("token"))
		tokens = Array.from(document.getElementsByClassName("token"))
		tokens.forEach(token => { token.remove()})
		
		if (document.getElementById("winner")) document.getElementById("winner").remove()
		if (document.getElementById("draw")) document.getElementById("draw").remove()
		if (document.getElementById("dice-container")) document.getElementById("dice-container").remove()
	}

	function resetDisplay(){
		document.getElementById("menu").style.display = 'block';
		document.getElementById("board").style.float = 'right';
		document.getElementById("board").style.pointerEvents = 'none';

		const buttom = document.getElementById("btnMn")
		buttom.remove()
	}
	
	resetDivs()
	resetDisplay()
}

function enterTheGame(){
	function ocultarMenu() {
		document.getElementById("menu").style.display = 'none';
		document.getElementById("board").style.float = 'none';
		document.getElementById("board").style.pointerEvents = 'auto';

		const buttom = document.createElement("button")
		buttom.className = "bg-gradient-to-r from-teal-400 to-blue-500"
		buttom.id = "btnMn"
		buttom.innerText = "Return to menu"
		document.getElementById("board").appendChild(buttom);
	}
	
	document.getElementById("btnClassic").addEventListener("click", () => {
		ocultarMenu();
		classicMode(false);
	});
	
	document.getElementById("btnClassicAI").addEventListener("click", () => {
		ocultarMenu();
		classicMode(true);
	});
	

	document.getElementById("btnCrazyTkns").addEventListener("click", () => {
		ocultarMenu();
		crazyTokensMode(false);
	});
}

enterTheGame();