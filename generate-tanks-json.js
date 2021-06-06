const fs = require("fs")
const got = require("got")

const API_KEY = process.env.WG_API_KEY

function makeUrl(pageNumber) {
    const baseUrl = "https://api.worldoftanks.eu/wot/encyclopedia/vehicles/"
    const fields = ["short_name", "tier", "images.contour_icon", "images.big_icon"].join("%2C")
    const tiers = [5, 6, 7, 8, 9, 10].join("%2C")
    return `${baseUrl}?application_id=${API_KEY}&fields=${fields}&tier=${tiers}&page_no=${pageNumber}`
}

async function fetchPage(pageNumber) {
    const url = makeUrl(pageNumber)
    const { body } = await got.get(url, { responseType: "json" })
    return body
}

async function fetchAll() {
    let pageNumber = 1
    const result = {}
    while (true) {
        const { meta, data } = await fetchPage(pageNumber)
        Object.assign(result, data)
        if (meta.page_total === pageNumber) {
            break
        }
        pageNumber++
    }
    return result
}

fetchAll().then(data => fs.writeFileSync("./src/tanks.json", JSON.stringify(data, null, 2)))
