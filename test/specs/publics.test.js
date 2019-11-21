/**
 * @jest-environment puppeteer
 */
import {
    fullDate, minuteToTimeStr
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

describe('public methods', () => {
    beforeAll(async () => {
        await page.goto('http://localhost:3000')
        await page.exposeFunction('genRandomEvent', genRandomEvent)
        await page.exposeFunction('minuteToTimeStr', minuteToTimeStr)
        page.on('console', msg => console.log(msg.text()))
    })

    it('addEvent', async () => {
        let today = fullDate(new Date())
        await page.evaluate((sd) => {
            let ts = new TableSchedule('#table-schedule')
            ts.addEvent({
                date: sd,
                start: '08:00',
                end: '09:00',
                title: 'test item 1'
            })
        }, today)

        let items = await page.$$('.event')
        expect(items.length).toBe(1)
        expect(await items[0].$eval('.event-title', node => node.innerText)).toBe('test item 1')
        // TODO: position check
        // console.log(await items[0].boundingBox())

        // out of range items should not be added
        let eow = fullDate(new Date(2012, 11, 24))
        await page.evaluate((sd) => {
            let ts = new TableSchedule('#table-schedule')
            ts.addEvent({
                date: sd,
                start: '08:00',
                end: '09:00',
                title: 'test item 2'
            })
        }, eow)
        items = await page.$$('.event')
        expect(items.length).toBe(0)
    })

    it('updateEvent', async () => {
        let today = fullDate(new Date())
        let tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        await page.evaluate((sd, se) => {
            let ts = new TableSchedule('#table-schedule')
            ts.addEvent({
                date: sd,
                start: '08:00',
                end: '09:00',
                title: 'test item 3'
            })
            ts.updateEvent([0, 0], {
                date: se,
                start: '09:00',
                end: '09:30',
                title: 'test item 3 modified'
            })
        }, today, fullDate(tomorrow))

        let items = await page.$$('.event')
        expect(items.length).toBe(1)
        expect(await items[0].$eval('.event-title', node => node.innerText)).toBe('test item 3 modified')
        // TODO: position check
    })

    it('deleteEvent', async () => {
        let today = fullDate(new Date())
        await page.evaluate((sd) => {
            let ts = new TableSchedule('#table-schedule')
            ts.addEvent({
                date: sd,
                start: '08:00',
                end: '09:00',
                title: 'test item 4'
            })
            ts.deleteEvent([0, 0])
        }, today)

        let items = await page.$$('.event')
        expect(items.length).toBe(0)
    })

    it('clear', async () => {
        let today = fullDate(new Date())
        const count = await page.evaluate(async (sd) => {
            let ts = new TableSchedule('#table-schedule')

            for (let i = 0; i < 10; i++) {
                let e = await genRandomEvent()
                ts.addEvent(e)
            }

            ts.addEvent({
                date: sd,
                start: '08:00',
                end: '09:00'
            })
            ts.clear(0) // clear one day with dateIndex
            let count1 = ts.events[0].length // 0

            ts.addEvent({
                date: sd,
                start: '08:00',
                end: '09:00'
            })
            ts.clear(sd) // with date string
            let count2 = ts.events[0].length // 0

            ts.addEvent({
                date: sd,
                start: '08:00',
                end: '09:00'
            })
            ts.clear(new Date(sd)) // with date
            let count3 = ts.events[0].length // 0

            ts.clear() // clear all
            let count4 = document.querySelectorAll('.event').length // 0

            return { count1, count2, count3, count4 }
        })
        expect(count.count1 + count.count2 + count.count3 + count.count4).toBe(0)
    })

    it('rerender', async () => {
        const count = await page.evaluate(async () => {
            let ts = new TableSchedule('#table-schedule')

            for (let i = 0; i < 10; i++) {
                ts.addEvent(await genRandomEvent())
            }
            document.querySelectorAll('.event').forEach(e => {
                e.remove()
            })
            ts.rerender()
            let count = document.querySelectorAll('.event').length // 10
            return count
        })
        expect(count).toBe(10)
    })

    it('changeStartDate', async () => {
        await page.evaluate(async () => {
            let today = new Date()
            let ts = new TableSchedule('#table-schedule')
            today.setDate(today.getDate() + 1)
            ts.changeStartDate(today)
        })
        let items = await page.$$('#table-schedule > thead > tr > th')
        let tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow = fullDate(tomorrow)
        expect(await items[1].$eval('div', node => node.innerText)).toBe(tomorrow.substring(5))
    })
})
