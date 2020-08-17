/*

    Voter.js by figgyc

*/

// https://stackoverflow.com/a/40385425/2758631
// creds to "OK sure", this function is under cc by-sa 4
function countWords(str) {
    return str
      .split(' ')
      .filter(function(n) { return n != '' })
      .length;
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
let responseA = document.querySelector("#responseA")
let responseB = document.querySelector("#responseB")
let output = document.querySelector("#output")
let letterFlag = document.querySelector("#letter")
let letterFlagBox = document.querySelector("#letterFlagBox")
let progress = document.querySelector("#progress")
let explanation = document.querySelector("#explanation")

let responses = {

}

const aGb = -1
const bGa = 1

let yourResponseLetters = []
let currentResponseA = ""
let currentResponseB = ""

go.addEventListener("click", e => {
    // parse responses
    let responsesLines = responsesText.value.split("\n")
    responsesLines.filter(line => line != "")
    let i = 0
    for (let responseLine of responsesLines) {
        if (letterFlag.checked) {
            let responseSplit = twowSplit(responseLine)
            let letter = responseSplit[0].slice(-1)
            let response = responseSplit[1]
            console.log(responseLine, responseSplit, letter, response, responsesLines)
            responses[letter] = response
        } else {
            responses[i] = responseLine
        }
        i++
    }
    yourResponseLetters = yourResponse.value.replace(" ", "").split(",")

    // prep ui
    progress.max = permutations(Object.keys(responses).length) // this is an upper bound afaik, the browser's sort algo may be more efficient
    responsesText.hidden = true
    go.hidden = true
    progress.style.display = "block"
    letterFlagBox.style.display = "none"
    explanation.style.display = "none"
    yourResponse.hidden = true
    responseA.hidden = false
    responseB.hidden = false

    resort()
})

function resort() {
    try {
        let sorted = Object.keys(responses).slice().sort((a, b) => { // sort not in place
            if (comparisonCache.includes(b + ">" + a)) {
                return bGa
            } else if (comparisonCache.includes(a + ">" + b)) {
                return aGb
            } else if (yourResponseLetters.includes(a)) {
                comparisonCache.push(a + ">" + b)
                progress.value = comparisonCache.length
                return aGb
            } else if (yourResponseLetters.includes(b)) {
                comparisonCache.push(b + ">" + a)
                progress.value = comparisonCache.length
                return bGa
            } else {
                currentResponseA = a
                currentResponseB = b
                throw "Unknown comparison"
            }
        })
        output.value = sorted.join("")
        let resorted = ""
        for (let letter of sorted) {
            resorted += letter + " " + responses[letter] + "\n"
        }
        responsesText.value = resorted
        if (letterFlag.checked) output.hidden = false
        responseA.hidden = true
        responseB.hidden = true
        responsesText.hidden = false
    } catch (e) {
        responseA.innerText = responses[currentResponseA] + " (" + countWords(responses[currentResponseA]) + ")"
        responseB.innerText = responses[currentResponseB] + " (" + countWords(responses[currentResponseB]) + ")"
    }
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

responseA.addEventListener("click", onResponseClick)
responseB.addEventListener("click", onResponseClick)