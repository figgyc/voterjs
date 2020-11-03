/*

    Voter.js by figgyc

*/

// https://stackoverflow.com/a/40385425/2758631
// creds to "OK sure", this function is under cc by-sa 4
function countWords(str) {
    str = str.replace(/[!.,:;?]+/g, " ")
    str = str.replace(/[^\d\w\s]+/g, "")
    //.replace(/[]/, " ")
    str = str.split(' ')
    str = str.filter(function (n) { return n != '' })
    return str.length
}

function twowSplit(str) {
    if (str.includes("\t")) return splitOnce(str, /\t+/)
    return splitOnce(str, " ")
}


// https://stackoverflow.com/a/2878726/2758631
// creds to Nick Craver, this function is under cc by-sa 4
function splitOnce(s, on) {
    var components = s.split(on);
    return [components.shift(), components.join(' ')]
}

let comparisonCache = [
    // eg "X>A"
    // yes its inefficent but idc
]

let throwCount = 0 //used to count remaining sorts

let tier = {
    // eg "A": 9 where higher numbers = better tiers
}

let tierULs = {}

let formatVersion = 2 // v2: don't cache auto guesses

const tierSets =
{
    none: ['Default'],
    numbers: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    numbersPoint5: ['0', '0.5', '1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10'],
    letters: ['F', 'E', 'D', 'C', 'B', 'A'],
    lettersS: ['F', 'E', 'D', 'C', 'B', 'A', 'S'],
    lettersDeltas: ['D-', 'D', 'D+', 'C-', 'C', 'C+', 'B-', 'B', 'B+', 'A-', 'A', 'A+'],
    lettersDeltasS: ['D-', 'D', 'D+', 'C-', 'C', 'C+', 'B-', 'B', 'B+', 'A-', 'A', 'A+', 'S-', 'S', 'S+'],
}

let tierSet = tierSets['none']

// UI stuff
let outputBox = document.querySelector("#outputBox")
let rank = document.querySelector("#rank")
let savestates = document.querySelector("#savestates")
let intro = document.querySelector("#intro")
let tierlist = document.querySelector("#tierlist")
let review = document.querySelector("#review")
let importUI = document.querySelector("#import")

// DOM stuff
let responsesText = document.querySelector("#responses")
let yourResponse = document.querySelector("#yours")
let go = document.querySelector("#go")
let done = document.querySelector("#done")
let finishBtn = document.querySelector("#finish")
let responseA = document.querySelector("#responseA")
let responseB = document.querySelector("#responseB")
let output = document.querySelector("#output")
let letterFlag = document.querySelector("#letter")
let wordCount = document.querySelector("#wordcount")
let progress = document.querySelector("#progress")
let explanation = document.querySelector("#explanation")
let reviewList = document.querySelector("#reviewList")
let save = document.querySelector("#save")
let undo = document.querySelector("#undo")
let load = document.querySelector("#load")
let smartColors = document.querySelector("#smartColors")
let jsSort = document.querySelector("#jsSort")
let picktierset = document.querySelector("#picktierset")
let responsesOut = document.querySelector("#responsesOut")
let sortButton = document.querySelector("#sort")
let leftBox = document.querySelector("#leftBox")
let tiers = document.querySelector("#tiers")
let customTierset = document.querySelector("#customTierset")
let numIterations = document.querySelector("#numIterations")
let importBtn = document.querySelector("#importBtn")
let importTextarea = document.querySelector("#importTextarea")

let responses = {

}

const aGb = -1
const bGa = 1

let yourResponseLetters = []
let currentResponseA = ""
let currentResponseB = ""

function nativeSort(list, comparator) {
    return list.sort(comparator)
}

function mergeSort(list, comparator) {
    let splitA = []
    let splitB = []
    if (list.length > 1) {
        splitA = mergeSort(list.slice(0, Math.floor(list.length / 2)), comparator)
        splitB = mergeSort(list.slice(Math.floor(list.length / 2)), comparator)
    }
    if (list.length <= 1) return list
    let mergedList = []
    while (splitA.length > 0 && splitB.length > 0) {
        a = splitA[0]
        b = splitB[0]
        if (comparator(a, b) == aGb) {
            mergedList.push(a)
            splitA = splitA.slice(1) // remove the first element from each list
        } else { // bGa
            mergedList.push(b)
            splitB = splitB.slice(1)
        }
    }
    for (let item of splitA) mergedList.push(item) // push what is left
    for (let item of splitB) mergedList.push(item)
    return mergedList
}

let sortFunction = mergeSort

function getScore(letter) {
    // this is a method to get the approximate level of quality of a response
    // by measuring how many comparisons it has won
    let score = 0
    let max = 0
    for (let comp of comparisonCache) {
        if (comp.charAt(0) == letter) {
            score++
        }
        if (comp.includes(letter)) {
            max++
        }
    }
    if (max == 0) return 0.5
    return score / max
}

function gradient(score) {
    /* 
        doing a gradient from green to yellow to red with simple math:
        start at green: 00ff00
        increase red until we get to yellow at 50%: ffff00
        decrease green for the last 50%: ff0000
    */
    let percentageGreen = Math.min(1, 2 * (score))
    let percentageRed = Math.min(1, Math.max(0, -2 * (score) + 2))
    let hexGreen = Math.round(percentageGreen * 255).toString(16).padStart(2, "0")
    let hexRed = Math.round(percentageRed * 255).toString(16).padStart(2, "0")
    return "#" + hexRed + hexGreen + "00"
}

async function countRemainingSorts() {

    const iterations = numIterations.value //more iterations = higher accuracy but more lag on button click
    //maybe make this variable depending on response count or user input?

    //runs through the sort, counting sorts that can't be resolved by the comparison cache
    throwCount = 0
    for (var i = 0; i < iterations; i++) {
        sortFunction(Object.keys(responses).slice(), Sorter(false, true))
    }

    throwCount = Math.ceil(throwCount * 100 / iterations) //averages the total counts (maybe consider root mean square to avoid backwards jumps?)

    //sets the value of the progress bar
    progress.max = comparisonCache.length * 100 + throwCount
    progress.value = comparisonCache.length * 100

    return throwCount
}

go.addEventListener("click", e => {

    if (JSON.parse(localStorage.getItem("savestates")).includes("autosave")) {
        if (!confirm("This will overwrite your autosave. Continue?")) return
    }

    // parse responses
    let responsesLines = responsesText.value.split("\n")
    responsesLines.filter(line => { return (line != "" && line != " ") })
    let i = 0
    for (let responseLine of responsesLines) {
        if (letterFlag.checked) {
            let responseSplit = twowSplit(responseLine)
            let letter = responseSplit[0].trim().slice(-1)
            let response = responseSplit[1]
            responses[letter] = response
        } else {
            responses[i] = responseLine
        }
        i++
    }
    yourResponseLetters = yourResponse.value.replace(" ", "").split(",")
    console.log(yourResponse.value, yourResponseLetters)
    if (yourResponseLetters[0] == "" && yourResponseLetters.length == 1) yourResponseLetters = []
    console.log(yourResponseLetters)

    // prep ui
    updateUI("tierlist")
    doTierlists()
})

function doTierlists() {
    if (picktierset.value != "custom") {
        tierSet = tierSets[picktierset.value]
    } else {
        tierSet = customTierset.value.split(",")
    }
    if (tierSet.length == 1) {
        for (const letter of Object.keys(responses)) {
            tier[letter] = 0
        }
        updateUI("rank")
        countRemainingSorts()
        resort()
    } else {


        unsortedList = createTier(-1)
        tierULs[-1] = unsortedList

        for (let i = tierSet.length; i--; i >= -1) {
            tierULs[i] = createTier(i)
        }

        // tier -1 or the unsorted tier comes first
        for (let letter of Object.keys(responses)) {
            let element = document.createElement("li")
            element.responseCode = letter
            element.innerText = responses[letter]
            if (yourResponseLetters.includes(letter)) {
                tierULs[tierSet.length - 1].appendChild(element)
            } else {
                unsortedList.appendChild(element)
            }
        }

        sortButton.addEventListener("click", () => {
            for (let tierCode of Object.keys(tierULs)) {
                for (let responseElement of tierULs[tierCode].children) {
                    console.log(responseElement, responseElement.responseCode)
                    tier[responseElement.responseCode] = tierCode
                }
            }
            updateUI("rank")
            countRemainingSorts()
            resort()
        })
    }
}

function createTier(i) {
    let header = document.createElement("p")
    header.innerText = i == -1 ? "Unsorted" : tierSet[i]
    header.style.color = tierColor(i)
    let list = document.createElement("ul")
    list.className = "tier"
    list.style.border = "1px solid white"
    list.style.borderColor = tierColor(i)
    Sortable.create(list, {
        animation: 150,
        group: "tierlisting"
    })
    if (i == -1) {
        leftBox.appendChild(header)
        leftBox.appendChild(list)
    } else {
        tiers.appendChild(header)
        tiers.appendChild(list)
    }
    return list
}

function tierColor(c) {
    if (c == -1) return "#ffffff"
    return gradient(c / (tierSet.length - 1))
}

picktierset.addEventListener("change", e => {
    customTierset.hidden = (e.target.value != "custom")
})

function resort() {
    try {
        let sorted = sortFunction(Object.keys(responses).slice(), Sorter(true))
        // done sorting
        reviewNow(sorted)
    } catch (e) {
        addSavestate("autosave")
        responseA.innerText = responses[currentResponseA] + (wordCount.checked ? (" (" + countWords(responses[currentResponseA]) + ")") : "")
        responseB.innerText = responses[currentResponseB] + (wordCount.checked ? (" (" + countWords(responses[currentResponseB]) + ")") : "")
        if (smartColors.checked) {
            responseA.style.borderColor = gradient(getScore(currentResponseA))
            responseA.style.color = gradient(getScore(currentResponseA))
            responseB.style.borderColor = gradient(getScore(currentResponseB))
            responseB.style.color = gradient(getScore(currentResponseB))
        }
        setTimeout(countRemainingSorts, 50)
    }
}

function reviewNow(sorted) {

    for (let letter of sorted) {
        let element = document.createElement("li")
        element.responseCode = letter
        element.innerText = responses[letter]
        reviewList.appendChild(element)
    }
    Sortable.create(reviewList, {
        animation: 150,
    })
    updateUI("review")
}

function Sorter(shouldThrow, random = false) {
    return (a, b) => {

        if (comparisonCache.includes(a + ">" + b)) {
            return aGb
        } else if (comparisonCache.includes(b + ">" + a)) {
            return bGa
        } else if (yourResponseLetters.includes(a)) {
            return aGb
        } else if (yourResponseLetters.includes(b)) {
            return bGa
        } else if (tier[a] > tier[b] && tier[b] != -1) {
            return aGb
        } else if (tier[b] > tier[a] && tier[a] != -1) {
            return bGa
        } else {
            if (shouldThrow) {
                console.log(a, b)
                currentResponseA = a
                currentResponseB = b
                throw "Unknown comparison"
            } else {
                throwCount++;
                if (random) {
                    if (Math.random() > 0.5) {
                        return aGb
                    }
                    return bGa
                }
                else {
                    if (getScore(a) > getScore(b)) {
                        return aGb
                    }
                    return bGa
                }
            }
        }
    }
}

function finish() {
    let sorted = []
    for (let element of reviewList.children) {
        sorted.push(element.responseCode)
    }
    output.value = sorted.join("")
    let resorted = ""
    for (let letter of sorted) {
        resorted += letter + " " + responses[letter] + "\n"
    }
    resorted = resorted.substring(0, resorted.length - 1) // remove trailing newline
    responsesOut.value = resorted
    if (letterFlag.checked) output.hidden = false
    updateUI("output")

    let names = JSON.parse(localStorage.getItem("savestates"))
    localStorage.setItem("savestates", JSON.stringify(names.filter(item => item !== "autosave")))
}

function onResponseClick(e) {
    if (e.target.id == "responseA") {
        comparisonCache.push(currentResponseA + ">" + currentResponseB)
    } else {
        comparisonCache.push(currentResponseB + ">" + currentResponseA)
    }
    resort()
}

responseA.addEventListener("click", onResponseClick)
responseB.addEventListener("click", onResponseClick)

jsSort.addEventListener("click", e => {
    // configure sorter
    if (jsSort.checked) {
        sortFunction = nativeSort
    } else {
        sortFunction = mergeSort
    }

})

let lastKeyTime = 0

document.addEventListener("keydown", e => {
    // if we be ranking
    if (rank.style.display == "block") {
        if (lastKeyTime+100 < new Date().getTime()) {
            lastKeyTime = new Date().getTime() // debounce
            switch (e.code) {
                case "Digit1":
                    e.preventDefault()
                    onResponseClick({ target: { id: "responseA" } })
                    return
                case "Digit2":
                    e.preventDefault()
                    onResponseClick({ target: { id: "responseB" } })
                    return
                default:
                    return // do nothing
            }
        }
    }
})

done.addEventListener("click", finish)

// form fill init related code
customTierset.hidden = (picktierset.value != "custom")
// configure sorter
if (jsSort.checked) {
    sortFunction = nativeSort
} else {
    sortFunction = mergeSort
}

function addSavestate(name) {
    localStorage.setItem(name, JSON.stringify({
        comparisonCache: comparisonCache,
        responses: responses,
        yourResponseLetters: yourResponseLetters,
        tier: tier,
        formatVersion: formatVersion
    }))
    let names = JSON.parse(localStorage.getItem("savestates"))
    if (names == null) {
        names = []
    }
    if (!names.includes(name)) {
        names.push(name)
        localStorage.setItem("savestates", JSON.stringify(names))
    }
}

finishBtn.addEventListener("click", () => {
    let sorted = Object.keys(responses).slice().sort(Sorter(false))
    if (confirm("Finishing early may reduce the accuracy of your vote severely. Make sure to use the review section carefully! Are you sure?")) reviewNow(sorted)
})

function blockNone(bool) {
    return bool ? "block" : "none"
}

function updateUI(state) {
    intro.style.display = blockNone(state == "intro")
    savestates.style.display = blockNone(state == "load")
    tierlist.style.display = blockNone(state == "tierlist")
    rank.style.display = blockNone(state == "rank")
    review.style.display = blockNone(state == "review")
    outputBox.style.display = blockNone(state == "output")
    importUI.style.display = blockNone(state == "import")
}

/* Save/load system */

save.addEventListener("click", () => {
    let name = prompt("Pick a unique name for your savestate. (don't pick 'autosave' or 'savestates')")
    if (name != 'autosave' && name != "savestates" && name != null && name != "") {
        addSavestate(name)
    }
})

undo.addEventListener("click", () => {
    comparisonCache.pop()
    resort()
})

importBtn.addEventListener("click", () => {
    if (importTextarea.value == "") {
        let output = {}
        output.savestates = JSON.parse(localStorage.savestates)
        output.saves = {}
        for (let name of output.savestates) {
            output.saves[name] = JSON.parse(localStorage.getItem(name))
        }
        importTextarea.value = JSON.stringify(output)
    }
    else {
        let input = JSON.parse(importTextarea.value)
        let savestates = JSON.parse(localStorage.getItem("savestates"))
        for (let item of input.savestates) {
            if (!savestates.includes(item)) savestates.push(item)
        }
        localStorage.setItem("savestates", JSON.stringify(savestates))
        for (let item of input.savestates) {
            localStorage.setItem(item, JSON.stringify(input.saves[item]))
        }
    }
})

document.querySelector("#importUI").addEventListener("click", () => {
    updateUI("import")
})

load.addEventListener("click", () => {

    updateUI("load")

    let names = JSON.parse(localStorage.getItem("savestates"))
    for (let savestateName of names) {
        let li = document.createElement("li")
        let button = document.createElement("button")
        button.innerText = savestateName
        button.addEventListener("click", () => {
            if (JSON.parse(localStorage.getItem("savestates")).includes("autosave") && savestateName != "autosave") {
                if (!confirm("This will overwrite your autosave. Continue?")) return
            }
            let savestate = JSON.parse(localStorage.getItem(savestateName))
            comparisonCache = savestate.comparisonCache
            responses = savestate.responses
            if (savestate.yourResponseLetters != undefined)
                yourResponseLetters = savestate.yourResponseLetters
            if (savestate.tier != undefined) {
                tier = savestate.tier
            } else {
                for (const letter of Object.keys(responses)) {
                    tier[letter] = 0
                }
            }

            if (savestate.formatVersion == undefined || savestate.formatVersion < 2) {
                // filter comparisons not done manually by the user, to fix the progress bar when migrating version
                let comparisonCacheTemp = comparisonCache
                comparisonCache = []
                comparisonCache = comparisonCacheTemp.filter(item => {
                    let x = true
                    try {
                        Sorter(true)(item.substring(0, 1), item.substring(2))
                        x = false
                    } catch (e) { }
                    return x
                })
            }

            updateUI("rank")

            resort()
        })
        li.appendChild(button)
        let deleteBtn = document.createElement("button")
        deleteBtn.innerText = "×"
        deleteBtn.addEventListener("click", () => {
            if (confirm("Are you sure you want to delete " + savestateName + "?")) {
                let names = JSON.parse(localStorage.getItem("savestates"))
                localStorage.setItem("savestates", JSON.stringify(names.filter(item => item !== savestateName)))
                savestates.removeChild(li)
            }
        })
        li.appendChild(deleteBtn)
        savestates.appendChild(li)
    }
})



if (localStorage.getItem("savestates") == null) {
    localStorage.setItem("savestates", "[]")
}