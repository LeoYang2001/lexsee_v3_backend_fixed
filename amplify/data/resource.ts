import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

// UserList is the new top-level model that organizes all of a user's word lists.
export const UserList = a
  .model({
    // This will be the unique ID for each user's central list.
    userId: a.string().required(),
    // The hasMany relationship connects this central list to the individual words lists.
    wordsLists: a.hasMany("WordsList", "userListId"),
  })
  .authorization((allow) => [
    // This rule ensures a user can only access their own lists.
    allow.owner(),
  ]);

// WordsList now belongs to a specific UserList.
export const WordsList = a
  .model({
    type: a.string().required(), // 'collected' or 'learned'
    // This is the foreign key that links a WordsList to its parent UserList.
    userListId: a.id(),
    // The belongsTo relationship defines the link back to the parent.
    userList: a.belongsTo("UserList", "userListId"),
    // The original hasMany relationship to the Word model remains unchanged.
    list: a.hasMany("Word", "wordsListId"),
  })
  .authorization((allow) => [allow.owner()]);

// The Word model remains largely the same, but it's crucial to correctly link it.
export const Word = a
  .model({
    data: a.json().required(), // JSON data for the word
    // This is the foreign key that links a Word to its parent WordsList.
    wordsListId: a.id(),
    // The belongsTo relationship defines the link back to the parent.
    wordsList: a.belongsTo("WordsList", "wordsListId"),
  })
  .authorization((allow) => [allow.owner()]);

const schema = a.schema({
  UserList,
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
