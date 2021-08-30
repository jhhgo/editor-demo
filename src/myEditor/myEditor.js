import React, { Component, createRef } from 'react'
import Selection from './core/selection'
import './myEditor.css'

export default class MyEditor extends Component {
    constructor(props) {
        super(props)
        this.editorRef = createRef()
        this.selection = new Selection()
    }
    editorFocus = () => {
        this.editorRef.current.className += ' myEditor-focus'
    }
    editorBlur = () => {
        this.editorRef.current.className = this.editorRef.current.className.replace(' myEditor-focus', '')
    }
    test = () => {
        console.log(this.selection.getRange())
    }
    render() {
        return (
            <>
                <div className='myEditor' contentEditable='true' ref={this.editorRef} onFocus={this.editorFocus} onBlur={this.editorBlur}></div>
                <br />
                <button onClick={this.test}>加粗</button>
            </>
        )
    }
}