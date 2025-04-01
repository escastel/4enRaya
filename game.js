function raya() {
	const boardMap = new Map();
	let columnMap = new Map();
	let columnList = new Array();

	class Player {
		color;
		turn;
		winner;
		click;
		num;
		constructor(color, num) {
			this.color = color;
			this.turn = false;
			this.winner = false;
			this.click = false;
			this.num = num;
		}
	}
	const player1 = new Player("red", 1);
	const player2 = new Player("yellow", 2);

	function setArray(num) {
		let array = new Array()

		for (let i = 1; i <= 6; i++)
			array.push(document.getElementById("c" + num + i.toString()))
		return (array)
	}

	function init() {
		for (let i = 1; i <= 7; i++) {
			boardMap.set(("c" + i.toString()), [0, 0, 0, 0, 0, 0])
			columnMap.set("c" + i.toString(), setArray(i.toString()))
			columnList.push(document.getElementById("c" + i.toString()))
		}
		player1.turn = true
	}

	async function start() {
		init();
	
		for (let i = 0; i < columnList.length; i++) {
			let column = columnList[i];
			column.addEventListener("click", async () => {
				if (!player1.winner && !player2.winner) {
					console.log("Player1: ", player1.winner)
					await readMap(column);
					if (await checkWin().valueOf() === true) {
						setTimeout(() => {
							alert(`¡Jugador ${player1.turn ? player1.num : player2.num} ha ganado!`);
						}, 3000);
					}
					else{
						await setTurn()
						await checkTurn()
					}
				}
			});
		}
	}


	async function checkTurn(){
		for (let i = 0; i < columnList.length; i++){
			let cellsDiv = columnMap.get(columnList[i].id)
			for (let j = 0; j < cellsDiv.length; j++){
				if (player1.turn && cellsDiv[j].getAttribute("class") == "cell cellYellow"){
					cellsDiv[j].removeAttribute("class")
					cellsDiv[j].setAttribute("class", "cell cellRed")
				}
				else if (player2.turn && cellsDiv[j].getAttribute("class") == "cell cellRed"){
					cellsDiv[j].removeAttribute("class")
					cellsDiv[j].setAttribute("class", "cell cellYellow")
				}
			}
		}
	}

	async function setClick(){
		if (player1.turn)
			player1.click = true
		else
			player2.click = true
	}

	async function setTurn(){
		if (player1.click){
			player1.click = false
			player2.turn = true
			player1.turn = false
		}
		else{
			player2.click = false
			player1.turn = true
			player2.turn = false
		}
	}
	
	async function placeToken(cellsDiv, column, pos, player){
		let ficha = document.createElement("div")
		const newMap = boardMap.get(column.id);

		newMap[pos] = player.num
		boardMap.delete(column.id)
		boardMap.set(column.id, newMap)
		ficha.setAttribute("class", player.color)
		cellsDiv[pos].removeAttribute("class")
		cellsDiv[pos].setAttribute("class", "ocupada")
		cellsDiv[pos].appendChild(ficha);
		ficha.classList.toggle("ficha")
	}

	async function readMap(column){
		setClick()

		let cellsDiv = columnMap.get(column.id)
		for (let j = 0; j < cellsDiv.length ; j++){
			if (boardMap.get(column.id)[j] == 0) {
				if (player1.turn)
					placeToken(cellsDiv, column, j, player1)
				else
					placeToken(cellsDiv, column, j, player2)
				break ;
			}
		}
	}

	async function checkWin() {
        const directions = [
            { x: 0, y: 1 }, 
			{ x: 1, y: 0 }, 
			{ x: 1, y: 1 }, 
			{ x: 1, y: -1 }
        ];

        for (let col = 0; col < columnList.length; col++) {
            const columnId = columnList[col].id;
            const columnData = boardMap.get(columnId);

            for (let row = 0; row < columnData.length; row++) {
                const currentPlayer = columnData[row];
                if (currentPlayer === 0) continue;

                for (let { x, y } of directions) {
                    let count = 1;
                    for (let step of [1, -1]) {
                        for (let s = 1; s < 4; s++) {
                            let newCol = col + x * s * step;
                            let newRow = row + y * s * step;
                            if (newCol >= 0 && newCol < columnList.length &&
                                newRow >= 0 && newRow < 6 &&
                                boardMap.get(columnList[newCol].id)[newRow] === currentPlayer)
                                count++;
                            else
                                break;
                        }
                    }
                    if (count >= 4){
						if (player1.turn)
							player1.winner = true
						else
							player2.winner = true
						return true;
					}
                }
            }
        }
        return false;
    }
	start()
}
raya()