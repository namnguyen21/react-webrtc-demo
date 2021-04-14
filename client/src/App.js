import { BrowserRouter as Router, Route } from "react-router-dom";
import VideoChat from "./VideoChat";
function App() {
  return (
    <Router>
      <div className="App">
        <Route path="/" component={Home} />
        <Route path="/:roomId" component={VideoChat} />
      </div>
      ;
    </Router>
  );
}

function Home() {
  return <div>Hello</div>;
}

export default App;
