import { useEffect, useState } from "react";
import { data, type Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { useAuthenticator } from "@aws-amplify/ui-react";

const client = generateClient<Schema>();

function App() {
  const [newWordJson, setNewWordJson] = useState("");
  const [words, setWords] = useState<Array<Schema["Word"]["type"]>>([]);
  const [userWordsList, setUserWordsList] = useState<
    Schema["WordsList"]["type"] | null
  >(null);
  const [selectedStatus, setSelectedStatus] = useState<"COLLECTED" | "LEARNED">(
    "COLLECTED"
  );
  const { user, signOut } = useAuthenticator();

  // Fetch user's WordsList and words on component mount
  useEffect(() => {
    if (user?.userId) {
      setupUser(user.userId).then(() => {
        fetchUserData();
      });
    }
  }, [user?.userId]);

  async function setupUser(userId: string) {
    try {
      // Step 1: Check if a UserList already exists for this user.
      // Use a query to find the UserList record where the `userId` field
      // matches the current user's ID.
      const existingUserList = await findUserListByUserId(userId);

      // Step 2: If the UserList doesn't exist, create it and its associated data.
      if (existingUserList === null) {
        // 2a: Create the top-level UserList record.
        // This is the container for everything else.
        const newUserList = await createNewUserList(userId);

        // 2b: Create the single WordsList record.
        // This will hold all of the user's words.
        // IMPORTANT: Link this new WordsList to the UserList using the `userListId`.
        if (newUserList) {
          const newWordsList = await createNewWordsList(newUserList.id);
        }
      }
      // Step 3: If the UserList already exists, do nothing.
      // The user's lists are already set up and ready to go.
    } catch (error) {
      console.error("Error in setupUser:", error);
    }
  }

  async function findUserListByUserId(userId: string) {
    try {
      const userListResult = await client.models.UserList.list({
        filter: { userId: { eq: userId } }
      });
      return userListResult.data.length > 0 ? userListResult.data[0] : null;
    } catch (error) {
      console.error("Error finding UserList:", error);
      return null;
    }
  }

  async function createNewUserList(userId: string) {
    try {
      const createResult = await client.models.UserList.create({
        userId: userId,
      });
      return createResult.data;
    } catch (error) {
      console.error("Error creating UserList:", error);
      return null;
    }
  }

  async function createNewWordsList(userListId: string) {
    try {
      const createWordsListResult = await client.models.WordsList.create({
        userListId: userListId,
      });
      return createWordsListResult.data;
    } catch (error) {
      console.error("Error creating WordsList:", error);
      return null;
    }
  }

  async function fetchUserData() {
    try {
      if (!user?.userId) return;

      // Find the user's UserList (should exist after setupUser)
      const userList = await findUserListByUserId(user.userId);
      
      if (userList) {
        // Get the user's WordsList
        const wordsListResult = await client.models.WordsList.list({
          filter: { userListId: { eq: userList.id } },
        });

        const wordsList = wordsListResult.data[0];

        if (wordsList) {
          setUserWordsList(wordsList);

          // Fetch all words for this WordsList
          const wordsResult = await client.models.Word.list({
            filter: { wordsListId: { eq: wordsList.id } },
          });
          setWords(wordsResult.data);
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  }

  async function handleCreateWord() {
    if (!newWordJson.trim()) {
      alert("Please enter word data");
      return;
    }

    if (!userWordsList) {
      alert("WordsList not available. Please refresh the page.");
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(newWordJson);
    } catch (e) {
      alert("Invalid JSON format");
      return;
    }

    try {
      const { errors, data: newWord } = await client.models.Word.create({
        data: parsed,
        status: selectedStatus,
        wordsListId: userWordsList.id,
      });

      if (newWord) {
        setWords((prev) => [...prev, newWord]);
        setNewWordJson("");
        alert(`Word created with status: ${selectedStatus}`);
      }
    } catch (error) {
      console.error("Error creating word:", error);
      alert("Failed to create word. Check console for details.");
    }
  }

  // Filter words by status
  const collectedWords = words.filter((word) => word.status === "COLLECTED");
  const learnedWords = words.filter((word) => word.status === "LEARNED");

  return (
    <main>
      <h1>{user?.signInDetails?.loginId}'s Lexsee</h1>
      <button onClick={signOut}>Sign out</button>

      <h2>Create New Word</h2>
      <div style={{ marginBottom: "20px" }}>
        <textarea
          value={newWordJson}
          onChange={(e) => setNewWordJson(e.target.value)}
          placeholder="Paste JSON for new word here"
          rows={5}
          style={{ width: "100%", marginBottom: "10px" }}
        />

        <div style={{ marginBottom: "10px" }}>
          <label>Status: </label>
          <select
            value={selectedStatus}
            onChange={(e) =>
              setSelectedStatus(e.target.value as "COLLECTED" | "LEARNED")
            }
            style={{ marginLeft: "10px", padding: "5px" }}
          >
            <option value="COLLECTED">COLLECTED</option>
            <option value="LEARNED">LEARNED</option>
          </select>
        </div>

        <button onClick={handleCreateWord}>Create Word</button>
      </div>

      <hr style={{ margin: "30px 0" }} />

      <div style={{ display: "flex", gap: "40px" }}>
        <div style={{ flex: 1 }}>
          <h2>Collected Words ({collectedWords.length})</h2>
          <div
            style={{
              border: "1px solid #ccc",
              borderRadius: "4px",
              padding: "10px",
              maxHeight: "400px",
              overflowY: "auto",
            }}
          >
            {collectedWords.length === 0 ? (
              <p style={{ color: "#666", fontStyle: "italic" }}>
                No collected words yet
              </p>
            ) : (
              collectedWords.map((word) => (
                <div
                  key={word.id}
                  style={{
                    padding: "8px",
                    border: "1px solid #eee",
                    borderRadius: "4px",
                    marginBottom: "8px",
                    backgroundColor: "#f8f9fa",
                  }}
                >
                  <pre
                    style={{
                      margin: 0,
                      fontSize: "12px",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {typeof word.data === "string"
                      ? word.data
                      : JSON.stringify(word.data, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <h2>Learned Words ({learnedWords.length})</h2>
          <div
            style={{
              border: "1px solid #ccc",
              borderRadius: "4px",
              padding: "10px",
              maxHeight: "400px",
              overflowY: "auto",
            }}
          >
            {learnedWords.length === 0 ? (
              <p style={{ color: "#666", fontStyle: "italic" }}>
                No learned words yet
              </p>
            ) : (
              learnedWords.map((word) => (
                <div
                  key={word.id}
                  style={{
                    padding: "8px",
                    border: "1px solid #eee",
                    borderRadius: "4px",
                    marginBottom: "8px",
                    backgroundColor: "#e8f5e8",
                  }}
                >
                  <pre
                    style={{
                      margin: 0,
                      fontSize: "12px",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {typeof word.data === "string"
                      ? word.data
                      : JSON.stringify(word.data, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: "30px" }}>
        <h3>Summary</h3>
        <p>Total Words: {words.length}</p>
        <p>Collected: {collectedWords.length}</p>
        <p>Learned: {learnedWords.length}</p>
      </div>
    </main>
  );
}

export default App;
