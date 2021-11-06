import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { HashRouter as Router, Route, Switch } from 'react-router-dom'
import VConsole from 'vconsole'

const vConsole = new VConsole({ maxLogNumber: 1000 });

// https://reactrouter.com/web/example/basic

const routeConfig = [
    { path: '/', component: App },
]

ReactDOM.render(<Router><Switch>{routeConfig.map((route, index) => (
    <Route
        key={index}
        path={route.path}
        children={route.component} />
))}</Switch></Router>, document.getElementById('root'))


serviceWorker.unregister();
