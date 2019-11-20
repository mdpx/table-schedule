/**
 * @jest-environment jsdom
 */

import {
    zeroize, fullDate, includesAny
} from '../../src/js/utils'

const REGEX = {
    date: /([12]\d{3}\/(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01]))/,
    time: /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/
}

describe('utils test', () => {
    it('zeroize', () => {
        let hh = zeroize(6)
        expect(hh).toBe('06')
        hh = zeroize(24)
        expect(hh).toBe('24')
    })
    it('fullDate', () => {
        let today = new Date()
        let todayStr = today.getFullYear() + '/' + zeroize(today.getMonth() + 1) + '/' + zeroize(today.getDate())
        expect(fullDate(today)).toBe(todayStr)
    })
    it('includesAny', () => {
        let big = []
        for (let i = 0; i < 50; i++) {
            big.push(Math.floor(Math.random() * 100))
        }
        // single value
        let small = big[0]
        expect(includesAny(big, small)).toBe(true)
        small = 'x'
        expect(includesAny(big, small)).toBe(false)
        // array
        small = big.concat([])
        for (let i = 0; i < 30; i++) {
            let l = small.length
            small.splice(Math.floor(Math.random() * l), 1)
        }
        expect(includesAny(big, small)).toBe(true)

        // edge cases
        expect(includesAny([], 1)).toBe(false)
        expect(includesAny([1], [])).toBe(false)
        expect(includesAny([])).toBe(false)
        expect(includesAny()).toBe(false)
    })
})