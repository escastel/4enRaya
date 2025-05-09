function crazyTokensMode(AI) {
    let columnMap = new Map();
    let columnList = new Array();
    let boardMap = new Map();
    const crazyTokens = ["🌀", "🌫️", "💣", "🔒", "👻", "🎲"];

    class Player {
        color;
        turn;
        winner;
        num;
        AI;
        count;
        constructor(AI, num, color) {
            this.AI = AI;
            this.num = num;
            this.color = color;
            this.count = 0;
            this.turn = false;
            this.winner = false;
            this.specialToken = null;
            this.useSpecial = false;
            this.affected = null; 
            this.turnAffected = 0;
            this.diceUses = 3;
        }
    }
    const player1 = new Player(false, 1, "red");
    const player2 = new Player(AI, 2, "yellow");

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
            boardMap.set("c" + i.toString(), Array(6).fill(0));
            columnMap.set("c" + i.toString(), setArray(i.toString()));
            columnList.push(document.getElementById("c" + i.toString()));
        }
    }

    async function start() {
        clearGame();
        init();
        insertDice();
        enableClicks();
        await document.getElementById("dice-container").addEventListener("click", () => rollDice());
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
            if (!column.classList.contains("opacity-50"))
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

        const currentPlayer = player1.turn ? player1 : player2;
        if (currentPlayer.affected && currentPlayer.affected != "🎲" && currentPlayer.turnAffected > 0)
            await disableEffects(currentPlayer);

        if (currentPlayer.useSpecial && currentPlayer.affected === "🎲"){
            const randomColumn = columnList[Math.floor(Math.random() * columnList.length)];
            await placeSpecialToken(randomColumn);
            await disableEffects(currentPlayer);
        }
        else if (currentPlayer.useSpecial)
            await placeSpecialToken(column)
        else if (currentPlayer.affected && currentPlayer.affected === "🎲"){
            const randomColumn = columnList[Math.floor(Math.random() * columnList.length)];
            await placeToken(randomColumn);
            await disableEffects(currentPlayer);
        }
        else
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

    /* Insert Div Win / Draw / Dice */

    function insertDice() {
        const diceContainer = document.createElement("div");

        diceContainer.id = "dice-container";
        diceContainer.className = "flex items-center justify-center w-20 h-20 rounded-lg bg-gray-100 shadow-lg transition-all ease-in-out";
        diceContainer.innerHTML = `<span id="dice-icon">⚪</span>`;
        diceContainer.style.backgroundColor = `rgba(255, 2, 2, 0.811)`;
        document.getElementById("board").appendChild(diceContainer);
    }

    function insertDivWinner() {
        const winner = document.getElementById("winner");
        const playerWinner = player1.winner ? `${player1.color}` : `${player2.color}`;
        const player = player1.winner ? "Player 1" : "Player 2";
        winner.classList.add(playerWinner);
        winner.style.display = "block";
        winner.innerHTML = `¡El <span>${player}</span> ha ganado!`;
    
        document.getElementById("dice-container").style.pointerEvents = 'none';
        disableClicks();
    }

    function insertDivDraw() {
        const draw = document.getElementById("draw");

        draw.innerText = `¡Empate!`;
        draw.style.display = "block";
        document.getElementById("dice-container").style.pointerEvents = 'none';
        disableClicks();
    }

    /* Turn Indicator */

    function updateDice() {
        const currentPlayer = player1.turn ? player1 : player2;

        const diceContainer = document.getElementById("dice-container");
        diceContainer.style.backgroundColor = `${currentPlayer.color === "red" ? 
            `rgba(255, 2, 2, 0.811)` : `rgba(255, 237, 35, 0.874)`}`;
        diceContainer.style.transition = `background-color 0.5s ease-in-out`;
        
        const diceIcon = document.getElementById("dice-icon");
        if (currentPlayer.specialToken != null)
            diceIcon.innerText = `${currentPlayer.specialToken}`
        else if (!currentPlayer.specialToken && currentPlayer.diceUses == 0)
            diceIcon.innerText = `❌`;
        else
            diceIcon.innerText = `⚪`
        
    }

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
        updateDice();
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
        const columnData = boardMap.get(column.id);
        if (!cells || !columnData) {
            console.error("Cells or columnData is undefined for column ID: ", column.id);
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
        const winColumns = detectWinOpportunities(player2);
        if (winColumns.length > 0) {
            await winColumns[0].click();
            return;
        }
    
        const	threatColumns = detectWinOpportunities(player1);
        let     columnToUse = await controlUseDice(threatColumns);

		if (!columnToUse){
			if (threatColumns.length > 0) {
				await threatColumns[0].click();
            	return;
			}
			columnToUse =
            	Math.random () < 0.2 ? columnList[Math.floor(Math.random() * columnList.length)] : doAlgorithm();
		}

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

	/* Special Tokens AI Functionality */
	
	function countTokens(playerNum) {
		let count = 0;

		columnList.forEach((column) => {
			const columnData = boardMap.get(column.id);
			count += columnData.filter(v => v === playerNum).length;
		});
		return count;
	}

    function shouldUseSpecialToken(token, blockNeeded, boardFilledRatio) {
        const	playerTokens = countTokens(player2.num);
    	const	opponentTokens = countTokens(player1.num);

		switch (token) {
            case "💣":
                return boardFilledRatio >= 0.5;
            case "🔒":
                return blockNeeded;
            case "👻":
                return boardFilledRatio >= 0.5;
            case "🌫️":
            	return blockNeeded || opponentTokens > playerTokens + 4;
			case "🌀":
            	return opponentTokens > playerTokens && boardFilledRatio > 0.35;
            case "🎲":
                return blockNeeded || opponentTokens > playerTokens + 4;;
            default:
                return false;
        }
    }

	function chooseBestColumn(token){
		let bestCol = null;
		let maxEnemyTokens = 0;

		if (token === "👻") {
			bestCol = columnList[Math.floor(columnList.length / 2)];
			if (isColumnPlayable(bestCol)) return bestCol;
			bestCol = null;
		}

		columnList.forEach((column) => {
			if (!isColumnPlayable(column)) return ;

			const columnData = boardMap.get(column.id);
			const enemyCount = columnData.filter(v => v === player1.num).length;
			if (enemyCount > maxEnemyTokens) {
				maxEnemyTokens = enemyCount;
				bestCol = column;
			}
		});
		return bestCol;
	}

    function chooseBestColumnForToken(token, threats) {
        switch (token) {
            case "🔒":
                return threats.length > 0 ? threats[0] : null;
            case "💣": 
                return chooseBestColumn("💣");
            case "👻":
				return chooseBestColumn("👻");
            default:
                return null;
        }
    }

    async function controlUseDice(threatColumns) {
		let		columnToUse = null;
		const	dice = document.getElementById("dice-container");
		const	blockNeeded = threatColumns.length > 0;
        const	needSpecialToken = blockNeeded || Math.random() < 0.5;

        if (!player2.specialToken && player2.diceUses > 0 && needSpecialToken) {
            await dice.click();
            await delay(500);
        }

        const   totalCells = columnList.length * 6;
        const	filledCells = Array.from(document.getElementsByClassName("filled")).length;
        const   boardFilledRatio = filledCells / totalCells;
		const  shouldUseSpecial = player2.specialToken ? 
			shouldUseSpecialToken(player2.specialToken, blockNeeded, boardFilledRatio) : false;

		if (shouldUseSpecial) {
			await dice.click();
			const specialColumn = chooseBestColumnForToken(player2.specialToken, threatColumns);
			if (specialColumn) 
				columnToUse = Math.random () < 0.2 ? 
					columnList[Math.floor(Math.random() * columnList.length)] : specialColumn;
			player2.useSpecial = true;
		}
		return columnToUse;
	}

    /* Special Tokens Functionality */

    async function rollDice() {
        const currentPlayer = player1.turn ? player1 : player2;
        const diceContainer = document.getElementById("dice-container");
        const diceIcon = document.getElementById("dice-icon");
    
        if (currentPlayer.diceUses <= 0 && !currentPlayer.specialToken) {
            diceIcon.innerText = "❌";
            return;
        }
        if (currentPlayer.specialToken) {
            currentPlayer.useSpecial = true;
            diceContainer.classList.add("usingDice");
            await delay(1000);
            diceContainer.classList.remove("usingDice");
            diceContainer.style.pointerEvents = 'none'
            return ;
        }

        diceContainer.classList.add("rolling");
        await delay(1000);
        const randomIndex = Math.floor(Math.random() * crazyTokens.length);
        const newToken = crazyTokens[randomIndex];
        
        diceIcon.innerText = newToken;
        currentPlayer.specialToken = newToken;
        currentPlayer.diceUses--;

        diceContainer.classList.remove("rolling");
    }

    /* Disable Effects */

    async function disableLock(){
        columnList.forEach((column) => {
            column.classList.remove("opacity-50");
            column.style.pointerEvents = "auto";
        });
        let tokens = Array.from(document.getElementsByClassName("lockToken"));
        tokens.forEach((token) => {
            token.innerText = "";
        });
    }

    async function disableBlind(){
        console.log("disableBlind")
        let tokens = Array.from(document.getElementsByClassName("token"));
        tokens.forEach((token) => {
            token.style.backgroundColor = token.classList.contains("red") ? "red" : "yellow";
            token.innerText = "";
        });
    }

    async function disableGhost() {
        let tokens = Array.from(document.getElementsByClassName("ghostToken"));
        for (const token of tokens) {
            const columnId = token.parentElement.parentElement.id;
            const columnData = boardMap.get(columnId);
            const row = Array.from(columnMap.get(columnId)).indexOf(document.getElementById(token.parentElement.id));
            if (row !== -1) {
                columnData[row] = 0;
            }
    
            token.parentElement.className = `cell ${player1.turn ?
                `bg-gradient-to-r hover:from-pink-400 hover:to-red-500` :
                `bg-gradient-to-r hover:from-orange-400 hover:to-yellow-500`}`;
            token.remove();
            await delay(300);
            await updateBoard(columnId);
        }
    }

    async function disableDice() {
        let tokens = Array.from(document.getElementsByClassName("diceToken"));
        tokens.forEach((token) => {
            token.innerText = "";
        });
    }

    async function disableEffects(currentPlayer){
        switch (currentPlayer.affected) {
            case "🔒":
                await disableLock();
                break;
            case "🌫️":
                await disableBlind();
                break;
            case "👻":
                await disableGhost();
                break;
            case "🎲":
                await disableDice();
                break;
        }
        currentPlayer.affected = null;
        currentPlayer.turnAffected = 0;
    }

    /* Handle Special Effects */

    async function updateBoard(colId){
        const columnData = boardMap.get(colId);
        const cells = columnMap.get(colId);

        for (let row = 0; row < columnData.length; row++) {
            if (columnData[row] != 0){
                const emptyCell = columnData.findIndex(cell => cell === 0);
                if (emptyCell > row) continue ;
                columnData[emptyCell] = columnData[row] = 1 ? 1 : 2;
                columnData[row] = 0;
                if (cells[row].hasChildNodes()){
                    const token = cells[row].firstChild;
                    token.style.animationName = 'none';
                    token.offsetHeight;
                    token.style.animationName = 'moveToken 0.15 ease-in-out forwards';
                    await delay(150);
                    cells[row].removeChild(token);
                    cells[row].className = `cell ${player1.turn ?
                        `bg-gradient-to-r hover:from-pink-400 hover:to-red-500` :
                        `bg-gradient-to-r hover:from-orange-400 hover:to-yellow-500`}`;
                    cells[emptyCell].appendChild(token);
                    cells[emptyCell].className = "filled";
                }
            }
        }
        await delay(250);
    }

    function handleReverse(){
        for (let col = 0; col < columnList.length; col++) {
            const columnId = columnList[col].id;
            const columnData = boardMap.get(columnId);

            for (let row = 0; row < columnData.length; row++) {
                if (columnData[row] == 1) columnData[row] = 2;
                else if (columnData[row] == 2) columnData[row] = 1;
            }
        }

        let tokens = Array.from(document.getElementsByClassName("token"))
        tokens.forEach(token => {
			if (token.classList.contains("red")) {
                token.classList.remove("red");
                token.classList.add("yellow");
            } 
            else if (token.classList.contains("yellow")) {
                token.classList.remove("yellow");
                token.classList.add("red");
            }
            token.innerText = "";
		})
        player1.color === "red" ? player1.color = "yellow" : player1.color = "red";
        player2.color === "yellow" ? player2.color = "red" : player2.color = "yellow";
        player1.num === 1 ? player1.num = 2 : player1.num = 1;
        player2.num === 2 ? player2.num = 1 : player2.num = 2;
    }

    async function handleBlind(player) {
        const opponent = player === player1 ? player2 : player1;
        opponent.affected = player === player1 ? player1.specialToken : player2.specialToken;
        opponent.turnAffected = 1;

        let tokens = Array.from(document.getElementsByClassName("token"));
        tokens.forEach(token => {
            token.style.backgroundColor = "gray";
        });
      } 

    async function handleBomb(row, columnId) {
        const colIndex = columnList.findIndex(col => col.id === columnId);
      
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = 1; dy >= -1; dy--) {
            const newCol = colIndex + dx;
            const newRow = row + dy;
      
            if (newCol >= 0 && newCol < columnList.length && newRow >= 0 && newRow < 6) {
                const col = columnList[newCol];
                const cell = columnMap.get(col.id)[newRow];
                cell.style.transition = 'background-color 0.3s';
                cell.style.backgroundColor = '#ff000088';
                await delay(200);
                boardMap.get(col.id)[newRow] = 0;
                cell.innerHTML = "";
                cell.style.backgroundColor = "";
                cell.className = `cell ${player1.turn ?
                `bg-gradient-to-r hover:from-pink-400 hover:to-red-500` :
                `bg-gradient-to-r hover:from-orange-400 hover:to-yellow-500`}`;
                await updateBoard(col.id);
            }
          }
        }
        await delay(300);
    }

    async function handleLock(column, player) {
        const opponent = player === player1 ? player2 : player1;
        opponent.affected = player === player1 ? player1.specialToken : player2.specialToken;
        opponent.turnAffected = 1;
        column.classList.add("opacity-50");
        column.style.pointerEvents = "none";
        await delay(500);
    } 

	
    async function handleGhost() {
        const opponent = player1.turn ? player2 : player1;
        const currentPlayer = player1.turn ? player1 : player2;

        player1.turn = !player1.turn;
        player2.turn = !player2.turn;
        opponent.affected = currentPlayer === player1 ? player1.specialToken : player2.specialToken;
        opponent.turnAffected = 1;
    } 

	async function handleDice(){
		const opponent = player1.turn ? player2 : player1;
        opponent.affected = player1.turn ? player1.specialToken : player2.specialToken;
        opponent.turnAffected = 1;
	}

    async function handleSpecialToken(row, player, column) {
        switch (player.specialToken) {
            case "🌀":
                await handleReverse();
                break;
            case "🌫️":
                await handleBlind(player);
                break;
            case "💣":
                await handleBomb(row, column.id);
                break;
            case "🔒":
                await handleLock(column, player);
                break;
            case "👻":
                await handleGhost(player, column);
                break;
            case "🎲":
                await handleDice();
                break;
          default:
            break;
        }
        document.getElementById("dice-container").style.pointerEvents = 'auto';
    }

    /* Place Special Token */

    async function updateSpecialCell(cell, player) {
        const token = document.createElement("div");

        token.className = `token ${player.color}`;
        if (player.specialToken === "👻")
            token.classList.add("ghostToken", "opacity-50", "grayscale");
        if (player.specialToken === "🎲")
            token.classList.add("diceToken")
        if (player.specialToken === "🔒")
            token.classList.add("lockToken")
        if (player.specialToken === "🌫️")
            token.classList.add("blindToken")
        token.innerText = `${player.specialToken}`;
        cell.className = "filled";
        cell.appendChild(token);
        await delay(1000);
    }

    async function placeSpecialToken(column) {
        disableClicks();

        const currentPlayer = player1.turn ? player1 : player2;
        const cells = columnMap.get(column.id);
        const columnData = boardMap.get(column.id);
        const row = columnData.findIndex(cell => cell === 0);
        if (row === -1) return;
        if (currentPlayer.specialToken === "👻")
            columnData[row] = 3;
        else
            columnData[row] = currentPlayer.num;

        await updateSpecialCell(cells[row], currentPlayer);
        document.getElementById("board").style.pointerEvents = 'none';
        await handleSpecialToken(row, currentPlayer, column);
        document.getElementById("board").style.pointerEvents = 'auto';
        await updateTurnIndicator();

        enableClicks();
        currentPlayer.specialToken = null;
        currentPlayer.useSpecial = false;
    }

    /* Utils */

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    document.getElementById("btnMn").addEventListener("click", () => {
        clearGame();
        returnToMenu();
    });

    start();
}
