

function raya() {
	let board = new Map()
	let columnList = new Array()
	let turn = 1

	for (let i = 1; i <= 7; i++) {
		board.set(document.getElementById("c" + i.toString()), [0, 0, 0, 0, 0, 0])
		columnList.push(document.getElementById("c" + i.toString()))
	}


	for (let i = 0; i < columnList.length; i++) {
		columnList[i].addEventListener("click", function () {
			let cells = board.get(columnList[i])
			let encontrado = false
			let j = 0
			while (!encontrado && j < cells.length) {
				if (cells[j] == 0) {
					if (turn % 2) {
						cells[j] = 1
						let cell = document.getElementById(columnList[i].id + (j + 1))
						let ficha = document.createElement("div")
						ficha.setAttribute("class", "ficha-roja")
						cell.appendChild(ficha);
						ficha.classList.toggle("transition-red")
					}
					else{
						cells[j] = 2
						let cell = document.getElementById(columnList[i].id + (j + 1))
						let ficha = document.createElement("div")
						ficha.setAttribute("class", "ficha-amarilla")
						cell.appendChild(ficha);
						ficha.classList.toggle("transition-yellow")
					}
					encontrado = true
					turn++;
				}
				j++
			}
		})
	}


}
raya()