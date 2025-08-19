import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

// UserProfile is the central point for a user's data.
export const UserProfile = a
  .model({
    // The userId is the unique identifier for the user.
    userId: a.string().required(),
    // The username is a new field for the user's name.
    username: a.string().required(),
    // A single wordsList belongs to each user profile.
    wordsList: a.hasOne("WordsList", "userProfileId"),
  })
  .authorization((allow) => [
    // This allows the owner to perform all operations on their profile.
    allow.owner(),
  ]);

// WordsList is now the single container for a user's words.
export const WordsList = a
  .model({
    // The foreign key to link this list to its parent UserProfile.
    userProfileId: a.id(),
    // The belongsTo relationship defines the link back to the parent.
    userProfile: a.belongsTo("UserProfile", "userProfileId"),
    // This provides a link to all the Word records belonging to this list.
    words: a.hasMany("Word", "wordsListId"),
  })
  .authorization((allow) => [allow.owner()]);

// The Word model now includes a 'status' field to differentiate words.
export const Word = a
  .model({
    // The data field stores the word's content.
    data: a.json().required(),
    // The new status field, which is an enum with predefined values.
    status: a.enum(["COLLECTED", "LEARNED"]), // Added `.required()`
    // The foreign key to link this word to its parent WordsList.
    wordsListId: a.id(),
    // The belongsTo relationship links the word to its WordsList container.
    wordsList: a.belongsTo("WordsList", "wordsListId"),
  })
  .authorization((allow) => [allow.owner()]);

const schema = a.schema({
  UserProfile,
  WordsList,
  Word,
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});
