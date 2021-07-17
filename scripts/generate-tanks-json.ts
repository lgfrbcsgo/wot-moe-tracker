import { dictionary, isNumber, isString, record } from "../src/guards"
import { Vehicle } from "../src/types"

const fs = require("fs")
const got = require("got")

const API_KEY = process.env.WG_API_KEY

const isVehicle = record({
    tier: isNumber,
    images: record({
        contour_icon: isString,
        big_icon: isString,
    }),
    short_name: isString,
})

const isPage = record({
    meta: record({ page_total: isNumber }),
    data: dictionary(isVehicle),
})

function makeUrl(pageNumber: number) {
    const baseUrl = "https://api.worldoftanks.eu/wot/encyclopedia/vehicles/"
    const fields = ["short_name", "tier", "images.contour_icon", "images.big_icon"].join("%2C")
    const tiers = [5, 6, 7, 8, 9, 10].join("%2C")
    return `${baseUrl}?application_id=${API_KEY}&fields=${fields}&tier=${tiers}&page_no=${pageNumber}`
}

async function fetchPage(pageNumber: number) {
    const url = makeUrl(pageNumber)
    const { body } = await got.get(url, { responseType: "json" })
    if (!isPage(body)) {
        console.log(body)
        throw new Error("Unexpected data format")
    }
    return body
}

async function fetchAll() {
    let pageNumber = 1
    let result: Vehicle[] = []
    while (true) {
        const { meta, data } = await fetchPage(pageNumber)
        console.log("Page", pageNumber)
        const vehicles = Object.entries(data).map(([id, vehicle]) => ({
            id,
            tier: vehicle.tier,
            name: vehicle.short_name,
            iconUrl: vehicle.images.contour_icon,
            imageUrl: vehicle.images.big_icon,
        }))
        result = [...result, ...vehicles]
        if (meta.page_total === pageNumber) {
            break
        }
        pageNumber++
    }
    return result
}

fetchAll()
    .then(data => fs.writeFileSync("./public/tanks.json", JSON.stringify(data, null, 2)))
    .catch(console.error)
