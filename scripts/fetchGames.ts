import { client, getGames } from 'cfbd';

const apiKey = process.env.CFBD_API_KEY;

if (!apiKey) {
  throw new Error('CFBD_API_KEY is required');
}

client.setConfig({
  headers: {
    Authorization: `Bearer ${apiKey}`,
  },
});

const response = await getGames({
  query: {
    year: 2023,
    team: 'Michigan',
  },
});

if (response.error) {
  throw response.error;
}

console.log(response.data?.[0]);