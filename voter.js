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

let responses = {

}

const aGb = -1
const bGa = 1

let yourResponseLetter = ""
let currentResponseA = ""
let currentResponseB = ""

go.addEventListener("click", e => {
    // parse responses
    let responsesLines = responsesText.value.split("\n")
    let i = 0
    for (let responseLine of responsesLines) {
        if (letterFlag.checked) {
            let responseSplit = splitOnce(responseLine, /[\t ]+/)
            let letter = responseSplit[0].slice(-1)
            let response = responseSplit[1]
            responses[letter] = response
        } else {
            responses[i] = responseLine
        }
        i++
    }
    yourResponseLetter = yourResponse.value

    // prep ui
    responsesText.hidden = true
    go.hidden = true
    letterFlagBox.style.display = "none"
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
            } else if (a == yourResponseLetter) {
                comparisonCache.push(a + ">" + b)
                return aGb
            } else if (b == yourResponseLetter) {
                comparisonCache.push(b + ">" + a)
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
        if (!letterFlag.checked) output.hidden = false
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
    } else {
        comparisonCache.push(currentResponseB + ">" + currentResponseA)
    }

    resort()
}

responseA.addEventListener("click", onResponseClick)
responseB.addEventListener("click", onResponseClick)