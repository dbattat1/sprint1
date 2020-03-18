'use strict';

var gBoard;
var gLevel;
var gGame = { isOn: false, shownCount: 0, markedCount: 0, secsPassed: 0 };
var SIZE = 8;
const MINE = '💣';
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

var startTime = 0;
var gInterval;

var gIsHint = false;

var gLivesCounter = 3;



function init(size = SIZE) {
    SIZE = size;
    gClickCounter = 0;
    buildBoard();
    renderBoard(gBoard);
    printTable(gBoard);
    clearInterval(gInterval);
    timer.textContent = '00:00';
    gGame.isOn = true;
    elSmiley.innerHTML = NORMAL_SMILEY;
    elHint1.style.display = 'inline';
    elHint2.style.display = 'inline';
    elHint3.style.display = 'inline';
    gLivesCounter = 3;
    elLives.innerHTML = `${gLivesCounter} LIVES LEFT`;

    // storage
    var best = localStorage.getItem(`${SIZE}`);
    console.log(best);
    if (best != null)
    document.querySelector('.score').innerHTML = best;

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


    console.table(gBoard);
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


function cellClicked(elCell, i, j) {
    if (!gGame.isOn) return

    if (gBoard[i][j].isMarked === true) return

    gClickCounter++;

    if (gClickCounter === 1) {
        console.log('clicked');
        var numOfMines = (SIZE === 4) ? 2 : (SIZE === 8) ? 12 : 30;
        for (var n = 0; n < numOfMines; n++) {
            placeRandomMines({ i: i, j: j });
        }
        setMinesNegsCount();
        // buildBoard();
        renderBoard(gBoard);
        gGame.isOn = true;
        elSmiley.innerHTML = NORMAL_SMILEY;
        startTime = Date.now();
        gInterval = setInterval(time, 10, startTime);
        console.table(gBoard);
        printTable(gBoard);  
        console.log('I am here');  
    }

    if(gIsHint){
        revealHint(i, j);
        return;
    }

    // Stepped on empty cell
    if (gBoard[i][j].minesAroundCount === 0 && !(gBoard[i][j].isMine)) {
        revealNegs(i, j);
    }

    // Stepped on a mine
    if (gBoard[i][j].isMine) {
        gLivesCounter--;
            if (gLivesCounter === 0){
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


    // Model
    gBoard[i][j].isShown = true;
    
    // console.log('sasa')
    // console.log(elCell.classList);
    // DOM
    elCell.classList.remove('hidden');

    if (gGame.isOn) {
        // checkGameOver();
        // console.log(checkGameOver());
        if (checkGameOver()) {
            elSmiley.innerHTML = SUNGLASSES_SMILEY;
            gGame.isOn = false;
            // storage
            // console.log(typeof timer.textContent);
            localStorage.setItem(`${SIZE}`, timer.textContent);
            // console.log(timer.textContent);
            //
            clearInterval(gInterval);

        }
    }
}

function showHint(elHint){
    elHint.style.display = 'none';
    gIsHint = true;
    console.log('I am in hint mode');
}

function revealHint(row, col){
    gGame.isOn = false;
    for (var i = row - 1; i <= row + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (var j = col - 1; j <= col + 1; j++) {
            if (j < 0 || j >= gBoard[0].length) continue;
            var elCell = document.querySelector(`.cell${i}-${j}`);
            elCell.classList.remove('hidden');
            
            setTimeout(hideHint ,1000, row, col);
        }
    }  
}

function hideHint(row, col){
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
document.addEventListener("contextmenu", function(elCell){
    elCell.preventDefault();
    // console.log(elCell);
});

// window.oncontextmenu = function (x) {
//     alert('Right Click');
//     x.preventDefault();
// }

function cellMarked(elCell, i ,j){
    console.log('right click');
    
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
        startTime = Date.now();
        gInterval = setInterval(time, 10, startTime);
        console.table(gBoard);
        printTable(gBoard);

    }
    if (gBoard[i][j].isMarked){
    elCell.innerHTML  = '';
    gBoard[i][j].isMarked = false;
    } else {
        gBoard[i][j].isMarked = true;
        elCell.innerHTML  = FLAG;
         elCell.style.color = "red";
    }
    if (checkGameOver()) {
        elSmiley.innerHTML = SUNGLASSES_SMILEY;
        gGame.isOn = false;
        // console.log(timer.textContent);
        // storage
        localStorage.setItem(`${SIZE}`, timer.textContent);
        //
        clearInterval(gInterval);
    }
}







//___________________________________UTILS_____________________________________________________

var timer = document.querySelector('.timer');

//TODO
function time(startTime) {
    var d = startTime;
    var now = Date.now();
    // var ms = parseInt((now - d) / 1 % 1000);
    var s = parseInt((now - d) / 1000) % 60;
    var m = parseInt(((now - d) / 1000) / 60);
    // var h = 0;
    // h = checkTime(h);
    m = checkTime(m);
    s = checkTime(s);
    // ms = checkTime(ms);
    timer.textContent = /*h + ":" + */ m + ":" + s /* + ":" + ms */;
}

function checkTime(i) {
    if (i < 10) {
        i = "0" + i
    };
    return i;
}

function getRandomIntInclusive(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}