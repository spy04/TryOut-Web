import { useEffect, useState } from "react";
import { fetchDetailMateri } from "../../../api/api";
import ReactMarkdown from "react-markdown";
import { useParams } from "react-router-dom";
import Navbar from "./../navbar"; // Import Navbar component

export default function DetailMateri({ token }) {
  const { materiId } = useParams(); // Get materiId from URL params
  const [materi, setMateri] = useState(null); // Now, materi is a single object
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isNavbarOpen, setIsNavbarOpen] = useState(true); // State to control navbar toggle
  const [toc, setToc] = useState([]); // State to store the table of contents

  useEffect(() => {
    const loadMateri = async () => {
      if (!materiId) {
        console.error("No materiId provided in URL.");
        setError("Invalid practice ID.");
        setLoading(false);
        return;
      }

      try {
        console.log(`Fetching materi with materiId=${materiId}`); // Debugging line
        const res = await fetchDetailMateri(materiId); // Fetch the materi by ID
        setMateri(res.data); // Assuming res.data contains the single materi object
        setLoading(false);

        // Generate Table of Contents for only h3 headings
        generateTableOfContents(res.data.konten_materi);
      } catch (err) {
        console.error("Error fetching materi:", err); // More detailed logging for errors
        setError("Failed to load materi.");
        setLoading(false);
      }
    };

    loadMateri();
  }, [materiId, token]); // Ensure token and materiId are in the dependency array

  const generateTableOfContents = (content) => {
    const tocItems = [];
    const lines = content.split('\n'); // Split the content into lines

    // Loop through lines and look for headings (### for h3)
    lines.forEach((line) => {
      if (line.startsWith('### ')) { // Check if the line starts with a heading
        const text = line.slice(4); // Remove the '### ' part
        const id = text.toLowerCase().replace(/[^a-z0-9]/g, "-"); // Create an ID from the text
        tocItems.push({ text, id });
      }
    });

    setToc(tocItems); // Set the table of contents in state
  };

  const toggleMenu = () => {
    setIsNavbarOpen(!isNavbarOpen); // Toggle the navbar state
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar */}
      <Navbar isNavbarOpen={isNavbarOpen} toggleMenu={toggleMenu} />

      {/* Content Wrapper */}
      <div
        style={{
          display: "flex",
          backgroundColor: "white",
          borderRadius: "10px",
          padding: "20px",
          height: "100%",
          flex: 1,
          marginLeft: isNavbarOpen ? "22%" : "7%",
          transition: "margin-left 0.3s ease",
        }}
      >
        {/* Materi Content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <h3>{materi.judul_materi}</h3>

          <div className="materi-content" style={{ flex: 1, overflowY: "auto" }}>
            {/* Render content with IDs for scrolling */}
            <ReactMarkdown
              children={materi.konten_materi}
              components={{
                h3: ({ children }) => {
                  // Check if children exist and process the text safely
                  const headingText = children && children[0] ? children[0] : "";
                  const id = headingText.toLowerCase().replace(/[^a-z0-9]/g, "-");
                  return (
                    <h3 id={id} style={{ marginTop: "30px" }}>
                      {children}
                    </h3>
                  );
                },
              }}
            />
          </div>
        </div>

        {/* Table of Contents Sidebar */}
        <div
          style={{
            width: "250px",
            marginLeft: "20px",
            position: "sticky",
            top: "20px",
            height: "calc(100vh - 40px)", // Make sure the sidebar stays within the viewport
            overflowY: "auto",
          }}
        >
          <h4>Daftar Isi</h4>
          <ul style={{ listStyleType: "none", paddingLeft: 0 }}>
            {toc.map((item, index) => (
              <li key={index}>
                <a
                  href={`#${item.id}`} // Link to the ID of the heading
                  style={{
                    fontSize: "18px",
                    textDecoration: "none",
                    color: "blue",
                  }}
                >
                  {item.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
