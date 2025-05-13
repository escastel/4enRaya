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
} from './gameEngine.ts';

interface Player {
	color: string;
	turn: boolean;
	winner: boolean;
	num: number;
	AI: boolean;
}

export function classicMode(activateAI: boolean): void {
	const columnMap: Map<string, HTMLElement[]> = new Map();
	const columnList: HTMLElement[] = [];
	const boardMap: Map<string, number[]> = new Map();

	class PlayerClass implements Player {
		color: string;
		turn: boolean = false;
		winner: boolean = false;
		num: number;
		AI: boolean;

		constructor(AI: boolean, num: number, color: string) {
			this.AI = AI;
			this.num = num;
			this.color = color;
		}
	}

	const player1 = new PlayerClass(false, 1, "red");
	const player2 = new PlayerClass(activateAI, 2, "yellow");

	function init(): void {
		initEngine(player1, boardMap, columnMap, columnList);
	}

	function start(): void {
		clearGame();
		init();
		enableClicks();
		columnList.forEach((column) => {
			column.addEventListener("click", () => handleColumnClick(column));
		});
	}

	function clearGame(): void {
		clearGameEngine(player1, player2, columnList, columnMap, boardMap);
	}

	function enableClicks(): void {
		enableClicksEngine(columnList);
	}

	function disableClicks(): void {
		disableClicksEngine(columnList);
	}

	async function handleColumnClick(column: HTMLElement): Promise<void> {
		if (player1.winner || player2.winner) {
			clearGame();
			return;
		}

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

	function insertDivWinner(): void {
		insertDivWinnerEngine(player1, player2, columnList);
	}

	function insertDivDraw(): void {
		insertDivDrawEngine(columnList);
	}

	async function placeToken(column: HTMLElement): Promise<void> {
		await placeTokenEngine(column, player1, player2, columnMap, boardMap, columnList, "classic");
	}

	function checkDraw(): boolean {
		return checkDrawEngine(boardMap, columnList);
	}

	function checkWin(checking: boolean): boolean {
		return checkWinEngine(boardMap, columnList, player1, player2, checking);
	}

	async function aiToken(): Promise<void> {
		const winColumns = detectWinOpportunities(player2);
		if (winColumns.length > 0) {
			await winColumns[0].click();
			return;
		}

		const threatColumns = detectWinOpportunities(player1);
		if (threatColumns.length > 0) {
			await threatColumns[0].click();
			return;
		}

		let columnToUse = Math.random() < 0.2
			? columnList[Math.floor(Math.random() * columnList.length)]
			: doAlgorithm();

		if (columnToUse && !isColumnPlayable(columnToUse)) {
			columnToUse = columnList.find((column) => isColumnPlayable(column)) || null;
		}

		if (columnToUse) {
			await columnToUse.click();
		}
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

	/* Utils */

	async function delay(ms: number): Promise<void> {
		await delayEngine(ms);
	}

	start();
}