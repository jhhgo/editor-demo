import Range from "./range"


export default class Selection {
    constructor() {
        this._bakRange = null
    }
    getNative() {
        return window.getSelection()
    }
    getRange() {
        const sel = this.getNative()
        const range = new Range()
        const firstRange = sel.getRangeAt(0)
        const lastRange = sel.getRangeAt(sel.rangeCount - 1)
        range.setStart(firstRange.startContainer, firstRange.startOffset)
        range.setEnd(lastRange.endContainer, lastRange.endOffset)
        return this._bakRange = range
    }
}