import { useState } from "react";
import Tryouts from "./tryoutlist";
import Question from "./question";
import Navbar from "./../navbar" 

export default function TryoutPage({ token }) {
  const [selectedTryout, setSelectedTryout] = useState(null);

  const handleSelectTryout = (id) => {
    setSelectedTryout(id);
  };

  const handleBack = () => {
    setSelectedTryout(null);
  };

  return (
        <div style={{ display: "flex" }}>
          {/* Sidebar */}
          <Navbar />
    <div>
      {!selectedTryout ? (
        <Tryouts token={token} selectTryout={handleSelectTryout} />
      ) : (
        <div>
          <button onClick={handleBack}>Back to Tryouts</button>
          <Question tryoutId={selectedTryout} />
        </div>
      )}
    </div>
    </div>
  );
}
