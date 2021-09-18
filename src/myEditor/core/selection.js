import Range from "./range";
import domUtils from "../util/domUtils";

export default class Selection {
	constructor() {
		this._bakRange = null;
		this._cachedRange = null
		this._cachedStartElement = null
		this._cachedStartElementPath = null
	}
	getNative() {
		return window.getSelection();
	}
	getRange() {
		const sel = this.getNative();
		const range = new Range();
		const firstRange = sel.getRangeAt(0);
		const lastRange = sel.getRangeAt(sel.rangeCount - 1);
		range.setStart(firstRange.startContainer, firstRange.startOffset);
		range.setEnd(lastRange.endContainer, lastRange.endOffset);
		return (this._bakRange = range);
	}

	// 获取选区开始位置的父节点到body
	getStartElementPath() {
		if (this._cachedStartElementPath) {
			return this._cachedStartElementPath;
		}
		var start = this.getStart();
		if (start) {
			return domUtils.findParents(start, true, null, true);
		}
		return [];
	}

	// 缓存当前选区的range和选区的开始节点
	cache() {
		this.clear();
		this._cachedRange = this.getRange();
		this._cachedStartElement = this.getStart();
		this._cachedStartElementPath = this.getStartElementPath();
	}

	// 清空缓存
	 clear() {
		this._cachedStartElementPath = this._cachedRange = this._cachedStartElement = null;
	}

	// 获取开始元素
	getStart() {
		if (this._cachedStartElement) {
			return this._cachedStartElement;
		}
		var range = this.getRange(),
			start;
		range.shrinkBoundary();
		start = range.startContainer;
		if (start.nodeType === 1 && start.hasChildNodes()) {
			start =
				start.childNodes[
					Math.min(start.childNodes.length - 1, range.startOffset)
				];
		}
		if (start.nodeType === 3) {
			return start.parentNode;
		}
		return start;
	}
}
