import GhostAPI from @tryghost/content-api;

const api = new GhostAPI({
    url: 'YOUR_URL',
    key: `YOUR_CONTENT_API_KEY`,
});

async function getPosts() {
    try {
        const {data, meta, response } = await api.posts.browse({});

        return data;
    } catch (err) {
        console.error(err);
    }
}

getPosts();