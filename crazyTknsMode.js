import {
    init as initEngine,
    clearGame as clearGameEngine,
    insertDivWinner as insertDivWinnerEngine,
    insertDivDraw as insertDivDrawEngine,
    checkDraw as checkDrawEngine,
    checkWin as checkWinEngine,
    enableClicks as enableClicksEngine,
    disableClicks as disableClicksEngine,
    placeToken as placeTokenEngine,
    updateTurnIndicator as updateTurnIndicatorEngine,
    isColumnPlayable as isColumnPlayableEngine,
    detectWinOpportunities as detectWinOpportunitiesEngine,
    doAlgorithm as doAlgorithmEngine,
    delay as delayEngine,
} from './gameEngine.js';

export function crazyTokensMode(AI) {
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

    function init() {
        initEngine(player1, boardMap, columnMap, columnList);
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
        return clearGameEngine(player1, player2, columnList, columnMap, boardMap);
    }

    /* Click Functionality */

    function enableClicks() {
        return enableClicksEngine(columnList);
    }
    
    function disableClicks() {
        return disableClicksEngine(columnList);
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
                await delay(1000);
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
        document.getElementById("dice-container").style.pointerEvents = 'none';
        return insertDivWinnerEngine(player1, player2, columnList);
    }

    function insertDivDraw() {
        document.getElementById("dice-container").style.pointerEvents = 'none';
        return insertDivDrawEngine(columnList);
    }

    /* Turn Indicator */

    async function updateDice() {
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
		await delay(300);
        
    }

    async function updateTurnIndicator() {
        await updateDice();
        return updateTurnIndicatorEngine(player1, player2, columnList, columnMap);
    }
      
    /* Place Token Functionality */

    async function placeToken(column) {
        placeTokenEngine(column, player1, player2, columnMap, boardMap, columnList);
    }

    /* Check Win / Draw */

    function checkDraw() {
        return checkDrawEngine(boardMap, columnList, player1, player2);
    }

    function checkWin(checking) {
        return checkWinEngine(boardMap, columnList, player1, player2, checking);
    }

    /* AI Functionality */

    async function aiToken() {
		if (player2.affected && player2.affected === "🌫️"){
			console.log("AI is blind");
			await columnList[Math.floor(Math.random() * columnList.length)].click();
			return ;
		}

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

        if (columnToUse) await columnToUse.click()
    }
    
    function isColumnPlayable(column) {
        return isColumnPlayableEngine(column, boardMap);
    }

    function detectWinOpportunities(player) {
        return detectWinOpportunitiesEngine(boardMap, columnList, player);
    }

    function doAlgorithm() {
        return doAlgorithmEngine(boardMap, columnList, player1, player2);
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
		const	blockNeeded = threatColumns.length > 0;
        const	needSpecialToken = blockNeeded || Math.random() < 0.5;

        if (!player2.specialToken && player2.diceUses > 0 && needSpecialToken) {
            await rollDice();
            await delay(500);
        }

        const   totalCells = columnList.length * 6;
        const	filledCells = Array.from(document.getElementsByClassName("filled")).length;
        const   boardFilledRatio = filledCells / totalCells;
		const  shouldUseSpecial = player2.specialToken ? 
			shouldUseSpecialToken(player2.specialToken, blockNeeded, boardFilledRatio) : false;

		if (shouldUseSpecial) {
			await rollDice();
			delay(500);
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
        return delayEngine(ms);
    }

    document.getElementById("btnMn").addEventListener("click", () => {
        clearGame();
        returnToMenu();
        console.log("Returning to menu...");
    });

    start();
}
