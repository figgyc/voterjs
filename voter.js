/*

    Voter.js by figgyc

*/

// https://stackoverflow.com/a/40385425/2758631
// creds to "OK sure", this function is under cc by-sa 4
function countWords(str) {
    return str
      .replace(/[!.,:;?]+/, " ")
      //.replace(/[]/, " ")
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
let done = document.querySelector("#done")
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
let load = document.querySelector("#load")
let savestates = document.querySelector("#savestates")

let responses = {

}

const aGb = -1
const bGa = 1

let yourResponseLetters = []
let currentResponseA = ""
let currentResponseB = ""

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
            let letter = responseSplit[0].slice(-1)
            let response = responseSplit[1]
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
    rank.style.display = "block"
    letterFlagBox.style.display = "none"
    explanation.style.display = "none"
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
                return aGb
            } else if (yourResponseLetters.includes(b)) {
                comparisonCache.push(b + ">" + a)
                return bGa
            } else {
                currentResponseA = a
                currentResponseB = b
                throw "Unknown comparison"
            }
        })
        // done sorting
        for (let letter of sorted) {
            let element = document.createElement("li")
            element.responseCode = letter
            element.innerText = responses[letter]
            reviewList.appendChild(element)
        }
        Sortable.create(reviewList, {
            animation: 150,
        })
        responseA.hidden = true
        responseB.hidden = true
        review.style.display = "block"
    } catch (e) {
        localStorage.setItem("autosave", JSON.stringify({
            comparisonCache: comparisonCache,
            responses: responses
        }))
        addSavestate("autosave")
        progress.value = comparisonCache.length
        responseA.innerText = responses[currentResponseA] + ( wordCount.checked ? (" (" + countWords(responses[currentResponseA]) + ")") : "" )
        responseB.innerText = responses[currentResponseB] + ( wordCount.checked ? (" (" + countWords(responses[currentResponseB]) + ")") : "" )
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
    responsesText.value = resorted
    if (letterFlag.checked) output.hidden = false
    review.style.display = "none"
    responsesText.hidden = false

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
            responses: responses
        }))
        addSavestate(name)
    }
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