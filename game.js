function raya() {
	let boardMap = new Map();
	let columnMap = new Map();
	let columnList = new Array();
	let turn = 1;
	let win = false
	class Player {
		ficha;
		constructor(color) {
			this.ficha = color;
			this.turn = false;
		}
	}
	const player1 = new Player("red");
	const player2 = new Player("yellow");

	function setArray(num) {
		let array = new Array()

		for (let i = 1; i <= 6; i++)
			array.push(document.getElementById("c" + num + i.toString()))
		return (array)
	}

	function initMaps() {
		for (let i = 1; i <= 7; i++) {
			boardMap.set(("c" + i.toString()), [0, 0, 0, 0, 0, 0])
			columnMap.set("c" + i.toString(), setArray(i.toString()))
			columnList.push(document.getElementById("c" + i.toString()))
		}
	}

	function start(){
		initMaps()
		if (!checkWin())
			clickEvent()
	}

	function checkWin(){
		console.log(boardMap)
		return false
	}

	function checkTurn(){
		for (let i = 0; i < columnList.length; i++){
			let cellsDiv = columnMap.get(columnList[i].id)
			for (let j = 0; j < cellsDiv.length; j++){
				if (turn % 2 && cellsDiv[j].getAttribute("class") == "cell cellYellow"){
					cellsDiv[j].removeAttribute("class")
					cellsDiv[j].setAttribute("class", "cell cellRed")
				}
				else if (cellsDiv[j].getAttribute("class") == "cell cellRed"){
					cellsDiv[j].removeAttribute("class")
					cellsDiv[j].setAttribute("class", "cell cellYellow")
				}
			}
		}
	}

	function clickEvent(){
		for (let i = 0; i < columnList.length; i++){
			let column = columnList[i];
			column.addEventListener("click", function () {
				let cellsMap = boardMap.get(column.id)
				let cellsDiv = columnMap.get(column.id)
				for (let j = 0; j < cellsMap.length; j++){
					if (cellsMap[j] == 0) {
						let ficha = document.createElement("div")
						if (turn % 2) {
							cellsMap[j] = 1
							ficha.setAttribute("class", "ficha-roja")
							cellsDiv[j].removeAttribute("class")
							cellsDiv[j].setAttribute("class", "ocupada")
							cellsDiv[j].appendChild(ficha);
							ficha.classList.toggle("ficha")
						}
						else{
							cellsMap[j] = 2
							ficha.setAttribute("class", "ficha-amarilla")
							cellsDiv[j].removeAttribute("class")
							cellsDiv[j].setAttribute("class", "ocupada")
							cellsDiv[j].appendChild(ficha);
							ficha.classList.toggle("ficha")
						}
						encontrado = true
						cellsDiv[j].removeAttribute("class")
						cellsDiv[j].setAttribute("class", "ocupada")
						turn += 1;
						checkTurn()
						break ;
					}
				}
			})
		}
	}
	start()
}
raya()