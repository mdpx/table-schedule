import { handlers } from './handlers'

export default {
    _bind() {
        for (let key in handlers) {
            this._handlers[key] = handlers[key].bind(this)
        }
        this.el.root.addEventListener('mousedown', this._handlers.touchstart)
        this.el.root.addEventListener('touchstart', this._handlers.touchstart)
        document.addEventListener('keydown', this._handlers.keydown)
    },
    _unbind() {
        this.el.root.removeEventListener('mousedown', this._handlers.touchstart)
        this.el.root.removeEventListener('touchstart', this._handlers.touchstart)
        document.removeEventListener('keydown', this._handlers.keydown)
    },
}