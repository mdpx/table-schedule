/**
 * @jest-environment puppeteer
 */
import {
    minuteToTimeStr
} from '../../src/js/utils'

const randomR = function(l) {
    return Math.floor(Math.random() * l)
}
const genRandomEvent = () => {
    var r = randomR(7)
    var date = new Date()
    date.setDate(date.getDate() + r)

    const dayStart = 6
    const dayEnd = 22
    const maxDur = 120
    const minDur = 30
    const gap = 10
    var startMin = dayStart * 60 + Math.floor((Math.random() * (dayEnd - maxDur / 60 - dayStart) * 60) / gap) * gap
    var endMin = startMin + minDur + Math.floor(Math.random() * (maxDur - minDur) / gap) * gap
    
    return {
        date: date.getFullYear() + '-' + (date.getMonth() + 1).toString().padStart(2,'0') + '-' + date.getDate().toString().padStart(2,'0'),
        start: minuteToTimeStr(startMin),
        end: minuteToTimeStr(endMin),
        title: 'title',
        content: 'content'
    }
}

describe('helper methods', () => {
    beforeAll(async () => {
        await page.goto('http://localhost:3000')
        await page.exposeFunction('genRandomEvent', genRandomEvent)
        page.on('console', msg => console.log(msg.text()))
    })

    it('_toDateIndex', async () => {
        const res = await page.evaluate(() => {
            let today = new Date()
            let ts = new TableSchedule('#table-schedule')

            let r1 = ts._toDateIndex(0) // 0
            let r2 = ts._toDateIndex(today) // 0
            today.setDate(today.getDate() + 1)
            let r3 = ts._toDateIndex(today) // 1
            
            return [r1, r2, r3]
        })
        expect(res[0]).toBe(0)
        expect(res[1]).toBe(0)
        expect(res[2]).toBe(1)
    })

    it('_toDateIndexList', async () => {
        const res = await page.evaluate(() => {
            let today = new Date()
            let ts = new TableSchedule('#table-schedule')

            let r1 = ts._toDateIndexList() // [0 .. 6]
            let r2 = ts._toDateIndexList(today) // [0]
            let r3 = ts._toDateIndexList([3, today, 'xxx']) // [3, 0]
            
            return [r1, r2, r3]
        })
        expect(res[0]).toEqual([0, 1, 2, 3, 4, 5, 6])
        expect(res[1]).toEqual([0])
        expect(res[2]).toEqual([3, 0])
    })
})
