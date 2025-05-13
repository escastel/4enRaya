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
} from './gameEngine.ts';

interface Player {
	color: string;
	turn: boolean;
	winner: boolean;
	num: number;
	AI: boolean;
	count: number;
	specialToken: string | null;
	useSpecial: boolean
	affected: string | null;
	turnAffected: number;
	diceUses: number;
}

export function crazyTokensMode(activateAI: boolean): void {
	const columnMap: Map<string, HTMLElement[]> = new Map();
	const columnList: HTMLElement[] = [];
	const boardMap: Map<string, number[]> = new Map();
    const crazyTokens: string[] = ["🌀", "🌫️", "💣", "🔒", "👻", "🎲"];

    class PlayerClass {
        color: string;
		turn: boolean = false;
		winner: boolean = false;
		num: number;
		AI: boolean;
        count: number = 0;
		specialToken: string | null = null;
		useSpecial: boolean = false;
		affected: string | null = null;
		turnAffected: number = 0;
		diceUses: number = 3;
        constructor(AI, num, color) {
            this.AI = AI;
            this.num = num;
            this.color = color;
        }
    }
	const player1 = new PlayerClass(false, 1, "red");
	const player2 = new PlayerClass(activateAI, 2, "yellow");

    /* Initialization Functionality */

    function init(): void {
        initEngine(player1, boardMap, columnMap, columnList);
    }

    async function start(): Promise<void> {
        clearGame();
        init();
        insertDice();
        enableClicks();
        await document.getElementById("dice-container")!.addEventListener("click", () => rollDice());
        columnList.forEach((column) => {
            column.addEventListener("click", async () => handleColumnClick(column));
        });
    }

    function clearGame(): void {
        return clearGameEngine(player1, player2, columnList, columnMap, boardMap);
    }

    /* Click Functionality */

    function enableClicks(): void {
        return enableClicksEngine(columnList);
    }
    
    function disableClicks(): void {
        return disableClicksEngine(columnList);
    }

    /* Handle Column Click */

    async function handleColumnClick(column: HTMLElement): Promise<void> {
        if (player1.winner || player2.winner) { 
			clearGame(); 
			return; 
		}

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
       if (checkWin(false)) {
			insertDivWinner();
			disableClicks();
		} else if (checkDraw()) {
			insertDivDraw();
			disableClicks();
		} else {
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

    function insertDice(): void {
        const diceContainer = document.createElement("div");

        diceContainer.id = "dice-container";
        diceContainer.className = "flex items-center justify-center w-20 h-20 rounded-lg bg-gray-100 shadow-lg transition-all ease-in-out";
        diceContainer.innerHTML = `<span id="dice-icon">⚪</span>`;
        diceContainer.style.backgroundColor = `rgba(255, 2, 2, 0.811)`;
        document.getElementById("board")!.appendChild(diceContainer);
    }

    function insertDivWinner(): void {
        document.getElementById("dice-container")!.style.pointerEvents = 'none';
        return insertDivWinnerEngine(player1, player2, columnList);
    }

    function insertDivDraw(): void {
        document.getElementById("dice-container")!.style.pointerEvents = 'none';
        return insertDivDrawEngine(columnList);
    }

    /* Turn Indicator */

    async function updateTurnIndicator(): Promise<void> {
        await updateTurnIndicatorEngine(player1, player2, columnList, columnMap, "crazy");
    }
      
    /* Place Token Functionality */

    async function placeToken(column: HTMLElement): Promise<void> {
        await placeTokenEngine(column, player1, player2, columnMap, boardMap, columnList, "crazy");
    }

    /* Check Win / Draw */

	function checkDraw(): boolean {
		return checkDrawEngine(boardMap, columnList);
	}

	function checkWin(checking: boolean): boolean {
		return checkWinEngine(boardMap, columnList, player1, player2, checking);
	}

    /* AI Functionality */

    async function aiToken(): Promise<void> {
		if (player2.affected && player2.affected === "🌫️"){
			console.log("AI is blind");
            columnList[Math.floor(Math.random() * columnList.length)]?.click();
			return ;
		}

        const winColumns = detectWinOpportunities(player2);
        if (winColumns.length > 0) {
            winColumns[0]?.click();
            return;
        }
    
        const	threatColumns = detectWinOpportunities(player1);
        let columnToUse: HTMLElement | null = await controlUseDice(threatColumns);

		if (!columnToUse){
			if (threatColumns.length > 0) {
                threatColumns[0]?.click();
            	return;
			}
            columnToUse = Math.random() < 0.2 
                ? (columnList[Math.floor(Math.random() * columnList.length)] ?? null) 
                : doAlgorithm();
		}

        if (columnToUse && !isColumnPlayable(columnToUse))
            columnToUse = columnList.find(column => isColumnPlayable(column)) ?? null;
        
        if (columnToUse) columnToUse.click();
    }
    
	function isColumnPlayable(column: HTMLElement): boolean {
		return isColumnPlayableEngine(column, boardMap);
	}

	function detectWinOpportunities(player: Player): HTMLElement[] {
		return detectWinOpportunitiesEngine(boardMap, columnList, player, player1, player2);
	}

	function doAlgorithm(): HTMLElement | null {
		return doAlgorithmEngine(boardMap, columnList, player1, player2);
	}

	/* Special Tokens AI Functionality */

	function countTokens(playerNum): number {
		let count = 0;

		columnList.forEach((column) => {
			const columnData = boardMap.get(column.id);
			if (!columnData) return;

			count += columnData.filter(v => v === playerNum).length;
		});
		return count;
	}

    function shouldUseSpecialToken(token, blockNeeded, boardFilledRatio): boolean {
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

	function chooseBestColumn(token): HTMLElement | null {
		let bestCol;
		let maxEnemyTokens = 0;

		if (token === "👻") {
			bestCol = columnList[Math.floor(columnList.length / 2)];
			if (isColumnPlayable(bestCol)) return bestCol;
			bestCol = null;
		}

		columnList.forEach((column) => {
			if (!isColumnPlayable(column)) return ;

			const columnData = boardMap.get(column.id);
			if (!columnData) return;
			const enemyCount = columnData.filter(v => v === player1.num).length;
			if (enemyCount > maxEnemyTokens) {
				maxEnemyTokens = enemyCount;
				bestCol = column;
			}
		});
		return bestCol;
	}

    function chooseBestColumnForToken(token, threats): HTMLElement | null {
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

    async function controlUseDice(threatColumns): Promise<HTMLElement | null> {
		let		columnToUse: Promise<HTMLElement | null> = Promise.resolve(null);
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
				columnToUse = Promise.resolve(Math.random () < 0.2 ? 
					columnList[Math.floor(Math.random() * columnList.length)] : specialColumn);
			player2.useSpecial = true;
		}
		return columnToUse;
	}

    /* Special Tokens Functionality */

    async function rollDice(): Promise<void> {
        const currentPlayer = player1.turn ? player1 : player2;
        
        const diceContainer = document.getElementById("dice-container");
        const diceIcon = document.getElementById("dice-icon");
		if (!diceContainer || !diceIcon) return;
    
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

    async function disableLock(): Promise<void> {
        columnList.forEach((column) => {
            column.classList.remove("opacity-50");
            column.style.pointerEvents = "auto";
        });

        let tokens = Array.from(document.getElementsByClassName("lockToken"));
        tokens.forEach((token) => {
            (token as HTMLElement).innerText = "";
        });
    }

    async function disableBlind(): Promise<void> {
        let tokens = Array.from(document.getElementsByClassName("token"));
        
        tokens.forEach((token) => {
            (token as HTMLElement).style.backgroundColor = token.classList.contains("red") ? "red" : "yellow";
            (token as HTMLElement).innerText = "";
        });
    }

    async function disableGhost(): Promise<void> {
        let tokens = Array.from(document.getElementsByClassName("ghostToken"));
        
        for (const token of tokens) {
            if (!token.parentElement || !token.parentElement.parentElement) continue;
            const columnId = token.parentElement.parentElement.id;
            
            const columnData = boardMap.get(columnId);
            if (!columnData) continue;
            
            const columnCells = columnMap.get(columnId);
            if (!columnCells) continue;
            
            const row = Array.from(columnCells).indexOf(document.getElementById(token.parentElement.id) as HTMLElement);
            if (row !== -1)
                columnData[row] = 0;
    
            token.parentElement.className = `cell ${player1.turn ?
                `bg-gradient-to-r hover:from-pink-400 hover:to-red-500` :
                `bg-gradient-to-r hover:from-orange-400 hover:to-yellow-500`}`;
            token.remove();
            await delay(300);
            await updateBoard(columnId);
        }
    }

    async function disableDice(): Promise<void> {
        let tokens = Array.from(document.getElementsByClassName("diceToken"));
        tokens.forEach((token) => {
            (token as HTMLElement).innerText = "";
        });
    }

    async function disableEffects(currentPlayer): Promise<void> {
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

    async function updateBoard(colId: string): Promise<void> {
        const columnData = boardMap.get(colId);
        const cells = columnMap.get(colId);
        if (!columnData || !cells) return;

        for (let row = 0; row < columnData.length; row++) {
            if (columnData[row] !== 0) {
                const emptyCell = columnData.findIndex(cell => cell === 0);
                if (emptyCell === -1 || emptyCell <= row) continue;

                columnData[emptyCell] = columnData[row] === 1 ? 1 : 2;
                columnData[row] = 0;

                if (cells[row]?.hasChildNodes()) {
                    const token = cells[row].firstChild as HTMLElement | null;
                    if (token) {
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
        }
        await delay(250);
    }

    function handleReverse(): void{
        for (let col = 0; col < columnList.length; col++) {
            const columnId = columnList[col].id;
            const columnData = boardMap.get(columnId);
			if (!columnData) continue;

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
            (token as HTMLElement).innerText = "";
		})

        player1.color === "red" ? player1.color = "yellow" : player1.color = "red";
        player2.color === "yellow" ? player2.color = "red" : player2.color = "yellow";
        player1.num === 1 ? player1.num = 2 : player1.num = 1;
        player2.num === 2 ? player2.num = 1 : player2.num = 2;
    }

    async function handleBlind(player): Promise<void> {
        const opponent = player === player1 ? player2 : player1;
        opponent.affected = player === player1 ? player1.specialToken : player2.specialToken;
        opponent.turnAffected = 1;

        let tokens = Array.from(document.getElementsByClassName("token"));
        tokens.forEach(token => {
            (token as HTMLElement).style.backgroundColor = "gray";
        });
      } 

    async function handleBomb(row: number, columnId: string): Promise<void> {
        const colIndex = columnList.findIndex(col => col.id === columnId);
      
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = 1; dy >= -1; dy--) {
            const newCol = colIndex + dx;
            const newRow = row + dy;
      
            if (newCol >= 0 && newCol < columnList.length && newRow >= 0 && newRow < 6) {
                const col = columnList[newCol];
                const columnCells = columnMap.get(col.id);
                const columnData = boardMap.get(col.id);

                if (columnCells && columnData) {
                    const cell = columnCells[newRow];
                    cell.style.transition = 'background-color 0.3s';
                    cell.style.backgroundColor = '#ff000088';
                    await delay(200);
                    columnData[newRow] = 0;
                    cell.innerHTML = "";
                    cell.style.backgroundColor = "";
                    cell.className = `cell ${player1.turn ?
                    `bg-gradient-to-r hover:from-pink-400 hover:to-red-500` :
                    `bg-gradient-to-r hover:from-orange-400 hover:to-yellow-500`}`;
                    await updateBoard(col.id);
                }
            }
          }
        }
        await delay(300);
    }

    async function handleLock(column, player): Promise<void> {
        const opponent = player === player1 ? player2 : player1;
        opponent.affected = player === player1 ? player1.specialToken : player2.specialToken;
        opponent.turnAffected = 1;
        column.classList.add("opacity-50");
        column.style.pointerEvents = "none";
        await delay(500);
    } 

	
    async function handleGhost(): Promise<void> {
        const opponent = player1.turn ? player2 : player1;
        const currentPlayer = player1.turn ? player1 : player2;

        player1.turn = !player1.turn;
        player2.turn = !player2.turn;
        opponent.affected = currentPlayer === player1 ? player1.specialToken : player2.specialToken;
        opponent.turnAffected = 1;
    } 

	async function handleDice(): Promise<void> {
		const opponent = player1.turn ? player2 : player1;
        opponent.affected = player1.turn ? player1.specialToken : player2.specialToken;
        opponent.turnAffected = 1;
	}

    async function handleSpecialToken(row, player, column): Promise<void> {
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
                await handleGhost();
                break;
            case "🎲":
                await handleDice();
                break;
          default:
            break;
        }
        document.getElementById("dice-container")!.style.pointerEvents = 'auto';
    }

    /* Place Special Token */

    async function updateSpecialCell(cell, player): Promise<void> {
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

    async function placeSpecialToken(column): Promise<void> {
        disableClicks();

        const currentPlayer = player1.turn ? player1 : player2;
        
        const cells = columnMap.get(column.id);
        const columnData = boardMap.get(column.id);
		if (!cells || !columnData) return;

        const row = columnData.findIndex(cell => cell === 0);
        if (row === -1) return;
        
        if (currentPlayer.specialToken === "👻")
            columnData[row] = 3;
        else
            columnData[row] = currentPlayer.num;

        await updateSpecialCell(cells[row], currentPlayer);
        document.getElementById("board")!.style.pointerEvents = 'none';
        await handleSpecialToken(row, currentPlayer, column);
        document.getElementById("board")!.style.pointerEvents = 'auto';
        await updateTurnIndicator();

        enableClicks();
        currentPlayer.specialToken = null;
        currentPlayer.useSpecial = false;
    }

    /* Utils */

	async function delay(ms: number): Promise<void> {
		await delayEngine(ms);
	}

    start();
}
