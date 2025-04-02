function  connectFour() {
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
			array.push(document.getElementById("c" + num + i.toString()));
		return (array)
	}

	function init() {
		for (let i = 1; i <= 7; i++) {
			boardMap.set(("c" + i.toString()), Array(6).fill(0));
			columnMap.set("c" + i.toString(), setArray(i.toString()));
			columnList.push(document.getElementById("c" + i.toString()));
		}
		player1.turn = true;
	}

	function start() {
        init();
        columnList.forEach((column) => {
            column.addEventListener("click", () => handleColumnClick(column));
        });
    }

	function handleColumnClick(column) {
        if (player1.winner || player2.winner) return;

        placeToken(column);
        if (checkWin())
            insertDivWinner()
        else if (checkDraw())
            insertDivDraw()
        else {
            toggleTurn();
            updateTurnIndicator();
        }
    }

    function insertDivWinner(){
        const winner = document.createElement("div")
        const playerWinner = player1.winner ? `winner-${player1.color}` : `winner-${player2.color}`;
        const player = player1.winner ? "Player 1" : "Player 2";
        
        winner.className = `${playerWinner} bg-gradient-to-r from-teal-400 to-blue-500`;
        winner.innerHTML = `¡El <span>${player}</span> ha ganado!`
        document.getElementById("board").appendChild(winner);
            
    }

    function insertDivDraw(){
        const draw = document.createElement("div")

        draw.className = `draw`
        draw.innerText = `¡Empate!`
        document.getElementById("board").appendChild(draw);
    }

	function toggleTurn() {
        player1.turn = !player1.turn;
        player2.turn = !player2.turn;
    }

	function updateTurnIndicator() {
        columnList.forEach((column) => {
            const cells = columnMap.get(column.id);
            cells.forEach((cell) => {
                if (cell.classList.contains("cell")) {
                    cell.className = `cell ${player1.turn ? `bg-gradient-to-r hover:from-pink-400 hover:to-red-500` : "bg-gradient-to-r hover:from-green-400 hover:to-yellow-500"}`;
                }
            });
        });
    }
	
	function updateCell(cell, player) {
        const token = document.createElement("div");
        token.className = `token-${player.color}`;
        cell.className = "filled";
        cell.appendChild(token);
    }

	function placeToken(column){
        const cells = columnMap.get(column.id);
        const columnData = boardMap.get(column.id);

        for (let row = 0; row < cells.length; row++) {
            if (columnData[row] === 0) {
                const currentPlayer = player1.turn ? player1 : player2;
                columnData[row] = currentPlayer.num;
                updateCell(cells[row], currentPlayer);
                break;
            }
        }
    }

    function checkDraw(){
        let draw = true;

        columnList.forEach((column) => {
            const cells = columnMap.get(column.id);
            cells.forEach((cell) => {
                if (cell.classList.contains("cell")) {
                    draw = false;
                }
            });
        });
        return draw;
    }

	function checkWin() {
        const directions = [
            { x: 0, y: 1 },
            { x: 1, y: 0 },
            { x: 1, y: 1 },
            { x: 1, y: -1 },
        ];

        for (let col = 0; col < columnList.length; col++) {
            const columnId = columnList[col].id;
            const columnData = boardMap.get(columnId);

            for (let row = 0; row < columnData.length; row++) {
                const currentPlayer = columnData[row];
                if (currentPlayer === 0) continue;

                if (checkDirection(col, row, currentPlayer, directions)) {
                    player1.winner = player1.turn;
                    player2.winner = player2.turn;
                    return true;
                }
            }
        }
        return false;
    }

	function checkDirection(col, row, player, directions) {
        for (const { x, y } of directions) {
            let count = 1;

            for (const step of [1, -1]) {
                for (let s = 1; s < 4; s++) {
                    const newCol = col + x * s * step;
                    const newRow = row + y * s * step;

                    if (newCol >= 0 &&
                        newCol < columnList.length &&
                        newRow >= 0 &&
                        newRow < 6 && 
						boardMap.get(columnList[newCol].id)[newRow] === player) {
                        count++;
                    } else
                        break;
                }
            }

            if (count >= 4) return true;
        }
        return false;
    }

    start();
}
connectFour();