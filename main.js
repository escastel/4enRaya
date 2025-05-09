function returnToMenu(){
	function resetDivs(){
		let columns = Array.from(document.getElementsByClassName("column"))
		columns.forEach(column => {
			column.className = "column flex flex-col items-center"
		})

		let cells = Array.from(document.getElementsByClassName("cell"))
		cells.forEach(cell => {
			cell.className = "cell bg-gradient-to-r hover:from-pink-400 hover:to-red-500"
		})
	
		let filleds = Array.from(document.getElementsByClassName("filled"))
		filleds.forEach(filled => {
			filled.className = "cell bg-gradient-to-r hover:from-pink-400 hover:to-red-500"
		})
	
		let tokens = Array.from(document.getElementsByClassName("token"))
		tokens.forEach(token => { token.remove()})
		
		if (document.getElementById("dice-container")) document.getElementById("dice-container").remove()
	}

	function resetDisplay(){
		document.getElementById("menu").style.display = 'block';
		document.getElementById("board").style.float = 'right';
		document.getElementById("board").style.pointerEvents = 'none';
		if (document.getElementById("btnMn"))
			document.getElementById("btnMn").remove()
	}
	localStorage.removeItem('gameState');
	resetDivs()
	resetDisplay()
	return ;
}

function enterTheGame() {
    function ocultarMenu() {
        document.getElementById("menu").style.display = 'none';
        document.getElementById("board").style.float = 'none';
        document.getElementById("board").style.pointerEvents = 'auto';

        const button = document.createElement("button");
        button.className = "bg-gradient-to-r from-teal-400 to-blue-500";
        button.id = "btnMn";
        button.innerText = "Return to menu";
        button.addEventListener("click", returnToMenu);
        document.getElementById("board").appendChild(button);
    }

    function initGame(modo, activarAI) {
        ocultarMenu();

        switch (modo) {
            case "classic":
                classicMode(activarAI);
                break;
            case "custom":
                crazyTokensMode(activarAI);
                break;
        }
        
    }

    document.getElementById("btnClassic").addEventListener("click", () => {
        initGame("classic", false);
    });

    document.getElementById("btnClassicAI").addEventListener("click", () => {
        initGame("classic", true);
    });

    document.getElementById("btnCrazyTkns").addEventListener("click", () => {
        initGame("custom", false);
    });

    document.getElementById("btnCrazyTknsAI").addEventListener("click", () => {
        initGame("custom", true);
    });
}

enterTheGame();