function classicMode(activateAI) {
    let columnMap = new Map();
    let columnList = new Array();
    let boardMap = new Map();

    class Player {
        color;
        turn;
        winner;
        num;
        AI;
        constructor(AI, num, color) {
            this.AI = AI;
            this.num = num;
            this.color = color;
            this.turn = false;
            this.winner = false;
        }
    }
    const player1 = new Player(false, 1, "red");
    const player2 = new Player(activateAI, 2, "yellow");

    /* Initialization Functionality */

    function setArray(num) {
        let array = new Array();

        for (let i = 1; i <= 6; i++)
            array.push(document.getElementById("c" + num + i.toString()));
        return array;
    }

    function init() {
        player1.turn = true;

        for (let i = 1; i <= 7; i++) {
            boardMap.set(("c" + i.toString()), Array(6).fill(0));
            columnMap.set("c" + i.toString(), setArray(i.toString()));
            columnList.push(document.getElementById("c" + i.toString()));
        }
    }

    function start() {
        clearGame();
        init();
        enableClicks();
        columnList.forEach((column) => {
            column.addEventListener("click", () => handleColumnClick(column));
        });
    }

    function clearGame() {
        columnList.forEach((column) => {
            const newColumn = column.cloneNode(true);
            column.replaceWith(newColumn);
        });
    
        boardMap.clear();
        columnMap.clear();
        columnList = [];
    
        const winnerDiv = document.getElementById("winner");
        const drawDiv = document.getElementById("draw");
        if (winnerDiv){
            winnerDiv.style.display = "none";
            winnerDiv.classList.remove = (`${player1.winner ? `${player1.color}` : `${player2.color}`}`);
        }
        if (drawDiv) drawDiv.style.display = "none";
    }

    /* Click Functionality */

    function enableClicks() {
        columnList.forEach((column) => {
            column.style.pointerEvents = "auto";
        });
    }

    function disableClicks() {
        columnList.forEach((column) => {
            column.style.pointerEvents = "none";
        });
    }

    /* Handle Column Click */

    async function handleColumnClick(column) {
        if (player1.winner || player2.winner) { clearGame(); return; }
        
        await placeToken(column);
        if (checkWin(false)) insertDivWinner(), disableClicks();
        else if (checkDraw()) insertDivDraw(), disableClicks();
        else {
            if (player2.turn && player2.AI) {
                disableClicks();
                console.log("AI is thinking...");
                await aiToken();
                console.log("AI token placed");
            }
        }
    }

    /* Insert Div Win / Draw */

    function insertDivWinner() {
        const winner = document.getElementById("winner");
        const playerWinner = player1.winner ? `${player1.color}` : `${player2.color}`;
        const player = player1.winner ? "Player 1" : "Player 2";
        winner.classList.add(playerWinner);
        winner.style.display = "block";
        winner.innerHTML = `¡El <span>${player}</span> ha ganado!`;
    
        disableClicks();
    }

    function insertDivDraw() {
        const draw = document.getElementById("draw");

        draw.innerText = `¡Empate!`;
        draw.style.display = "block";
        disableClicks();
    }

    /* Turn Indicator */

    async function updateTurnIndicator() {
        player1.turn = !player1.turn;
        player2.turn = !player2.turn;

        const currentPlayer = player1.turn ? player1 : player2;
        columnList.forEach((column) => {
            const cells = columnMap.get(column.id);

            cells.forEach((cell) => {
                if (cell.classList.contains("cell") && !player2.AI) {
                    cell.className = `cell ${currentPlayer.color === "red" ?
                        `bg-gradient-to-r hover:from-pink-400 hover:to-red-500` :
                        `bg-gradient-to-r hover:from-orange-400 hover:to-yellow-500`}`;
                }
            });
        });
        console.log(`Turn: ${currentPlayer.num}, color: ${currentPlayer.color}`);
    }

    /* Place Token Functionality */

    async function updateCell(cell, player) {
        const token = document.createElement("div");

        token.className = `token ${player.color}`;
        cell.className = "filled";
        cell.appendChild(token);
    }

    async function placeToken(column) {
        disableClicks();
        if (!column || !column.id) {
            console.error("Column or column ID is invalid: ", column);
            return;
        }

        const cells = columnMap.get(column.id);
        if (!cells) {
            console.error("Cells are undefined for column ID: ", column.id);
            return;
        }
        const columnData = boardMap.get(column.id);
        if (!columnData) {
            console.error("ColumnData is undefined for column ID: ", column.id, boardMap);
            return;
        }    

        const row = columnData.findIndex(cell => cell === 0);
        if (row === -1){
            console.error("No rows left in column: ", column);
            return ;
        }

        const currentPlayer = player1.turn ? player1 : player2;
        columnData[row] = currentPlayer.num;

        await updateCell(cells[row], currentPlayer);
        await updateTurnIndicator();
        await delay(1000);
        enableClicks();
    }

    /* Check Win / Draw */

    function checkDraw() {
        let draw = true;

        columnList.forEach((column) => {
            const columnData = boardMap.get(column.id);
            if (!columnData) {
                console.error("Column data is undefined for column ID: ", column.id);
                return;
            }
            const row = columnData.findIndex(cell => cell === 0);
            if (row != -1) draw = false;
        });
        return draw;
    }

    function checkWin(checking) {
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
                    if (!checking) 
                        player1.num === currentPlayer ? player1.winner = true : player2.winner = true;
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
                    } else break;
                }
            }
            if (count >= 4) return true;
        }
        return false;
    }

    /* AI Functionality */

    async function aiToken() {
        const	winColumns = detectWinOpportunities(player2);
        if (winColumns.length > 0) {
            await winColumns[0].click();
            return;
        }

        const	threatColumns = detectWinOpportunities(player1);
        if (threatColumns.length > 0) {
            await threatColumns[0].click();
            return;
        }

		let columnToUse = 
            Math.random () < 0.2 ? columnList[Math.floor(Math.random() * columnList.length)] : doAlgorithm()
		console.log("AI column to use: ", columnToUse);

		if (columnToUse && !isColumnPlayable(columnToUse))
            columnToUse = columnList.find(column => isColumnPlayable(column));

		if (columnToUse) columnToUse.click()
    }

	function isColumnPlayable(column) {
        if (!column || !column.id) return false;
        
        if (column.classList.contains("opacity-50")) return false;
        
        const columnData = boardMap.get(column.id);
        const hasEmptyCell = columnData.some(cell => cell === 0);
        
        return hasEmptyCell;
    }

    function detectWinOpportunities(player) {
        const winColumns = [];
    
        columnList.forEach((column) => {
			if (!isColumnPlayable(column)) return;

            const columnData = boardMap.get(column.id);
            const row = columnData.findIndex(cell => cell === 0);
            if (row === -1) return;
    
            columnData[row] = player.num;
            const wouldWin = checkWin(true);
            columnData[row] = 0;
    
            if (wouldWin) winColumns.push(column);
        });
    
        return winColumns;
    }

   	function doAlgorithm() {
		let bestScore = -Infinity;
		let bestColumn = null;
	
		columnList.forEach((column) => {
			if (!isColumnPlayable(column)) return;
			
			const columnData = boardMap.get(column.id);
			const row = columnData.findIndex(cell => cell === 0);
			if (row === -1) return;
			
			const potential = evaluateColumnPotential(column.id, player2.num);
			
			if (potential === 0 && columnData.some(cell => cell === player1.num)) {
				return;
			}
	
			columnData[row] = player2.num;
			const score = minmax(5, false, -Infinity, Infinity) + potential;
			columnData[row] = 0;
	
			if (score > bestScore) {
				bestScore = score;
				bestColumn = column;
			}
		});
		if (!bestColumn) 
            bestColumn = columnList.find(column => isColumnPlayable(column));
		return bestColumn;
	}

    function minmax(depth, isMax, alpha, beta) {
        if (checkDraw()) return 0;
        if (depth === 0) return evaluateBoard();

        if (isMax) {
            columnList.forEach((column) => {
				if (!isColumnPlayable(column)) return;

                const columnData = boardMap.get(column.id);
                const row = columnData.findIndex(cell => cell === 0);
                if (row === -1) return;

                columnData[row] = player2.num;
                const eval = minmax(depth - 1, false, alpha, beta);
                columnData[row] = 0;

                alpha = Math.max(alpha, eval);
                if (beta <= alpha) return;
            });
            return alpha;
        }
        else {
            columnList.forEach((column) => {
				if (!isColumnPlayable(column)) return;

                const columnData = boardMap.get(column.id);
                const row = columnData.findIndex(cell => cell === 0);
                if (row === -1) return;

                columnData[row] = player1.num;
                const eval = minmax(depth - 1, true, alpha, beta);
                columnData[row] = 0;

                beta = Math.min(beta, eval);
                if (beta <= alpha) return;
            });
            return beta;
        }
    }

    function evaluateBoard() {
		let score = 0;
		
		score += evaluateLines(1, 0);
		score += evaluateLines(0, 1);
		score += evaluateLines(1, 1);
		score += evaluateLines(1, -1);
		
		return score;
	}

	function evaluateLines(deltaX, deltaY) {
		let score = 0;
		for (let startCol = 0; startCol < columnList.length - 3 * Math.abs(deltaX); startCol++) {
			for (let startRow = 0; startRow < 6 - 3 * Math.abs(deltaY); startRow++) {
				if (deltaY === -1 && startRow < 3) continue;
				let windowScore = evaluateWindow(startCol, startRow, deltaX, deltaY);
				score += windowScore;
			}
		}
		return score;
	}

	function evaluateWindow(col, row, deltaX, deltaY) {
		const window = [];
		
		for (let i = 0; i < 4; i++) {
			const currentCol = col + i * deltaX;
			const currentRow = row + i * deltaY;
			
			if (currentCol >= 0 && currentCol < columnList.length && 
				currentRow >= 0 && currentRow < 6) {
				const cellValue = boardMap.get(columnList[currentCol].id)[currentRow];
				window.push(cellValue);
			}
		}
		if (window.length !== 4) return 0;
		
		const ai = window.filter(cell => cell === player2.num).length;
		const human = window.filter(cell => cell === player1.num).length;
		const empty = window.filter(cell => cell === 0).length;
		
		if (ai === 4) return 100;
		if (human === 4) return -100;
		if (ai === 3 && empty === 1) return 10;
		if (human === 3 && empty === 1) return -10;
		if (ai === 2 && empty === 2) return 2;
		if (human === 2 && empty === 2) return -2;
		
		return 0;
	}

	function evaluateColumnPotential(columnId, playerNum) {
		let potential = 0;
		const columnData = boardMap.get(columnId);
		let verticalCount = 0;

		for (let i = 0; i < columnData.length; i++) {
			if (columnData[i] === playerNum) verticalCount++;
			else if (columnData[i] === 0) continue;
			else verticalCount = 0;
		}
		
		if (verticalCount >= 4) potential += 100;
		
		for (let row = 0; row < columnData.length; row++) {
			if (columnData[row] === 0 || columnData[row] === playerNum) {
				potential += checkLinePotential(
					parseInt(columnId.substring(1)) - 1, row, playerNum
				);
			}
		}
		return potential;
	}
	
	function checkLinePotential(col, row, playerNum) {
		let potential = 0;
		const directions = [
			{x: 1, y: 0},
			{x: 1, y: 1},
			{x: 1, y: -1}
		];
		
		for (const {x, y} of directions) {
			let space = 0;
			let count = 0;
			
			for (let i = -3; i <= 3; i++) {
				const newCol = col + i * x;
				const newRow = row + i * y;
				
				if (newCol >= 0 && newCol < 7 && newRow >= 0 && newRow < 6) {
					const value = boardMap.get(`c${newCol + 1}`)[newRow];
					if (value === 0) space++;
					else if (value === playerNum) count++;
					else {
						space = 0;
						count = 0;
					}
				}
			}
			if (space + count >= 4) potential += count * 2;
		}
		return potential;
	}

    /* Utils */

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    document.getElementById("btnMn").addEventListener("click", () => {
        clearGame();
        returnToMenu();
        console.log("Returning to menu...");
    });

    start();
}