import { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Spinner } from 'react-bootstrap';
import './App.css';
import { ToastContainer } from 'react-toastify'; //toster
import 'react-toastify/dist/ReactToastify.css';

import { BrowserRouter as Router, Switch, Route } from "react-router-dom";


import Home from './pages/home';

function App() {

  const [loading, setLoading] = useState(false);
  const [tokenCount, setTokenCount] = useState(0);

  return (
    <Router>
      <div className="App">
        <ToastContainer autoClose={4000} limit={3}></ToastContainer>
        <div className={loading ? "pageData loading-div" : "pageData"}>
          <div className={loading ? 'loading-bar-center' : 'hide'}>
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
          <Switch>
            <Route exact path="/">
              <Home loading={loading} setLoading={setLoading}/>
            </Route>
          </Switch>
        </div>
      </div>
    </Router>
  );
}

export default App;
