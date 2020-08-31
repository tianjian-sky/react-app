import React from 'react';
import logo from './logo.svg';
import {Game} from './game'
import Webgl1 from './webgl/1'
import Webgl2 from './webgl/2'
import './App.css';
import {Route, Switch} from 'react-router-dom' 

const routeConfig = [
  { path: '/game', component: Game },
  { path: '/webgl/1', component: Webgl1 },
  { path: '/webgl/2', component: Webgl2 },
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
