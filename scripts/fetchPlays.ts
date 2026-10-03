import { client, getPlays } from 'cfbd';

async function main() {
  const apiKey = process.env.CFBD_API_KEY;

  if (!apiKey) {
    throw new Error('CFBD_API_KEY is required');
  }

  client.setConfig({
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  const response = await getPlays({
    query: {
      year: 2023,
      week: 1
    }
  });

  if (response.error) {
    throw response.error;
  }

  console.log(response.data?.[0]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});