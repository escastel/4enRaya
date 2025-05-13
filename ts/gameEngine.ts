export function setArray(num) {
	let array = new Array();
	
    for (let i = 1; i <= 6; i++)
        array.push(document.getElementById("c" + num + i.toString()));
	return array;
}

export function init(player1, boardMap, columnMap, columnList) {
	player1.turn = true;
	
    for (let i = 1; i <= 7; i++) {
		boardMap.set(("c" + i.toString()), Array(6).fill(0));
        columnMap.set("c" + i.toString(), setArray(i.toString()));
        columnList.push(document.getElementById("c" + i.toString()));
    }
}

export function enableClicks(columnList) {
	columnList.forEach((column) => {
		column.style.pointerEvents = "auto";
	});
}

export function disableClicks(columnList) {
	columnList.forEach((column) => {
		column.style.pointerEvents = "none";
	});
}

export	function clearGame(player1, player2, columnList, columnMap, boardMap) {
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
        winnerDiv.classList.remove(`${player1.winner ? `${player1.color}` : `${player2.color}`}`);
    }
    if (drawDiv) drawDiv.style.display = "none";
}

export function insertDivWinner(player1, player2, columnList) {
		const winner = document.getElementById("winner");
		const playerWinner = player1.winner ? `${player1.color}` : `${player2.color}`;
		const player = player1.winner ? "Player 1" : "Player 2";
		if (winner){
			winner.classList.add(playerWinner);
			winner.style.display = "block";
			winner.innerHTML = `¡El <span>${player}</span> ha ganado!`;
		}
		disableClicks(columnList);
}

export function insertDivDraw(columnList) {
	const draw = document.getElementById("draw");
	if (!draw) return;

	draw.innerText = `¡Empate!`;
	draw.style.display = "block";
	disableClicks(columnList);
}

async function updateDice(player1, player2) {
        const currentPlayer = player1.turn ? player1 : player2;

        const diceContainer = document.getElementById("dice-container");
		if (!diceContainer) return;

        diceContainer.style.backgroundColor = `${currentPlayer.color === "red" ? 
            `rgba(255, 2, 2, 0.811)` : `rgba(255, 237, 35, 0.874)`}`;
        diceContainer.style.transition = `background-color 0.5s ease-in-out`;
        
        const diceIcon = document.getElementById("dice-icon");
		if (!diceIcon) return;
        
        if (currentPlayer.specialToken != null)
            diceIcon.innerText = `${currentPlayer.specialToken}`
        else if (!currentPlayer.specialToken && currentPlayer.diceUses == 0)
            diceIcon.innerText = `❌`;
        else
            diceIcon.innerText = `⚪`
		await delay(300);
}  

export async function updateTurnIndicator(player1, player2, columnList, columnMap, mode) {
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
        if (mode == "crazy") 
            await updateDice(player1, player2);
        console.log(`Turn: ${currentPlayer.num}, color: ${currentPlayer.color}`);
}


async function updateCell(cell, player) {
        const token = document.createElement("div");

        token.className = `token ${player.color}`;
        cell.className = "filled";
        cell.appendChild(token);
}

export async function placeToken(column, player1, player2, columnMap, boardMap, columnList, mode) {
    disableClicks(columnList);
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
    await updateTurnIndicator(player1, player2, columnList, columnMap, mode);
    await delay(1000);
    enableClicks(columnList);
}

export function checkDraw(boardMap, columnList) {
    let draw = true;

    columnList.forEach((column) => {
        const columnData = boardMap.get(column.id);
        if (!columnData) return;
        
        const row = columnData.findIndex(cell => cell === 0);
        if (row !== -1) draw = false;
    });
    return draw;
}

export function checkWin(boardMap, columnList, player1, player2, checking) {
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

			if (checkDirection(col, row, currentPlayer, directions, columnList, boardMap)) {
				if (!checking) 
					player1.num === currentPlayer ? player1.winner = true : player2.winner = true;
				return true;
			}
		}
	}
	return false;
}

function checkDirection(col, row, player, directions, columnList, boardMap) {
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

export function isColumnPlayable(column, boardMap) {
	if (!column || !column.id) return false;
	
	if (column.classList.contains("opacity-50")) return false;
	
	const columnData = boardMap.get(column.id);
	if (!columnData) return false;
	
	const hasEmptyCell = columnData.some(cell => cell === 0);
	return hasEmptyCell;
}

export function detectWinOpportunities(boardMap, columnList, player, player1, player2) {
    const winColumns: HTMLElement[] = [];

	columnList.forEach((column) => {
		if (!isColumnPlayable(column, boardMap)) return;

		const columnData = boardMap.get(column.id);
		const row = columnData.findIndex(cell => cell === 0);
		if (row === -1) return;

		columnData[row] = player.num;
		const wouldWin = checkWin(boardMap, columnList, player1, player2, true);
		columnData[row] = 0;

		if (wouldWin) winColumns.push(column);
	});

	return winColumns;
}

export function doAlgorithm(boardMap, columnList, player1, player2) {
	let bestScore = -Infinity;
	let bestColumn = null;

	columnList.forEach((column) => {
		if (!isColumnPlayable(column, boardMap)) return;
		
		const columnData = boardMap.get(column.id);
		const row = columnData.findIndex(cell => cell === 0);
		if (row === -1) return;
		
		const potential = evaluateColumnPotential(boardMap, column.id, player2.num);
		
		if (potential === 0 && columnData.some(cell => cell === player1.num)) {
			return;
		}

		columnData[row] = player2.num;
		const score = minmax(5, false, -Infinity, Infinity, boardMap, columnList, player1, player2) + potential;
		columnData[row] = 0;

		if (score > bestScore) {
			bestScore = score;
			bestColumn = column;
		}
	});
	
	if (!bestColumn) 
		bestColumn = columnList.find(column => isColumnPlayable(column, boardMap));

	return bestColumn;
}

function minmax(depth, isMax, alpha, beta, boardMap, columnList, player1, player2) {
    if (checkDraw(boardMap, columnList)) return 0;
    if (depth === 0) return evaluateBoard(boardMap, columnList, player2.num, player1.num);

    if (isMax) {
        columnList.forEach((column) => {
            if (!isColumnPlayable(column, boardMap)) return;

            const columnData = boardMap.get(column.id);
            const row = columnData.findIndex(cell => cell === 0);
            if (row === -1) return;

            columnData[row] = player2.num;
            let evaluation = minmax(depth - 1, false, alpha, beta, boardMap, columnList, player1, player2);
            columnData[row] = 0;

            alpha = Math.max(alpha, evaluation);
            if (beta <= alpha) return;
        });
        return alpha;
    }
    else {
        columnList.forEach((column) => {
            if (!isColumnPlayable(column, boardMap)) return;

            const columnData = boardMap.get(column.id);
            const row = columnData.findIndex(cell => cell === 0);
            if (row === -1) return;

            columnData[row] = player1.num;
            const evaluation = minmax(depth - 1, true, alpha, beta, boardMap, columnList, player1, player2);
            columnData[row] = 0;

            beta = Math.min(beta, evaluation);
            if (beta <= alpha) return;
        });
        return beta;
    }
}

function evaluateBoard(boardMap, columnList, aiNum, humanNum) {
    let score = 0;
    
    score += evaluateLines(boardMap, columnList, aiNum, humanNum, 1, 0);
    score += evaluateLines(boardMap, columnList, aiNum, humanNum, 0, 1);
    score += evaluateLines(boardMap, columnList, aiNum, humanNum, 1, 1);
    score += evaluateLines(boardMap, columnList, aiNum, humanNum, 1, -1);
    
    return score;
}

function evaluateLines(boardMap, columnList, aiNum, humanNum, deltaX, deltaY) {
    let score = 0;

    for (let startCol = 0; startCol < columnList.length - 3 * Math.abs(deltaX); startCol++) {
        for (let startRow = 0; startRow < 6 - 3 * Math.abs(deltaY); startRow++) {
            if (deltaY === -1 && startRow < 3) continue;
            let mapScore = evaluateMap(boardMap, columnList, aiNum, humanNum, startCol, startRow, deltaX, deltaY);
            score += mapScore;
        }
    }
    return score;
}

function evaluateMap(boardMap, columnList, aiNum, humanNum, col, row, deltaX, deltaY) {
    const map: number[] = [];
    
    for (let i = 0; i < 4; i++) {
        const currentCol = col + i * deltaX;
        const currentRow = row + i * deltaY;
        
        if (currentCol >= 0 && currentCol < columnList.length && 
            currentRow >= 0 && currentRow < 6) {
            const cellValue = boardMap.get(columnList[currentCol].id)[currentRow];
            map.push(cellValue);
        }
    }
    if (map.length !== 4) return 0;
    
    const ai = map.filter(cell => cell === aiNum).length;
    const human = map.filter(cell => cell === humanNum).length;
    const empty = map.filter(cell => cell === 0).length;
    
    if (ai === 4) return 100;
    if (human === 4) return -100;
    if (ai === 3 && empty === 1) return 10;
    if (human === 3 && empty === 1) return -10;
    if (ai === 2 && empty === 2) return 2;
    if (human === 2 && empty === 2) return -2;
    
    return 0;
}

function evaluateColumnPotential(boardMap, columnId, playerNum) {
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
            potential += checkLinePotential(boardMap, parseInt(columnId.substring(1)) - 1, row, playerNum);
        }
    }
    return potential;
}

function checkLinePotential(boardMap, col, row, playerNum) {
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

export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}