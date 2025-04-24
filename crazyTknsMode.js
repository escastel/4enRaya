function crazyTokensMode(AI) {
    let timeAI;
    let columnMap = new Map();
    let columnList = new Array();
    let boardMap = new Map();
    const crazyTokens = ["💣", "👻", "🔒", "🎲", "🌀", "🌫️"];

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
            this.diceUses = 3;
        }
    }
    const player1 = new Player(false, 1, "red");
    const player2 = new Player(AI, 2, "yellow");

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

    function start() {
        init();
        insertDice();
        document.getElementById("dice-container").addEventListener("click", () => rollDice());
        columnList.forEach((column) => {
            column.addEventListener("click", () => handleColumnClick(column));
        });
    }

    function clearGame() {
        boardMap.clear()
        columnMap.clear()
        columnList = []
    }

    function stop() {
        clearGame()
        if (timeAI)
            clearTimeout(timeAI);
    }

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

    function handleColumnClick(column) {
        if (player1.winner || player2.winner) { stop(); return; }

        placeToken(column);
        if (checkWin(false)) insertDivWinner(), stop();
        else if (checkDraw()) insertDivDraw(), stop();
        else {
            updateTurnIndicator();
            if (player2.turn && player2.AI) {
                disableClicks();
                timeAI = setTimeout(() => {
                    aiToken();
                    enableClicks();
                }, 1000);
            }
        }
    }

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
    }

    function insertDivDraw() {
        const draw = document.createElement("div");

        draw.className = `bg-gradient-to-r from-red-400 to-yellow-500`;
        draw.id = `draw`
        draw.innerText = `¡Empate!`;
        document.getElementById("board").appendChild(draw);
    }

    function updateTurnIndicator() {
        player1.turn = !player1.turn;
        player2.turn = !player2.turn;

        columnList.forEach((column) => {
            const cells = columnMap.get(column.id);

            cells.forEach((cell) => {
                if (cell.classList.contains("cell") && !player2.AI) {
                    cell.className = `cell ${player1.turn ?
                        `bg-gradient-to-r hover:from-pink-400 hover:to-red-500` :
                        `bg-gradient-to-r hover:from-orange-400 hover:to-yellow-500`}`;
                }
            });
        });
        document.getElementById("dice-container").style.backgroundColor = `${player1.turn ? `rgba(255, 2, 2, 0.811)` : `rgba(255, 237, 35, 0.874)`}`;
        document.getElementById("dice-container").style.transition = `background-color 0.5s ease-in-out`; 
    }

    function rollDice() {
        const currentPlayer = player1.turn ? player1 : player2;
        const diceContainer = document.getElementById("dice-container");
        const diceIcon = document.getElementById("dice-icon");
    
        if (currentPlayer.diceUses <= 0) {
            diceIcon.innerText = "❌";
            return;
        }
        if (currentPlayer.specialToken) { // Me gustaria que se guardase el token y que el jugador elija cuando usarlo
            currentPlayer.useSpecial = true;
            return ;
        }

        diceContainer.classList.add("rolling");
        setTimeout(() => {
            const randomIndex = Math.floor(Math.random() * crazyTokens.length);
            /* const newToken = crazyTokens[randomIndex]; */
            const newToken = "🎲"
            
            diceIcon.innerText = newToken;
            currentPlayer.specialToken = newToken;
            currentPlayer.diceUses--;
    
            diceContainer.classList.remove("rolling");
        }, 1000);
    }

    function handleReverse(){ // Funciona. Hacerlo para que se cambie primero y luego juegues la ficha
        for (let col = 0; col < columnList.length; col++) {
            const columnId = columnList[col].id;
            const columnData = boardMap.get(columnId);

            for (let row = 0; row < columnData.length; row++) {
                if (columnData[row] == 1) columnData[row] = 2;
                else if (columnData[row] == 2) columnData[row] = 1;
            }
        }

        let tokens = Array.from(document.getElementsByClassName("token red"))
        tokens.forEach(token => {
			token.className = "token yellow special-token"
		})
        tokens = Array.from(document.getElementsByClassName("token yellow"))
        tokens.forEach(token => {
            if (!token.classList.contains("special-token"))
                token.className = "token red special-token"
		})
        tokens = Array.from(document.getElementsByClassName("special-token"))
        tokens.forEach(token => {
            token.classList.remove("special-token")
        })
    }

    function handleBlind() {  // Funciona. Hacerlo para que afecte al otro jugador durante 1 turno
        let tokens = Array.from(document.getElementsByClassName("token"));
        tokens.forEach(token => {
            token.style.visibility = "hidden";
        });
    }

    function exploitedToken(row, columnId){
        const cells = columnMap.get(columnId);
        const columnData = boardMap.get(columnId);

        columnData[row] = 0
        cells[row].className = `cell ${player1.turn ?
            `bg-gradient-to-r hover:from-pink-400 hover:to-red-500` :
            `bg-gradient-to-r hover:from-orange-400 hover:to-yellow-500`}`;
        while (cells[row].firstChild)
            cells[row].removeChild(cells[row].firstChild);
        if (columnData[row - 1] && columnData[row - 1] != 0){
            columnData[row - 1] = 0
            cells[row - 1].className = `cell ${player1.turn ?
                `bg-gradient-to-r hover:from-pink-400 hover:to-red-500` :
                `bg-gradient-to-r hover:from-orange-400 hover:to-yellow-500`}`;
            while (cells[row - 1].firstChild)
                cells[row - 1].removeChild(cells[row - 1].firstChild);
        }
        if (columnData[row + 1] && columnData[row + 1] != 0){
            columnData[row + 1] = 0
            cells[row + 1].className = `cell ${player1.turn ?
                `bg-gradient-to-r hover:from-pink-400 hover:to-red-500` :
                `bg-gradient-to-r hover:from-orange-400 hover:to-yellow-500`}`;
            while (cells[row + 1].firstChild)
                cells[row + 1].removeChild(cells[row + 1].firstChild);
        }
    }

    function updateBoard(){  // Modifica bien, tengo que hacer lo de abajo, que explote.
        for (let col = 0; col < columnList.length; col++) {
            const columnData = boardMap.get(columnList[col].id);
            const cells = columnMap.get(columnList[col].id);

            for (let row = 0; row < columnData.length; row++) {
                if (columnData[row] != 0){
                    const emptyCell = columnData.findIndex(cell => cell === 0);
                    if (emptyCell > row) continue ;
                    columnData[emptyCell] = columnData[row] = 1 ? 1 : 2;
                    columnData[row] = 0
                    cells[row].className = `cell ${player1.turn ?
                        `bg-gradient-to-r hover:from-pink-400 hover:to-red-500` :
                        `bg-gradient-to-r hover:from-orange-400 hover:to-yellow-500`}`;
                    cells[emptyCell].className = `filled`
                    if (cells[row].hasChildNodes())
                        cells[emptyCell].appendChild(cells[row].firstChild);
                    //cells[row].removeChild(cells[row].firstChild);
                }
            }
        }
    }

    function handleBomb(row, column){  // EL mapa se modifica bien, hacer que explote y la ficha bomba tambien desaparezca
        for (let col = 0; col < columnList.length; col++) {
            const columnId = columnList[col].id;
            if (columnList[col + 1] && columnList[col + 1].id == column)
                exploitedToken(row, columnId)
            if (columnList[col - 1] && columnList[col - 1].id == column)
                exploitedToken(row, columnId)
            if (columnList[col].id == column)
                exploitedToken(row, columnId)
        }
        console.log(boardMap)
        updateBoard();
    }

	function handleLock(column){  // Hacer x 1 turno al rival, puede que añada un dado para poner x turnos.
		document.getElementById(column.id).style.pointerEvents = 'none';
	}

	function handleGhost(){
		// Aparece una ficha para bloquear por x turnos
	}

	function handleDice(){
		const randomColumn = Math.floor(Math.random() * 6)
		return columnList[randomColumn]
	}

    function handleSpecialToken(row, player, column) {
        switch (player.specialToken) {
            case "💣":
                handleBomb(row, column.id); // ok, Explota 3x3
                break;
            case "👻":
                handleGhost(player); // por hacer
                break;
            case "🔒":
                handleLock(column); // ok, Bloquea una columna x 1 turno
                break;
            case "🎲":
                handleDice(column); // remodelar, hace que pulse la columna que pulse el oponente, se coloque random
                break;
            case "🌀":
                handleReverse(); // ok, Cambia las fichas amarillas por las rojas
                break;
            case "🌫️":
                handleBlind(); // ok, Invisibiliza las fichas al oponente x 1 turno.
                break;
            default:
                break;
        }
        player.specialToken = null;
    }

    function updateCell(cell, player) {
        const token = document.createElement("div");

        token.className = `token ${player.color}`;
        cell.className = "filled";
        cell.appendChild(token);
    }

    function placeToken(column) {
        const currentPlayer = player1.turn ? player1 : player2;
        const cells = columnMap.get(column.id);
        const columnData = boardMap.get(column.id);
        const row = columnData.findIndex(cell => cell === 0);
        if (row === -1) return;

        if (currentPlayer.useSpecial)
            handleSpecialToken(row, currentPlayer, column);

        columnData[row] = currentPlayer.num;
        updateCell(cells[row], currentPlayer);

    }

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
                    if (!checking) player1.turn ? player1.winner = true : player2.winner = true;
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

    function aiToken() {
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

    document.getElementById("btnMn").addEventListener("click", () => {
        stop();
        returnToMenu();
    });
    start();
}
