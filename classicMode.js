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
    isColumnPlayable as isColumnPlayableEngine,
    detectWinOpportunities as detectWinOpportunitiesEngine,
    doAlgorithm as doAlgorithmEngine,
    delay as delayEngine,
} from './gameEngine.js';

export function classicMode(activateAI) {
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

    function init() {
        initEngine(player1, boardMap, columnMap, columnList);
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

    /* Insert Div Win / Draw */

    function insertDivWinner() {
        return insertDivWinnerEngine(player1, player2, columnList);
    }

    function insertDivDraw() {
        return insertDivDrawEngine(columnList);
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
        return isColumnPlayableEngine(column, boardMap);
    }

    function detectWinOpportunities(player) {
        return detectWinOpportunitiesEngine(boardMap, columnList, player, player1, player2);
    }

   	function doAlgorithm() {
        return doAlgorithmEngine(boardMap, columnList, player1, player2);
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