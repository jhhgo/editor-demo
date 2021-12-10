import React, { Component } from "react";
import "./myEditor.css";

export default class MyEditor extends Component {
	constructor(props) {
		super(props);
	}
	currentFillingCharNode = null;
	static zeroWithChar = "\ufeff";

	handleEditorKeyDown = (e) => {
		const { keyCode } = e
		if (keyCode === 8 || keyCode === 37) {
			this.removeFillingCharNode()
		}
	}

	createSpan = ({ fontSize }) => {
		const span = document.createElement("span");
		const fillingChar = document.createTextNode(MyEditor.zeroWithChar);
		this.currentFillingCharNode = fillingChar;
		span.appendChild(fillingChar);
		span.style.fontSize = fontSize;
		return span;
	};

	changeFontSize = (e) => {
		const fontSize = `${e.target.value}px`;
		const sel = window.getSelection();

		if (sel.rangeCount) {
			const range = sel.getRangeAt(0);
			if (range.collapsed) {
				const span = this.createSpan({ fontSize });
				range.insertNode(span);
				range.setStartAfter(span);
				range.collapse(true);
				sel.removeAllRanges();
				sel.addRange(range);
			} else {
				document.execCommand("styleWithCSS", false, false);
				document.execCommand("fontSize", false, 1);
				document.querySelectorAll('FONT[size="1"]').forEach((dom) => {
					dom.removeAttribute("size");
					dom.style.fontSize = fontSize;
				});
			}
		}
	};

	removeFillingCharNode = () => {
		if (this.currentFillingCharNode) {
			const fillingCharNode = this.currentFillingCharNode;
			this.currentFillingCharNode = null;
			const sel = window.getSelection();
			const range = sel?.rangeCount && sel.getRangeAt(0);
			if (false) {
			} else {
				const length = fillingCharNode.nodeValue.length;
				const parentNode = fillingCharNode.parentNode;
				if (
					length === 1 &&
					parentNode?.childNodes?.length === 1 &&
					parentNode.childNodes[0] === fillingCharNode
				) {
					parentNode.remove()
				}
			}
		}
	};

	render() {
		return (
			<div className="editor-wrap">
				<div className="btn-wrap">
					<select
						onChange={(e) => this.changeFontSize(e)}
						name=""
						id=""
					>
						<option value={12}>12</option>
						<option value={14}>14</option>
						<option value={16}>16</option>
						<option value={18}>18</option>
						<option value={20}>20</option>
						<option value={36}>36</option>
						<option value={48}>48</option>
						<option value={60}>60</option>
						<option value={80}>80</option>
					</select>
					<button>加粗</button>
					<button>斜体</button>
				</div>

				<div className="editor" onKeyDown={(e) => this.handleEditorKeyDown(e) } contentEditable="true"></div>
			</div>
		);
	}
}
