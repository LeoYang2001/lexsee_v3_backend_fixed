import { useEffect, useState } from "react";
import { data, type Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { useAuthenticator } from "@aws-amplify/ui-react";

const client = generateClient<Schema>();

function App() {
  const [newWordJson, setNewWordJson] = useState("");
  const [words, setWords] = useState<Array<Schema["Word"]["type"]>>([]);
  const [wordsLists, setWordsLists] = useState<
    Array<Schema["WordsList"]["type"]>
  >([]);
  const [selectedWordId, setSelectedWordId] = useState("");
  const [selectedListId, setSelectedListId] = useState("");
  const [newListType, setNewListType] = useState("");
  const { user, signOut } = useAuthenticator();

  // Fetch all words and word lists on component mount
  useEffect(() => {
    fetchWordsAndLists();
  }, []);

  async function fetchWordsAndLists() {
    try {
      const [wordsResult, listsResult] = await Promise.all([
        client.models.Word.list(),
        client.models.WordsList.list(),
      ]);

      setWords(wordsResult.data);
      setWordsLists(listsResult.data);
      console.log("listsResult.data");
      console.log(listsResult.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }

  async function handleCreateWord() {
    console.log("creating word");
    try {
      const { errors, data: newWord } = await client.models.Word.create({
        id: crypto.randomUUID(), // Generate a unique ID
        data: JSON.stringify({ word: "test" }), // Parse the JSON input
      });
      console.log(newWord);
      if (newWord) {
        setWords((prev) => [...prev, newWord]);
      }
    } catch (error) {
      console.error("Error creating word:", error);
      alert("Failed to create word. Check console for details.");
      return;
    }
  }

  async function handleCreateWordsList() {
    if (!newListType.trim()) {
      alert("Please enter a list type name");
      return;
    }

    // Check if list type already exists
    const existingList = wordsLists.find(
      (list) => list.type === newListType.trim()
    );
    if (existingList) {
      alert("A list with this type already exists");
      return;
    }

    try {
      const { errors, data: newList } = await client.models.WordsList.create({
        type: newListType.trim(),
      });

      console.log("Created new list:", newList);
      if (newList) {
        setWordsLists((prev) => [...prev, newList]);
        setNewListType("");
        alert(`WordsList "${newList.type}" created successfully!`);
      }
    } catch (error) {
      console.error("Error creating WordsList:", error);
      alert("Failed to create WordsList. Check console for details.");
    }
  }

  async function handleLinkWordToList() {
    if (!selectedWordId || !selectedListId) {
      alert("Please select both a word and a list");
      return;
    }

    try {
      const { errors, data: updatedWord } = await client.models.Word.update({
        id: selectedWordId,
        wordsListId: selectedListId,
      });

      if (updatedWord) {
        // Update the word in the local state
        setWords((prev) =>
          prev.map((word) =>
            word.id === selectedWordId
              ? { ...word, wordsListId: selectedListId }
              : word
          )
        );

        setSelectedWordId("");
        setSelectedListId("");
        alert("Word successfully linked to list!");
      }
    } catch (error) {
      console.error("Error linking word:", error);
      alert("Failed to link word. Check console for details.");
    }
  }

  // Get unlinked words (words without wordsListId)
  const unlinkedWords = words.filter((word) => !word.wordsListId);

  return (
    <main>
      <h1>{user?.signInDetails?.loginId}'s Lexsee</h1>
      <button onClick={signOut}>Sign out</button>

      <h2>Create New WordsList</h2>
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          value={newListType}
          onChange={(e) => setNewListType(e.target.value)}
          placeholder="Enter list type name (e.g., collected, learned, favorites)"
          style={{
            width: "300px",
            padding: "8px",
            marginRight: "10px",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        />
        <button
          onClick={handleCreateWordsList}
          style={{
            padding: "8px 16px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Create List
        </button>
      </div>

      <h2>Create New Word</h2>
      <textarea
        value={newWordJson}
        onChange={(e) => setNewWordJson(e.target.value)}
        placeholder="Paste JSON for new word here"
        rows={5}
        style={{ width: "100%", marginBottom: "10px" }}
      />
      <button onClick={handleCreateWord}>Create Word</button>

      <hr style={{ margin: "30px 0" }} />

      <h2>Link Existing Words to Lists</h2>
      <div style={{ marginBottom: "20px" }}>
        <h3>Unlinked Words ({unlinkedWords.length})</h3>
        <div style={{ marginBottom: "10px" }}>
          <label>Select Word: </label>
          <select
            value={selectedWordId}
            onChange={(e) => setSelectedWordId(e.target.value)}
            style={{ minWidth: "200px", marginLeft: "10px" }}
          >
            <option value="">Choose a word...</option>
            {unlinkedWords.map((word) => (
              <option key={word.id} value={word.id}>
                {typeof word.data === "string"
                  ? word.data.substring(0, 50)
                  : JSON.stringify(word.data).substring(0, 50)}
                ...
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Select List: </label>
          <select
            value={selectedListId}
            onChange={(e) => setSelectedListId(e.target.value)}
            style={{ minWidth: "200px", marginLeft: "10px" }}
          >
            <option value="">Choose a list...</option>
            {wordsLists.map((list) => (
              <option key={list.id} value={list.id}>
                {list.type}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleLinkWordToList}
          disabled={!selectedWordId || !selectedListId}
          style={{
            padding: "10px 20px",
            backgroundColor:
              selectedWordId && selectedListId ? "#007bff" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor:
              selectedWordId && selectedListId ? "pointer" : "not-allowed",
          }}
        >
          Link Word to List
        </button>
      </div>

      <div style={{ marginTop: "20px" }}>
        <h3>All Words Summary</h3>
        <p>Total Words: {words.length}</p>
        <p>Unlinked Words: {unlinkedWords.length}</p>
        <p>Linked Words: {words.length - unlinkedWords.length}</p>

        <h4>Words by List:</h4>
        {wordsLists.map((list) => {
          const linkedWordsCount = words.filter(
            (word) => word.wordsListId === list.id
          ).length;
          return (
            <p key={list.id}>
              {list.type}: {linkedWordsCount} words
            </p>
          );
        })}
      </div>
    </main>
  );
}

export default App;
