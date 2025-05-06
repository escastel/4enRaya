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
        if (winnerDiv) winnerDiv.remove();
        if (drawDiv) drawDiv.remove();
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
        const winner = document.createElement("div");
        const playerWinner = player1.winner ? `${player1.color}` : `${player2.color}`;
        const player = player1.winner ? "Player 1" : "Player 2";

        winner.className = `${playerWinner} bg-gradient-to-r from-teal-400 to-blue-500`;
        winner.id = `winner`
        winner.innerHTML = `¡El <span>${player}</span> ha ganado!`;
        document.getElementById("board").appendChild(winner);
        document.getElementById("dice-container").style.pointerEvents = 'none';
        disableClicks();
    }

    function insertDivDraw() {
        const draw = document.createElement("div");

        draw.className = `bg-gradient-to-r from-red-400 to-yellow-500`;
        draw.id = `draw`
        draw.innerText = `¡Empate!`;
        document.getElementById("board").appendChild(draw);
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

        updateCell(cells[row], currentPlayer);
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
        let bestScore = -Infinity;
        let bestColumn = null;

        columnList.forEach((column) => {
            const columnData = boardMap.get(column.id);
            const row = columnData.findIndex(cell => cell === 0);
            if (row === -1) return;

            columnData[row] = player2.num;
            const score = minmax(6, false, -Infinity, Infinity);
            columnData[row] = 0;

            if (score > bestScore) {
                bestScore = score;
                bestColumn = column;
            }
        });
        if (bestColumn) handleColumnClick(bestColumn)
    }

    function minmax(depth, isMax, alpha, beta) {
        if (checkWin(true)) return isMax ? -1 : 1;
        if (checkDraw()) return 0;
        if (depth === 0) return evaluateBoard();

        if (isMax) {
            columnList.forEach((column) => {
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

        columnList.forEach((column) => {
            const columnData = boardMap.get(column.id);

            columnData.forEach((cell) => {
                if (cell === player2.num) score += 1;
                else if (cell === player1.num) score -= 1;
            });
        });
        return score;
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
        let tokens = Array.from(document.getElementsByClassName("blindToken"));
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
