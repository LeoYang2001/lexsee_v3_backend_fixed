import { useEffect, useState } from "react";
import { data, type Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { useAuthenticator } from "@aws-amplify/ui-react";

const client = generateClient<Schema>();

function App() {
  const { user, signOut } = useAuthenticator();

  return (
    <main>
      <h1>{user?.signInDetails?.loginId}'s Lexsee</h1>
      <button onClick={signOut}>Sign out</button>
    </main>
  );
}

export default App;
