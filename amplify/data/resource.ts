import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a
  .schema({
    WordsList: a.model({
      type: a.string().required(), // 'first' or 'backup'
      list: a.hasMany("Word", "wordsListId"),
    }),
    Word: a.model({
      id: a.string().required(),
      data: a.json().required(), // JSON data for the word
      wordsListId: a.id(), // reference to WordsList
      wordsList: a.belongsTo("WordsList", "wordsListId"), // each word belongs to one words list only
    }),
  })
  .authorization((allow) => [allow.owner()]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});
