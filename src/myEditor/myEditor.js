import React, { Component, createRef } from "react";
import Editor from "./core/editor";
import "./myEditor.css";

export default class MyEditor extends Component {
	constructor(props) {
		super(props);
		this.editorRef = createRef();
		window.editor = this.editor = new Editor();
	}
	editorFocus = () => {
		this.editorRef.current.className += " myEditor-focus";
	};
	editorBlur = () => {
		this.editorRef.current.className =
			this.editorRef.current.className.replace(" myEditor-focus", "");
	};
	bold = () => {
		this.editor.execCommand('bold')
	};
	italic = () => {
		this.editor.execCommand('italic')
	}
	render() {
		return (
			<>
				<div
					className="myEditor"
					contentEditable="true"
					ref={this.editorRef}
					onFocus={this.editorFocus}
					onBlur={this.editorBlur}
				></div>
				<br />
				<button onClick={this.bold}>加粗</button>
				<button onClick={this.italic}>斜体</button>
			</>
		);
	}
}
