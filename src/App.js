import React, { Component } from "react";
import MyEditor from "./myEditor/myEditor";
import './index.css'
import $ from 'jquery'
// import Tooltip from "./tooltip";
// import { Tooltip } from "antd";
// import { Button } from "antd";
export default class App extends Component {
	render() {
		return (
			<div id="app">
				<MyEditor />
			</div>
		);
	}
}
