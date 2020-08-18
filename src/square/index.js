import React from 'react';

// export class Square extends React.Component {
//     constructor(props) {
//         super(props);
//         console.warn(props)
//     }
//     render() {
//         return (
//         <button 
//             className="square"  
//             onClick={() => this.props.onClick()}
//         >
//             {this.props.value}
//         </button>
//         );
//     }
// }

/**
 * 函数组件
 * 如果你想写的组件只包含一个 render 方法，并且不包含 state，那么使用函数组件就会更简单。我们不需要定义一个继承于 React.Component 的类，我们可以定义一个函数
 */

export function Square (props) {
    return (
        <button className="square" onClick={props.onClick}>
        {props.value}
        </button>
    );
}
