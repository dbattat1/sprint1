'use strict';

var gBoard;

function createGLevel(size, mines){
    return {
        'SIZE': size,
        'MINES': mines
    }
}



const BEGGINER_LEVEL = createGLevel(4,2);
const MEDIUM_LEVEL = createGLevel(8,12);
const EXPERT_LEVEL = createGLevel(12,30);
const LEVELS = [BEGGINER_LEVEL, MEDIUM_LEVEL, EXPERT_LEVEL];
var gLevel = BEGGINER_LEVEL;

var gGame = { isOn: false, shownCount: 0, markedCount: 0, secsPassed: 0 };
var SIZE = null;
const DEFAULT_SIZE = 8;
const MINE = '⬤';
const FLAG = '☒';
var gClickCounter = 0;

var elSmiley = document.querySelector('.smiley');
var elHint1 = document.querySelector('.hint1');
var elHint2 = document.querySelector('.hint2');
var elHint3 = document.querySelector('.hint3');
var elLives = document.querySelector('.livesCounter');
var NORMAL_SMILEY = '😄';
var SAD_SMILEY = '😩';
var SUNGLASSES_SMILEY = '😎';

var START_TIME = null;
var gInterval;
var gIsHint = false;
var gLivesCounter = 3;

var gIsSafe = false;
var gSafeCounter = 3;
var gCurrCell = null;

function undo(){
    if (!gGame.isOn) return;
    if (gCurrCell === null) return;
    // console.log(gCurrCell.i, 'i',gCurrCell.j, 'j');
    hideCellContent(gCurrCell.i, gCurrCell.j);
    /////////
    if (gBoard[gCurrCell.i][gCurrCell.j].minesAroundCount === 0 &&
         !(gBoard[gCurrCell.i][gCurrCell.j].isMine)){

        hideNegs(gCurrCell.i, gCurrCell.j);
    }

    if (gBoard[gCurrCell.i][gCurrCell.j].isMine && gLivesCounter < 3){
        gLivesCounter++;
        elLives.innerHTML = `${gLivesCounter} LIVES LEFT`;
        gBoard[gCurrCell.i][gCurrCell.j].isShown = false;
        gBoard[gCurrCell.i][gCurrCell.j].isMarked = false;
        var cell = getCellInstanceFromPosOnBoard(gCurrCell.i,gCurrCell.j);
        cell.style.backgroundColor = "rgb(87,151,179)";

    }
}

function hideCellContent(i, j) {
    gBoard[i][j].isShown = false;
    var cell = getCellInstanceFromPosOnBoard(i,j);
    // cell.style.backgroundColor = "rgb(87,151,179)";
    cell.classList.add('hidden');
}

function hideNegs(row, col) {
    for (var i = row - 1; i <= row + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (var j = col - 1; j <= col + 1; j++) {
            if (j < 0 || j >= gBoard[0].length) continue;
            if (i === row && j === col) continue;
            if (gBoard[i][j].isMarked) continue;
            if ((gBoard[i][j].minesAroundCount === 0) && (gBoard[i][j].isShown === true)) {
                gBoard[i][j].isShown = false;
                var elCell = document.querySelector(`.cell${i}-${j}`);
                elCell.classList.add('hidden');
                // elCell.style.backgroundColor = "rgb(87,151,179)";
                hideNegs(i, j);
            }
            // in case the cell isn't empty
            if ((gBoard[i][j].isMine === false) && (gBoard[i][j].isShown === true)) {
                gBoard[i][j].isShown = false;
                var elCell = document.querySelector(`.cell${i}-${j}`);
                elCell.classList.add('hidden');
                // elCell.style.backgroundColor = "rgb(87,151,179)";
            }
        }
    }
}




function setBestScoreText(size) {
    const bestTimeForLevel = getBestTimeForLevel(size);
    if(bestTimeForLevel &&
      bestTimeForLevel.minutes != null &&
      bestTimeForLevel.seconds != null) {
        document.querySelector('.score').innerHTML = getTimeFormat(bestTimeForLevel.minutes, bestTimeForLevel.seconds);
    } else {
        document.querySelector('.score').innerHTML = "";
    }
}

function init(size = DEFAULT_SIZE) {
    SIZE = size
    gLevel = getLevelBySize(size);
    gClickCounter = 0;
    timer.textContent = '00:00';
    gGame.isOn = true;
    elSmiley.innerHTML = NORMAL_SMILEY;
    elHint1.style.display = 'inline';
    elHint2.style.display = 'inline';
    elHint3.style.display = 'inline';
    gLivesCounter = 3;
    buildBoard();
    renderBoard(gBoard);
    printTable(gBoard);
    clearInterval(gInterval);
    elLives.innerHTML = `${gLivesCounter} LIVES LEFT`;
    setBestScoreText(SIZE);
    gSafeCounter = 3;
    var elClicksAvailable = document.querySelector('.clicks-available');
    elClicksAvailable.innerHTML = `${gSafeCounter} clicks available`;
}

function buildBoard() {
    gBoard = []
    for (var i = 0; i < SIZE; i++) {
        gBoard[i] = [];
        for (var j = 0; j < SIZE; j++) {
            var cell = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false,
            };
            gBoard[i][j] = cell;
        }
    }
    // gBoard[2][0].isMine = true;
    // gBoard[1][2].isMine = true;
    // gBoard[2][0].isMarked = true;
    // gBoard[1][2].isMarked = true;


    // console.table(gBoard);
}

function printTable(gBoard) {
    var printedTable = [];
    for (var i = 0; i < SIZE; i++) {
        printedTable[i] = [];
        for (var j = 0; j < SIZE; j++) {
            if (gBoard[i][j].isMine) {
                printedTable[i][j] = MINE;
            } else if (gBoard[i][j].minesAroundCount) {
                printedTable[i][j] = gBoard[i][j].minesAroundCount;
            } else {
                printedTable[i][j] = '';
            }
        }
    }
    console.table(printedTable);
}


function placeRandomMines(firstCell) {
    var idx = getRandomIntInclusive(0, SIZE - 1);
    var jdx = getRandomIntInclusive(0, SIZE - 1);
    while (idx === firstCell.i && jdx === firstCell.j) {
        idx = getRandomIntInclusive(0, SIZE - 1);
        jdx = getRandomIntInclusive(0, SIZE - 1);
    }
    gBoard[idx][jdx].isMine = true;
}


function setMinesNegsCount() {
    for (var i = 0; i < SIZE; i++) {
        for (var j = 0; j < SIZE; j++) {
            gBoard[i][j].minesAroundCount = countNeighbors(i, j);
        }
    }
}

function countNeighbors(row, col) {
    var counter = 0;
    for (var i = row - 1; i <= row + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (var j = col - 1; j <= col + 1; j++) {
            if (j < 0 || j >= gBoard[0].length) continue;
            if (i === row && j === col) continue;
            if (gBoard[i][j].isMine) counter++;
        }
    }
    return counter;
}

function renderBoard(gBoard) {
    var strHTML = '';
    for (var i = 0; i < SIZE; i++) {
        strHTML += `<tr>`;
        for (var j = 0; j < SIZE; j++) {
            var innerCell = (gBoard[i][j].isMine) ? MINE : (gBoard[i][j].minesAroundCount === 0) ? '' : gBoard[i][j].minesAroundCount.toString();
            var className = 'cell cell' + i + '-' + j;
            var cellHTML = `<td class="${className} hidden" onclick="cellClicked(this, ${i}, ${j})" oncontextmenu="cellMarked(this, ${i}, ${j})">${innerCell}</td>`;
            strHTML += cellHTML;
        }
    }
    var elTable = document.querySelector('table');
    elTable.innerHTML = strHTML;
}


function isFirstClick(clickCounter){
    return clickCounter == 1;
}

function getMinesCount(){
    return gLevel['MINES'];
}

function displayCellContent(i, j) {
    gBoard[i][j].isShown = true;
    var cell = getCellInstanceFromPosOnBoard(i,j);
    cell.classList.remove('hidden');
    // cell.style.backgroundColor =  'rgb(201, 215, 221)';
    gCurrCell = {i: i, j: j};
}

function getBestTimeForLevel(size) {
    const bestTimeForLevelStr = localStorage.getItem(size);
    if(bestTimeForLevelStr){
        return JSON.parse(bestTimeForLevelStr);
    }
    return null;
}

function isNewTimeFaster(currTime, bestTime) {
    if (!bestTime ||
      bestTime.minutes == null ||
      bestTime.seconds == null ||
      currTime.minutes < bestTime.minutes){
        return true;
    }
    if (currTime.minutes > bestTime.minutes){
        return false;
    }
    if (currTime.seconds < bestTime.seconds){
        return true;
    }
    return false;
}

function cellClicked(elCell, i, j) {
    if (!gGame.isOn) return

    if (gBoard[i][j].isMarked === true) return

    gClickCounter++;
    const firstClick = isFirstClick(gClickCounter);

    if (firstClick) {
        var numOfMines = getMinesCount();
        for (var n = 0; n < numOfMines; n++) {
            placeRandomMines({ i: i, j: j });
        }
        setMinesNegsCount();
        renderBoard(gBoard);
        gGame.isOn = true;
        elSmiley.innerHTML = NORMAL_SMILEY;
        START_TIME = Date.now();
        gInterval = setInterval(setTimeSinceGameStarted, 10, START_TIME);
        // gInterval = setInterval(time, 10, START_TIME);
        // //
        // console.table(gBoard);
        printTable(gBoard);
        // //
        displayCellContent(i, j);
      
        
    }

    if (gIsHint) {
        revealHint(i, j);
        return;
    }
  

    // Stepped on empty cell
    if (gBoard[i][j].minesAroundCount === 0 && !(gBoard[i][j].isMine)) {
        revealNegs(i, j);
    }

    if (!firstClick){
        // Stepped on a mine
        if (gBoard[i][j].isMine) {
            gLivesCounter--;
            if (gLivesCounter === 0) {
                gGame.isOn = false;
                elCell.style.backgroundColor = "red";
                revealAllMines();
                elSmiley.innerHTML = SAD_SMILEY;
                clearInterval(gInterval);
            }
            gBoard[i][j].isMarked = true;
            // change the dom
            elLives.innerHTML = `${gLivesCounter} LIVES LEFT`;
            elCell.style.backgroundColor = "red";
        }
        displayCellContent(i, j);

        const currTime = setTimeSinceGameStarted(START_TIME);

       

        if (gGame.isOn && checkGameOver()) {
            elSmiley.innerHTML = SUNGLASSES_SMILEY;
            gGame.isOn = false;
            handleBestTimeValidation(currTime);
            clearInterval(gInterval);
        }
    }
}

function showHint(elHint) {
    elHint.style.display = 'none';
    gIsHint = true;
}

function revealHint(row, col) {
    gGame.isOn = false;
    for (var i = row - 1; i <= row + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (var j = col - 1; j <= col + 1; j++) {
            if (j < 0 || j >= gBoard[0].length) continue;
            var elCell = document.querySelector(`.cell${i}-${j}`);
            elCell.classList.remove('hidden');

            setTimeout(hideHint, 1000, row, col);
        }
    }
}

function hideHint(row, col) {
    for (var i = row - 1; i <= row + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (var j = col - 1; j <= col + 1; j++) {
            if (j < 0 || j >= gBoard[0].length) continue;
            var elCell = document.querySelector(`.cell${i}-${j}`);
            elCell.classList.add('hidden');
        }
    }
    gIsHint = false;
    gGame.isOn = true;
}

function getCellInstanceFromPosOnBoard(i, j){
    return document.querySelector(`.cell${i}-${j}`)
}


function checkGameOver() {
    for (var i = 0; i < SIZE; i++) {
        for (var j = 0; j < SIZE; j++) {
            // not a mine but isShown false - a cell that is not revealed yet
            if (!gBoard[i][j].isMine && !gBoard[i][j].isShown) {
                return false;
            }
            if (gBoard[i][j].isMine && !gBoard[i][j].isMarked) {
                return false;
            }
        }
    }
    return true;
}


function revealNegs(row, col) {
    for (var i = row - 1; i <= row + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (var j = col - 1; j <= col + 1; j++) {
            if (j < 0 || j >= gBoard[0].length) continue;
            if (i === row && j === col) continue;
            if (gBoard[i][j].isMarked) continue;
            if ((gBoard[i][j].minesAroundCount === 0) && (gBoard[i][j].isShown === false)) {
                gBoard[i][j].isShown = true;
                var elCell = document.querySelector(`.cell${i}-${j}`);
                elCell.classList.remove('hidden');
                revealNegs(i, j);
            }
            // in case the cell isn't empty
            if ((gBoard[i][j].isMine === false) && (gBoard[i][j].isShown === false)) {
                gBoard[i][j].isShown = true;
                var elCell = document.querySelector(`.cell${i}-${j}`);
                elCell.classList.remove('hidden');
            }
        }
    }
}

function revealAllMines() {
    for (var i = 0; i < SIZE; i++) {
        for (var j = 0; j < SIZE; j++) {
            if (gBoard[i][j].isMine) {
                // model
                gBoard[i][j].isShown = true;
                // DOM
                var elCell = document.querySelector(`.cell${i}-${j}`);
                elCell.classList.remove('hidden');
            }
        }
    }
}
document.addEventListener("contextmenu", function (elCell) {
    elCell.preventDefault();
    // console.log(elCell);
});

function handleBestTimeValidation(currTime) {
    const bestTime = getBestTimeForLevel(SIZE);
    if(isNewTimeFaster(currTime, bestTime)) {
        localStorage.setItem(SIZE, JSON.stringify(currTime));
        document.querySelector('.score').innerHTML = getTimeFormat(currTime.minutes, currTime.seconds);
    }
}

function cellMarked(elCell, i, j) {

    if (!gGame.isOn || gBoard[i][j].isShown) return;
    gClickCounter++;
    if (gClickCounter === 1) {
        var numOfMines = (SIZE === 4) ? 2 : (SIZE === 8) ? 12 : 30;
        for (var n = 0; n < numOfMines; n++) {
            placeRandomMines({ i: i, j: j });
        }
        setMinesNegsCount();
        renderBoard(gBoard);
        gGame.isOn = true;
        elSmiley.innerHTML = NORMAL_SMILEY;
        START_TIME = Date.now();
        gInterval = setInterval(setTimeSinceGameStarted, 10, START_TIME);
        console.table(gBoard);
        printTable(gBoard);

    }
    if (gBoard[i][j].isMarked) {
        elCell.innerHTML = '';
        gBoard[i][j].isMarked = false;
    } else {
        gBoard[i][j].isMarked = true;
        elCell.innerHTML = FLAG;
        elCell.style.color = "red";
    }
    if (checkGameOver()) {
        elSmiley.innerHTML = SUNGLASSES_SMILEY;
        gGame.isOn = false;
        const currTime = setTimeSinceGameStarted(START_TIME);
        handleBestTimeValidation(currTime);
        clearInterval(gInterval);
    }
}

function getLevelBySize(size) {
    const levelsWithTheSameSize = LEVELS.filter(function(x){
        return x['SIZE'] == size;
    });
    return levelsWithTheSameSize.length > 0 ? levelsWithTheSameSize[0] : MEDIUM_LEVEL;
}

function getTime(timerStr) {
    if (timerStr === null) return Infinity;
    var minutes = +timerStr.substring(0, 2);
    var seconds = +timerStr.substring(3);
    return minutes * 60 + seconds;
}


function findSafeClickCells(){
    var safeClicks = []
    for (var i = 0; i < gLevel.SIZE; i++){
        for (var j = 0; j < gLevel.SIZE; j++){
           
            if ( !(gBoard[i][j].isMine) &&  !(gBoard[i][j].isShown) ){
                safeClicks.push({i :i, j: j, cell : gBoard[i][j] } );
            }
        }
    }
    return safeClicks;
}

function getSafeClickCell(safeClicks){
    // var idx = getRandomIntInclusive(0, safeClicks.length - 1);
    // var cell = safeClicks.slice(idx,idx + 1);
    if (safeClicks.length === 0) return null;
    var shuffledSafeClicks = shuffle(safeClicks);
    return shuffledSafeClicks.pop();
}

function showSafe(){
    if (!gSafeCounter) return;
    if (!gGame.isOn) return;
    if (gClickCounter < 1) return;

    gSafeCounter--;
    var elClicksAvailable = document.querySelector('.clicks-available');
    elClicksAvailable.innerHTML = (gSafeCounter === 1)? 
    `${gSafeCounter} click available` : `${gSafeCounter} clicks available`
    
    ////// SAFE
    var safeCell = getSafeClickCell(findSafeClickCells());
    if (safeCell === null){  
        return;
    }
    
    gIsSafe = true;
    gGame.isOn = false;
     revealSafe(safeCell);
}

function revealSafe(safeCell){
    var elCell = document.querySelector(`.cell${safeCell.i}-${safeCell.j}`);
    elCell.classList.remove('hidden');
    setTimeout(hideSafe, 1000, safeCell.i, safeCell.j);
}

function hideSafe(row, col){
    var elCell = document.querySelector(`.cell${row}-${col}`);
    elCell.classList.add('hidden');
    gIsSafe = false;
    gGame.isOn = true;
}






//___________________________________UTILS_____________________________________________________

var timer = document.querySelector('.timer');

function createTimeObj(minutes, seconds){
    return {
        minutes: minutes,
        seconds: seconds
    }
}
function getTime(gameStartTime) {
    const now = Date.now();
    const seconds = parseInt((now - gameStartTime) / 1000) % 60;
    const minutes = parseInt(((now - gameStartTime) / 1000) / 60);
    return createTimeObj(minutes, seconds);
}


function getTimeFormat(minutes, seconds){
    const m = convertNumberToTimeRepresentation(minutes);
    const s = convertNumberToTimeRepresentation(seconds);
    return `${m}:${s}`;
}

function setTimeSinceGameStarted(gameStartTime){
    const currTime = getTime(gameStartTime);
    timer.textContent = getTimeFormat(currTime.minutes, currTime.seconds);
    return currTime;
}

function convertNumberToTimeRepresentation(time) {
    return time < 10 ? "0" + time : time;
}

function getRandomIntInclusive(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}