/**
 * @jest-environment puppeteer
 */
import {
    zeroize, fullDate
} from '../../src/js/utils'

describe('public methods', () => {
    beforeAll(async () => {
        await page.goto('http://localhost:3000')
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
})
