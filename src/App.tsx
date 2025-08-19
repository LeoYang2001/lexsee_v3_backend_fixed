import { useEffect, useState } from "react";
import { data, type Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { useAuthenticator } from "@aws-amplify/ui-react";

const client = generateClient<Schema>();

function App() {
  const [username, setUsername] = useState("");
  const [userProfile, setUserProfile] = useState<
    Schema["UserProfile"]["type"] | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [wordsList, setWordsList] = useState<
    Schema["WordsList"]["type"] | null
  >(null);
  const [words, setWords] = useState<Array<Schema["Word"]["type"]>>([]);
  const [newWordJson, setNewWordJson] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"COLLECTED" | "LEARNED">(
    "COLLECTED"
  );
  const [isCreatingWord, setIsCreatingWord] = useState(false);
  const { user, signOut } = useAuthenticator();

  // Check if user profile exists on component mount
  useEffect(() => {
    if (user?.userId) {
      checkUserProfile(user.userId);
    }
  }, [user?.userId]);

  async function checkUserProfile(userId: string) {
    try {
      const profileResult = await client.models.UserProfile.list({
        filter: { userId: { eq: userId } },
      });

      if (profileResult.data.length > 0) {
        const profile = profileResult.data[0];
        setUserProfile(profile);

        // Fetch the user's WordsList and words
        await fetchUserWordsListAndWords(profile.id);
      }
    } catch (error) {
      console.error("Error checking user profile:", error);
    }
  }

  async function fetchUserWordsListAndWords(userProfileId: string) {
    try {
      // Get the user's WordsList
      const wordsListResult = await client.models.WordsList.list({
        filter: { userProfileId: { eq: userProfileId } },
      });

      if (wordsListResult.data.length > 0) {
        const userWordsList = wordsListResult.data[0];
        setWordsList(userWordsList);

        // Fetch all words for this WordsList
        const wordsResult = await client.models.Word.list({
          filter: { wordsListId: { eq: userWordsList.id } },
        });
        setWords(wordsResult.data);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  }

  async function setupUser(uid: string, username: string) {
    if (!username.trim()) {
      alert("Please enter a username");
      return;
    }

    setIsLoading(true);
    try {
      // Create UserProfile
      const profileResult = await client.models.UserProfile.create({
        userId: uid,
        username: username.trim(),
      });

      if (profileResult.data) {
        setUserProfile(profileResult.data);

        // Create WordsList for this user profile
        const wordsListResult = await client.models.WordsList.create({
          userProfileId: profileResult.data.id,
        });

        if (wordsListResult.data) {
          setWordsList(wordsListResult.data);
          alert(`User profile created successfully for ${username}!`);
          setUsername(""); // Clear the input
        }
      }
    } catch (error) {
      console.error("Error setting up user:", error);
      alert("Failed to create user profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleSetup = () => {
    if (user?.userId) {
      setupUser(user.userId, username);
    } else {
      alert("User not authenticated");
    }
  };

  async function createWord() {
    if (!newWordJson.trim()) {
      alert("Please enter word data");
      return;
    }

    if (!wordsList) {
      alert("WordsList not available. Please refresh the page.");
      return;
    }

    setIsCreatingWord(true);
    console.log(
      "creating word with data:",
      newWordJson,
      "and status:",
      selectedStatus
    );
    try {
      const wordResult = await client.models.Word.create({
        data: newWordJson,
        status: selectedStatus,
        wordsListId: wordsList.id,
      });

      if (wordResult.data) {
        setWords((prev) => [...prev, wordResult.data!]);
        setNewWordJson("");
        alert(`Word created successfully with status: ${selectedStatus}`);
      }
    } catch (error) {
      console.error("Error creating word:", error);
      alert("Failed to create word. Please try again.");
    } finally {
      setIsCreatingWord(false);
    }
  }

  // Filter words by status
  const collectedWords = words.filter((word) => word.status === "COLLECTED");
  const learnedWords = words.filter((word) => word.status === "LEARNED");

  return (
    <main>
      {/* Header */}
      <div className="app-header">
        <h1 className="app-title">{user?.signInDetails?.loginId}'s Lexsee</h1>
        <button onClick={signOut} className="btn-secondary">
          Sign out
        </button>
      </div>

      {!userProfile ? (
        // Show setup form if user profile doesn't exist
        <div className="card setup-card">
          <h2 style={{ marginBottom: "20px", color: "#2d3748" }}>
            Welcome! Let's set up your profile
          </h2>
          <p style={{ marginBottom: "24px", color: "#718096" }}>
            User ID: {user?.userId}
          </p>

          <div className="form-group">
            <label htmlFor="username" className="form-label">
              Choose a username:
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="form-input"
              disabled={isLoading}
            />
          </div>

          <button
            onClick={handleSetup}
            disabled={isLoading || !username.trim()}
            className="btn-primary"
          >
            {isLoading ? "Setting up..." : "Create Profile"}
          </button>
        </div>
      ) : (
        // Show main app content if user profile exists
        <div>
          {/* Welcome Card */}
          <div className="card welcome-card">
            <h3 style={{ marginBottom: "12px", fontSize: "1.5rem" }}>
              Welcome back, {userProfile.username}! 👋
            </h3>
            <p style={{ opacity: 0.8 }}>Ready to manage your words?</p>
          </div>

          {/* Word Creation Section */}
          <div className="card">
            <h2 style={{ marginBottom: "24px", color: "#2d3748" }}>
              Create New Word
            </h2>

            <div className="form-group">
              <label htmlFor="wordData" className="form-label">
                Word Data (JSON):
              </label>
              <textarea
                id="wordData"
                value={newWordJson}
                onChange={(e) => setNewWordJson(e.target.value)}
                placeholder='{"word": "hello", "definition": "greeting", "example": "Hello world!"}'
                className="form-textarea"
                disabled={isCreatingWord}
              />
            </div>

            <div className="form-group">
              <label htmlFor="status" className="form-label">
                Status:
              </label>
              <select
                id="status"
                value={selectedStatus}
                onChange={(e) =>
                  setSelectedStatus(e.target.value as "COLLECTED" | "LEARNED")
                }
                className="form-select"
                disabled={isCreatingWord}
              >
                <option value="COLLECTED">🗂️ COLLECTED</option>
                <option value="LEARNED">✅ LEARNED</option>
              </select>
            </div>

            <button
              onClick={createWord}
              disabled={isCreatingWord || !newWordJson.trim()}
              className="btn-success"
            >
              {isCreatingWord ? "Creating..." : "Create Word"}
            </button>
          </div>

          <div className="divider"></div>

          {/* Words Display Section */}
          <div className="words-grid">
            <div className="words-column">
              <div className="words-header">
                <h2 className="words-title">🗂️ Collected Words</h2>
                <span className="words-count">{collectedWords.length}</span>
              </div>
              <div className="words-container collected">
                {collectedWords.length === 0 ? (
                  <div className="empty-state">
                    No collected words yet. Start by creating your first word!
                  </div>
                ) : (
                  collectedWords.map((word) => (
                    <div key={word.id} className="word-card collected">
                      <pre className="word-content">
                        {typeof word.data === "string"
                          ? word.data
                          : JSON.stringify(word.data, null, 2)}
                      </pre>
                      <div className="word-status">🗂️ {word.status}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="words-column">
              <div className="words-header">
                <h2 className="words-title">✅ Learned Words</h2>
                <span className="words-count">{learnedWords.length}</span>
              </div>
              <div className="words-container learned">
                {learnedWords.length === 0 ? (
                  <div className="empty-state">
                    No learned words yet. Mark words as learned when you master
                    them!
                  </div>
                ) : (
                  learnedWords.map((word) => (
                    <div key={word.id} className="word-card learned">
                      <pre className="word-content">
                        {typeof word.data === "string"
                          ? word.data
                          : JSON.stringify(word.data, null, 2)}
                      </pre>
                      <div className="word-status">✅ {word.status}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Summary Section */}
          <div className="card summary-card">
            <div className="summary-item">
              <span className="summary-number">{words.length}</span>
              <div className="summary-label">Total Words</div>
            </div>
            <div className="summary-item">
              <span className="summary-number">{collectedWords.length}</span>
              <div className="summary-label">Collected</div>
            </div>
            <div className="summary-item">
              <span className="summary-number">{learnedWords.length}</span>
              <div className="summary-label">Learned</div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;
