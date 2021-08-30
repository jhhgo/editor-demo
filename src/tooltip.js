import React, { Component, createRef } from "react";
import ReactDOM from "react-dom";
import "./index.css";

class ToolTipPortal extends Component {
	constructor(props) {
		super(props);
		this.el = document.createElement("div");
	}
	componentDidMount() {
		document.body.appendChild(this.el);
	}
	componentWillUnmount() {
		document.body.removeChild(this.el);
	}
	render() {
		return ReactDOM.createPortal(this.props.children, this.el);
	}
}

export default class ToolTip extends Component {
	state = {
		visible: false,
		top: 0,
		left: 0,
	};
	constructor(props) {
		super(props);
		this.tooltipWrapper = createRef();
		this.childrenRef = createRef();
	}
	getWrapperBounding = () => {
		const { width, height, top, left } =
			this.childrenRef.current.getBoundingClientRect();
		const { height: wrapperHeight, width: wrapperWidth } =
			this.tooltipWrapper.current.getBoundingClientRect();
		const { scrollX, scrollY } = window;

		const position = {
			top: top + height + scrollY,
			left: left + scrollX + width / 2 - wrapperWidth / 2,
		};
		return position;
	};
	showTooltip = () => {
		const { top, left } = this.getWrapperBounding();
		this.setState({
			top,
			left,
			visible: true,
		});
	};
	closeTooltip = () => {
		this.setState({
			visible: false,
		});
	};
	componentDidMount() {
		console.log(1123);
	}
	render() {
		const { visible, left, top } = this.state;
		const that = this;
		return (
			<>
				<ToolTipPortal>
					<div
						className={
							visible ? "tooltip-wrap" : "tooltip-wrap hide"
						}
						ref={this.tooltipWrapper}
						style={{ top, left }}
					>
						{this.props.title}
					</div>
				</ToolTipPortal>
				{React.cloneElement(this.props.children, {
					onMouseEnter: that.showTooltip,
					onMouseOut: that.closeTooltip,
					ref: that.childrenRef,
				})}
			</>
		);
	}
}
