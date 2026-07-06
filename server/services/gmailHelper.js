const { getMessagesWithBackoff } = require('./gmail');

/**
 * Apply a batchModify operation to every message matching a Gmail search query.
 * Pages through all results in batches of 100. Returns the count of messages affected.
 *
 * @param {object} gmail - google.gmail v1 client
 * @param {string} query - Gmail search query (e.g. "from:x@example.com")
 * @param {object} labels - { addLabelIds?: string[], removeLabelIds?: string[] }
 * @param {object} [opts] - { maxPages?: number } safety cap
 * @returns {Promise<number>}
 */
async function applyToAllMessages(gmail, query, labels, opts = {}) {
  const { maxPages = Infinity } = opts;
  let pageToken = null;
  let pageCount = 0;
  let affected = 0;

  do {
    const response = await getMessagesWithBackoff(gmail, {
      userId: 'me',
      q: query,
      maxResults: 100,
      pageToken
    });

    if (response.data.messages) {
      const ids = response.data.messages.map(m => m.id);
      await gmail.users.messages.batchModify({
        userId: 'me',
        requestBody: {
          ids,
          addLabelIds: labels.addLabelIds,
          removeLabelIds: labels.removeLabelIds
        }
      });
      affected += ids.length;
    }

    pageToken = response.data.nextPageToken;
    pageCount++;
  } while (pageToken && pageCount < maxPages);

  return affected;
}

module.exports = { applyToAllMessages };
