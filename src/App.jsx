import { Routes, Route } from "react-router-dom";
import Main from "./component/Main";
import Login from "./component/Login";

function App() {
  //const [count, setCount] = useState(0)

  return (
    <div>
      <h1>Hello World</h1>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </div>
  );
}

export default App;
