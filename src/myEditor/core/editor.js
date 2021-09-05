import Selection from "./selection";
import basestyles from "../plugins/basestyles";

export default class Editor {
	constructor() {
		this.commands = {};
		this.selection = new Selection();
		this.plugins(basestyles);
	}
	// 富文本操作
	execCommand() {}

	// 扩展
	plugins(fn) {
		typeof fn === "function" && fn.call(this);
	}
}
