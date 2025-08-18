import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

// UserList remains the central point for a user's data.
export const UserProfile = a
  .model({
    // The userId links this record to the authenticated user.
    userId: a.string().required(),
    // This provides a single entry point to access a user's single WordsList.
    wordsList: a.hasOne("WordsList", "userListId"),
  })
  .authorization((allow) => [
    // This rule ensures a user can only access their own lists.
    allow.owner(),
  ]);

// WordsList now acts as the single container for all of a user's words.
export const WordsList = a
  .model({
    // The foreign key to link this list to its parent UserList.
    userListId: a.id(),
    // The belongsTo relationship defines the link back to the parent.
    userList: a.belongsTo("UserList", "userListId"),
    // This provides a link to all the Word records belonging to this list.
    words: a.hasMany("Word", "wordsListId"),
  })
  .authorization((allow) => [allow.owner()]);

// The Word model now includes a 'status' field.
export const Word = a
  .model({
    // The data field stores the word's content.
    data: a.json().required(),
    // The new status field, which is an enum with predefined values.
    status: a.enum(["COLLECTED", "LEARNED"]),
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
