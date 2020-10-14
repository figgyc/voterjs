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
    str = str.filter(function(n) { return n != '' })
    return str.length
 }

function twowSplit(str) {
    if (str.includes("\t")) return splitOnce(str, /\t+/)
    return splitOnce(str, " ")
}

function permutations(n) {
    return n* Math.log2(n) // avg for quicksort, should be accurate enough
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
let letterFlagBox = document.querySelector("#letterFlagBox")
let progress = document.querySelector("#progress")
let explanation = document.querySelector("#explanation")
let review = document.querySelector("#review")
let reviewList = document.querySelector("#reviewList")
let rank = document.querySelector("#rank")
let save = document.querySelector("#save")
let undo = document.querySelector("#undo")
let load = document.querySelector("#load")
let savestates = document.querySelector("#savestates")
let smartColors = document.querySelector("#smartColors")

let responses = {

}

const aGb = -1
const bGa = 1

let yourResponseLetters = []
let currentResponseA = ""
let currentResponseB = ""

function getScore(letter) {
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
    return score/max
}

function gradient(score) {
    /* 
        doing a gradient from green to yellow to red with simple math:
        start at green: 00ff00
        increase red until we get to yellow at 50%: ffff00
        decrease green for the last 50%: ff0000
    */
    let percentageGreen = Math.min(1, 2*(score))
    let percentageRed = Math.min(1, Math.max(0, -2*(score) +2))
    let hexGreen = Math.round(percentageGreen*255).toString(16).padStart(2, "0")
    let hexRed = Math.round(percentageRed*255).toString(16).padStart(2, "0")
    return "#" + hexRed + hexGreen + "00"
}

go.addEventListener("click", e => {

    if (JSON.parse(localStorage.getItem("savestates")).includes("autosave")) {
        if (!confirm("This will overwrite your autosave. Continue?")) return
    }

    // parse responses
    let responsesLines = responsesText.value.split("\n")
    responsesLines.filter(line => {return (line != "" && line != " ")})
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
    if (yourResponseLetters == [""]) yourResponseLetters = []
    console.log(yourResponseLetters)

    // prep ui
    progress.max = permutations(Object.keys(responses).length) // this is an upper bound afaik, the browser's sort algo may be more efficient
    responsesText.hidden = true
    rank.style.display = "block"
    letterFlagBox.style.display = "none"
    explanation.style.display = "none"
    responseA.hidden = false
    responseB.hidden = false

    resort()
})

function resort() {
    try {
        let sorted = Object.keys(responses).slice().sort(Sorter(true))
        // done sorting
        reviewNow(sorted)
    } catch (e) {
        localStorage.setItem("autosave", JSON.stringify({
            comparisonCache: comparisonCache,
            responses: responses,
            yourResponseLetters: yourResponseLetters
        }))
        addSavestate("autosave")
        progress.value = comparisonCache.length
        responseA.innerText = responses[currentResponseA] + ( wordCount.checked ? (" (" + countWords(responses[currentResponseA]) + ")") : "" )
        responseB.innerText = responses[currentResponseB] + ( wordCount.checked ? (" (" + countWords(responses[currentResponseB]) + ")") : "" )
        if (smartColors.checked) {
            responseA.style.borderColor = gradient(getScore(currentResponseA))
            responseA.style.color = gradient(getScore(currentResponseA))
            responseB.style.borderColor = gradient(getScore(currentResponseB))
            responseB.style.color = gradient(getScore(currentResponseB))
        }
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
    responseA.style.display = "none"
    responseB.style.display = "none"
    undo.style.display = "none"
    finishBtn.style.display = "none"
    review.style.display = "block"
}

function Sorter(shouldThrow) {
    return (a, b) => {
        if (comparisonCache.includes(b + ">" + a)) {
            return bGa
        } else if (comparisonCache.includes(a + ">" + b)) {
            return aGb
        } else if (yourResponseLetters.includes(a)) {
            comparisonCache.push(a + ">" + b)
            return aGb
        } else if (yourResponseLetters.includes(b)) {
            comparisonCache.push(b + ">" + a)
            return bGa
        } else {
            if (shouldThrow) {
                console.log(a, b)
                currentResponseA = a
                currentResponseB = b
                throw "Unknown comparison"
            } else {
                if (getScore(a) > getScore(b)) {
                    return aGb
                }
                return bGa
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
    responsesText.value = resorted
    if (letterFlag.checked) output.hidden = false
    review.style.display = "none"
    responsesText.hidden = false
    save.hidden = true

    let names = JSON.parse(localStorage.getItem("savestates"))
    localStorage.setItem("savestates", JSON.stringify(names.filter(item => item !== "autosave")))
}

function onResponseClick(e) {
    if (e.target.id == "responseA") {
        comparisonCache.push(currentResponseA + ">" + currentResponseB)
        progress.value = comparisonCache.length
    } else {
        comparisonCache.push(currentResponseB + ">" + currentResponseA)
        progress.value = comparisonCache.length
    }

    resort()
}

function addSavestate(name) {
    let names = JSON.parse(localStorage.getItem("savestates"))
    if (names == null) {
        names = []
    }
    if (!names.includes(name)) {
        names.push(name)
        localStorage.setItem("savestates", JSON.stringify(names))
    }
}

save.addEventListener("click", () => {
    let name = prompt("Pick a unique name for your savestate. (don't pick 'autosave' or 'savestates')")
    if (name != 'autosave' && name != "savestates" && name != null) {
        localStorage.setItem(name, JSON.stringify({
            comparisonCache: comparisonCache,
            responses: responses,
            yourResponseLetters: yourResponseLetters
        }))
        addSavestate(name)
    }
})

undo.addEventListener("click", () => {
    let notSelf = false
    do {
        notSelf = false
        let popped = comparisonCache.pop()
        for (let letter of yourResponseLetters) {
            if (popped.includes(letter)) {
                notSelf = true // if its an auto genned cache, do another
            }
        }
    } while (notSelf)
    resort()
})

finishBtn.addEventListener("click", () => {
    let sorted = Object.keys(responses).slice().sort(Sorter(false))
    if (confirm("Finishing early may reduce the accuracy of your vote severely. Make sure to use the review section carefully! Are you sure?")) reviewNow(sorted)
})

load.addEventListener("click", () => {

    savestates.style.display = "block"
    explanation.style.display = "none"
    responsesText.hidden = true
    letterFlagBox.style.display = "none"

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

            progress.max = permutations(Object.keys(responses).length) // this is an upper bound afaik, the browser's sort algo may be more efficient
            responsesText.hidden = true
            rank.style.display = "block"
            letterFlagBox.style.display = "none"
            explanation.style.display = "none"
            savestates.style.display = "none"
            responseA.hidden = false
            responseB.hidden = false

            resort()
        })
        li.appendChild(button)
        let deleteBtn = document.createElement("button")
        deleteBtn.innerText = "×"
        deleteBtn.addEventListener("click", () => {
            if (confirm("Are you sure you want to delete "  + savestateName + "?")) {
                let names = JSON.parse(localStorage.getItem("savestates"))
                localStorage.setItem("savestates", JSON.stringify(names.filter(item => item !== savestateName)))
                savestates.removeChild(li)
            }
        })
        li.appendChild(deleteBtn)
        savestates.appendChild(li)
    }
})


responseA.addEventListener("click", onResponseClick)
responseB.addEventListener("click", onResponseClick)
done.addEventListener("click", finish)

if (localStorage.getItem("savestates") == null) {
    localStorage.setItem("savestates", "[]")
}