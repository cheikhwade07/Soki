
import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require', prepare: false });

export async function GET() {
    if (process.env.NODE_ENV !== 'development') {
        return Response.json({ error: 'Not found' }, { status: 404 });
    }

    try {
        const result = await sql`SELECT NOW() as time`;
        const users = await sql`SELECT user_id, email FROM users`;
        const decks = await sql`SELECT deck_id, title FROM decks`;
        const cards = await sql`SELECT COUNT(*) as count FROM cards`;

        return Response.json({
            connected: true,
            server_time: result[0].time,
            users,
            decks,
            total_cards: cards[0].count,
        });
    } catch (error) {
        return Response.json({ connected: false, error }, { status: 500 });
    }
}
