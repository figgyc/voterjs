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

// https://stackoverflow.com/a/54708145/2758631
// creds to andyhasit, this function is under cc by-sa 4
function splitOnce(s, on) {
    [first, ...rest] = s.split(on)
    return [first, rest.length > 0? rest.join(on) : null]
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
let responses = {

}

let yourResponseLetter = ""
let currentResponseA = ""
let currentResponseB = ""

go.addEventListener("click", e => {
    // parse responses
    let responsesLines = responsesText.value.split("\n")
    console.log(responsesLines)
    for (let responseLine of responsesLines) {
        let responseSplit = splitOnce(responseLine, " ")
        let letter = responseSplit[0]
        let response = responseSplit[1]
        responses[letter] = response
    }
    yourResponseLetter = yourResponse.value

    // prep ui
    responsesText.hidden = true
    go.hidden = true
    yourResponse.hidden = true
    responseA.hidden = false
    responseB.hidden = false

    resort()
})

function resort() {
    try {
        let sorted = Object.keys(responses).sort((a, b) => { // sort not in place
            if (comparisonCache.includes(b + ">" + a)) {
                return b > a
            } else if (comparisonCache.includes(a + ">" + b)) {
                return a > b
            } else if (a == yourResponseLetter) {
                comparisonCache.push(a + ">" + b)
                return a > b
            } else if (b == yourResponseLetter) {
                comparisonCache.push(b + ">" + a)
                return b > a
            } else {
                currentResponseA = a
                currentResponseB = b
                throw "Unknown comparison"
            }
        })
        // TODO: output
        output.value = sorted.join("")
        output.hidden = false
        responseA.hidden = true
        responseB.hidden = true
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