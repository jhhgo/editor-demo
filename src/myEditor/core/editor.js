import Selection from "./selection";
import basestyles from "../plugins/basestyles";
import $ from 'jquery'
import dtd from './dtd'

export default class Editor {
	constructor() {
		this.commands = {};
		this._initEvents()
		this.selection = new Selection();
		this.plugins(basestyles);
	}
	// 初始化事件
	_initEvents() {
		const me = this
		$(document).on('mouseup', '.myEditor', function (e) {
			me._selectionChange(250, e)
		})
	}
	// 富文本操作
	execCommand(cmdName) {
		cmdName = cmdName.toLowerCase();
		let me = this,
			result,
			cmd = me.commands[cmdName];
		if (!cmd || !cmd.execCommand) {
			return null;
		}
		if (!cmd.notNeedUndo && !me.__hasEnterExecCommand) {
			me.__hasEnterExecCommand = true;
			if (me.queryCommandState.apply(me, arguments) != -1) {
				result = this._callCmdFn('execCommand', arguments);
			}
			me.__hasEnterExecCommand = false;
		} else {
			result = this._callCmdFn('execCommand', arguments);
		}
		(!me.__hasEnterExecCommand && !cmd.ignoreContentChange && !me._ignoreContentChange) && me._selectionChange();
		return result;

	}

	// 根据传入的command命令，查选编辑器当前的选区，返回命令的状态
	queryCommandState(cmdName) {
		return this._callCmdFn('queryCommandState', arguments);
	}

	_callCmdFn(funName, args) {
		
		let cmdName = args[0].toLowerCase(),
			cmd, cmdFn;
		cmd = this.commands[cmdName];
		cmdFn = cmd && cmd[funName];
		//没有querycommandstate或者没有command的都默认返回0
		if ((!cmd || !cmdFn) && funName === 'queryCommandState') {
			return 0;
		} else if (cmdFn) {
			return cmdFn.apply(this, args);
		}
	}

	// 扩展
	plugins(fn) {
		typeof fn === "function" && fn.call(this);
	}

	_selectionChange(delay, evt) {

		const me = this;
		clearTimeout(this._selectionChangeTimer);

		this._selectionChangeTimer = setTimeout(function () {
			if (!me.selection || !me.selection.getNative()) {
				return;
			}
			me.selection.cache();
			if (me.selection._cachedRange && me.selection._cachedStartElement) {
				me.selection.clear();
			}
		}, delay || 50);
	}
}
