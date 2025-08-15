class Minesweeper {
    constructor() {
        this.difficulties = {
            beginner: { rows: 9, cols: 9, mines: 10 },
            intermediate: { rows: 16, cols: 16, mines: 40 },
            expert: { rows: 16, cols: 30, mines: 99 }
        };
        this.currentDifficulty = 'intermediate';
        this.boardSize = this.difficulties[this.currentDifficulty];
        this.mineCount = this.boardSize.mines;
        this.board = [];
        this.gameBoard = document.getElementById('game-board');
        this.minesLeftElement = document.getElementById('mines-left');
        this.timerElement = document.getElementById('timer');
        this.bestTimeElement = document.getElementById('best-time');
        this.currentDifficultyElement = document.getElementById('current-difficulty');
        this.gameMessageElement = document.getElementById('game-message');
        this.newGameBtn = document.getElementById('new-game-btn');
        this.gameOver = false;
        this.flagsPlaced = 0;
        this.gameStarted = false;
        this.timerInterval = null;
        this.gameTime = 0;
        this.difficultyListenersAdded = false;
        this.bestTimes = this.loadBestTimes();
        
        this.init();
    }
    
    init() {
        this.createBoard();
        this.placeMines();
        this.calculateNumbers();
        this.renderBoard();
        this.addEventListeners();
        this.updateMinesCounter();
        this.resetTimer();
    }
    
    createBoard() {
        this.board = [];
        for (let row = 0; row < this.boardSize.rows; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.boardSize.cols; col++) {
                this.board[row][col] = {
                    isMine: false,
                    isOpened: false,
                    isFlagged: false,
                    neighborMines: 0
                };
            }
        }
    }
    
    placeMines() {
        let minesPlaced = 0;
        while (minesPlaced < this.mineCount) {
            const row = Math.floor(Math.random() * this.boardSize.rows);
            const col = Math.floor(Math.random() * this.boardSize.cols);
            
            if (!this.board[row][col].isMine) {
                this.board[row][col].isMine = true;
                minesPlaced++;
            }
        }
    }
    
    calculateNumbers() {
        for (let row = 0; row < this.boardSize.rows; row++) {
            for (let col = 0; col < this.boardSize.cols; col++) {
                if (!this.board[row][col].isMine) {
                    this.board[row][col].neighborMines = this.countNeighborMines(row, col);
                }
            }
        }
    }
    
    countNeighborMines(row, col) {
        let count = 0;
        for (let r = Math.max(0, row - 1); r <= Math.min(this.boardSize.rows - 1, row + 1); r++) {
            for (let c = Math.max(0, col - 1); c <= Math.min(this.boardSize.cols - 1, col + 1); c++) {
                if (this.board[r][c].isMine) {
                    count++;
                }
            }
        }
        return count;
    }
    
    renderBoard() {
        this.gameBoard.innerHTML = '';
        this.gameBoard.style.gridTemplateColumns = `repeat(${this.boardSize.cols}, 30px)`;
        this.gameBoard.style.gridTemplateRows = `repeat(${this.boardSize.rows}, 30px)`;
        
        for (let row = 0; row < this.boardSize.rows; row++) {
            for (let col = 0; col < this.boardSize.cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                const cellData = this.board[row][col];
                
                if (cellData.isOpened) {
                    cell.classList.add('opened');
                    if (cellData.isMine) {
                        cell.classList.add('mine');
                    } else if (cellData.neighborMines > 0) {
                        cell.textContent = cellData.neighborMines;
                        cell.dataset.mines = cellData.neighborMines;
                    }
                } else if (cellData.isFlagged) {
                    cell.classList.add('flagged');
                }
                
                this.gameBoard.appendChild(cell);
            }
        }
    }
    
    addEventListeners() {
        // Удаляем старые обработчики перед добавлением новых
        this.gameBoard.removeEventListener('click', this.handleLeftClick);
        this.gameBoard.removeEventListener('contextmenu', this.handleRightClick);
        this.gameBoard.removeEventListener('dblclick', this.handleDoubleClick);
        
        // Создаём привязанные обработчики
        this.handleLeftClick = (e) => {
            if (e.target.classList.contains('cell') && !this.gameOver) {
                const row = parseInt(e.target.dataset.row);
                const col = parseInt(e.target.dataset.col);
                this.openCell(row, col);
            }
        };
        
        this.handleRightClick = (e) => {
            e.preventDefault();
            if (e.target.classList.contains('cell') && !this.gameOver) {
                const row = parseInt(e.target.dataset.row);
                const col = parseInt(e.target.dataset.col);
                this.toggleFlag(row, col);
            }
        };
        
        // Обработчик двойного клика для механики "chord"
        this.handleDoubleClick = (e) => {
            if (e.target.classList.contains('cell') && !this.gameOver) {
                const row = parseInt(e.target.dataset.row);
                const col = parseInt(e.target.dataset.col);
                this.chordClick(row, col);
            }
        };
        
        // Добавляем новые обработчики
        this.gameBoard.addEventListener('click', this.handleLeftClick);
        this.gameBoard.addEventListener('contextmenu', this.handleRightClick);
        this.gameBoard.addEventListener('dblclick', this.handleDoubleClick);
        
        this.newGameBtn.addEventListener('click', () => {
            this.resetGame();
        });
        
        // Обработчики кнопок сложности (добавляем только один раз)
        if (!this.difficultyListenersAdded) {
            document.querySelectorAll('.difficulty-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const difficulty = e.target.dataset.difficulty;
                    this.changeDifficulty(difficulty);
                });
            });
            this.difficultyListenersAdded = true;
        }
    }
    
    openCell(row, col) {
        const cell = this.board[row][col];
        
        if (cell.isOpened || cell.isFlagged) {
            return;
        }
        
        if (!this.gameStarted) {
            this.startTimer();
        }
        
        cell.isOpened = true;
        
        if (cell.isMine) {
            this.gameOver = true;
            this.stopTimer();
            this.revealAllMines();
            this.showMessage('Проигрыш!', 'lose');
            return;
        }
        
        if (cell.neighborMines === 0) {
            this.openNeighbors(row, col);
        }
        
        this.renderBoard();
        
        if (this.checkWin()) {
            this.gameOver = true;
            this.stopTimer();
            this.updateBestTime();
            this.showMessage('Победа!', 'win');
        }
    }
    
    openNeighbors(row, col) {
        for (let r = Math.max(0, row - 1); r <= Math.min(this.boardSize.rows - 1, row + 1); r++) {
            for (let c = Math.max(0, col - 1); c <= Math.min(this.boardSize.cols - 1, col + 1); c++) {
                if (!this.board[r][c].isOpened && !this.board[r][c].isFlagged) {
                    this.openCell(r, c);
                }
            }
        }
    }
    
    // Механика "chord" - двойной клик по открытой числовой клетке
    chordClick(row, col) {
        const cell = this.board[row][col];
        
        // Проверяем, что клетка открыта и содержит число
        if (!cell.isOpened || cell.neighborMines === 0) {
            return;
        }
        
        // Подсчитываем количество флагов вокруг клетки
        let flagsCount = 0;
        for (let r = Math.max(0, row - 1); r <= Math.min(this.boardSize.rows - 1, row + 1); r++) {
            for (let c = Math.max(0, col - 1); c <= Math.min(this.boardSize.cols - 1, col + 1); c++) {
                if (this.board[r][c].isFlagged) {
                    flagsCount++;
                }
            }
        }
        
        // Если количество флагов равно числу на клетке, открываем остальные соседние клетки
        if (flagsCount === cell.neighborMines) {
            for (let r = Math.max(0, row - 1); r <= Math.min(this.boardSize.rows - 1, row + 1); r++) {
                for (let c = Math.max(0, col - 1); c <= Math.min(this.boardSize.cols - 1, col + 1); c++) {
                    if (!this.board[r][c].isOpened && !this.board[r][c].isFlagged) {
                        this.openCell(r, c);
                    }
                }
            }
        }
    }
    
    toggleFlag(row, col) {
        const cell = this.board[row][col];
        
        if (cell.isOpened) {
            return;
        }
        
        if (cell.isFlagged) {
            cell.isFlagged = false;
            this.flagsPlaced--;
        } else {
            cell.isFlagged = true;
            this.flagsPlaced++;
        }
        
        this.renderBoard();
        this.updateMinesCounter();
    }
    
    revealAllMines() {
        for (let row = 0; row < this.boardSize.rows; row++) {
            for (let col = 0; col < this.boardSize.cols; col++) {
                if (this.board[row][col].isMine) {
                    this.board[row][col].isOpened = true;
                }
            }
        }
        this.renderBoard();
    }
    
    checkWin() {
        for (let row = 0; row < this.boardSize.rows; row++) {
            for (let col = 0; col < this.boardSize.cols; col++) {
                const cell = this.board[row][col];
                if (!cell.isMine && !cell.isOpened) {
                    return false;
                }
            }
        }
        return true;
    }
    
    updateMinesCounter() {
        const minesLeft = this.mineCount - this.flagsPlaced;
        this.minesLeftElement.textContent = minesLeft;
    }
    
    changeDifficulty(difficulty) {
        if (difficulty === this.currentDifficulty) return;
        
        this.currentDifficulty = difficulty;
        this.boardSize = this.difficulties[difficulty];
        this.mineCount = this.boardSize.mines;
        
        // Обновляем активную кнопку
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-difficulty="${difficulty}"]`).classList.add('active');
        
        // Обновляем отображение сложности
        const difficultyNames = {
            beginner: 'Beginner',
            intermediate: 'Intermediate', 
            expert: 'Expert'
        };
        this.currentDifficultyElement.textContent = difficultyNames[difficulty];
        
        // Обновляем отображение лучшего времени для новой сложности
        this.updateBestTimeDisplay();
        
        // Пересоздаём игру
        this.resetGame();
    }
    
    showMessage(message, type) {
        this.gameMessageElement.textContent = message;
        this.gameMessageElement.className = `game-message ${type}`;
    }
    
    resetGame() {
        this.gameOver = false;
        this.flagsPlaced = 0;
        this.gameMessageElement.textContent = '';
        this.gameMessageElement.className = 'game-message';
        this.stopTimer();
        this.init();
    }
    
    startTimer() {
        this.gameStarted = true;
        this.timerInterval = setInterval(() => {
            this.gameTime++;
            this.timerElement.textContent = this.gameTime;
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    resetTimer() {
        this.stopTimer();
        this.gameStarted = false;
        this.gameTime = 0;
        this.timerElement.textContent = '0';
    }
    
    // Загрузка лучших времён из localStorage
    loadBestTimes() {
        const saved = localStorage.getItem('minesweeper-best-times');
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            beginner: null,
            intermediate: null,
            expert: null
        };
    }
    
    // Сохранение лучших времён в localStorage
    saveBestTimes() {
        localStorage.setItem('minesweeper-best-times', JSON.stringify(this.bestTimes));
    }
    
    // Обновление лучшего времени при победе
    updateBestTime() {
        const currentBest = this.bestTimes[this.currentDifficulty];
        if (currentBest === null || this.gameTime < currentBest) {
            this.bestTimes[this.currentDifficulty] = this.gameTime;
            this.saveBestTimes();
            this.updateBestTimeDisplay();
        }
    }
    
    // Обновление отображения лучшего времени
    updateBestTimeDisplay() {
        const bestTime = this.bestTimes[this.currentDifficulty];
        if (bestTime === null) {
            this.bestTimeElement.textContent = '-';
        } else {
            this.bestTimeElement.textContent = `${bestTime} c`;
        }
    }
    
    init() {
        this.createBoard();
        this.placeMines();
        this.calculateNumbers();
        this.renderBoard();
        this.addEventListeners();
        this.updateMinesCounter();
        this.resetTimer();
        
        // Обновляем отображение сложности при инициализации
        const difficultyNames = {
            beginner: 'Beginner',
            intermediate: 'Intermediate', 
            expert: 'Expert'
        };
        this.currentDifficultyElement.textContent = difficultyNames[this.currentDifficulty];
        
        // Обновляем отображение лучшего времени
        this.updateBestTimeDisplay();
    }
}

// Запуск игры при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new Minesweeper();
});
