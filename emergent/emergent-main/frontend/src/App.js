import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import IdeaValidation from "@/pages/IdeaValidation";
import Debate from "@/pages/Debate";
import BrandKit from "@/pages/BrandKit";
import Landing from "@/pages/Landing";
import PitchDeck from "@/pages/PitchDeck";

function App() {
    return (
        <div className="App">
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<IdeaValidation />} />
                    <Route path="/results" element={<IdeaValidation />} />
                    <Route path="/debate" element={<Debate />} />
                    <Route path="/brand" element={<BrandKit />} />
                    <Route path="/landing" element={<Landing />} />
                    <Route path="/deck" element={<PitchDeck />} />
                </Routes>
            </BrowserRouter>
        </div>
    );
}

export default App;
