import React from 'react';
import logo from './logo.svg';
import {Game} from './game'
import Webgl1 from './webgl/1'
import Webgl2 from './webgl/2'
import Webgl3 from './webgl/3'
import Webgl4 from './webgl/4'
import Webgl5 from './webgl/5'
import './App.css';
import {Route, Switch} from 'react-router-dom' 

const routeConfig = [
  { path: '/game', component: Game },
  { path: '/webgl/1', component: Webgl1 },
  { path: '/webgl/2', component: Webgl2 },
  { path: '/webgl/3', component: Webgl3 },
  { path: '/webgl/4', component: Webgl4 },
  { path: '/webgl/5', component: Webgl5 },
]

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
      <Switch>
        {routeConfig.map((route, i) => (
          <Route
          key={route.path}
          path={route.path}
          render={props => (
            // pass the sub-routes down to keep nesting
            <route.component {...props} routes={route.routes || []} />
          )}
        />
        ))}
      </Switch>
    </div>
  );
}

export default App;
