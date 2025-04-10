function connectFour(): void {
    let timeAI;
    let columnMap = new Map();
    let columnList = new Array();
    const boardMap = new Map();

    class Player {
        color: string;
        turn: boolean;
        winner: boolean;
        num: number;
        AI : boolean;

        constructor(AI: boolean, num: number, color: string) {
            this.AI = AI;
            this.num = num;
            this.color = color;
            this.turn = false;
            this.winner = false;
        }
    }
    const player1 = new Player(false, 1, "red");
    const player2 = new Player(false, 2, "yellow");

    function setArray(num: string) {
        let array = new Array();

        for (let i = 1; i <= 6; i++)
            array.push(document.getElementById("c" + num + i.toString()) as HTMLElement);
        return array;
    }

    function init(): void {
        player1.turn = true;

        for (let i = 1; i <= 7; i++) {
            boardMap.set(("c" + i.toString()), Array(6).fill(0));
            columnMap.set("c" + i.toString(), setArray(i.toString()));
            columnList.push(document.getElementById("c" + i.toString()) as HTMLElement);
        }
    }

    function start(): void {
        init();

        columnList.forEach((column) => {
                column.addEventListener("click", () => handleColumnClick(column));
        });
    }

    function stop(): void {
        clearTimeout(timeAI);
    }
    
    function enableClicks(): void {
        columnList.forEach((column) => {
            column.style.pointerEvents = "auto";
        });
    }

    function disableClicks(): void {
        columnList.forEach((column) => {
            column.style.pointerEvents = "none";
        });
    }
    
    function handleColumnClick(column: HTMLElement): void {
        if (player1.winner || player2.winner) { stop(); return ;}

        placeToken(column);
        if (checkWin(false)) insertDivWinner();
        else if (checkDraw()) insertDivDraw();
        else {
            updateTurnIndicator();
            if (player2.turn && player2.AI){
                disableClicks();
                timeAI = setTimeout(() => {
                    aiToken();
                    enableClicks();
                }, 1000);
            }
        }
    }

    function insertDivWinner(): void {
        const winner = document.createElement("div");
        const playerWinner = player1.winner ? `winner-${player1.color}` : `winner-${player2.color}`;
        const player = player1.winner ? "Player 1" : "Player 2";
		const boardElement = document.getElementById("board")
		if (!boardElement)
			return ;

        winner.className = `${playerWinner} bg-gradient-to-r from-teal-400 to-blue-500`;
        winner.innerHTML = `¡El <span>${player}</span> ha ganado!`;
		boardElement.appendChild(winner);
    }

    function insertDivDraw(): void {
        const draw = document.createElement("div");
		const boardElement = document.getElementById("board");
		if (!boardElement)
			return ;

        draw.className = `draw bg-gradient-to-r from-red-400 to-yellow-500`;
        draw.innerText = `¡Empate!`;
        boardElement.appendChild(draw);
    }

    function updateTurnIndicator(): void {
        player1.turn = !player1.turn;
        player2.turn = !player2.turn;
        
        columnList.forEach((column) => {
            const cells = columnMap.get(column.id);

            cells.forEach((cell) => {
                if (cell.classList.contains("cell") && !player2.AI) {
                    cell.className = `cell ${player1.turn ? 
                        `bg-gradient-to-r hover:from-pink-400 hover:to-red-500` : 
                        "bg-gradient-to-r hover:from-orange-400 hover:to-yellow-500"}`;
                }
            });
        });
    }

    function updateCell(cell: HTMLElement, player: Player): void {
        const token = document.createElement("div");

        token.className = `token-${player.color}`;
        cell.className = "filled";
        cell.appendChild(token);
    }

    function placeToken(column: HTMLElement): void {
        const cells = columnMap.get(column.id);
        const columnData = boardMap.get(column.id);
        const row = columnData.findIndex(cell => cell === 0);
        if (row === -1) return;

        const currentPlayer = player1.turn ? player1 : player2;
        columnData[row] = currentPlayer.num;

        updateCell(cells[row], currentPlayer);
    }

    function checkDraw(): boolean {
        let draw = true;

        columnList.forEach((column) => {
            const columnData = boardMap.get(column.id);
            const row = columnData.findIndex(cell => cell === 0);
            if (row != -1) draw = false;
        });
        return draw;
    }

    function checkWin(checking: boolean): boolean {
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
                    if (!checking) player1.turn? player1.winner = true : player2.winner = true;
                    return true;
                }
            }
        }
        return false;
    }

    function checkDirection(col: number, row: number, player: string, directions): boolean {
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

    function aiToken(): void {
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

    function minmax(depth, isMax, alpha, beta): number {
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
                if (beta <= alpha) return ;
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
                if (beta <= alpha) return ;
            });
            return beta;
        }
    }

    function evaluateBoard(): number {
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

    start();
}
connectFour();