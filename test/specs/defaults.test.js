/**
 * @jest-environment puppeteer
 */
describe('validate default config', () => {
    beforeAll(async () => {
        await page.goto('http://localhost:3000')
    })

    it('TableSchedule should be a function', async () => {
        const type = await page.evaluate(() => {
            return typeof TableSchedule
        })
        expect(type).toBe('function')
    })
    it('Initiating with invalid element/selector should throw error', async () => {
        let e = await page.evaluate(() => {
            let e = ''
            try {
                new TableSchedule('#non-existing')
            } catch (error) {
                e = error.message
            }
            return e
        })
        expect(e).toBe('el must be a <TABLE> element or a valid selector')
    })
    it('Initiating with default options', async () => {
        const sd = await page.evaluate(() => {
            var ts = new TableSchedule('#table-schedule')
            return ts.config.startDate.toLocaleDateString()
        })
        const today = new Date()
        expect(sd).toBe(today.toLocaleDateString())
    })
})
